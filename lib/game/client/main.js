ig.module('game.client.main')
.requires(
    //'impact.debug.debug',
    'impact.game',
    'impact.font',
    'game.client.camera',
    'game.client.entities.player',
    'game.client.scoreboard',
    'game.shared.entities.tracer',
    'game.shared.entities.explosion',
    'game.shared.entities.corpse',
    'game.shared.entities.dot',
    'game.shared.entities.upgrade',
    'game.shared.levels.empty',
    'game.shared.levels.test',
    'plugins.joncom.essentials.entity',
    'plugins.joncom.url-variables.url-variables',
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
        scoreboard: null, // class for drawing names, scores, etc.
        status_text: '',
        local_player_name: null,

        controls_timer: null, // used to hide controls after wait
        controls_hide_delay: 15,

        init: function() {

            // Bind controls.
            ig.input.bind(ig.KEY.W, 'UP');
            ig.input.bind(ig.KEY.S, 'DOWN');
            ig.input.bind(ig.KEY.A, 'LEFT');
            ig.input.bind(ig.KEY.D, 'RIGHT');
            ig.input.bind(ig.KEY.MOUSE1, 'ATTACK');
            ig.input.bind(ig.KEY.TAB, 'SCORE');

            this.camera = new ig.Camera();
            this.scoreboard = new ig.Scoreboard();

            // Prevent time-scaling due to low FPS.
            ig.Timer.maxStep = 999;

            this.debugDisplay = new DebugDisplay(this.font);

            window.onresize = this.onresize;
            this.onresize();

            // Get config from JSON file.
            this.status_text = 'Loading config...';
            jQuery.getJSON('config.js', function(config) {
                console.log('Loaded config.');
                ig.config = config; // Make config globally available.

                var host = ig.config.server.host;
                var port = ig.config.server.port;
                var server_url = 'http://' + host + ':' + port;
                var script_url = 'socket.io.1.0.6.js';

                // Get and load socket.io script.
                ig.game.status_text = 'Loading socket script...';
                jQuery.getScript(script_url, function( data, textStatus, jqxhr ) {
                    console.log('Loaded socket.io script.');

                    // Initialize socket connection.
                    console.log('Connecting to server...');
                    ig.game.status_text = 'Connecting to server...';
                    var socket = io.connect(server_url, { reconnection: false });

                    socket.on('connect', function() {
                        console.log('Connected to ' + server_url);

                        // Set blank status text so it's not drawn.
                        ig.game.status_text = '';

                        // Load up the level.
                        ig.game.loadLevel(LevelTest);

                        // Set timer for showing controls.
                        var delay = ig.game.controls_hide_delay;
                        ig.game.controls_timer = new ig.Timer(delay);

                        // Send name to server.
                        var random = Math.floor(Math.random() * 1000);
                        var name = 'Player' + random;
                        socket.emit('init', name);

                        // Keep record of name.
                        ig.game.local_player_name = name;

                        // Keep pointer for easy of use.
                        ig.game.socket = socket;

                        socket.on('snapshot', function(snapshot) {
                            //console.log(JSON.stringify(snapshot));
                            ig.game.handle_snapshot(snapshot);
                        });
                    });

                    socket.on('disconnect', function(message) {
                        console.log('Disconnected');
                        ig.game.status_text = 'Disconnected';
                        ig.game.loadLevel(LevelEmpty);
                    });

                    socket.on('error', function(error) {
                        console.log('An error occured.', error, error.description);
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

            // Send commands to server.
            var commands = ['UP', 'DOWN', 'LEFT', 'RIGHT', 'ATTACK'];
            for(var i=0; i<commands.length; i++) {
                var command = commands[i];
                if(ig.input.pressed(command))
                    ig.game.socket.emit('command', '+' + command);
                if(ig.input.released(command))
                    ig.game.socket.emit('command', '-' + command);
            }

            this.parent();

            // Send attack angle to server.
            var player = this.getEntityByName(this.local_player_name);
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

            if(this.status_text) {
                var x = ig.system.width/2;
                var y = ig.system.height/2;
                this.font.draw(this.status_text, x, y, ig.Font.ALIGN.CENTER);
            }

            if(ig.input.state('SCORE')) {
                this.scoreboard.draw();
            }

            var debugInfo = [];

            // Show controls on screen for a while.
            if(this.controls_timer && this.controls_timer.delta() < 0) {
                debugInfo.push('WASD to move', 'MOUSE to shoot', 'TAB for score');
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

                    // Check if entity already exists.
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
