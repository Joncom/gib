ig.module('game.server.entities.corpse')
.requires('game.entities.corpse')
.defines(function() {

    EntityCorpse = ig.Entity.extend({

        kill_timer: null,

        init: function(x, y, settings) {
            this.parent(x, y, settings);

            this.kill_timer = new ig.Timer(3);

            // Networked entities need names.
            this.name = 'corpse-' + this.id;
        },

        update: function() {
            this.parent();

            if(this.kill_timer.delta() >= 0) {
                this.kill();
            }
        }

    });

});
