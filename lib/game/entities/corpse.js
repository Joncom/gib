ig.module('game.entities.corpse')
.requires('impact.entity')
.defines(function() {

    EntityCorpse = ig.Entity.extend({

        size: { x: 16, y: 16 },
        animSheet: new ig.AnimationSheet('media/tilesheet.png', 16, 16),
        kill_timer: new ig.Timer(3),

        init: function(x, y, settings) {
            this.parent(x, y, settings);
            this.addAnim('default', 1, [3]);
        },

        update: function() {
            this.parent();

            if(this.kill_timer.delta() >= 0) {
                this.kill();
            }
        }

    });

});
