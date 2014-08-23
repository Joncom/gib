ig.module('game.entities.player')
.requires('shared.entities.grid-traveller')
.defines(function() {

    EntityPlayer = EntityGridTraveller.extend({

        size: { x: 16, y: 16 },
        speed: 150,
        animSheet: new ig.AnimationSheet('media/tilesheet.png', 16, 16),

        init: function(x, y, settings) {
            this.parent(x, y, settings);
            this.addAnim('default', 1, [0]);
            this.maxVel.x = this.maxVel.y = this.speed;
        },

        update: function() {
            if(ig.input.pressed('SPACE')) {
                // Check if on or beside a warp, and use warp if so...
                var tilesize = ig.RomBlock.prototype.size;
                for(var i=0; i<ig.game.warpEntities.length; i++) {
                    var warp = ig.game.warpEntities[i];
                    if(
                        // Standing on warp...
                        (this.pos.x === warp.pos.x && this.pos.y === warp.pos.y) ||
                        // Standing below warp...
                        (this.pos.x === warp.pos.x && this.pos.y - tilesize === warp.pos.y) ||
                        // Standing above warp...
                        (this.pos.x === warp.pos.x && this.pos.y + tilesize === warp.pos.y) ||
                        // Standing left of warp...
                        (this.pos.x - tilesize === warp.pos.x && this.pos.y === warp.pos.y) ||
                        // Standing right of warp...
                        (this.pos.x + tilesize === warp.pos.x && this.pos.y === warp.pos.y)
                    ) {
                        var rom = ig.game.roms[ig.game.currentRomKey];
                        var player = this;
                        ig.game.world.ensureDependenciesAreAvailable(
                                rom, warp.bankId, warp.mapId, function() {

                            var mapKey = ig.RomMap.getKey(warp.bankId, warp.mapId);
                            var romMap = rom.maps[mapKey];
                            var desintationWarp = romMap.eventset.warps[warp.toWarpNo];
                            player.warp(warp.bankId, warp.mapId,
                                desintationWarp.pos.x, desintationWarp.pos.y);
                        });
                        console.log('Warping to map ' + warp.bankId +
                            '.' + warp.mapId + ' warp_no ' + warp.toWarpNo);
                        break;
                    }
                }
            }

            /*if( this.pos.y < 0 &&
                    this.lastMove === EntityGridTraveller.DIRECTION.UP) {
                this.stepOffMap('UP');
            }
            else if(this.pos.y > ig.game.world.tileMaps[this.mapKey].pxHeight - 16 &&
                    this.lastMove === EntityGridTraveller.DIRECTION.DOWN ) {
                this.stepOffMap('DOWN');
            }
            else if(this.pos.x < 0 &&
                    this.lastMove === EntityGridTraveller.DIRECTION.LEFT) {
                this.stepOffMap('LEFT');
            }
            else if(this.pos.x > ig.game.world.tileMaps[this.mapKey].pxWidth - 16 &&
                    this.lastMove === EntityGridTraveller.DIRECTION.RIGHT ) {
                this.stepOffMap('RIGHT');
            }*/

            // Set movement intent based on input.
            /*
            if(ig.input.state('RIGHT'))
                this.moveIntent = EntityGridTraveller.DIRECTION.RIGHT;
            else if(ig.input.state('LEFT'))
                this.moveIntent = EntityGridTraveller.DIRECTION.LEFT;
            else if(ig.input.state('UP'))
                this.moveIntent = EntityGridTraveller.DIRECTION.UP;
            else if(ig.input.state('DOWN'))
                this.moveIntent = EntityGridTraveller.DIRECTION.DOWN;
            else this.moveIntent = null;
            */

            // Send movement commands to server.
            var cmd = 'UP';
            if(ig.input.pressed(cmd))
                ig.game.gateway.emit('command', '+' + cmd);
            if(ig.input.released(cmd))
                ig.game.gateway.emit('command', '-' + cmd);

            cmd = 'DOWN';
            if(ig.input.pressed(cmd))
                ig.game.gateway.emit('command', '+' + cmd);
            if(ig.input.released(cmd))
                ig.game.gateway.emit('command', '-' + cmd);

            cmd = 'LEFT';
            if(ig.input.pressed(cmd))
                ig.game.gateway.emit('command', '+' + cmd);
            if(ig.input.released(cmd))
                ig.game.gateway.emit('command', '-' + cmd);

            cmd = 'RIGHT';
            if(ig.input.pressed(cmd))
                ig.game.gateway.emit('command', '+' + cmd);
            if(ig.input.released(cmd))
                ig.game.gateway.emit('command', '-' + cmd);

            this.parent();

            if(this.snapshots.length>=3) {

                var duration = this.snapshot_intervals[0];
                var current_time = this.interpolate_timer.delta();

                if(current_time >= duration) {
                    this.snapshots.shift();
                    this.snapshot_intervals.shift();
                    duration = this.snapshot_intervals[0];
                    this.interpolate_timer.reset();
                    current_time = 0;
                }

                var x1 = this.snapshots[0].pos.x;
                var x2 = this.snapshots[1].pos.x;
                var y1 = this.snapshots[0].pos.y;
                var y2 = this.snapshots[1].pos.y;
                if(duration === 0) {
                    this.pos.x = x2;
                } else {
                    var v = (duration - current_time) / duration;
                    this.pos.x = (x1 * v) + (x2 * (1 - v));
                    this.pos.y = (y1 * v) + (y2 * (1 - v));
                }
            }
        }

    });

});