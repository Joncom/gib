ig.module('game.client.main')
.requires(
    'impact.debug.debug',
    'impact.game',
    'impact.font',
    'plugins.joncom.url-variables.url-variables',
    'plugins.empika.debug_display'
)
.defines(function(){"use strict";

    var MyGame = ig.Game.extend({

        font: new ig.Font( 'media/04b03.font.png' ),
        camera: null,
        debugDisplay: null,

        init: function() {
            window.onresize = this.onresize;
            this.onresize();
        },

        update: function() {
            this.parent();
        },

        draw: function() {
            this.parent();

            var debugInfo = [];
            if(this.player) {
                debugInfo.push("pos.x: " + this.player.pos.x);
                debugInfo.push("pos.y: " + this.player.pos.y);
                debugInfo.push("tile.x: " + this.player.pos.x / tilesize);
                debugInfo.push("tile.y: " + this.player.pos.y / tilesize);
                debugInfo.push("last.x: " + this.player.last.x);
                debugInfo.push("last.y: " + this.player.last.y);
                if(this.player.destination) {
                    debugInfo.push("destination.x: " + this.player.destination.x);
                    debugInfo.push("destination.y: " + this.player.destination.y);
                }
            }
            this.debugDisplay.draw(debugInfo);
        },

        onresize: function(event) {
            var width = Math.floor(window.innerWidth/ig.system.scale);
            var height = Math.floor(window.innerHeight/ig.system.scale);
                width = 240;
                height = 160;
            ig.system.resize(width, height);
        }

    });

    var scale = 2;
    var width = Math.floor(window.innerWidth/scale);
    var height = Math.floor(window.innerHeight/scale);
    ig.main('#canvas', MyGame, 60, width, height, scale);

});
