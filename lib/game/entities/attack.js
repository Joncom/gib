ig.module('game.entities.attack')
.requires('impact.entity')
.defines(function() {

    EntityAttack = ig.Entity.extend({

        size: { x: 16, y: 16 },
        angle: 0,
        zIndex: 16,

        init: function(x, y, settings) {
            this.parent(x, y, settings);
        },

        draw: function() {
            this.parent();

            // Draw line outward at angle.
            var scale = ig.system.scale;
            var start_x = (this.pos.x + this.size.x/2 - ig.game.screen.x) * scale;
            var start_y = (this.pos.y + this.size.y/2 - ig.game.screen.y) * scale;
            var end_x = start_x + Math.cos(this.angle) * 1024; // FIXME: magic number
            var end_y = start_y + Math.sin(this.angle) * 1024; // FIXME: magic number

            var context = ig.system.context;
            context.beginPath();
            context.moveTo(start_x, start_y);
            context.lineTo(end_x, end_y);
            context.stroke();
        }

    });

});
