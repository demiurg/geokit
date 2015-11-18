var fs = require('fs');
var mapnik = require('mapnik');
var mkdirp = require('mkdirp');
var SphericalMercator = require('sphericalmercator');
var util = require('util');

mapnik.register_default_input_plugins();
mapnik.register_default_fonts();

function getCachedTile(tileFilePath) {
    if (!fs.existsSync(tileFilePath)) {
        return false
    } else {
        var data = fs.readFileSync(tileFilePath);
        var tile = new mapnik.VectorTile(0,0,0);  // Populating with raw buffer, so coordinates don't matter
        if (data.length !== 0) {
            tile.setDataSync(data);
        }
        return tile;
    }
}

function createTile(layer, z, x, y, cb) {
    var map = new mapnik.Map(256, 256);
    var mapnikFilePath = util.format('%s/../static/layers/%s.xml', __dirname, layer);
    var tileFilePath = util.format('%s/../static/tiles/%s/%d/%d/%d.pbf', __dirname, layer, z, x, y);

    var cachedTile = getCachedTile(tileFilePath);
    if (cachedTile) {
        cb(cachedTile);
    } else {
        map.load(mapnikFilePath, function(err, map) {
            if (err) throw err;

            sm = new SphericalMercator();
            map.extent = sm.bbox(x,y,z, false, '900913');
            var tile = new mapnik.VectorTile(z, x, y);

            map.render(tile, {}, function(err, tile) {
                if (err) throw err;

                var filePath = util.format('%s/../static/tiles/%s/%d/%d/', __dirname, layer, z, x);
                mkdirp.sync(filePath);
                var tileFile = fs.openSync(tileFilePath, 'w');

                fs.write(tileFile, tile.getData(), 0, tile.getData().length, 0, function(err, written, string) {
                    if (err) throw err;

                    cb(tile); // Tile is written and cached, call callback

                    fs.closeSync(tileFile);
                });
            });
        });
    }
}

module.exports = {
    createTile: createTile
};
