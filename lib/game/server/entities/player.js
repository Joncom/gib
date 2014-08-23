ig.module('game.server.entities.player')
.requires('game.entities.player', 'game.entities.attack')
.defines(function() {

    EntityPlayer.inject({

        commands: {}, // active commands stored as keys; values always true

        init: function(x, y, settings) {
            this.parent(x, y, settings);
        },

        update: function() {

            if(this.commands['LEFT'] && !this.commands['RIGHT'])
                this.vel.x = -this.speed;
            else if(this.commands['RIGHT'] && !this.commands['LEFT'])
                this.vel.x = this.speed;
            else
                this.vel.x = 0;

            if(this.commands['UP'] && !this.commands['DOWN'])
                this.vel.y = -this.speed;
            else if(this.commands['DOWN'] && !this.commands['UP'])
                this.vel.y = this.speed;
            else
                this.vel.y = 0;

            if(this.commands['ATTACK']) {
                this.attack();
            }

            this.parent();

            // Send snapshot to client.
            var snapshot = this.take_snapshot();
            this.socket.emit('snapshot', snapshot);
        },

        attack: function() {
            var x = this.pos.x;
            var y = this.pos.y;
            var settings = { angle: this.attack_angle };
            ig.game.spawnEntity(EntityAttack, x, y, settings);
        },

        take_snapshot: function() {

            var snapshot = {};

            // Add players to snapshot.
            snapshot.players = {};
            var players = ig.game.getEntitiesByType(EntityPlayer);
            for(var i=0; i<players.length; i++) {
                var entity = players[i];
                var name = entity.name;
                snapshot.players[name] = {
                    pos: players[i].pos
                };
            }

            // Add attacks to snapshot.
            snapshot.attacks = {};
            var attacks = ig.game.getEntitiesByType(EntityAttack);
            for(var i=0; i<attacks.length; i++) {
                var entity = attacks[i];
                var name = 'attack-' + entity.id;
                snapshot.attacks[name] = {
                    pos: attacks[i].pos
                };
            }

            return snapshot;
        }
    });
});