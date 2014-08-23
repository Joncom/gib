ig.module('game.server.entities.player')
.requires('shared.entities.grid-traveller')
.defines(function() {

    EntityPlayer = EntityGridTraveller.extend({

        size: { x: 16, y: 16 },
        speed: 150,
        animSheet: new ig.AnimationSheet('media/tilesheet.png', 16, 16),
        commands: {}, // active commands stored as keys; values always true

        init: function(x, y, settings) {
            this.parent(x, y, settings);
            this.addAnim('default', 1, [0]);
            this.maxVel.x = this.maxVel.y = this.speed;
        },

        update: function() {

            if(this.commands['RIGHT'])
                this.moveIntent = EntityGridTraveller.DIRECTION.RIGHT;
            else if(this.commands['LEFT'])
                this.moveIntent = EntityGridTraveller.DIRECTION.LEFT;
            else if(this.commands['UP'])
                this.moveIntent = EntityGridTraveller.DIRECTION.UP;
            else if(this.commands['DOWN'])
                this.moveIntent = EntityGridTraveller.DIRECTION.DOWN;
            else this.moveIntent = null;

            this.parent();

            // Send snapshot to client.
            var snapshot = this.take_snapshot();
            this.socket.emit('snapshot', snapshot);
        },

        take_snapshot: function() {

            var snapshot = {};

            // Add player data to snapshot.
            snapshot.players = {};
            var players = ig.game.getEntitiesByType(EntityPlayer);
            for(var i=0; i<players.length; i++) {
                var name = players['name'];
                snapshot.players[name] = {
                    pos: players[i].pos
                };
            }

            return snapshot;
        }
    });
});