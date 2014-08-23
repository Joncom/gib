ig.module('shared.entities.grid-traveller')
.requires('impact.entity')
.defines(function() {

    EntityGridTraveller = ig.Entity.extend({

        speed: 100,
        moveIntent: null,
        lastMove: null,
        destination: null,
        _debugMovement: false,

        init: function(x, y, settings) {
            this.parent(x, y, settings);
        },

        update: function() {

            // It's important that this call occur before the movement code below,
            // because otherwise you would sometimes see the entity move past his
            // destination slightly just before snapping back into place.
            this.parent();

            if(
                this.isMoving() &&
                this.justReachedDestination() &&
                !this.moveIntent
            ) {
                if(this._debugMovement) {
                    console.log("Stopping because destination reached and no move intent.")
                }
                this.stopMoving();
            }
            else if(
                this.isMoving() &&
                this.justReachedDestination() &&
                this.moveIntent &&
                !this.canMoveDirection(this.moveIntent)
            ) {
                if(this._debugMovement) {
                    console.log("Stopping because destination reached and blocked.")
                }
                this.stopMoving();
            }
            else if(
                this.isMoving() &&
                this.justReachedDestination() &&
                this.moveIntent &&
                this.canMoveDirection(this.moveIntent) &&
                this.moveIntent === this.lastMove
            ) {
                if(this._debugMovement) {
                    console.log("Destination reached, but continuing same direction.");
                }
                this.continueMovingFromDestination();
            }
            else if(
                this.isMoving() &&
                this.justReachedDestination() &&
                this.moveIntent &&
                this.canMoveDirection(this.moveIntent) &&
                this.moveIntent !== this.lastMove
            ) {
                if(this._debugMovement) {
                    console.log("Destination reached, but continuing new direction.");
                }
                this.changeDirectionAndContinueMoving(this.moveIntent);
            }
            else if(
                this.isMoving() &&
                !this.justReachedDestination()
            ) {
                if(this._debugMovement) {
                    console.log("Destination not yet reached so continuing.");
                }
                this.setVelocityByDir(this.speed, this.lastMove);
            }
            else if(
                !this.isMoving() &&
                this.moveIntent &&
                this.canMoveDirection(this.moveIntent)
            ) {
                if(this._debugMovement) {
                    console.log("Entity wants to move and can, so starting!");
                }
                this.startMoving(this.moveIntent);
            }

        },

        getTileAdjacentToTile: function(tileX, tileY, direction) {
            if(direction === EntityGridTraveller.DIRECTION.UP) tileY += -1;
            else if(direction === EntityGridTraveller.DIRECTION.DOWN) tileY += 1;
            else if(direction === EntityGridTraveller.DIRECTION.LEFT) tileX += -1;
            else if(direction === EntityGridTraveller.DIRECTION.RIGHT) tileX += 1;
            return { x: tileX, y: tileY };
        },

        startMoving: function(direction) {
            var tilesize = 16;
            var tile = { x: this.pos.x / tilesize, y: this.pos.y / tilesize };
            this.destination = this.getTileAdjacentToTile(tile.x, tile.y, direction);
            this.setVelocityByDir(this.speed, direction);
            this.lastMove = direction;
        },

        continueMovingFromDestination: function() {
            var tilesize = 16;
            var tile = { x: this.pos.x / tilesize, y: this.pos.y / tilesize };
            if(this.lastMove === EntityGridTraveller.DIRECTION.LEFT) {
                if(tile.x % 1 === 0) tile.x--;
                else tile.x = Math.floor(tile.x);
            } else if(this.lastMove === EntityGridTraveller.DIRECTION.RIGHT) {
                if(tile.x % 1 === 0) tile.x++;
                else tile.x = Math.ceil(tile.x);
            } else if(this.lastMove === EntityGridTraveller.DIRECTION.UP) {
                if(tile.y % 1 === 0) tile.y--;
                else tile.y = Math.floor(tile.y);
            } else if(this.lastMove === EntityGridTraveller.DIRECTION.DOWN) {
                if(tile.y % 1 === 0) tile.y++;
                else tile.y = Math.ceil(tile.y);
            }
            this.destination = { x: tile.x, y: tile.y };
            this.setVelocityByDir(this.speed, this.lastMove);
        },

        changeDirectionAndContinueMoving: function(newDirection) {
            this.snapToTile(this.destination.x, this.destination.y);
            this.destination = this.getTileAdjacentToTile(this.destination.x, this.destination.y, newDirection);
            this.setVelocityByDir(this.speed, this.moveIntent);
            this.lastMove = newDirection;
        },

        stopMoving: function() {
            this.snapToTile(this.destination.x, this.destination.y);
            this.destination = null;
            this.vel.x = this.vel.y = 0;
        },

        snapToTile: function(x, y) {
            var tilesize = 16; // TODO: Don't use magic number.
            this.pos.x = x * tilesize;
            this.pos.y = y * tilesize;
        },

        justReachedDestination: function() {
            var tilesize = 16; // TODO: Don't use magic number.
            var destinationX = this.destination.x * tilesize;
            var destinationY = this.destination.y * tilesize;
            var result = (
                (this.pos.x >= destinationX && this.last.x < destinationX) ||
                (this.pos.x <= destinationX && this.last.x > destinationX) ||
                (this.pos.y >= destinationY && this.last.y < destinationY) ||
                (this.pos.y <= destinationY && this.last.y > destinationY)
            );
            return result;
        },

        isMoving: function() {
            return this.destination !== null;
        },

        canMoveDirection: function(direction) {
            var DIRECTION = EntityGridTraveller.DIRECTION;
            var distance_x = 0;
            var distance_y = 0;
            if(direction === DIRECTION.UP) {
                distance_y -= 1;
            } else if(direction === DIRECTION.DOWN) {
                distance_y += 1;
            } else if(direction === DIRECTION.LEFT) {
                distance_x -= 1;
            } else if(direction === DIRECTION.RIGHT) {
                distance_x += 1;
            }
            var trace = ig.game.collisionMap.trace(this.pos.x,
                this.pos.y, distance_x, distance_y, this.size.x, this.size.y);
            return !trace.collision.x && !trace.collision.y;
        },

        setVelocityByDir: function(velocity, direction) {
            var tilesize = 16; // TODO: Don't use magic number.
            this.vel.x = this.vel.y = 0;
            if(direction === EntityGridTraveller.DIRECTION.LEFT) {
                this.vel.x -= velocity;
            } else if(direction === EntityGridTraveller.DIRECTION.RIGHT) {
                this.vel.x += velocity;
            } else if(direction === EntityGridTraveller.DIRECTION.UP) {
                this.vel.y -= velocity;
            } else if(direction === EntityGridTraveller.DIRECTION.DOWN) {
                this.vel.y += velocity;
            }
        }

    });

    EntityGridTraveller.DIRECTION = {
        UP: 1,
        DOWN: 2,
        LEFT: 4,
        RIGHT: 8
    };

});