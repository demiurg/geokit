var async = require('async');
var express = require('express');
var fs = require('fs');
var mapnik = require('mapnik');
var mkdirp = require('mkdirp');
var pg = require('pg');
var SphericalMercator = require('sphericalmercator');
var util = require('util');
var zlib = require('zlib');

var createTile = require('./tiles').createTile;

var app = express();
var conString = "postgres://geokit:geokitp4ss@localhost:5432/geokit";

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

    createTile(req.params.layer, z, x, y, function(tile) {
        res.setHeader('Content-Encoding', 'deflate');
        res.setHeader('Content-Type', 'application/x-protobuf');
        zlib.deflate(tile.getData(), function(err, pbf) {
            if (err) throw err;

            res.send(pbf);
        });
    });

});

app.get('/:layer/:z/:x/:y/patch/:patch', function(req, res) {
    var z = +req.params.z,
        x = +req.params.x,
        y = +req.params.y,
        expression = +req.params.expression;

    createTile(req.params.layer, z, x, y, function(tile) {
        if (tile.isSolidSync() !== '') {
            var tileGeoJSON = JSON.parse(tile.toGeoJSONSync(0));
            var amendedGeoJSON = {
                type: tileGeoJSON.type,
                name: tileGeoJSON.name,
                features: []
            };

            fs.readFile(util.format('%s/../static/tile_patches/%s', __dirname, req.params.patch), function(err, patch_query) {
                if (err) throw err;

                async.each(tileGeoJSON.features, function(feature, callback) {
                    pg.connect(conString, function(err, client, done) {
                        if (err) throw err;

                        client.query("SELECT to_json(properties) FROM layers_feature WHERE id = $1", [feature.properties.id], function(err, result) {
                            if (err) throw err;

                            client.query(patch_query.toString(), [result.rows[0].to_json], function(err, result) {
                                if (err) throw err;

                                var patchVal;

                                if (result.rows[0].to_json.error) {
                                    patchVal = null;
                                } else {
                                    patchVal = result.rows[0].to_json.result;
                                }

                                amendedGeoJSON.features.push({
                                    type: feature.type,
                                    id: feature.id,
                                    geometry: feature.geometry,
                                    properties: {
                                        id: feature.properties.id,
                                        patchVal: patchVal
                                    }
                                });
                                done();
                                callback();
                            });
                        });
                    });
                }, function(err) {
                    if (err) throw err;

                    tile.clearSync();
                    tile.addGeoJSON(JSON.stringify(amendedGeoJSON), amendedGeoJSON.name);
                    zlib.deflate(tile.getData(), function(err, pbf) {
                        if (err) throw err;
                        res.send(pbf);
                    });
                });
            });
        } else {
            zlib.deflate(tile.getData(), function(err, pbf) {
                if (err) throw err;
                res.send(pbf);
            });
        }
    });
});

var port;
if (typeof process.argv[2] === 'undefined')
    port = 3001;
else
    port = process.argv[2];

var server = app.listen(port, 'localhost', function() {
    var host = server.address().address;
    var port = server.address().port;

    console.log("Listening at http://%s:%s", host, port);
});
