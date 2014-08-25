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
            var speed = 99999999; // basically instant
            var x = this.pos.x + this.size.x/2;
            var y = this.pos.y + this.size.y/2;
            var sx = Math.cos(this.angle) * speed;
            var sy = Math.sin(this.angle) * speed;
            var width = 1;
            var height = 1;

            // Calculate position of first tile collided with.
            var res = ig.game.collisionMap.trace2(x, y, sx, sy, width, height);
            var c_tilesize = ig.game.collisionMap.tilesize;
            var m_tilesize = ig.game.backgroundMaps[0].tilesize;
            var x = Math.floor((res.hit.x * c_tilesize) / 16) * 16;
            var y = Math.floor((res.hit.y * c_tilesize) / 16) * 16;

            // Print info for debugging purposes.
            ig.io.emit('info', JSON.stringify(res));

            // Spawn corpse at collision tile for testing.
            ig.game.spawnEntity(EntityCorpse, x, y);

            // Find points where attack intersects collision tile.
            var points = [];
            var lines = [{
                x1: x,
                y1: y,
                x2: x + m_tilesize,
                y2: y
            }, {
                x1: x + m_tilesize,
                y1: y,
                x2: x + m_tilesize,
                y2: y + m_tilesize
            }, {
                x1: x + m_tilesize,
                y1: y + m_tilesize,
                x2: x,
                y2: y + m_tilesize
            }, {
                x1: x,
                y1: y + m_tilesize,
                x2: x,
                y2: y
            }, ];
            for(var i=0; i<lines.length; i++) {
                var line = lines[i];
                var intersect = get_line_intersect_point(start_x, start_y, this.end_point.x, this.end_point.y, line.x1, line.y1, line.x2, line.y2 );
                if(intersect) {
                    points.push(intersect);
                }
            }
            ig.io.emit('info', JSON.stringify(points));

            // Find point closest to attack origin.
            // FIXME: Sometimes no points are found because
            // due to the collision map size, the line
            // _actually_ overlaps a neighbouring tile.
            if(points.length > 1) {
                var closest = this.distanceToCoord(points[0].x, points[0].y);
                this.end_point.x = points[0].x;
                this.end_point.y = points[0].y;
                for(var i=1; i<points.length; i++) {
                    var distance = this.distanceToCoord(points[i].x, points[i].y);
                    if(distance < closest) {
                        closest = distance;
                        this.end_point.x = points[i].x;
                        this.end_point.y = points[i].y;
                    }
                }
                ig.game.spawnEntity(EntityDot, this.end_point.x, this.end_point.y);
            }

            // Check for player hit.
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
                if(line_intersects(
                    start_x,
                    start_y,
                    this.end_point.x,
                    this.end_point.y,
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
                if(line_intersects(
                    start_x,
                    start_y,
                    this.end_point.x,
                    this.end_point.y,
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
                if(line_intersects(
                    start_x,
                    start_y,
                    this.end_point.x,
                    this.end_point.y,
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
                if(line_intersects(
                    start_x,
                    start_y,
                    this.end_point.x,
                    this.end_point.y,
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

                    // Kill player.
                    player.kill();

                    // Leave a corpse.
                    ig.game.spawnEntity(EntityCorpse, player.pos.x, player.pos.y);

                    // Add to dead players list.
                    ig.game.dead_list.push(player.name);
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