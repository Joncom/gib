ig.module('game.entities.scoreboard')
.requires('impact.entity')
.defines(function() {

    EntityScoreboard = ig.Entity.extend({

        zIndex: 32,
        font: new ig.Font('media/04b03.font.png'),

        init: function(x, y, settings) {
            this.parent(x, y, settings);
        },

        draw: function() {
            this.parent();

            /*
            context.save();
            context.beginPath();
            context.rect(0, 0, 200, 100);
            context.fill();
            context.restore();
            */

            var y = 64;
            for(var name in ig.game.clients) {
                var client = ig.game.clients[name];

                // Draw name.
                this.font.draw(name, 0, y);

                // Draw kills.
                this.font.draw(client.kills, 96, y);

                // Draw ping.
                this.font.draw(client.ping, 128, y);

                // Increment y to prevent overlap.
                y += this.font.height;
            }
        }

    });

});
