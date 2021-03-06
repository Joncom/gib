ig.module('game.server.entities.attack')
.requires(
    'impact.entity',
    'game.server.collision-map'
)
.defines(function() {

    EntityAttack = ig.Entity.extend({

        size: { x: 16, y: 16 },
        attacker: null,
        angle: 0,
        origin: { x: null, y: null },
        end_point: { x: null, y: null },

        init: function(x, y, settings) {
            this.parent(x, y, settings);

            this.origin.x = this.pos.x + this.size.x/2;
            this.origin.y = this.pos.y + this.size.y/2;

            // Calculate position of first tile collided with.
            var speed = 99999999; // basically instant
            var x = this.pos.x + this.size.x/2;
            var y = this.pos.y + this.size.y/2;
            var sx = Math.cos(this.angle) * speed;
            var sy = Math.sin(this.angle) * speed;
            var width = 1;
            var height = 1;
            var res = ig.game.collisionMap.trace2(x, y, sx, sy, width, height);

            var tilesize = ig.game.collisionMap.tilesize;
            var distance = this.attacker.distanceToCoord(res.hit.x * tilesize, res.hit.y * tilesize);

            this.end_point.x = this.origin.x + Math.cos(this.angle) * distance;
            this.end_point.y = this.origin.y + Math.sin(this.angle) * distance;
        },

        hitsPlayer: function(player) {
            var edges = player.getEdges();
            for(var j=0; j<edges.length; j++) {
                if(line_intersects(
                    this.origin.x,
                    this.origin.y,
                    this.end_point.x,
                    this.end_point.y,
                    edges[j].x1,
                    edges[j].y1,
                    edges[j].x2,
                    edges[j].y2
                )) {
                    return true;
                }
            }
            return false;
        }

    });

});

// http://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect/1968345#1968345
function line_intersects( p0_x, p0_y, p1_x, p1_y, p2_x, p2_y, p3_x, p3_y, i_x, i_y) {

    var s1_x, s1_y, s2_x, s2_y;
    s1_x = p1_x - p0_x;
    s1_y = p1_y - p0_y;
    s2_x = p3_x - p2_x;
    s2_y = p3_y - p2_y;

    var s, t;
    s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y);
    t = ( s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y);

    if (s >= 0 && s <= 1 && t >= 0 && t <= 1)
    {
        // Collision detected
        // if (i_x != NULL)
        //     i_x = p0_x + (t * s1_x);
        // if (i_y != NULL)
        //     i_y = p0_y + (t * s1_y);
        return 1;
    }

    return 0; // No collision
}

function get_line_intersect_point( p0_x, p0_y, p1_x, p1_y, p2_x, p2_y, p3_x, p3_y ) {

    var s1_x, s1_y, s2_x, s2_y;
    s1_x = p1_x - p0_x;
    s1_y = p1_y - p0_y;
    s2_x = p3_x - p2_x;
    s2_y = p3_y - p2_y;

    var s, t;
    s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y);
    t = ( s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y);

    if (s >= 0 && s <= 1 && t >= 0 && t <= 1)
    {
        // Collision detected
        return {
            x: p0_x + (t * s1_x),
            y: p0_y + (t * s1_y)
        };
    }

    return false; // No collision
}
