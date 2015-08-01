ig.module('game.shared.entities.explosion')
.requires('impact.entity')
.defines(function() {

    EntityExplosion = ig.Entity.extend({

        radius: 64,
        zIndex: 16,
        animProgress: 0, // number between 0 and 1, inclusive
        fillFactorStart: 0.82,
        fillFactorEnd: 1,

        init: function(x, y, settings) {
            this.parent(x, y, settings);
            this.size.x = this.size.y = this.radius * 2;
        },

        draw: function() {
            this.parent();

            var x = ((this.pos.x + this.size.x/2) - ig.game.screen.x) * ig.system.scale;
            var y = ((this.pos.y + this.size.y/2) - ig.game.screen.y) * ig.system.scale;
            var fillFactor = this.animProgress.map(0, 1, this.fillFactorStart, this.fillFactorEnd);
            var radius = (this.radius * fillFactor) * ig.system.scale;
            ig.system.context.beginPath();
            ig.system.context.arc(x, y, radius, 0, 2 * Math.PI, false);
            ig.system.context.fillStyle = 'white';
            ig.system.context.fill();
        }
    });
});
