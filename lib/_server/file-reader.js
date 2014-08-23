ig.module('_zone.file-reader')
.defines(function() {

    var fs = require('fs');

    ig.FileReader = {

        readHex: function(filepath, offset, bytes, callback) {

            fs.open(filepath, 'r', function(status, fd) {

                if (status) {
                    console.log(status.message);
                    return;
                }

                var buffer = new Buffer(bytes);
                fs.read(fd, buffer, 0, bytes, offset, function(err, num) {
                    if(typeof callback !== 'function') {
                        throw "Expected callback function as argument.";
                    } else {
                        callback(buffer.toString('hex', 0, num));
                    }

                    // Close file descriptor to avoid eventual EMFILE error.
                    fs.close(fd);
                });
            });
        }
    };

});
