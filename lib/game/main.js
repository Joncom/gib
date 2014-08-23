ig.module('game.client.main')
.requires(
    'impact.debug.debug',
    'impact.game',
    'impact.font',
    'game.levels.test',
    'game.entities.player',
    'game.camera',
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

        init: function() {

            // Bind controls.
            ig.input.bind(ig.KEY.W, 'UP');
            ig.input.bind(ig.KEY.S, 'DOWN');
            ig.input.bind(ig.KEY.A, 'LEFT');
            ig.input.bind(ig.KEY.D, 'RIGHT');
            ig.input.bind(ig.KEY.MOUSE1, 'ATTACK');

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
                            console.log(JSON.stringify(snapshot));
                            ig.game.handle_snapshot(snapshot);
                        });
                    });

                    socket.on('info', function(message) {
                        console.log('Server says: ' + message);
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
                    this.socket.emit('command', '+' + command);
                if(ig.input.released(command))
                    this.socket.emit('command', '-' + command);
            }

            this.parent();

            // Update camera position.
            this.camera.update();
        },

        draw: function() {
            this.parent();

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

            for(var name in snapshot.players) {

                var player = snapshot.players[name];
                var entity = this.getEntityByName(name);

                // Update entity if it exists.
                if(entity) {
                    entity.pos.x = player.pos.x;
                    entity.pos.y = player.pos.y;
                }

                // Otherwise spawn the entity.
                else {
                    var x = player.pos.x;
                    var y = player.pos.y;
                    var settings = { name: name };
                    this.spawnEntity(EntityPlayer, x, y, settings);
                }
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
