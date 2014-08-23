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

        update: function() {
            this.parent();

            if(ig.input.state('ATTACK')) {

                // Calculate angle to mouse.
                var center_x = this.pos.x + this.size.x/2;
                var center_y = this.pos.y + this.size.y/2;
                var mouse_x = ig.input.mouse.x + ig.game.screen.x;
                var mouse_y = ig.input.mouse.y + ig.game.screen.y;
                var angle = Math.atan2(mouse_y - center_y, mouse_x - center_x);

                // Spawn entity.
                var x = this.pos.x;
                var y = this.pos.y;
                var settings = { angle: angle };
                ig.game.spawnEntity(EntityAttackOrigin, x, y, settings);
            }
        }

    });

});