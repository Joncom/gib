ig.module('game.client.entities.player')
.requires('game.shared.entities.player')
.defines(function() {

    EntityPlayer.inject({

        init: function(x, y, settings) {
            this.parent(x, y, settings);
        },

        update: function() {
            this.parent();

            // Is this player being controlled locally?
            if(this.is_local()) {

                // Send commands to server.
                var commands = ['UP', 'DOWN', 'LEFT', 'RIGHT', 'ATTACK'];
                for(var i=0; i<commands.length; i++) {
                    var command = commands[i];
                    if(ig.input.pressed(command))
                        this.socket.emit('command', '+' + command);
                    if(ig.input.released(command))
                        this.socket.emit('command', '-' + command);
                }
            }
        },

        draw: function() {
            this.parent();
        },

        is_local: function() {
            return this.name === ig.game.local_player_name;
        }

    });

});
