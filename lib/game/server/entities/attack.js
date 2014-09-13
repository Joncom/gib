ig.module('game.server.entities.attack')
.requires('game.entities.attack', 'game.collision-map')
.defines(function() {

    EntityAttack.inject({

        kill_timer: null,
        attacker: null,
        angle: 0,

        init: function(x, y, settings) {
            this.parent(x, y, settings);

            // Networked entities require names.
            this.name = 'attack-' + this.id;

            this.kill_timer = new ig.Timer(3);

            var scale = ig.system.scale;
            var start_x = this.pos.x + this.size.x/2;
            var start_y = this.pos.y + this.size.y/2;
            this.end_point.x = start_x + Math.cos(this.angle) * 1024; // FIXME: magic number
            this.end_point.y = start_y + Math.sin(this.angle) * 1024; // FIXME: magic number

            // Check for collision map hit.

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
            var x = res.hit.x * tilesize;
            var y = res.hit.y * tilesize;

            // Print info for debugging purposes.
            //ig.io.emit('info', JSON.stringify(res));

            // Spawn corpse at collision tile for testing.
            //ig.game.spawnEntity(EntityCorpse, x, y);

            this.end_point.x = res.hit.x;
            this.end_point.y = res.hit.y;

            // Check for player hit.
            var players = ig.game.getEntitiesByType(EntityPlayer);
            for(var i=0; i<players.length; i++) {

                var hit = false;
                var player = players[i];

                // Prevent player from attacking himself.
                if(player === this.attacker) continue;

                var edges = [
                    {
                        x1: player.pos.x,
                        y1: player.pos.y,
                        x2: player.pos.x + player.size.x,
                        y2: player.pos.y
                    },
                    {
                        x1: player.pos.x,
                        y1: player.pos.y,
                        x2: player.pos.x,
                        y2: player.pos.y + player.size.y
                    },
                    {
                        x1: player.pos.x + player.size.x,
                        y1: player.pos.y,
                        x2: player.pos.x + player.size.x,
                        y2: player.pos.y + player.size.y
                    },
                    {
                        x1: player.pos.x,
                        y1: player.pos.y + player.size.y,
                        x2: player.pos.x + player.size.x,
                        y2: player.pos.y + player.size.y
                    }
                ];

                for(var i=0; i<edges.length; i++) {
                    if(line_intersects(
                        start_x,
                        start_y,
                        this.end_point.x,
                        this.end_point.y,
                        edges[i].x1,
                        edges[i].y1,
                        edges[i].x2,
                        edges[i].y2
                    )) {
                        hit = true;
                        break;
                    }
                }

                if(hit) {
                    var message = this.attacker.name + ' hit ' + player.name + '.';
                    console.log(message);
                    ig.io.emit('info', message);

                    // Award point to attacker.
                    ig.game.clients[this.attacker.name].kills++;

                    // Kill player.
                    player.kill();

                    // Ensure player cannot spawn right away.
                    var victim_client = ig.game.clients[player.name];
                    victim_client.respawn_timer.reset();

                    // Leave a corpse.
                    ig.game.spawnEntity(EntityCorpse, player.pos.x, player.pos.y);
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