ig.module('game.shared.entities.tracer')
.requires('impact.entity')
.defines(function() {

    EntityTracer = ig.Entity.extend({

        size: { x: 16, y: 16 },
        zIndex: 16,
        end_point: { x: 0, y: 0 },

        draw: function() {
            this.parent();

            // Draw line outward toward end point.
            var origin_x = this.pos.x + this.size.x/2;
            var origin_y = this.pos.y + this.size.y/2;
            var start_x = (origin_x - ig.game.screen.x) * ig.system.scale;
            var start_y = (origin_y - ig.game.screen.y) * ig.system.scale;
            var end_x = (this.end_point.x - ig.game.screen.x) * ig.system.scale;
            var end_y = (this.end_point.y - ig.game.screen.y) * ig.system.scale;
            ig.system.context.beginPath();
            ig.system.context.moveTo(start_x, start_y);
            ig.system.context.lineTo(end_x, end_y);
            ig.system.context.lineWidth = ig.system.scale;
            ig.system.context.stroke();
        }
    });
});
