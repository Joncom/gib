ig.module('game.shared.entities.attack')
.requires('impact.entity')
.defines(function() {

    EntityAttack = ig.Entity.extend({

        size: { x: 16, y: 16 },
        zIndex: 16,
        end_point: { x: 0, y: 0 },

        draw: function() {
            this.parent();

            // Draw line outward toward end point.
            var scale = ig.system.scale;
            var start_x = (this.pos.x + this.size.x/2 - ig.game.screen.x) * scale;
            var start_y = (this.pos.y + this.size.y/2 - ig.game.screen.y) * scale;
            var end_x = (this.end_point.x - ig.game.screen.x) * scale;
            var end_y = (this.end_point.y - ig.game.screen.y) * scale;

            var context = ig.system.context;
            context.beginPath();
            context.moveTo(start_x, start_y);
            context.lineTo(end_x, end_y);
            context.lineWidth = scale;
            context.stroke();
        }

    });

});
