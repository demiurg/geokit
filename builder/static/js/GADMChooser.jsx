function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

class GADMChooser extends React.Component {
    constructor() {
        super();

        this.mapRendered = false;

        this.state = {
            layer_name: "",
            level: null,
            parents: [],
            units: [],
            selected: {},
            loading: true
        };
    }

    componentDidMount() {
        this.getAdminUnits(0, null, (admin_units) => {
            this.setState({
                level: 0,
                units: admin_units.map((unit) => {return unit.name}),
                selected: admin_units.map((unit) => {return unit.name}),
                loading: false
            });
        });
    }

    componentDidUpdate(prevProps, prevState) {
        if (!this.state.loading && !this.mapRendered) {
            this.renderMap();
        } else if (!this.state.loading && this.mapRendered) {
            if (prevState.level != this.state.level) {
                this.setGadmLayer(this.state.level);
            } else {
                prevState.selected.map((selection) => {
                    if (this.state.selected.indexOf(selection) == -1) {
                        var e = new Event(selection + "-deselect");
                        window.dispatchEvent(e);
                    }
                });
            }
        }
    }

    renderMap() {
        var map = this.map = L.map('map').setView([0, 0], 2);

        this.terrain = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
            maxZoom: 18,
            id: 'ags.n5m0p5ci',
            accessToken: 'pk.eyJ1IjoiYWdzIiwiYSI6IjgtUzZQc0EifQ.POMKf3yBYLNl0vz1YjQFZQ'
        }).addTo(map);

        var drawControl = new L.Control.Draw({
            draw: {
                marker: false,
                polyline: false
            }
        });
        map.addControl(drawControl);

        this.setGadmLayer(0);
        this.mapRendered = true;
    }

    getIdString(feature, level) {
        var parent_string = '';

        for (var i = 0; i < level; i++) {
            var level_name = feature.properties['name_'+i];

            if (level_name) {
                parent_string += level_name + ".";
            }
        }

        parent_string += feature.properties['name_'+level];
        return parent_string;
    }

    extractNameFromIdString(id_string) {
        var names_split = id_string.split('.');

        var name = names_split.slice(-1)[0];

        if (name == "null") {
            return names_split.slice(-2)[0];
        } else {
            return name;
        }
    }

    isSelected(feature) {
        var parent_string = '';

        for (var i = 0; i < this.state.level; i++) {
            var level_name = feature.properties['name_'+i];

            if (level_name) {
                parent_string += level_name + ".";
            }
        }

        parent_string += feature.properties['name_'+this.state.level];

        if (this.state.selected.indexOf(parent_string) == -1) {
            return false;
        }

        return true;
    }

    setGadmLayer(level){
        if (this.geojsonTileLayer){
            this.map.removeLayer(this.geojsonTileLayer);
        }
        if (this.super_layer) {
            this.map.removeLayer(this.super_layer);
        }

        if (this.state.level > 0) {
            var geojson_super_URL = '/layers/gadm/' + (level - 1) + '/{z}/{x}/{y}.json';
            this.sub_layer = new L.TileLayer.GeoJSON(geojson_super_URL, {
                clipTiles: true
            }, {
                style: {
                    weight: 4,
                    color: "green",
                    fillColor: "grey"
                }
            }).addTo(this.map);
        }

        this.geojsonURL = '/layers/gadm/' + level + '/{z}/{x}/{y}.json';
        this.geojsonTileLayer = new L.TileLayer.GeoJSON(this.geojsonURL, {
            clipTiles: true,
            unique: function(feature) {
                var hasc_id = '';
                for (var i = 0; i <= Number.parseInt(level); i++) {
                    hasc_id += feature.properties['name_'+i];
                }
                return hasc_id;
            }
        }, {
            onEachFeature: (feature, layer) => {
                var featureIdString = this.getIdString(feature, this.state.level);

                layer.on('click', (e) => {
                    var featureIdx = this.state.selected.indexOf(featureIdString);

                    var double_click = true;
                    if (this.click_ll != e.latlng) {
                        double_click = false;
                        this.click_ll = e.latlng;
                        this.last_featureIdx = featureIdx;
                    }

                    if (!double_click) {
                        if (featureIdx != -1) {
                                layer.setStyle({
                                    fillColor: "grey"
                                });
                    
                                var selected = this.state.selected.slice();
                                selected.splice(featureIdx, 1);
                                this.setState({
                                    selected: selected
                                });
                        } else {
                                layer.setStyle({
                                    fillColor: "blue"
                                });
                        
                                var selected = this.state.selected.slice();
                                selected.push(featureIdString);
                                this.setState({
                                    selected: selected
                                });
                        }
                    } else {
                        if (this.last_featureIdx != -1) {
                            layer.setStyle({fillColor: "grey"});
                        } else {
                            layer.setStyle({fillColor: "blue"});
                        }
                    }
                });

                window.addEventListener(featureIdString + "-deselect", () => {
                    layer.setStyle({
                        fillColor: "grey"
                    });
                });
            },
            style: (feature) => {
                if (this.isSelected(feature)) {
                    return {
                        fillColor: "blue",
                        weight: 1
                    };
                } else {
                    return {
                        fillColor: "grey",
                        weight: 1
                    };
                }
            }
        }).addTo(this.map);

        this.map.on(L.Draw.Event.CREATED, (e) => {
            var new_selection = [];
            this.geojsonTileLayer.geojsonLayer.eachLayer((layer) => {
                if (e.layer.getBounds().contains(layer.getBounds())) {
                    layer.setStyle({fillColor: "blue"});
                    new_selection.push(this.getIdString(layer.feature, this.state.level));
                } else {
                    layer.setStyle({fillColor: "grey"});
                }
            });

            this.setState({selected: new_selection});
        });

        this.zoomMap();
    }

    zoomMap() {
        if (this.state.level == 0) {
            this.map.setView([0,0], 2);
            return;
        }

        var url = '/admin/layers/gadm-bounds.json'
        var query_params = '?level=' + this.state.level;

        var i = 0;
        this.state.parents.forEach((unit) => {
            query_params += '&name_' + i + '=' + unit;
            i++;
        });

        $.ajax(url + query_params, {
            dataType: 'json',
            success: (data, status, xhr) => {
                this.map.fitBounds(L.geoJson(data).getBounds());
            },
            error: (xhr, status, error) => {
            }
        });
    }

    getAdminUnits(level, parent_name, callback) {
        var url = '/layers/gadm';
        var query_params = '?level=' + level;

        if (level != 0) {
            var i = 0;
            this.state.parents.forEach((unit) => {
                query_params += '&name_' + i + '=' + unit;
                i++;
            });
        }

        $.ajax(url + query_params, {
            dataType: 'json',
            success: (data, status, xhr) => {
                callback(data);
            },
            error: (xhr, status, error) => {
            }
        });
    }

    back(parent_index) {
        var level = parent_index,
            parents = this.state.parents.slice();

        parents.splice(parent_index);

        this.getAdminUnits(level, parents[parents.length - 1], (admin_units) => {
            this.setState({
                level: level,
                units: admin_units.map((unit) => {return unit.name}),
                selected: admin_units.map((unit) => {
                    var parent_string = parents.join(".");
                    return parent_string + "." + unit.name;
                }),
                parents: parents
            });
        });
    }

    forward(parent) {
        var level = this.state.level + 1,
            parents = this.state.parents,
            parent_name = parent.value;

        parents.push(parent_name);

        this.getAdminUnits(level, parent_name, (admin_units) => {


            this.setState({
                level: level,
                units: admin_units.map((unit) => {return unit.name}),
                selected: admin_units.map((unit) => {
                    var parent_string = parents.join(".");
                    return parent_string + "." + unit.name;
                }),
                parents: parents
            });
        });
    }

    changeSelection(newSelection) {
        this.setState({
            selected: newSelection.map((unit) => {return unit.value;})
        });
    }

    saveLayer(e) {
        e.preventDefault();

        var data = {features: this.state.selected};

        data.name = this.state.layer_name;

        $.ajax('/layers/gadm/', {
            dataType: 'json',
            contentType: 'application/json',
            type: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            data: JSON.stringify(data),
            success: (data, status, xhr) => {
                window.location = '/builder/admin/layers';
            },
            error: (xhr, status, error) => {
            }
        });
    }

    updateLayerName(e) {
        this.setState({layer_name: e.target.value});
    }

    render() {
        if (this.state.loading) {
            return <div>Loading...</div>
        } else {
            return (
                <div>
                    <ul className="fields">
                        <li className="required">
                            <div className="field slug_field text_input">
                                <label htmlFor="id_name">Name:</label>
                                <div className="field-content">
                                    <div className="input">
                                        <input id="id_name" maxlength="250" name="name" type="text" required={true} value={this.state.layer_name} onChange={this.updateLayerName.bind(this)} />
                                    </div>
                                    <p className="help">
                                        The name of the layer as it will appear in URLs e.g http://domain.com/blog/my-slug/ and expression e.g map(my-slug)
                                    </p>
                                </div>
                            </div>
                        </li>
                        <h1>
                            <span>
                                <a href="javascript:void(0)"
                                    onClick={this.back.bind(this, 0)}>World</a> > 
                            </span>
                            {this.state.parents.map((unit, i) => {
                                return <span>
                                    <a href="javascript:void(0)"
                                        onClick={this.back.bind(this, i + 1)}>{unit}</a> > 
                                </span>;
                            })}
                            <div style={{display: "inline-block", width: 400}}>
                                <Select name="parent-selector"
                                        options={this.state.units.map((unit) => {
                                            return {value: unit, label: unit};})
                                        }
                                    onChange={this.forward.bind(this)} />
                            </div>
                        </h1>
                        <Select multi={true}
                                value={this.state.selected.map((selection) => {
                                    var name = this.extractNameFromIdString(selection);
                                    return {value: selection, label: name};
                                })}
                                options={this.state.selected.map((selection) => {
                                    var name = this.extractNameFromIdString(selection);
                                    return {value: selection, label: name};
                                })}
                                onChange={this.changeSelection.bind(this)} />
                        <div id="map" style={{height: 400}}></div>
                        <button className="button"
                            onClick={this.saveLayer.bind(this)}
                            disabled={this.state.level == 0}
                        >Save</button>
                    </ul>
                </div>
            );
        }
    }
}
