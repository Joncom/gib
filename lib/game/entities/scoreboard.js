ig.module('game.entities.scoreboard')
.requires('impact.entity')
.defines(function() {

    EntityScoreboard = ig.Entity.extend({

        zIndex: 32,
        font: new ig.Font('media/04b03.font.png'),
        padding: 8,
        name_column_width: 96,
        kills_column_width: 32,
        ping_column_width: 32,

        init: function(x, y, settings) {
            this.parent(x, y, settings);
        },

        draw: function() {
            this.parent();

            var scale = ig.system.scale;
            var context = ig.system.context;

            var width = (this.padding * 2) + this.name_column_width +
                        this.kills_column_width + this.ping_column_width;
            context.save();
            context.beginPath();
            context.rect(0, 0, width * scale, 100);
            context.fill();
            context.restore();

            var x;
            var y = this.padding;
            var string;

            // Draw name header.
            x = this.padding;
            this.font.draw('Name', x, y);

            // Draw kills header.
            x = width - this.padding - this.ping_column_width;
            this.font.draw('Kills', x, y, ig.Font.ALIGN.RIGHT);

            // Draw ping header.
            x = width - this.padding;
            this.font.draw('Ping', x, y, ig.Font.ALIGN.RIGHT);

            y += this.font.height * 2;


            for(var name in ig.game.clients) {
                var client = ig.game.clients[name];

                // Draw name.
                x = this.padding;
                this.font.draw(name, x, y);

                // Draw kills.
                x = width - this.padding - this.ping_column_width;
                this.font.draw(client.kills, x, y, ig.Font.ALIGN.RIGHT);

                // Draw ping.
                x = width - this.padding;
                this.font.draw(client.latency, x, y, ig.Font.ALIGN.RIGHT);

                // Increment y to prevent overlap.
                y += this.font.height;
            }
        }

    });

});
