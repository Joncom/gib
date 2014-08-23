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