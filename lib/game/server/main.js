ig.module(
	'game.server.main'
)
.requires(
    'plugins.empika.debug_display',
    'plugins.server',
    'game.levels.test',
    'game.server.entities.attack',
    'game.server.entities.player'
)
.defines(function() {

    //var uuid = require('node-uuid');

    Server = ig.Game.extend({

        font: new ig.Font( 'media/04b03.font.png' ),
        timer: new ig.Timer(), // Timer for syncing server/clients
        pingTimer: new ig.Timer(),
        pingDelay: 2, // seconds between ping calculations
        ping_requests: {}, // ping requests info keyed by UUID
        debug_display: null,

        init: function() {

            this.debug_display = new DebugDisplay(this.font);

            this.loadLevel(LevelTest);

            // Setup the webserver
            var http = require('http');
            var port = ig.config.server.port;
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
                console.log(socket.id + " connected.");

                socket.on('init', function(name) {

                    // TODO: Validate name.

                    // Entity exists for name?
                    if(ig.game.getEntityByName(name)) {
                        console.log(socket.id + ' tried in-use name.');
                        socket.emit('info', 'Name in use.');
                        socket.disconnect();
                        return;
                    }

                    console.log(socket.id + ' using name ' + name + '.');

                    // Spawn entity.
                    var x = 16;
                    var y = 16;
                    var settings = { name: name };
                    var entity = ig.game.spawnEntity(EntityPlayer, x, y, settings);

                    // Tie socket to entity and vice versa.
                    entity.socket = socket;
                    socket.entity = entity;
                });

                socket.on('disconnect', function() {

                    // Entity defined?
                    if(socket.entity) {

                        console.log(socket.entity.name + ' disconnected.');

                        ig.game.removeEntity(socket.entity);

                        // Break ties for gargbage collection.
                        socket.entity.socket = null;
                        socket.entity = null;
                    }

                    else console.log(socket.id + ' disconnected.');
                });

                /*
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
                */

                socket.on('command', function(command) {

                    // Can't apply command if no entity found.
                    if(!socket.entity) {
                        console.error('Received command, but no entity found.');
                        return;
                    }

                    console.log('Received ' + command + ' command ' +
                                'from ' + socket.entity.name + '.');

                    // Determine action.
                    var action = '';
                    var firstChar = command.charAt(0);
                    if(firstChar === '+')      action = 'add';
                    else if(firstChar === '-') action = 'remove';
                    else throw 'Invalid command ' + command + ' from client ' + socket_id;

                    // Strip first char from command.
                    command = command.substr(1);

                    // Check that entity is defined.
                    if(!socket.entity) {
                        throw 'Command received but no entity defined.';
                    }

                    // Add or remove command from entity.
                    if(action === 'add') {
                        socket.entity.commands[command] = true;
                    } else if(action === 'remove') {
                        delete socket.entity.commands[command];
                    }
                });

                socket.on('set_attack_angle', function(angle) {
                    if(socket.entity) {
                        console.log(socket.entity.name + ' set attack angle.');
                        socket.entity.attack_angle = angle;
                    }
                });
            });
        },

        update: function() {

            this.parent();

            /*
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
            */
        },

        draw: function() {
            this.parent();

            this.debug_display.draw([
                'Entities: ' + this.entities.length
            ]);
        }

    });

    ig.main('#canvas', Server, 60, 320, 240, 2);

});
