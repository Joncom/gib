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
        }
    });

});
