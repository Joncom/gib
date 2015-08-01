ig.module('game.server.entities.player')
.requires('game.shared.entities.player')
.defines(function() {

    EntityPlayer.inject({

        commands: {}, // active commands stored as keys; values always true
        fire_timer: null,

        init: function(x, y, settings) {
            this.parent(x, y, settings);
            this.fire_timer = new ig.Timer(1/2);
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

            // Has fire cooldown expired?
            if(this.fire_timer.delta() >= 0) {

                // Has an attack command been issued?
                if(this.commands['ATTACK']) {
                    this.fire_timer.reset();
                    this.attack();
                }
            }

            this.parent();
        },

        attack: function() {
            ig.game.log('Player ' + this.name + ' attacks!');
            var x = this.pos.x;
            var y = this.pos.y;
            var settings = {
                angle: this.attack_angle,
                attacker: this
            };
            ig.game.spawnEntity(EntityRailgunAttack, x, y, settings);
        },

        getEdges: function() {
            return [
                {
                    x1: this.pos.x,
                    y1: this.pos.y,
                    x2: this.pos.x + this.size.x,
                    y2: this.pos.y
                },
                {
                    x1: this.pos.x,
                    y1: this.pos.y,
                    x2: this.pos.x,
                    y2: this.pos.y + this.size.y
                },
                {
                    x1: this.pos.x + this.size.x,
                    y1: this.pos.y,
                    x2: this.pos.x + this.size.x,
                    y2: this.pos.y + this.size.y
                },
                {
                    x1: this.pos.x,
                    y1: this.pos.y + this.size.y,
                    x2: this.pos.x + this.size.x,
                    y2: this.pos.y + this.size.y
                }
            ];
        }
    });
});