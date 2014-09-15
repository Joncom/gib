ig.module('game.client.entities.player')
.requires('game.shared.entities.player')
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
        },

        is_local: function() {
            return this.name === ig.game.local_player_name;
        }

    });

});
