ig.module('game.server.entities.explosion')
.requires('game.shared.entities.explosion')
.defines(function() {

    EntityExplosion.inject({

        totalAnimDuration: 0.25,
        animTimer: null,

        init: function(x, y, settings) {
            this.parent(x, y, settings);

            // Networked entities require names.
            this.name = 'explosion-' + this.id;

            this.animTimer = new ig.Timer(this.totalAnimDuration);
        },

        update: function() {
            this.parent();

            if(this.animTimer.delta() > 0) {
                this.kill();
            } else {
                var remaining = -this.animTimer.delta();
                this.animProgress = percentCompleted = (this.totalAnimDuration - remaining) / this.totalAnimDuration;
            }
        }
    });
});
