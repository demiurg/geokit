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

        this.state = {
            name: "",
            layer: "",
            featureIds: []
        };
    }

    componentDidMount() {
        this.renderMap();
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevState.layer != this.state.layer) {
            this.switchLayer(this.state.layer);
        }
    }

    renderMap() {
        var map = this.map = L.map('map').setView([0, 0], 2);
        $(document).on('shown.bs.tab', function(e) {
            map.invalidateSize();
        });


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
    }

    switchLayer(layer_name) {
        if (this.geojsonTileLayer) {
            this.map.removeLayer(this.geojsonTileLayer);
        }

        this.geojsonURL = '/layers/vector-catalog/' + layer_name + '/{z}/{x}/{y}.json';
        this.geojsonTileLayer = new L.TileLayer.GeoJSON(this.geojsonURL, {
            clipTiles: true,
            unique: function(feature) {
                return feature.properties.id;
            }
        }, {
            onEachFeature: (feature, layer) => {
                layer.on('click', (e) => {
                    var featureIdx = this.state.featureIds.indexOf(feature.properties.id);

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

                                var selected = this.state.featureIds.slice();
                                selected.splice(featureIdx, 1);
                                this.setState({
                                    featureIds: selected
                                });
                        } else {
                                layer.setStyle({
                                    fillColor: "blue"
                                });

                                var selected = this.state.featureIds.slice();
                                selected.push(feature.properties.id);
                                this.setState({
                                    featureIds: selected
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

                window.addEventListener(feature.properties.id + "-deselect", () => {
                    layer.setStyle({
                        fillColor: "grey"
                    });
                });
            },
            style: (feature) => {
                var featureIdx = this.state.featureIds.indexOf(feature.properties.id);
                if (featureIdx != -1) {
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
                    new_selection.push(layer.feature.properties.id);
                } else {
                    layer.setStyle({fillColor: "grey"});
                }
            });

            this.setState({featureIds: new_selection});
        });

        //this.zoomMap();
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

    changeLayer(newSelection) {
        if (this.state.layer && this.state.featureIds.length != 0) {
            $.ajax('/layers/vector-catalog/translate/'+this.state.layer+'/'+newSelection.value, {
                dataType: 'json',
                contentType: 'application/json',
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                },
                data: JSON.stringify({features: this.state.featureIds}),
                success: (data, status, xhr) => {
                    this.setState({
                        layer: newSelection.value,
                        featureIds: data
                    });
                },
                error: (xhr, status, error) => {
                }
            });
        } else {
            this.setState({
                layer: newSelection.value
            });
        }
    }

    saveLayer(e) {
        e.preventDefault();

        var data = {
            name: this.state.name,
            layer: this.state.layer,
            features: this.state.featureIds
        };

        $.ajax('/layers/vector-catalog/', {
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

    updateName(e) {
        this.setState({name: e.target.value});
    }

    render() {
        if (this.state.loading) {
            return <div>Loading...</div>
        } else {
            return (
                <div>
                    <ul className="fields">
                        <li>
                            <div className="field slug_field text_input">
                                <label htmlFor="id_name">Name:</label>
                                <div className="field-content">
                                    <div className="input">
                                        <input id="id_name"
                                               maxlength="250"
                                               type="text"
                                               value={this.state.name}
                                               onChange={this.updateName.bind(this)} />
                                    </div>
                                    <p className="help">
                                        The name of the layer as it will appear in URLs e.g http://domain.com/blog/my-slug/ and expression e.g map(my-slug)
                                    </p>
                                </div>
                            </div>
                        </li>
                        <li>
                            <Select value={this.state.layer}
                                    options={this.props.layers.map((layer) => {
                                        return {value: layer, label: this.props.names[layer]};
                                    })}
                                    onChange={this.changeLayer.bind(this)} />
                            <div id="map" style={{height: 400}}></div>
                        </li>
                        <li>
                            <button className="button"
                                onClick={this.saveLayer.bind(this)}>
                                Save
                            </button>
                        </li>
                    </ul>
                </div>
            );
        }
    }
}
