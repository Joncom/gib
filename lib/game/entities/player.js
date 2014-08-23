ig.module('game.entities.player')
.requires('shared.entities.grid-traveller')
.defines(function() {

    EntityPlayer = EntityGridTraveller.extend({

        size: { x: 16, y: 16 },
        speed: 150,
        animSheet: new ig.AnimationSheet('media/tilesheet.png', 16, 16),

        init: function(x, y, settings) {
            this.parent(x, y, settings);
            this.addAnim('default', 1, [0]);
            this.maxVel.x = this.maxVel.y = this.speed;
        },

        update: function() {

            // Send movement commands to server.
            var commands = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
            for(var i=0; i<commands.length; i++) {
                var command = commands[i];
                if(ig.input.pressed(command))
                    server.emit('command', '+' + command);
                if(ig.input.released(command))
                    server.emit('command', '-' + command);
            }

            this.parent();
        }

    });

});