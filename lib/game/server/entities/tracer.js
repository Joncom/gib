ig.module('game.server.entities.tracer')
.requires('game.shared.entities.tracer')
.defines(function() {

    EntityTracer.inject({

        kill_timer: null,

        init: function(x, y, settings) {
            this.parent(x, y, settings);
            this.kill_timer = new ig.Timer(3);

            // Networked entities require names.
            this.name = 'tracer-' + this.id;
        },

        update: function() {
            this.parent();

            if(this.kill_timer.delta() >= 0) {
                this.kill();
            }
        }
    });
});
