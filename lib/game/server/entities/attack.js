ig.module('game.server.entities.attack')
.requires('game.entities.attack')
.defines(function() {

    EntityAttack.inject({

        kill_timer: null,
        attacker: null,

        init: function(x, y, settings) {
            this.parent(x, y, settings);
            this.kill_timer = new ig.Timer(3);

            var scale = ig.system.scale;
            var start_x = this.pos.x + this.size.x/2;
            var start_y = this.pos.y + this.size.y/2;
            var end_x = start_x + Math.cos(this.angle) * 1024; // FIXME: magic number
            var end_y = start_y + Math.sin(this.angle) * 1024; // FIXME: magic number

            // Check for hit.
            var players = ig.game.getEntitiesByType(EntityPlayer);
            for(var i=0; i<players.length; i++) {

                var hit = false;
                var player = players[i];

                // Prevent player from attacking himself.
                if(player === this.attacker) continue;

                var x1 = player.pos.x;
                var y1 = player.pos.y;
                var x2 = player.pos.x + player.size.x;
                var y2 = player.pos.y;
                if(lineIntersect(
                    start_x,
                    start_y,
                    end_x,
                    end_y,
                    x1,
                    y1,
                    x2,
                    y2
                )) {
                    hit = true;
                }

                var x1 = player.pos.x;
                var y1 = player.pos.y;
                var x2 = player.pos.x;
                var y2 = player.pos.y + player.size.y;
                if(lineIntersect(
                    start_x,
                    start_y,
                    end_x,
                    end_y,
                    x1,
                    y1,
                    x2,
                    y2
                )) {
                    hit = true;
                }

                var x1 = player.pos.x + player.size.x;
                var y1 = player.pos.y;
                var x2 = player.pos.x + player.size.x;
                var y2 = player.pos.y + player.size.y;
                if(lineIntersect(
                    start_x,
                    start_y,
                    end_x,
                    end_y,
                    x1,
                    y1,
                    x2,
                    y2
                )) {
                    hit = true;
                }

                var x1 = player.pos.x;
                var y1 = player.pos.y + player.size.y;
                var x2 = player.pos.x + player.size.x;
                var y2 = player.pos.y + player.size.y;
                if(lineIntersect(
                    start_x,
                    start_y,
                    end_x,
                    end_y,
                    x1,
                    y1,
                    x2,
                    y2
                )) {
                    hit = true;
                }

                if(hit) {
                    var message = this.attacker.name + ' hit ' + player.name + '.';
                    console.log(message);
                    ig.io.emit('info', message);
                }
            }
        },

        update: function() {
            this.parent();

            if(this.kill_timer.delta() >= 0) {
                this.kill();
            }
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
