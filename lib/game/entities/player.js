ig.module('game.entities.player')
.requires(
    'impact.entity',
    'game.entities.attack'
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

            // Is this the local player?
            if(this.name === ig.game.player_name) {

                if(ig.input.pressed('ATTACK')) {

                    // Calculate angle to mouse.
                    var center_x = this.pos.x + this.size.x/2;
                    var center_y = this.pos.y + this.size.y/2;
                    var mouse_x = ig.input.mouse.x + ig.game.screen.x;
                    var mouse_y = ig.input.mouse.y + ig.game.screen.y;
                    var angle = Math.atan2(mouse_y - center_y, mouse_x - center_x);

                    var players = ig.game.getEntitiesByType(EntityPlayer);
                    for(var i=0; i<players.length; i++) {

                        var player = players[i];

                        // Don't check against self.
                        if(player === this) continue;

                        var x1 = player.pos.x;
                        var y1 = player.pos.y;
                        var x2 = player.pos.x + player.size.x;
                        var y2 = player.pos.y;
                        if(lineIntersect(center_x, center_y, mouse_x, mouse_y, x1, y1, x2, y2)) {
                            console.log("intersect");
                        }

                        var x1 = player.pos.x;
                        var y1 = player.pos.y;
                        var x2 = player.pos.x;
                        var y2 = player.pos.y + player.size.y;
                        if(lineIntersect(center_x, center_y, mouse_x, mouse_y, x1, y1, x2, y2)) {
                            console.log("intersect");
                        }

                        var x1 = player.pos.x + player.size.x;
                        var y1 = player.pos.y;
                        var x2 = player.pos.x + player.size.x;
                        var y2 = player.pos.y + player.size.y;
                        if(lineIntersect(center_x, center_y, mouse_x, mouse_y, x1, y1, x2, y2)) {
                            console.log("intersect");
                        }

                        var x1 = player.pos.x;
                        var y1 = player.pos.y + player.size.y;
                        var x2 = player.pos.x + player.size.x;
                        var y2 = player.pos.y + player.size.y;
                        if(lineIntersect(center_x, center_y, mouse_x, mouse_y, x1, y1, x2, y2)) {
                            console.log("intersect");
                        }
                    }
                }
            }
        }

    });

});

function lineIntersect(x1,y1,x2,y2, x3,y3,x4,y4) {
    var x=((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
    var y=((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
    if (isNaN(x)||isNaN(y)) {
        return false;
    } else {
        if (x1>=x2) {
            if (!(x2<=x&&x<=x1)) {return false;}
        } else {
            if (!(x1<=x&&x<=x2)) {return false;}
        }
        if (y1>=y2) {
            if (!(y2<=y&&y<=y1)) {return false;}
        } else {
            if (!(y1<=y&&y<=y2)) {return false;}
        }
        if (x3>=x4) {
            if (!(x4<=x&&x<=x3)) {return false;}
        } else {
            if (!(x3<=x&&x<=x4)) {return false;}
        }
        if (y3>=y4) {
            if (!(y4<=y&&y<=y3)) {return false;}
        } else {
            if (!(y3<=y&&y<=y4)) {return false;}
        }
    }
    return true;
}