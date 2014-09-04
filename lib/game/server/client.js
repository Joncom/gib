ig.module('game.server.client')
.defines(function() {

    ig.Client = ig.Class.extend({
        socket: null,
        latency: -1,
        kills: 0,
        respawn_timer: null,

        init: function() {
            this.respawn_timer = new ig.Timer(0.5);
        }
    });

});
