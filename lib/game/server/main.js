ig.module(
	'game.server.main'
)
.requires(
    'plugins.empika.debug_display',
    'plugins.joncom.essentials.entity',
    'plugins.server',
    'game.levels.test',
    'game.server.entities.corpse',
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
        snapshot_timer: new ig.Timer(1/30),
        sockets_by_name: {},
        dead_list: [], // names of dead players

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

                    // Link socket to player.
                    socket.name = name;
                    ig.game.sockets_by_name[name] = socket;
                });

                socket.on('disconnect', function() {

                    // Did client init?
                    if(socket.name) {

                        console.log(socket.name + ' disconnected.');

                        // Remove entity.
                        var entity = ig.game.getEntityByName(socket.name);
                        if(entity) ig.game.removeEntity(entity);

                        // Remove name from waiting to respawn list.
                        var list = ig.game.dead_list;
                        for(var i=0; i<list.length; i++) {
                            if(socket.name === list[i]) {
                                list.splice(i, 1);
                            }
                            break;
                        }

                        // Remove now-inactive socket.
                        delete ig.game.sockets_by_name[socket.name];
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

                    // Client must init first.
                    if(!socket.name) return;

                    console.log('Received ' + command + ' command ' +
                                'from ' + socket.name + '.');

                    // Determine action.
                    var action = '';
                    var firstChar = command.charAt(0);
                    if(firstChar === '+')      action = 'add';
                    else if(firstChar === '-') action = 'remove';
                    else throw 'Invalid command ' + command + ' from client ' + socket_id;

                    // Strip first char from command.
                    command = command.substr(1);

                    // Is the player dead?
                    if(ig.game.is_dead(socket.name)) {

                        // Is the player trying to respawn?
                        if(command === 'ATTACK') {
                            ig.game.respawn(socket.name);
                        }

                        // Player is dead - no other commands valid.
                        return;
                    }

                    var entity = ig.game.getEntityByName(socket.name);

                    if(!entity) {
                        console.error('Command received for ' +
                            socket.name + ' but no entity!');
                    }

                    // Add or remove command from entity.
                    if(action === 'add') {
                        entity.commands[command] = true;
                    } else if(action === 'remove') {
                        delete entity.commands[command];
                    }
                });

                socket.on('set_attack_angle', function(angle) {
                    if(socket.name) {
                        var entity = ig.game.getEntityByName(socket.name);
                        if(entity) {
                            //console.log(socket.name + ' set attack angle to ' + angle + '.');
                            entity.attack_angle = angle;
                        }
                    }
                });
            });
        },

        update: function() {

            this.parent();

            // Is it time to send a snapshot?
            if(this.snapshot_timer.delta() >= 0) {
                this.snapshot_timer.reset();

                // Send each player a game state snapshot.
                for(var name in this.sockets_by_name) {

                    var socket = this.sockets_by_name[name];
                    socket.emit('snapshot', this.take_snapshot());
                }
            }

            /*
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

            var debug_array = [
                'Entities: ' + this.entities.length,
                'Init Sockets: ' + this.sockets_by_name.length
            ];

            var players = this.getEntitiesByType(EntityPlayer);
            debug_array.push('Players:');
            for(var i=0; i<players.length; i++) {
                debug_array.push(players[i].name);
            }

            // List players waiting to respawn.
            var string = 'Waiting to respawn: ';
            for(var i=0; i<this.dead_list.length; i++) {
                if(i !== 0) string += ', ';
                string += this.dead_list[i];
            }
            debug_array.push(string);

            this.debug_display.draw(debug_array);
        },

        is_dead: function(name) {
            var list = this.dead_list;
            for(var i=0; i<list.length; i++) {
                if(name === list[i]) {
                    return true;
                }
            }
            return false;
        },

        remove_from_dead_list: function(name) {
            var list = this.dead_list;
            for(var i=0; i<list.length; i++) {
                if(name === list[i]) {
                    list.splice(i, 1);
                    return;
                }
            }
            throw 'Could not find name in dead list.';
        },

        respawn: function(name) {
            var settings = { name: name };
            this.spawnEntity(EntityPlayer, 16, 16, settings);
        },

        take_snapshot: function() {

            var snapshot = {};

            var properties = {
                EntityPlayer: ['pos', 'attack_angle'],
                EntityAttack: ['pos', 'angle'],
                EntityCorpse: ['pos'],
            };

            for(var type in properties) {
                snapshot[type] = {};

                // FIXME: Use something less expensive.
                var entities = ig.game.getEntitiesByType(type);

                for(var i=0; i<entities.length; i++) {
                    var entity = entities[i];

                    // Skip entities without names.
                    if(!entity.name) {
                        console.error('Cannot snapshot without name.');
                        continue;
                    }

                    // Place to store entity properties.
                    snapshot[type][entity.name] = {};

                    // Cycle through properties to copy.
                    for(var j=0; j<properties[type].length; j++) {
                        var property = properties[type][j];

                        // Copy property to snapshot.
                        snapshot[type][entity.name][property] =
                            ig.copy(entity[property]);
                    }
                }
            }

            return snapshot;
        }

    });

    ig.main('#canvas', Server, 60, 320, 240, 2);

});
