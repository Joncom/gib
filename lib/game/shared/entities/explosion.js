ig.module('game.shared.entities.explosion')
.requires('impact.entity')
.defines(function() {

    EntityExplosion = ig.Entity.extend({

        radius: 64,
        zIndex: 16,
        animProgress: 0, // number between 0 and 1, inclusive
        fillFactorStart: 0.82,
        fillFactorEnd: 1,
        hollowProgressStart: 5/8,
        hollowFillFactorStart: 0.2,
        hollowFillFactorEnd: 0.94,

        init: function(x, y, settings) {
            this.parent(x, y, settings);
            this.size.x = this.size.y = this.radius * 2;
        },

        draw: function() {
            this.parent();

            var canvas = ig.$new('canvas');
            var context = canvas.getContext("2d");
            canvas.width = canvas.height = 2 * this.radius * ig.system.scale;

            context.save();

            var x = this.radius * ig.system.scale;
            var y = this.radius * ig.system.scale;
            var fillFactor = this.animProgress.map(0, 1, this.fillFactorStart, this.fillFactorEnd);
            var radius = (this.radius * fillFactor) * ig.system.scale;
            context.beginPath();
            context.arc(x, y, radius, 0, 2 * Math.PI, false);
            context.fillStyle = 'white';
            context.fill();

            if(this.animProgress >= this.hollowProgressStart) {
                var hollowProgress = this.animProgress.map(
                    this.hollowProgressStart, 1, 0, 1
                );
                fillFactor = hollowProgress.map(
                    0, 1,
                    this.hollowFillFactorStart,
                    this.hollowFillFactorEnd
                );
                radius = (this.radius * fillFactor) * ig.system.scale;
                context.globalCompositeOperation = 'destination-out';
                context.fillStyle = 'red';
                context.beginPath();
                context.arc(x, y, radius, 0, 2 * Math.PI, false);
                context.fill();
            }

            context.restore();

            var x = (this.pos.x - ig.game.screen.x) * ig.system.scale;
            var y = (this.pos.y - ig.game.screen.y) * ig.system.scale;
            ig.system.context.drawImage(canvas, x, y);
        },

        tweenColor: function(color1, color2, ratio) {
            var color1RedDec = parseInt(color1.substr(1,2), 16);
            var color1GreenDec = parseInt(color1.substr(3,2), 16);
            var color1BlueDec = parseInt(color1.substr(5,2), 16);

            var color2RedDec = parseInt(color2.substr(1,2), 16);
            var color2GreenDec = parseInt(color2.substr(3,2), 16);
            var color2BlueDec = parseInt(color2.substr(5,2), 16);

            var color3RedDec = Math.ceil(color1RedDec + (color2RedDec - color1RedDec) * ratio);
            var color3GreenDec = Math.ceil(color1GreenDec + (color2GreenDec - color1GreenDec) * ratio);
            var color3BlueDec = Math.ceil(color1BlueDec + (color2BlueDec - color1BlueDec) * ratio);

            color3RedHex = color3RedDec.toString(16);
            color3GreenHex = color3GreenDec.toString(16);
            color3BlueHex = color3BlueDec.toString(16);

            if(color3RedHex.length === 1) color3RedHex = '0' + color3RedHex;
            if(color3GreenHex.length === 1) color3GreenHex = '0' + color3GreenHex;
            if(color3BlueHex.length === 1) color3BlueHex = '0' + color3BlueHex;

            return '#' + color3RedHex + color3GreenHex + color3BlueHex;
        }
    });
});
