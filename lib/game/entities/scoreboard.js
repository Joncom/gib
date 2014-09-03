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

            // Client count will be needed to
            // calculate rectange dimensions.
            var client_count = 0;
            for(var name in ig.game.clients) {
                client_count++;
            }

            var width = (this.padding * 2) + this.name_column_width +
                        this.kills_column_width + this.ping_column_width;
            var height = (this.padding * 2) +
                         (this.font.height * 2) + // header row + space row
                         (this.font.height * client_count);
            var base_x = Math.floor(ig.system.width/2 - width/2);
            var base_y = Math.floor(ig.system.height/2 - height/2);

            // Draw background box.
            context.save();
            context.globalAlpha = 0.5;
            context.beginPath();
            context.rect(
                base_x * scale,
                base_y * scale,
                width * scale,
                height * scale
            );
            context.fill();
            context.restore();

            var x;
            var y = base_y + this.padding;
            var string;

            // Draw name header.
            x = base_x + this.padding;
            this.font.draw('Name', x, y);

            // Draw kills header.
            x = base_x + width - this.padding - this.ping_column_width;
            this.font.draw('Kills', x, y, ig.Font.ALIGN.RIGHT);

            // Draw ping header.
            x = base_x + width - this.padding;
            this.font.draw('Ping', x, y, ig.Font.ALIGN.RIGHT);

            y += this.font.height * 2;

            for(var name in ig.game.clients) {
                var client = ig.game.clients[name];

                // Draw name.
                x = base_x + this.padding;
                this.font.draw(name, x, y);

                // Draw kills.
                x = base_x + width - this.padding - this.ping_column_width;
                this.font.draw(client.kills, x, y, ig.Font.ALIGN.RIGHT);

                // Draw ping.
                x = base_x + width - this.padding;
                this.font.draw(client.latency, x, y, ig.Font.ALIGN.RIGHT);

                // Increment y to prevent overlap.
                y += this.font.height;
            }
        }

    });

});
