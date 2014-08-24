ig.module('game.entities.player')
.requires('impact.entity')
.defines(function() {

    EntityCorpse = ig.Entity.extend({

        size: { x: 16, y: 16 },
        animSheet: new ig.AnimationSheet('media/tilesheet.png', 16, 16),

        init: function(x, y, settings) {
            this.parent(x, y, settings);
            this.addAnim('default', 1, [3]);
        }

    });

});
