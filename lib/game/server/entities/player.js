ig.module('game.server.entities.player')
.requires('game.entities.player')
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
        },

        attack: function() {
            var x = this.pos.x;
            var y = this.pos.y;
            var settings = {
                angle: this.attack_angle,
                attacker: this
            };
            ig.game.spawnEntity(EntityAttack, x, y, settings);
        }
    });
});