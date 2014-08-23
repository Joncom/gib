process.argv.forEach(function (val, index, array) {
  console.log(index + ': ' + val);
});

var path = require('path');
var fs = require('fs');

// Get config.
fs.readFile('config.js', 'utf8', function(error, data){

    // Halt if no config found.
    if(error) throw error;

    var config = JSON.parse(data);

    // Setup paths
    var root = __dirname;
    var impactLibPath = root + '/lib';

    // Add missing draw functionality.
    global.Canvas = require('canvas');
    global.Canvas.prototype.style = {};
    global.Image = Canvas.Image;

    global.window = global;
    global.ImpactMixin = {
        module: function() { return ig; },
        requires: function() {
            var requires = Array.prototype.slice.call(arguments);
            // Go ahead and require the proper files
            requires.forEach(function(name) {
                // Ignore any dom ready type stuff on the server.
                if (name == 'dom.ready') return;
                var path = name.replace(/\./g, '/');
                require(impactLibPath + '/' + path);
            });
            return ig;
        },
        defines: function(func) {
            func(); // immediately execute
        },
        $: function(selector) {
            return new Canvas();
        }
    };
    window.document = { };
    window.addEventListener = function() { };

    // Canvas should be the only element impact uses on the server.
    window.HTMLElement = Canvas;
    require(impactLibPath + '/impact/impact.js');

    // Make components accessible to Impact.
    ig.config = config;

    var folder = process.argv[2]; // Get first user supplied arg.
    var path = impactLibPath + '/_' + folder + '/main.js';

    // Check if target app exists.
    if(fs.existsSync(path)) require(path); // App exists. Start it...
    else console.log("Make sure app exists: " + path);

});
