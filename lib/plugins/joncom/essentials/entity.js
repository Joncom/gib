/*
 * Plugin for ImpactJS which adds useful methods to all entities.
 * @author   Jonathan Commins
 * @modified June 1, 2013
 * @version  2.0
 *
 * Version History:
 * 1.0 - Created.
 * 1.1 - Added isTouchingTile method.
 * 1.2 - Added isOnScreen method.
 * 1.3 - Added angleToCoord method.
 * 1.4 - Modified setVelocityByCoord to be more performant.
 * 1.5 - Added new method setAccelByCoord.
 * 1.6 - Added setVelocityByTile method.
 * 1.7 - Added setAccelByAngle method.
 * 1.8 - Simplified and more functional set(Velocity/Accel)ByAngle methods.
 * 1.9 - Added angleFromVelocity method.
 *     - Removed setVelocityByTile method.
 * 2.0 - Added angleToMouse method.
 */
ig.module('plugins.joncom.essentials.entity')
.requires('impact.entity')
.defines(function() {
    ig.Entity.inject({
        angleToCoord: function(x, y) {
            var centerX = this.pos.x + this.size.x/2;
            var centerY = this.pos.y + this.size.y/2;
            var angle = Math.atan2(y - centerY, x - centerX);
            return angle;
        },
        angleToMouse: function() {
            var centerX = this.pos.x + this.size.x/2;
            var centerY = this.pos.y + this.size.y/2;
            var mouseX = ig.input.mouse.x + ig.game.screen.x;
            var mouseY = ig.input.mouse.y + ig.game.screen.y;
            var angle = Math.atan2(mouseY - centerY, mouseX - centerX);
            return angle;
        },
        angleFromVelocity: function() {
            var angle = Math.atan2(this.vel.y, this.vel.x);
            return angle;
        },
        setVelocityByCoord: function(x, y, velocity) {
            var distance_x = x - (this.pos.x + this.size.x/2);
            var distance_y = y - (this.pos.y + this.size.y/2);
            this.vel.x = (distance_x >= 0 ? 1 : -1) * velocity * (Math.abs(distance_x) / (Math.abs(distance_x) + Math.abs(distance_y)));
            this.vel.y = (distance_y >= 0 ? 1 : -1) * velocity * (Math.abs(distance_y) / (Math.abs(distance_x) + Math.abs(distance_y)));
        },
        setVelocityByAngle: function(angle, velocity) {
            this.vel.x = Math.cos(angle) * velocity;
            this.vel.y = Math.sin(angle) * velocity;
        },
        setAccelByCoord: function(x, y, accel) {
            var distance_x = x - (this.pos.x + this.size.x/2);
            var distance_y = y - (this.pos.y + this.size.y/2);
            this.accel.x = (distance_x >= 0 ? 1 : -1) * accel * (Math.abs(distance_x) / (Math.abs(distance_x) + Math.abs(distance_y)));
            this.accel.y = (distance_y >= 0 ? 1 : -1) * accel * (Math.abs(distance_y) / (Math.abs(distance_x) + Math.abs(distance_y)));
        },
        setAccelByAngle: function(angle, accel) {
            this.accel.x = Math.cos(angle) * accel;
            this.accel.y = Math.sin(angle) * accel;
        },
        isTouchingTile: function(x, y) {
            var tilesize = ig.game.collisionMap.tilesize;
            return (
                this.pos.x + this.size.x - 1 >= x * tilesize &&
                this.pos.x < x * tilesize + tilesize &&
                this.pos.y + this.size.y - 1 >= y * tilesize &&
                this.pos.y < y * tilesize + tilesize
            );
        },
        isOnScreen: function() {
            return (
                this.pos.x + this.size.x - 1 >= ig.game.screen.x &&
                this.pos.x < ig.game.screen.x + ig.system.width &&
                this.pos.y + this.size.y - 1 >= ig.game.screen.y &&
                this.pos.y < ig.game.screen.y + ig.system.height
            );
        }
    });
});