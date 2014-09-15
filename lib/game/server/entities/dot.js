ig.module('game.server.entities.dot')
.requires('game.shared.entities.dot')
.defines(function() {

    EntityDot.inject({

        kill_timer: null,

        init: function(x, y, settings) {
            this.parent(x, y, settings);
            this.kill_timer = new ig.Timer(1);

            this.name = 'dot-' + this.id;
        },

        update: function() {
            this.parent();

            if(this.kill_timer.delta() >= 0) {
                this.kill();
            }
        }

    });

});
