ig.module('game.shared.entities.spawn')
.requires('impact.entity')
.defines(function() {

    EntitySpawn = ig.Entity.extend({

        size: { x: 16, y: 16 },
        animSheet: new ig.AnimationSheet('media/tilesheet.png', 16, 16),

        init: function(x, y, settings) {
            this.parent(x, y, settings);
            this.addAnim('default', 1, [3]);

            // Spawn points needed only server side.
            if(!ig.global.wm && !ig.game.is_server) {
                this.kill();
            }
        }

    });

});
