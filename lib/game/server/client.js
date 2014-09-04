ig.module('game.server.client')
.defines(function() {

    ig.Client = ig.Class.extend({

        name: null,
        socket: null,
        latency: -1,
        kills: 0,
        respawn_timer: null,

        init: function(name) {
            this.name = name
            this.respawn_timer = new ig.Timer(0.5);
        },

        respawn: function() {

            var entity = ig.game.getEntityByName(this.name);
            if(entity) {
                throw 'Respawn failed. Entity already exists.';
            }

            // Spawn entity.
            var pos = ig.game.get_random_spawn_position();
            var settings = { name: this.name };
            this.entity = ig.game.spawnEntity(EntityPlayer, pos.x, pos.y, settings);
        },

        is_dead: function() {
            var entity = ig.game.getEntityByName(this.name);
            return entity === undefined;
        }
    });

});
