ig.module('game.server.entities.corpse')
.requires('game.entities.corpse')
.defines(function() {

    EntityCorpse = ig.Entity.extend({

        kill_timer: new ig.Timer(3),

        init: function(x, y, settings) {
            this.parent(x, y, settings);
        },

        update: function() {
            this.parent();

            if(this.kill_timer.delta() >= 0) {
                this.kill();
            }
        }

    });

});
