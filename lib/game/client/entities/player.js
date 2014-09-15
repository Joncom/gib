ig.module('game.client.entities.player')
.requires('game.shared.entities.base-player')
.defines(function() {

    EntityPlayer.inject({

        init: function(x, y, settings) {
            this.parent(x, y, settings);
        },

        update: function() {
            this.parent();
        },

        draw: function() {
            this.parent();
        }

    });

});
