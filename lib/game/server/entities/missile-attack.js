ig.module('game.server.entities.missile-attack')
.requires(
    'game.server.entities.attack',
    'game.server.entities.explosion',
    'game.server.entities.tracer'
)
.defines(function() {

    EntityMissileAttack = EntityAttack.extend({

        init: function(x, y, settings) {
            this.parent(x, y, settings);

            // Build a list of players this attack potentially hits
            var candidates = [];
            var players = ig.game.getEntitiesByType(EntityPlayer);
            for(var i=0; i<players.length; i++) {
                var player = players[i];

                // Prevent player from attacking himself.
                if(player === this.attacker) continue;

                if(this.hitsPlayer(player)) {
                    candidates.push(player);
                }
            }

            // Find closest player out of possibly hits players
            var closestCandidate = null;
            var closestDistance = null;
            if(candidates.length > 0) {
                for(var i=0; i<candidates.length; i++) {
                    var candidate = candidates[i];
                    var distance = this.attacker.distanceTo(candidate);
                    if(closestDistance === null || distance < closestDistance) {
                        closestDistance = distance;
                        closestCandidate = candidate;
                    }
                }
            }

            // Recalculate end point if a player was hit before the wall
            if(closestCandidate) {
                this.end_point.x = this.origin.x + Math.cos(this.angle) * closestDistance;
                this.end_point.y = this.origin.y + Math.sin(this.angle) * closestDistance;
            }

            var settings = { end_point: ig.copy(this.end_point) };
            ig.game.spawnEntity(EntityTracer, this.pos.x, this.pos.y, settings);

            var x = this.end_point.x - EntityExplosion.prototype.radius;
            var y = this.end_point.y - EntityExplosion.prototype.radius;
            ig.game.spawnEntity(EntityExplosion, x, y);

            // Check for player hit.
            var players = ig.game.getEntitiesByType(EntityPlayer);
            for(var i=0; i<players.length; i++) {
                var player = players[i];

                // Prevent player from attacking himself.
                if(player === this.attacker) continue;

                if(this.hitsPlayer(player)) {

                    var message = this.attacker.name + ' hit ' + player.name + '.';
                    ig.game.log(message);
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

            this.kill();
        }
    });
});
