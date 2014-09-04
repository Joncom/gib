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

            if(!this.is_dead) {
                throw 'Respawn failed. Must be dead first.';
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
