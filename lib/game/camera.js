ig.module('game.camera')
.defines(function(){"use strict";

    ig.Camera = ig.Class.extend({

        update: function() {

            var name = ig.game.player_name;
            var player = ig.game.getEntityByName(name);

            // Center camera over player if he exists.
            if(player) {
                ig.game.screen.x = player.pos.x +
                    player.size.x/2 - ig.system.width/2;
                ig.game.screen.y = player.pos.y +
                    player.size.y/2 - ig.system.height/2;
            }
        }
    });
});
