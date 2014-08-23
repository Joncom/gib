ig.module(
	'game.server.main'
)
.requires(
    'plugins.server',
    'game.server.entities.player'
)
.defines(function() {

    //var uuid = require('node-uuid');

    ZoneServer = ig.Game.extend({

        timer: new ig.Timer(), // Timer for syncing server/clients
        pingTimer: new ig.Timer(),
        pingDelay: 2, // seconds between ping calculations
        ping_requests: {}, // ping requests info keyed by UUID

        init: function() {

            // Setup the webserver
            var http = require('http');
            var port = ig.config.servers.zone.port;
            var handler = function (req, res) {
                // Provide canvas as PNG image via HTTP.
                var dataUrl = ig.system.canvas.toDataURL('image/png');
                var dataString = dataUrl.split( "," )[ 1 ];
                var buffer = new Buffer( dataString, 'base64');
                res.writeHead(200, {'Content-Type': 'image/png'});
                res.end(buffer);
            };
            var server = http.createServer(handler).listen(port);

            // Setup the websockets
            var io = require('socket.io').listen(server);
            console.log('Socket server listening on port ' + port + '.');

            // Keep pointers.
            ig.server = server;
            ig.io = io;

            ig.io.sockets.on('connection', function(socket) {
                console.log("Client " + socket.id + " connected.");

                // Maintain record of gateway.
                ig.game.gatewaySockets[socket.id] = socket;

                // Cleanup dead connections.
                socket.on('disconnect', function() {
                    console.log('Client ' + socket.id + ' disconnected.');

                    if(ig.game.gatewaySockets[socket.id] === undefined) {
                        throw 'Socket with no record disconneted.';
                    }

                    delete ig.game.gatewaySockets[socket.id];
                });

                // This is used for calculating client latency.
                socket.on('pong', function(uuid) {
                    console.log('Received ping response:', uuid);

                    var ping = ig.game.ping_requests[uuid];
                    if(!ping) {
                        console.log('... but no ping found for UUID.');
                        return;
                    }

                    var timestamp = new Date().getTime();
                    var latency = timestamp - ping.timestamp;
                    console.log('User ' + ping.user_uuid +
                                ' has latency:', latency);

                    delete ig.game.ping_requests[uuid];
                });

                socket.on('ack_snapshot', function(user_uuid, frame) {
                    var entity = ig.game.getEntityByUUID(user_uuid);

                    console.log('User ' + user_uuid + ' acknowledged ' +
                                'frame ' + frame + '.');

                    // Discard out-dated acknowlegments.
                    if(entity.last_acked_frame >= frame) return;

                    entity.last_acked_frame = frame;
                });

                socket.on('add_user', function(user_uuid) {

                    // TODO: Validate argument.

                    // Get user details.
                    ig.api.get('users/' + user_uuid, function(response) {

                        //  Did something go wrong?
                        if(response.code !== 200) {
                            return console.error(response);
                        }

                        // TODO: Check if user belongs to zone.

                        // Create entity.
                        var tilesize = ig.game.collisionMap.tilesize;
                        var x = response.data.x * tilesize;
                        var y = response.data.y * tilesize;
                        var name = response.data.name;
                        console.log('Spawning player at x/y:', x, y);
                        var settings = {
                            uuid: user_uuid,
                            name: name,
                            gateway_socket_id: socket.id
                        };
                        var entity = ig.game.spawnEntity(EntityPlayer, x, y, settings);

                        console.log('Added user ' + name + ' to zone.');

                        // FIXME: Don't use magic zone string.
                        socket.emit('to_user', user_uuid, 'set_primary_zone', '0.9');
                    });
                });

                socket.on('remove_user', function(user_uuid) {

                    // FIXME: Be more efficient than for-loop.
                    // Find entity.
                    for(var i=0; i<ig.game.entities.length; i++) {
                        var entity = ig.game.entities[i];
                        if(entity.uuid === user_uuid) {

                            // Remove entity.
                            entity.kill();
                            console.log('Removed user ' + user_uuid + '.');
                            return;
                        }
                    }
                    throw 'Tried removing non existent ' +
                          'user ' + user_uuid + '.';
                });

                socket.on('command', function(user_uuid, command) {
                    console.log('Received ' + command +
                                ' command from user ' + user_uuid);

                    // Determine action.
                    var action = '';
                    var firstChar = command.charAt(0);
                    if(firstChar === '+')      action = 'add';
                    else if(firstChar === '-') action = 'remove';
                    else throw 'Invalid command ' + command + ' from user ' + user_uuid;

                    // Strip first char from command.
                    command = command.substr(1);


                    // Find entity command applies to.
                    for(var i=0; i<ig.game.entities.length; i++) {
                        var entity = ig.game.entities[i];
                        if(entity.uuid === user_uuid) {

                            // Add or remove command from entity.
                            if(action === 'add') {
                                entity.commands[command] = true;
                            } else if(action === 'remove') {
                                delete entity.commands[command];
                            }
                            return;
                        }
                    }

                    throw "Can't apply command because user " + user_uuid +
                          ' not found.';
                });
            });

            var readHex = function(offset, bytes, callback) {
                return ig.FileReader.readHex(
                    ig.config.rom_path, offset, bytes, callback);
            };

            ig.rom = new ig.Rom(readHex, function(rom) {
                console.log('ROM loaded.');

                 /*
                rom.loadMap(0, 0, function() {
                    console.log('Map loaded.');
                });
                */

                ig.game.world = new ig.World(ig.rom, 0, 9, function() {
                    console.log('World loaded.');
                });
            });
        },

        update: function() {

            this.parent();

            // Every update, tell all zone servers within frustum range,
            // the position of every entity.

            // Is it time to send a snapshot?
            if(this.snapshot_timer.delta() >= 0) {
                var delay = 1/this.snapshots_per_second;
                this.snapshot_timer.set(delay);

                // Send each user a game state snapshot.
                var entities = this.getEntitiesByType(EntityPlayer);
                for(var i=0; i<entities.length; i++) {

                    var entity = entities[i];

                    // Don't send snapshot to disconnected player.
                    if(entity._killed) continue;

                    var socket_id = entity.gateway_socket_id;
                    var socket = this.gatewaySockets[socket_id];

                    if(!socket) {
                        throw "Couldn't find socket with ID: " + socket_id;
                    }

                    // Prepare snapshot data to send.
                    var data;
                    var current = entity.snapshots[0];
                    var last = entity.get_last_acked_snapshot();

                    // Delta encode current snapshot against the last
                    // acknowledged snapshot if one exists.
                    if(last && last.frame != current.frame)
                        data = this.delta_encode_snapshot(last, current);

                    // Otherwise a full snapshot will be sent.
                    else data = current;

                    socket.emit('to_user', entity.uuid, 'snapshot', data);
                }
            }

            // Handle client-server latency calculations.
            if(this.pingTimer.delta() >= 0) {
                this.pingTimer.set(this.pingDelay); // reset timer

                var entities = this.getEntitiesByType(EntityPlayer);
                entities.forEach(function(entity) {

                    // XXX: Could improve this by bundling pings
                    // of users that exist on the same gateway.

                    var ping_uuid = uuid.v4();
                    var user_uuid = entity.uuid;
                    var socket_id = entity.gateway_socket_id;
                    var socket = ig.game.gatewaySockets[socket_id];
                    var timestamp = new Date().getTime();

                    // Keep record of ping for later use.
                    ig.game.ping_requests[ping_uuid] = {
                        user_uuid: user_uuid,
                        timestamp: timestamp
                    };

                    socket.emit('to_user', user_uuid, 'ping', ping_uuid);
                });
            }

            this.frame++;
        },

        draw: function() {
            this.parent();

            if(this.activeBorderMap) this.activeBorderMap.draw();
            for(var i=0; i<this.activeTileMaps.length; i++) {
                this.activeTileMaps[i].draw();
            }

            this.drawEntities(); // FIXME: 2nd time drawn!
        },

        delta_encode_snapshot: function(old, current) {

            var result = ig.copy(current);

            for(var uuid in current.players) {

                var old_player     = old.players[uuid];
                var current_player = current.players[uuid];
                var result_player  = result.players[uuid];

                if(old_player) {

                    if(old_player.pos.x === current_player.pos.x) {
                        delete result_player.pos.x;
                    }
                    if(old_player.pos.y === current_player.pos.y) {
                        delete result_player.pos.y;
                    }
                }
            }

            return result;
        }

    });

    ig.main('#canvas', ZoneServer, 60, 320, 240, 2);

});
