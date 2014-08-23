ig.module('game.entities.player')
.requires(
    'impact.entity',
    'game.entities.attack-origin'
)
.defines(function() {

    EntityPlayer = ig.Entity.extend({

        size: { x: 16, y: 16 },
        speed: 150,
        animSheet: new ig.AnimationSheet('media/tilesheet.png', 16, 16),

        init: function(x, y, settings) {
            this.parent(x, y, settings);
            this.addAnim('default', 1, [0]);
            this.maxVel.x = this.maxVel.y = this.speed;
        },

        draw: function() {
            this.parent();

            if(ig.input.state('ATTACK')) {

                var x = this.pos.x;
                var y = this.pos.y;
                ig.game.spawnEntity(EntityAttackOrigin, x, y);
                return;

                var scale = ig.system.scale;
                var start_x = (this.pos.x + this.size.x/2 - ig.game.screen.x) * scale;
                var start_y = (this.pos.y + this.size.y/2 - ig.game.screen.y) * scale;
                var end_x = ig.input.mouse.x * scale;
                var end_y = ig.input.mouse.y * scale;

                var context = ig.system.context;
                context.beginPath();
                context.moveTo(start_x, start_y);
                context.lineTo(end_x, end_y);
                context.stroke();
            }
        }

    });

});