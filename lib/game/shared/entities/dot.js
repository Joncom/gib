ig.module('game.client.entities.dot')
.requires('impact.entity')
.defines(function() {

    EntityDot = ig.Entity.extend({

        size: { x: 1, y: 1 },
        animSheet: new ig.AnimationSheet('media/dot.png', 1, 1),
        zIndex: 64,

        init: function(x, y, settings) {
            this.parent(x, y, settings);
            this.addAnim('default', 1, [0]);
        }

    });

});
