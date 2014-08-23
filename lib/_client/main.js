ig.module('_client.main')
.requires(
    'impact.debug.debug',
    'impact.game',
    'impact.font',
    '_client.rom-tests',
    '_client.rom-file-loader',
    'rom.rom',
    '_client.rom-tileset', // enable saving to local storage
    'rom.header',
    '_client.image',
    '_client.image-from-canvas',
    '_client.camera',
    '_client.entities.player',
    '_client.entities.chat-bubble',
    'rom.map',
    'shared.game',
    'shared.world',
    '_client.file-system',
    '_client.entities.warp',
    'plugins.joncom.url-variables.url-variables',
    'plugins.empika.debug_display'
)
.defines(function(){"use strict";

    var MyGame = ig.Game.extend({

        autoSort: true,
        sortBy: ig.Game.SORT.Z_INDEX,
        font: new ig.Font( 'media/04b03.font.png' ),
        camera: null,
        world: null,
        debugDisplay: null,
        warpEntities: [],
        activeTileMaps: [],
        activeBorderMap: null,
        romFileLoader: null,
        roms: {},
        currentRomKey: null,
        gateway: null, // pointer to gateway socket
        user_uuid: null,
        snapshots: [], // gamestate snapshots received from server
        last_snapshot_timer: new ig.Timer(),

        init: function() {
            var game = this;

            // Get config from JSON file.
            jQuery.getJSON('config.js', function(config) {
                console.log('Loaded config.');
                ig.config = config; // Make config globally available.

                // Get and load socket.io script.
                var url = 'https://' + ig.config.servers.login.host +
                          ':' + ig.config.servers.login.port +
                          '/socket.io/socket.io.js';
                console.log(url);
                jQuery.getScript(url, function( data, textStatus, jqxhr ) {
                    console.log('Loaded socket.io script.');

                    // Initialize socket connection.
                    console.log('Connecting to login server...');
                    var url = 'https://' + ig.config.servers.login.host +
                          ':' + ig.config.servers.login.port;
                    var socket = io.connect(url, { reconnection: false });

                    // Setup Basic Events
                    socket.on('connect_timeout', function(){    console.log('Timed out connecting to ' + url); });
                    socket.on('connect_error', function(error){ console.log('Error connecting to ' + url, error);});
                    socket.on('error', function(error) {        console.log('Error from ' + url, error); });
                    socket.on('disconnect', function(){         console.log('Disconnected from ' + url); });
                    socket.on('info', function(info){           console.log('Socket server says: ' + info); });

                    // Login server logic...
                    socket.on('connect', function() {
                        console.log('Connected to ' + url);

                        // Attempt to login.
                        var name = ig.urlVariables.name;
                        var password = ig.urlVariables.password;
                        console.log('Logging in as ' + name + '...');
                        socket.emit('login', name, password);

                        // Handle login success.
                        socket.on('login_success', function(data) {

                            console.log('Login succeeded. Received:', data);

                            // Connect to the gateway.
                            console.log('Connecting to gateway server...');
                            var gateway = data.gateway;
                            var url = 'https://' + gateway.host + ':' + gateway.port;
                            var socket = io.connect(url, { reconnection: false });

                            ig.game.gateway = socket;

                            // Setup Basic Events
                            socket.on('connect_timeout', function(){    console.log('Timed out connecting to ' + url); });
                            socket.on('connect_error', function(error){ console.log('Error connecting to ' + url, error);});
                            socket.on('error', function(error) {        console.log('Error from ' + url, error); });
                            socket.on('disconnect', function(){         console.log('Disconnected from ' + url); });
                            socket.on('info', function(info){           console.log('Socket server says: ' + info); });

                            socket.on('connect', function() {
                                console.log('Connected to ' + url);

                                // Initiate session with gateway.
                                console.log('Initiating session...');
                                socket.emit('init', data.session_uuid);

                                // This is used for calculating latency.
                                socket.on('ping', function(uuid) {
                                    console.log('Received ping:', uuid);
                                    socket.emit('pong', uuid);
                                });

                                socket.on('set_user_uuid', function(user_uuid) {
                                    console.log('User UUID set to ' + user_uuid);
                                    ig.game.user_uuid = user_uuid;
                                });

                                socket.on('set_primary_zone', function(zone) {
                                    console.log('Setting primary zone to ' + zone);

                                    // FIXME: Don't load filesystem each time.
                                    // It should be loaded once, probably before
                                    // this function call...

                                    // Continue loading game...
                                    ig.FileSystem.init(function() {
                                        game.romFileLoader = new ig.RomFileLoader(function(file) {
                                            ig.file = file;

                                            var readHex = function(offset, bytes, callback) {
                                                ig.FileSystem.readHex(ig.file, offset, bytes, callback);
                                            };

                                            new ig.Rom(readHex, function(rom) {
                                                if(!rom.isValid()) {
                                                    throw "ROM is invalid.";
                                                } else {
                                                    game.roms[rom.key()] = rom;
                                                    game.currentRomKey = rom.key();

                                                    var zone_parts = zone.split('.');
                                                    var bankId = zone_parts[0];
                                                    var mapId = zone_parts[1];

                                                    var rom = game.roms[game.currentRomKey];
                                                    var position = { x: 0, y: 0 }; // FIXME: Remove magic.
                                                    game.world = new ig.World(rom, bankId, mapId,
                                                            function(world) {

                                                        // Let server tell us what to do...
                                                    });
                                                }
                                            });
                                        });
                                    });
                                });
                            });

                            socket.on('snapshot', function(snapshot) {

                                // Discard outdated snapshots.
                                var last_snapshot = ig.game.snapshots[0];
                                if(last_snapshot && snapshot.frame < last_snapshot.frame) {
                                    return;
                                }

                                // Acknowledge received snapshot.
                                socket.emit('ack_snapshot', snapshot.frame);

                                // Create list of entities to MAYBE remove.
                                var entities_to_remove = {};
                                ig.game.entities.forEach(function(entity) {

                                    // Only consider entites with UUIDs.
                                    if(entity.uuid) {
                                        entities_to_remove[entity.uuid] = entity;
                                    }
                                });

                                // Loop through available updates.
                                for(var user_uuid in snapshot.players) {

                                    // Look for an entity that matches the update.
                                    var found_match = false;
                                    var pos; // position
                                    for(var i=0; i<ig.game.entities.length; i++) {
                                        var entity = ig.game.entities[i];

                                        // Did we find a match?
                                        if(entity.uuid === user_uuid) {
                                            found_match = true;

                                            // Keep entity alive.
                                            delete entities_to_remove[entity.uuid];

                                            // *********
                                            var frame = snapshot.frame;

                                            // Start with assumption nothing changed.
                                            var partial = {};
                                            partial.pos = ig.copy(entity.pos);

                                            // Update position if changed.
                                            pos = snapshot.players[user_uuid].pos;
                                            if(typeof pos === 'object') {
                                                if(typeof pos.x === 'number') {
                                                    partial.pos.x = pos.x;
                                                }
                                                if(typeof pos.y === 'number') {
                                                    partial.pos.y = pos.y;
                                                }
                                            }

                                            entity.snapshots.push(partial);
                                            var interval = ig.game.last_snapshot_timer.delta();
                                            entity.snapshot_intervals.push(interval);
                                            ig.game.last_snapshot_timer.reset();

                                            break;
                                        }
                                    }

                                    // Was no match found?
                                    if(!found_match) {

                                        // Create the entity.
                                        pos = snapshot.players[user_uuid].pos;
                                        var x = pos.x;
                                        var y = pos.y;
                                        var settings = { uuid: user_uuid };
                                        ig.game.spawnEntity(EntityPlayer, x, y, settings);
                                    }
                                }

                                // Remove entities for which we didn't receive an update.
                                for(var uuid in entities_to_remove) {
                                    var entity = entities_to_remove[uuid];
                                    ig.game.removeEntity(entity);
                                }
                            });
                        });
                    });
                });
            });

            window.onresize = this.onresize;
            this.onresize();

            ig.input.bind(ig.KEY.UP_ARROW, 'UP');
            ig.input.bind(ig.KEY.DOWN_ARROW, 'DOWN');
            ig.input.bind(ig.KEY.LEFT_ARROW, 'LEFT');
            ig.input.bind(ig.KEY.RIGHT_ARROW, 'RIGHT');
            ig.input.bind(ig.KEY.SPACE, 'SPACE');

            this.camera = new ig.Camera();
            this.debugDisplay = new DebugDisplay(this.font);

            // Prevent game from slowing down the game time
            // due to a low framerate.
            ig.Timer.maxStep = 999;
        },

        update: function() {
            this.parent();
        },

        draw: function() {
            // Don't draw if paused (loading map resources)...
            if(!ig.system.running) return;

            if( this.clearColor ) {
                ig.system.clear( this.clearColor );
            }
            this.camera.update();
            this._rscreen.x = ig.system.getDrawPos(this.screen.x)/ig.system.scale;
            this._rscreen.y = ig.system.getDrawPos(this.screen.y)/ig.system.scale;

            if(this.activeBorderMap) this.activeBorderMap.draw();
            for(var i=0; i<this.activeTileMaps.length; i++) {
                this.activeTileMaps[i].draw();
            }

            this.drawEntities();

            // Draw status messages while loading ROM file...
            if(this.romFileLoader) {
                var text = this.romFileLoader.status;
                if(text) {
                    var x = ig.system.width/2;
                    var y = ig.system.height/2;
                    this.font.draw(text, x, y, ig.Font.ALIGN.CENTER);
                }
            }

            var tilesize = ig.RomBlock.prototype.size;
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

        onresize: function(event) {
            var width = Math.floor(window.innerWidth/ig.system.scale);
            var height = Math.floor(window.innerHeight/ig.system.scale);
                width = 240;
                height = 160;
            ig.system.resize(width, height);
        },

        setScale: function(scale) {
            ig.system.scale = scale;
            for(var path in ig.Image.cache) {
                if(!ig.Image.cache.hasOwnProperty(path)) continue;
                ig.Image.cache[path].resize(scale);
            }
            this.onresize();
        }

    });

    var scale = 2;
    var width = Math.floor(window.innerWidth/scale);
    var height = Math.floor(window.innerHeight/scale);
    ig.main('#canvas', MyGame, 60, width, height, scale);

});
