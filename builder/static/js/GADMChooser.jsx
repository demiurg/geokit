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
            level: null,
            parents: [],
            units: [],
            selected: [],
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
            if (this.state.level == 0) {
                // Don't bother rendering any admin units, just zoom out
                // to the world.

                if (this.unit_json_layer) {
                    this.map.removeLayer(this.unit_json_layer);
                }
                this.map.setView([0,0], 1);
            } else {
                if (this.state.level == prevState.level) {
                    // Only the selected admin units have changed,
                    // no need to fetch the geometries again.

                    this.renderAdminUnits();
                } else {
                    var url = '/admin/layers/gadm.json';

                    var query_params = '?level=' + this.state.level;

                        var i = 0;

                        this.state.parents.forEach((unit) => {
                            query_params += '&name_' + i + '=' + unit;
                            i++;
                        });

                    $.ajax(url + query_params, {
                        dataType: 'json',
                        success: (data, status, xhr) => {
                            this.unit_geometries = data;
                            this.renderAdminUnits();
                        },
                        error: (xhr, status, error) => {
                        }
                    });
                }
            }
        }
    }

    renderAdminUnits() {
        if (this.unit_json_layer) {
            this.map.removeLayer(this.unit_json_layer);
        }

        var units = this.unit_geometries;
        var geometries = [];
        for (var unit in units) {
            var geometry = JSON.parse(units[unit]);
            geometry.properties = {};
            geometry.properties.name = unit;
            geometries.push(geometry);
        }

        this.unit_json_layer = L.geoJson(geometries, {
            style: (feature) => {
                if (this.state.selected.indexOf(feature.geometry.properties.name) == -1) {
                    return {color: 'grey'};
                } else {
                    return {color: 'crimson'};
                }
            },
            onEachFeature: (feature, layer) => {
                layer.on('click', () => {
                    var selected = this.state.selected;
                    var i = selected.indexOf(feature.properties.name);
                    if (i == -1) {
                        selected.push(feature.properties.name);
                    } else {
                        selected.splice(i, 1);
                    }
                    this.setState({selected: selected});
                });
            }
        }).addTo(this.map);
        this.map.fitBounds(this.unit_json_layer.getBounds());
    }

    renderMap() {
        var map = this.map = L.map('map').setView([0, 0], 1);

        self.terrain = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
            maxZoom: 18,
            id: 'ags.n5m0p5ci',
            accessToken: 'pk.eyJ1IjoiYWdzIiwiYSI6IjgtUzZQc0EifQ.POMKf3yBYLNl0vz1YjQFZQ'
        }).addTo(map);

        this.mapRendered = true;
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

    back() {
        var level = this.state.level - 1,
            parents = this.state.parents;

        parents.pop();

        this.getAdminUnits(level, parents[parents.length - 1], (admin_units) => {
            this.setState({
                level: level,
                units: admin_units.map((unit) => {return unit.name}),
                selected: admin_units.map((unit) => {return unit.name}),
                parents: parents
            });
        });
    }

    forward(parent_name) {
        var level = this.state.level + 1,
            parents = this.state.parents;

        parents.push(parent_name);

        this.getAdminUnits(level, parent_name, (admin_units) => {
            this.setState({
                level: level,
                units: admin_units.map((unit) => {return unit.name}),
                selected: admin_units.map((unit) => {return unit.name}),
                parents: parents
            });
        });
    }

    saveLayer(e) {
        e.preventDefault();

        var data = {features: []};
        /*for (var i = 0; i < this.state.parents.length; i++) {
            data['name_' + i] = this.state.parents[i];
        }
        data.selected = this.state.selected;
        data.level = this.state.level;*/
        this.state.selected.forEach((unit) => {
            data.features.push({
                geometry: this.unit_geometries[unit],
                name: unit
            });
        });

        data.name = this.state.parents[this.state.parents.length - 1];

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

    render() {
        if (this.state.loading) {
            return <div>Loading...</div>
        } else {
            return (
                <div>
                    <h1>{this.state.parents.map((unit) => { return unit + " > "; })}</h1>
                    <ul className="listing" style={{height: 300, overflow: "scroll", marginBottom: 0}}>
                        {this.state.level != 0 ? <li><a href="javascript:" onClick={this.back.bind(this)}>&lt; Back</a></li> : null}
                        {this.state.units.map((unit) => {
                            return <li><a href="javascript:" onClick={this.forward.bind(this, unit)}>{unit}</a></li>
                        })}
                    </ul>
                    <div id="map" style={{height: 400}}></div>
                    <button className="button" onClick={this.saveLayer.bind(this)} disabled={this.state.level == 0}>Save</button>
                </div>
            );
        }
    }
}
