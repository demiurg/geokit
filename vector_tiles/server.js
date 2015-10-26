var express = require('express');
var fs = require('fs');
var mapnik = require('mapnik');
var mkdirp = require('mkdirp');
var SphericalMercator = require('sphericalmercator');
var zlib = require('zlib');

var app = express();

mapnik.register_default_input_plugins();
mapnik.register_default_fonts();

// CORS headers
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/:layer/:z/:x/:y', function(req, res) {
    var z = +req.params.z,
        x = +req.params.x,
        y = +req.params.y;

    var map = new mapnik.Map(256, 256);

    map.load('../static/layers/' + req.params.layer + '.xml', function(err, map) {
        if (err) throw err;

        sm = new SphericalMercator();
        map.extent = sm.bbox(x,y,z, false, '900913');
        var tile = new mapnik.VectorTile(z, x, y);

        map.render(tile, {}, function(err, tile) {
            if (err) throw err;

            var filePath = '../static/tiles/'+req.params.layer+'/'+z+'/'+x+'/'
            mkdirp.sync(filePath);
            var tileFile = fs.openSync(filePath+y+'.pbf', 'w');

            fs.write(tileFile, tile.getData(), 0, tile.getData().length, 0, function(err, written, string) {
                if (err) throw err;

                res.setHeader('Content-Encoding', 'deflate');
                res.setHeader('Content-Type', 'application/x-protobuf');
                zlib.deflate(tile.getData(), function(err, pbf) {
                    if (err) throw err;

                    res.send(pbf);
                });

                fs.closeSync(tileFile);
            });
        });
    });
});

var server = app.listen(3001, function() {
    var host = server.address().address;
    var port = server.address().port;

    console.log("Listening at http://%s:%s", host, port);
});
