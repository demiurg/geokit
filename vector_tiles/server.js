var async = require('async');
var express = require('express');
var fs = require('fs');
var mapnik = require('mapnik');
var mkdirp = require('mkdirp');
var pg = require('pg');
var SphericalMercator = require('sphericalmercator');
var zlib = require('zlib');

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

    var map = new mapnik.Map(256, 256);

    map.load(__dirname+'/../static/layers/' + req.params.layer + '.xml', function(err, map) {
        if (err) throw err;

        sm = new SphericalMercator();
        map.extent = sm.bbox(x,y,z, false, '900913');
        var tile = new mapnik.VectorTile(z, x, y);

        map.render(tile, {}, function(err, tile) {
            if (err) throw err;

            var filePath = __dirname+'/../static/tiles/'+req.params.layer+'/'+z+'/'+x+'/'
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

app.get('/:layer/:z/:x/:y/expression/:expression', function(req, res) {
    var z = +req.params.z,
        x = +req.params.x,
        y = +req.params.y,
        expression = +req.params.expression;

    var map = new mapnik.Map(256, 256);

    map.load(__dirname+'/../static/layers/' + req.params.layer + '.xml', function(err, map) {
        if (err) throw err;


        sm = new SphericalMercator();
        map.extent = sm.bbox(x,y,z, false, '900913');
        var tile = new mapnik.VectorTile(z, x, y);

        map.render(tile, {}, function(err, tile) {
            if (err) throw err;

            if (tile.isSolidSync() !== '') {
                var tileGeoJSON = JSON.parse(tile.toGeoJSONSync(0));
                var amendedGeoJSON = {
                    type: tileGeoJSON.type,
                    name: tileGeoJSON.name,
                    features: []
                };

                async.each(tileGeoJSON.features, function(feature, callback) {
                    pg.connect(conString, function(err, client, done) {
                        if (err) throw err;

                        client.query("SELECT to_json(properties) FROM layers_feature WHERE id = $1", [feature.properties.id], function(err, result) {
                            if (err) throw err;

                            client.query("SELECT to_json(evaluate_expression($1, 1, $2::json))", [expression, result.rows[0].to_json], function(err, result) {
                                if (err) throw err;

                                var expressionVal;

                                if (result.rows[0].to_json.error) {
                                    expressionVal = null;
                                } else {
                                    expressionVal = result.rows[0].to_json.result;
                                }

                                amendedGeoJSON.features.push({
                                    type: feature.type,
                                    id: feature.id,
                                    geometry: feature.geometry,
                                    properties: {
                                        id: feature.properties.id,
                                        expressionVal: expressionVal
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
                    //console.log(JSON.stringify(amendedGeoJSON));
                    //console.log(tile.toGeoJSONSync(0));
                    zlib.deflate(tile.getData(), function(err, pbf) {
                        if (err) throw err;
                        res.send(pbf);
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
