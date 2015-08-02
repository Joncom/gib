ig.module('game.shared.entities.upgrade')
.requires('impact.entity')
.defines(function() {

    EntityUpgrade = ig.Entity.extend({

        size: { x: 16, y: 16 },
        animSheet: new ig.AnimationSheet('media/upgrade.png', 16, 16),
        zIndex: 4,

        init: function(x, y, settings) {
            this.parent(x, y, settings);
            this.addAnim('default', 1, [0]);
        }
    });
});
