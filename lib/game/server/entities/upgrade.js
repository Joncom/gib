ig.module('game.server.entities.upgrade')
.requires('game.shared.entities.upgrade')
.defines(function() {

    EntityUpgrade.inject({

        type: ig.Entity.TYPE.B,
        friction: { x: 400, y: 400 },
        maxVel: { x: 400, y: 400 },

        init: function(x, y, settings) {
            this.parent(x, y, settings);
            this.name = 'upgrade-' + this.id;
        },

        update: function() {
            this.parent();
        }
    });
});
