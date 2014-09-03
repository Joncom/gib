ig.module('game.client.main')
.requires(
    'impact.debug.debug',
    'impact.game',
    'impact.font',
    'game.levels.test',
    'game.entities.player',
    'game.entities.scoreboard',
    'game.entities.corpse',
    'game.entities.dot',
    'game.entities.attack',
    'game.camera',
    'plugins.joncom.url-variables.url-variables',
    'plugins.joncom.essentials.entity',
    'plugins.empika.debug_display'
)
.defines(function(){"use strict";

    var MyGame = ig.Game.extend({

        font: new ig.Font( 'media/04b03.font.png' ),
        camera: null,
        debugDisplay: null,
        config: null,
        socket: null,
        attack_angle_update_timer: new ig.Timer(1/30),
        autoSort: true,
        clients: {}, // latencies, scores, etc.

        init: function() {

            // Bind controls.
            ig.input.bind(ig.KEY.W, 'UP');
            ig.input.bind(ig.KEY.S, 'DOWN');
            ig.input.bind(ig.KEY.A, 'LEFT');
            ig.input.bind(ig.KEY.D, 'RIGHT');
            ig.input.bind(ig.KEY.MOUSE1, 'ATTACK');
            ig.input.bind(ig.KEY.TAB, 'SCORE');

            this.camera = new ig.Camera();

            // Prevent time-scaling due to low FPS.
            ig.Timer.maxStep = 999;

            this.debugDisplay = new DebugDisplay(this.font);

            window.onresize = this.onresize;
            this.onresize();

            // Get config from JSON file.
            jQuery.getJSON('config.js', function(config) {
                console.log('Loaded config.');
                ig.config = config; // Make config globally available.

                var host = ig.config.server.host;
                var port = ig.config.server.port;
                var server_url = 'http://' + host + ':' + port;
                var script_url = server_url + '/socket.io/socket.io.js';

                // Get and load socket.io script.
                jQuery.getScript(script_url, function( data, textStatus, jqxhr ) {
                    console.log('Loaded socket.io script.');

                    // Initialize socket connection.
                    console.log('Connecting to server...');
                    var socket = io.connect(server_url, { reconnection: false });

                    socket.on('connect', function() {
                        console.log('Connected to ' + server_url);

                        // Load up the level.
                        ig.game.loadLevel(LevelTest);

                        // Send name to server.
                        var random = Math.floor(Math.random() * 1000);
                        var name = 'Player' + random;
                        socket.emit('init', name);

                        // Keep record of name.
                        ig.game.player_name = name;

                        // Keep pointer for easy of use.
                        ig.game.socket = socket;

                        socket.on('snapshot', function(snapshot) {
                            //console.log(JSON.stringify(snapshot));
                            ig.game.handle_snapshot(snapshot);
                        });
                    });

                    socket.on('info', function(message) {
                        console.log('Server says: ' + message);
                    });

                    // Used for calculating client-server latency.
                    socket.on('ping', function(uuid) {
                        console.log('Received ping:', uuid);
                        socket.emit('pong', uuid);
                    });
                });
            });
        },

        update: function() {

            var player = this.getEntityByName(this.player_name);

            // Send commands to server.
            var commands = ['UP', 'DOWN', 'LEFT', 'RIGHT', 'ATTACK'];
            for(var i=0; i<commands.length; i++) {
                var command = commands[i];
                if(ig.input.pressed(command))
                    this.socket.emit('command', '+' + command);
                if(ig.input.released(command))
                    this.socket.emit('command', '-' + command);
            }

            this.parent();

            // Send attack angle to server.
            if(player) {
                if(this.attack_angle_update_timer.delta() >= 0) {
                    this.attack_angle_update_timer.reset();
                    var angle = player.angleToMouse();
                    this.socket.emit('set_attack_angle', angle);
                }
            }

            // Update camera position.
            this.camera.update();
        },

        draw: function() {
            this.parent();

            if(ig.input.state('SCORE')) {
                var y = 50;
                for(var name in this.clients) {
                    var client = this.clients[name];
                    var latency = client.latency;
                    var kills = client.kills;
                    var string = latency + ' ' + name + ' ' + kills;
                    this.font.draw(string, 10, y);
                    y += 16;
                }
            }

            var debugInfo = [];
            if(this.player) {
                debugInfo.push("pos.x: " + this.player.pos.x);
                debugInfo.push("pos.y: " + this.player.pos.y);
                debugInfo.push("tile.x: " + this.player.pos.x / tilesize);
                debugInfo.push("tile.y: " + this.player.pos.y / tilesize);
                debugInfo.push("last.x: " + this.player.last.x);
                debugInfo.push("last.y: " + this.player.last.y);
                if(this.player.destination) {
                    debugInfo.push("destination.x: " + this.player.destination.x);
                    debugInfo.push("destination.y: " + this.player.destination.y);
                }
            }
            this.debugDisplay.draw(debugInfo);
        },

        handle_snapshot: function(snapshot) {

            // Create list of entities to MAYBE remove.
            var entities_to_remove = {};
            ig.game.entities.forEach(function(entity) {

                // Only consider entites with names.
                if(entity.name) {
                    entities_to_remove[entity.name] = entity;
                }
            });

            // Loop through entity types.
            for(var type in snapshot.entities) {

                // Loop through entities.
                for(var name in snapshot.entities[type]) {

                    var entity = this.getEntityByName(name);

                    // Check if entity alread exists.
                    if(entity) {

                        // Update entity.
                        entity = ig.merge(entity, snapshot.entities[type][name]);

                        // Keep entity alive.
                        delete entities_to_remove[entity.name];
                    }

                    // Entity not found.
                    else {

                        // Spawn entity.
                        var settings = { name: name };
                        settings = ig.merge(settings, snapshot.entities[type][name]);
                        this.spawnEntity(type, 0, 0, settings);
                    }
                }
            }

            // Store client scores, latencies, etc.
            this.clients = snapshot.clients;

            // Remove entities for which we didn't receive an update.
            for(var name in entities_to_remove) {
                var entity = entities_to_remove[name];
                ig.game.removeEntity(entity);
            }
        },

        onresize: function(event) {
            var width = Math.floor(window.innerWidth/ig.system.scale);
            var height = Math.floor(window.innerHeight/ig.system.scale);
            ig.system.resize(width, height);
        }

    });

    var scale = 2;
    var width = Math.floor(window.innerWidth/scale);
    var height = Math.floor(window.innerHeight/scale);
    ig.main('#canvas', MyGame, 60, width, height, scale);

});
