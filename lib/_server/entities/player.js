ig.module('_zone.entities.player')
.requires('shared.entities.grid-traveller')
.defines(function() {

    EntityPlayer = EntityGridTraveller.extend({

        size: { x: 16, y: 16 },
        zIndex: 10,
        speed: 150,
        animSheet: new ig.AnimationSheet('media/tilesheet.png', 16, 16),
        mapKey: null,
        commands: {}, // active commands stored as keys; values always true
        gateway_socket_id: null,
        snapshots: [],
        snapshots_by_frame: {},
        max_snapshots: 32,
        last_acked_frame: 0,

        init: function(x, y, settings) {
            this.parent(x, y, settings);
            this.addAnim('default', 1, [0]);
            this.maxVel.x = this.maxVel.y = this.speed;
        },

        update: function() {

            if(this.commands['RIGHT'])
                this.moveIntent = EntityGridTraveller.DIRECTION.RIGHT;
            else if(this.commands['LEFT'])
                this.moveIntent = EntityGridTraveller.DIRECTION.LEFT;
            else if(this.commands['UP'])
                this.moveIntent = EntityGridTraveller.DIRECTION.UP;
            else if(this.commands['DOWN'])
                this.moveIntent = EntityGridTraveller.DIRECTION.DOWN;
            else this.moveIntent = null;

            this.parent();

            this.take_snapshot();
        },

        take_snapshot: function() {

            // Start building current snapshot.
            var snapshot = {};
            snapshot.frame = ig.game.frame;

            // Add player data to snapshot.
            snapshot.players = {};
            var players = ig.game.getEntitiesByType(EntityPlayer);
            for(var i=0; i<players.length; i++) {

                if(typeof players[i].uuid !== 'string') {
                    throw 'Expected UUID to be a string.';
                }

                snapshot.players[players[i].uuid] = {
                    pos: players[i].pos
                };
            }

            if(this.snapshot_array_is_full()) {
                this.remove_oldest_snapshot();
            }

            this.add_new_snapshot(snapshot);
        },

        get_last_acked_snapshot: function() {
            var frame = this.last_acked_frame;
            return this.snapshots_by_frame[frame];
        },

        snapshot_array_is_full: function() {
            var count = this.snapshots.length;
            var max = this.max_snapshots;
            return count >= max;
        },

        add_new_snapshot: function(snapshot) {

            // Add snapshot to start of array.
            this.snapshots.unshift(snapshot);

            // Create convenient pointer.
            this.snapshots_by_frame[snapshot.frame];
        },

        remove_oldest_snapshot: function() {

            // Remove last snapshot from array.
            var last = this.snapshots.pop();

            // Remove pointer.
            var frame = last.frame;
            delete this.snapshots_by_frame[frame];
        }
    });
});