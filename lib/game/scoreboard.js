ig.module('game.scoreboard')
.requires('impact.entity')
.defines(function() {

    ig.Scoreboard = ig.Class.extend({

        font: new ig.Font('media/04b03.font.png'),
        padding: 8,
        name_column_width: 96,
        kills_column_width: 32,
        ping_column_width: 32,

        init: function() {},

        draw: function() {

            // Create reference client array.
            var clients = [];
            for(var name in ig.game.clients) {
                var client = ig.copy(ig.game.clients[name]);
                client.name = name;
                clients.push(client);
            }

            // Sort array from highest to lowest score.
            clients.sort(function(a, b){
                var keyA = a.kills,
                keyB = b.kills;
                if(keyA > keyB) return -1;
                if(keyA < keyB) return 1;
                return 0;
            });

            // Calculate background rectangle size and position.
            var scale = ig.system.scale;
            var width = (this.padding * 2) + this.name_column_width +
                        this.kills_column_width + this.ping_column_width;
            var height = (this.padding * 2) +
                         (this.font.height * 2) + // header row + space row
                         (this.font.height * clients.length);
            var base_x = Math.floor(ig.system.width/2 - width/2);
            var base_y = Math.floor(ig.system.height/2 - height/2);

            // Draw background box.
            var context = ig.system.context;
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

            for(var i=0; i<clients.length; i++) {
                var client = clients[i];

                // Draw name.
                x = base_x + this.padding;
                this.font.draw(client.name, x, y);

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
