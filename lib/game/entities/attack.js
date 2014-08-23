ig.module('game.entities.attack')
.requires('impact.entity')
.defines(function() {

    EntityAttack = ig.Entity.extend({

        size: { x: 16, y: 16 },
        angle: 0,

        init: function(x, y, settings) {
            this.parent(x, y, settings);
        },

        draw: function() {
            this.parent();

            // Draw line outward at angle.
            var scale = ig.system.scale;
            var start_x = (this.pos.x + this.size.x/2 - ig.game.screen.x) * scale;
            var start_y = (this.pos.y + this.size.y/2 - ig.game.screen.y) * scale;
            var end_x = start_x + Math.cos(this.angle) * 100;
            var end_y = start_y + Math.sin(this.angle) * 100;

            var context = ig.system.context;
            context.beginPath();
            context.moveTo(start_x, start_y);
            context.lineTo(end_x, end_y);
            context.stroke();
        }

    });

});

// http://stackoverflow.com/questions/9043805/test-if-two-lines-intersect-javascript-function
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

/*
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
*/