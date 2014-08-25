ig.module('game.entities.player')
.requires('impact.entity')
.defines(function() {

    EntityPlayer = ig.Entity.extend({

        size: { x: 16, y: 16 },
        speed: 150,
        animSheet: new ig.AnimationSheet('media/tilesheet.png', 16, 16),
        attack_angle: 0,
        zIndex: 8,

        init: function(x, y, settings) {
            this.parent(x, y, settings);
            this.addAnim('default', 1, [0]);
            this.maxVel.x = this.maxVel.y = this.speed;
        },

        update: function() {
            this.parent();
        },

        draw: function() {
            this.parent();

            // Draw line outward at angle.
            var scale = ig.system.scale;
            var start_x = (this.pos.x + this.size.x/2 - ig.game.screen.x) * scale;
            var start_y = (this.pos.y + this.size.y/2 - ig.game.screen.y) * scale;
            var end_x = start_x + Math.cos(this.attack_angle) * 16 * scale; // FIXME: magic number
            var end_y = start_y + Math.sin(this.attack_angle) * 16 * scale; // FIXME: magic number

            var context = ig.system.context;
            context.beginPath();
            context.moveTo(start_x, start_y);
            context.lineTo(end_x, end_y);
            context.lineWidth = scale;
            context.stroke();
        }

    });

});
