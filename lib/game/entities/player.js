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
            var cmd = 'UP';
            if(ig.input.pressed(cmd))
                ig.game.gateway.emit('command', '+' + cmd);
            if(ig.input.released(cmd))
                ig.game.gateway.emit('command', '-' + cmd);

            cmd = 'DOWN';
            if(ig.input.pressed(cmd))
                ig.game.gateway.emit('command', '+' + cmd);
            if(ig.input.released(cmd))
                ig.game.gateway.emit('command', '-' + cmd);

            cmd = 'LEFT';
            if(ig.input.pressed(cmd))
                ig.game.gateway.emit('command', '+' + cmd);
            if(ig.input.released(cmd))
                ig.game.gateway.emit('command', '-' + cmd);

            cmd = 'RIGHT';
            if(ig.input.pressed(cmd))
                ig.game.gateway.emit('command', '+' + cmd);
            if(ig.input.released(cmd))
                ig.game.gateway.emit('command', '-' + cmd);

            this.parent();
        }

    });

});