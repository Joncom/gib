ig.module(
	'game.server.main'
)
.requires(
    'plugins.empika.debug_display',
    'plugins.joncom.essentials.entity',
    'plugins.server',
    'game.shared.levels.test',
    'game.server.client',
    'game.server.entities.corpse',
    'game.server.entities.dot',
    'game.server.entities.attack',
    'game.server.entities.player'
)
.defines(function() {

    var uuid = require('node-uuid');

    Server = ig.Game.extend({

        is_server: true,
        font: new ig.Font( 'media/04b03.font.png' ),
        timer: new ig.Timer(), // Timer for syncing server/clients
        debug_display: null,
        snapshot_timer: new ig.Timer(1/30),
        total_socket_count: 0,

        ping_timer: new ig.Timer(), // used to stager ping requests
        ping_delay: 2, // delay between ping requests
        ping_requests: {}, // ping requests keyed by UUID

        clients: {}, // client sockets, latencies, kills, etc.

        log: function(message) {
            var date = new Data();
            var stamp = ([date.getYear(), date.getMonth(), date.getDay()]).join('-');
            console.log(stamp + ' ' + message);
        },

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
            ig.game.log('Socket server listening on port ' + port + '.');

            // Keep pointers.
            ig.server = server;
            ig.io = io;

            ig.io.sockets.on('connection', function(socket) {

                var address = socket.handshake.address;
                ig.game.log(
                    socket.id + " connected from " +
                    address.address + ":" + address.port
                );

                ig.game.total_socket_count++;

                socket.on('init', function(name) {

                    // TODO: Validate name.

                    // Name already in use?
                    for(var key in ig.game.clients) {
                        if(key === name) {

                            // Terminate session.
                            ig.game.log(socket.id + ' tried in-use name.');
                            socket.emit('info', 'Name in use.');
                            socket.disconnect();
                            return;
                        }
                    }

                    ig.game.log(socket.id + ' using name ' + name + '.');

                    // Link socket to player.
                    socket.name = name;
                    ig.game.clients[name] = new ig.Client(name);
                    ig.game.clients[name].socket = socket;

                    // Add player into the game.
                    ig.game.clients[name].respawn();
                });

                socket.on('disconnect', function() {

                    ig.game.total_socket_count--;

                    // Did client init?
                    if(socket.name) {

                        ig.game.log(socket.name + ' disconnected.');

                        // Remove entity.
                        var entity = ig.game.getEntityByName(socket.name);
                        if(entity) ig.game.removeEntity(entity);

                        // Remove now-inactive client.
                        delete ig.game.clients[socket.name];
                    }

                    else ig.game.log(socket.id + ' disconnected.');
                });

                // This is used to calculate client latency.
                socket.on('pong', function(uuid) {
                    ig.game.log('Received ping response:', uuid);

                    var ping = ig.game.ping_requests[uuid];
                    if(!ping) {
                        ig.game.log('... but no ping found for UUID.');
                        return;
                    }

                    var timestamp = new Date().getTime();
                    var latency = timestamp - ping.timestamp;

                    // Update client latency.
                    var client = ig.game.clients[ping.name];
                    if(client) client.latency = latency;

                    ig.game.log('User ' + ping.name +
                                ' has latency:', latency);

                    delete ig.game.ping_requests[uuid];
                });

                socket.on('command', function(command) {

                    // Client must init first.
                    if(!socket.name) return;

                    ig.game.log('Received ' + command + ' command ' +
                                'from ' + socket.name + '.');

                    // Determine action.
                    var action = '';
                    var firstChar = command.charAt(0);
                    if(firstChar === '+')      action = 'add';
                    else if(firstChar === '-') action = 'remove';
                    else throw 'Invalid command ' + command + ' from client ' + socket_id;

                    // Strip first char from command.
                    command = command.substr(1);

                    var entity = ig.game.getEntityByName(socket.name);
                    var client = ig.game.clients[socket.name];

                    // Is the player dead (non-existent)?
                    if(!entity) {

                        // Is the player trying to respawn?
                        if(command === 'ATTACK') {

                            // Is the player allowed to respawn?
                            if(client.respawn_timer.delta() >= 0) {

                                client.respawn();
                            }
                        }

                        // Player is dead - no other commands valid.
                        return;
                    }

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
                            //ig.game.log(socket.name + ' set attack angle to ' + angle + '.');
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
                for(var name in this.clients) {

                    var socket = this.clients[name].socket;
                    socket.emit('snapshot', this.take_snapshot());
                }
            }

            // Handle issuing of ping requests.
            // XXX: Isssue pings within snapshots for fewer packets?
            if(this.ping_timer.delta() >= 0) {
                this.ping_timer.set(this.ping_delay); // reset timer

                for(var name in this.clients) {
                    var socket = this.clients[name].socket;
                    var ping_uuid = uuid.v4();
                    var timestamp = new Date().getTime();

                    // Keep record of ping for later use.
                    this.ping_requests[ping_uuid] = {
                        name: name,
                        timestamp: timestamp
                    };

                    // Ping the client.
                    socket.emit('ping', ping_uuid);
                }
            }
        },

        draw: function() {
            this.parent();

            var debug_array = [
                'Entities count: ' + this.entities.length
            ];

            // List living players.
            var players = this.getEntitiesByType(EntityPlayer);
            var string = 'Living players: ';
            for(var i=0; i<players.length; i++) {
                if(i !== 0) string += ', ';
                string += players[i].name;
            }
            debug_array.push(string);

            // Show socket count.
            debug_array.push('Sockets: ' + this.total_socket_count);

            // Show named client count.
            var count = 0;
            for(var name in this.clients) {
                count++;
            }
            debug_array.push('Named Clients: ' + count);

            // Show dead player count.
            var count = 0;
            for(var name in this.clients) {
                var client = this.clients[name];
                if(client.is_dead()) count++;
            }
            debug_array.push('Dead: ' + count);

            this.debug_display.draw(debug_array);
        },

        get_random_spawn_position: function() {
            var spawns = ig.game.getEntitiesByType(EntitySpawner);
            var index = Math.floor(Math.random() * spawns.length);
            return ig.copy(spawns[index].pos);
        },

        take_snapshot: function() {

            var snapshot = {};
            snapshot.entities = {};
            snapshot.clients = {};

            var properties = {
                EntityPlayer: ['pos', 'attack_angle'],
                EntityAttack: ['pos', 'end_point'],
                EntityCorpse: ['pos'],
                EntityDot: ['pos']
            };

            // Add entities to snapshot.
            for(var type in properties) {
                snapshot.entities[type] = {};

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
                    snapshot.entities[type][entity.name] = {};

                    // Cycle through properties to copy.
                    for(var j=0; j<properties[type].length; j++) {
                        var property = properties[type][j];

                        // Copy property to snapshot.
                        snapshot.entities[type][entity.name][property] =
                            ig.copy(entity[property]);
                    }
                }
            }

            // Add client information to snapshot.
            for(var name in this.clients) {
                var client = this.clients[name];
                snapshot.clients[name] = {};
                snapshot.clients[name].latency = client.latency;
                snapshot.clients[name].kills = client.kills;
            }

            return snapshot;
        }

    });

    ig.main('#canvas', Server, 60, 320, 240, 1);

});
