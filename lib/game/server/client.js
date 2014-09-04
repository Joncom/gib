ig.module('game.server.client')
.defines(function() {

    ig.Client = ig.Class.extend({

        name: null,
        socket: null,
        latency: -1,
        kills: 0,
        is_dead: true,
        respawn_timer: null,

        init: function(name) {
            this.name = name
            this.respawn_timer = new ig.Timer(0.5);
        },

        respawn: function() {

            // Is the player actually dead?
            if(!this.is_dead) {
                throw 'Cannot respawn ' + this.name + ' because not dead.';
            }

            // Remove 'is dead' flag.
            this.is_dead = false;

            // Spawn entity.
            var pos = ig.game.get_random_spawn_position();
            var settings = { name: this.name };
            this.entity = ig.game.spawnEntity(EntityPlayer, pos.x, pos.y, settings);
        }
    });

});
