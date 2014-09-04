ig.module('game.server.client')
.defines(function() {

    ig.Client = ig.Class.extend({
        socket: null,
        latency: -1,
        kills: 0,
    });

});
