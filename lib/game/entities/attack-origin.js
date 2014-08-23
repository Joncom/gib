ig.module('game.entities.attack-origin')
.requires('impact.entity')
.defines(function() {

    EntityAttackOrigin = ig.Entity.extend({

        size: { x: 16, y: 16 },
        angle: 0,

        init: function(x, y, settings) {
            this.parent(x, y, settings);
        },

        draw: function() {
            this.parent();

            // Draw line outward at angle.
            var scale = ig.system.scale;
            var start_x = (this.pos.x + this.size.x/2 - ig.game.screen.x) * scale;
            var start_y = (this.pos.y + this.size.y/2 - ig.game.screen.y) * scale;
            var end_x = Math.cos(this.angle) * 100;
            var end_y = Math.sin(this.angle) * 100;

            var context = ig.system.context;
            context.beginPath();
            context.moveTo(start_x, start_y);
            context.lineTo(end_x, end_y);
            context.stroke();
        }

    });

});