ig.module(
    'plugins.server'
)
.requires(
    'impact.game',
    'impact.loader',
    'impact.input'
)
.defines(function() {

    // This is needed because the original calls
    // document.createElement, which doesn't exist.
    window.ig.$new = function( name ) {
        if(name === 'canvas') return new Canvas();
        else throw "Element '" + name + "' not implemented.";
    };

    // Allow input to be triggered by clients.
    ig.Input.inject({
        set_keydown: function(action) {
			this.actions[action] = true;
			if (!this.locks[action]) {
				this.presses[action] = true;
				this.locks[action] = true;
			}
        },
        set_keyup: function(action) {
            this.delayedKeyup[action] = true;
        }
    });

    // Rewrite this function to delay and allow the server class to setup.
    ig.main = function(canvasId, gameClass, fps, width, height, scale, loaderClass) {
        ig.system = new ig.System(canvasId, fps, width, height, scale || 1);
        ig.input = new ig.Input();
        ig.soundManager = new ig.SoundManager();
        ig.music = new ig.Music();
        ig.ready = true;

        var loader = new (loaderClass || ig.Loader)(gameClass, ig.resources);
        setTimeout(function() {
            loader.load();
        }, 100);
    };
});
