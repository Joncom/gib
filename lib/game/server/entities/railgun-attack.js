ig.module('game.server.entities.railgun-attack')
.requires(
    'game.server.entities.attack',
    'game.server.entities.tracer'
)
.defines(function() {

    EntityRailgunAttack = EntityAttack.extend({

        init: function(x, y, settings) {
            this.parent(x, y, settings);

            var settings = { end_point: ig.copy(this.end_point) };
            ig.game.spawnEntity(EntityTracer, this.pos.x, this.pos.y, settings);

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
