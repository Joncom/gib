ig.module('game.client.camera')
.defines(function(){"use strict";
    ig.Camera = ig.Class.extend({
        update: function() {

            // Do we have the user's UUID?
            var user_uuid = ig.game.user_uuid;
            if(user_uuid) {

                // Do does a matching entity exist?
                var entity = ig.game.getEntityByUUID(user_uuid);
                if(entity) {

                    // Center camera over entity.
                    ig.game.screen.x = entity.pos.x +
                        entity.size.x/2 - ig.system.width/2;
                    ig.game.screen.y = entity.pos.y +
                        entity.size.y/2 - ig.system.height/2;
                }
            }
        }
    });
});
