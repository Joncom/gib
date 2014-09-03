ig.module('game.entities.scoreboard')
.requires('impact.entity')
.defines(function() {

    EntityScoreboard = ig.Entity.extend({

        zIndex: 32,

        init: function(x, y, settings) {
            this.parent(x, y, settings);
        }

    });

});
