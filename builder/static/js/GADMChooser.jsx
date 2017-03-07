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
            }
        }
    }

    renderMap() {
        var map = this.map = L.map('map').setView([0, 0], 1);

        this.terrain = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
            maxZoom: 18,
            id: 'ags.n5m0p5ci',
            accessToken: 'pk.eyJ1IjoiYWdzIiwiYSI6IjgtUzZQc0EifQ.POMKf3yBYLNl0vz1YjQFZQ'
        }).addTo(map);

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
                layer.on('click', (e) => {
                    var featureIdString = this.getIdString(feature, this.state.level);
                    var featureIdx = this.state.selected.indexOf(featureIdString);
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
                selected: admin_units.map((unit) => {
                    var parent_string = parents.join(".");
                    return parent_string + "." + unit.name;
                }),
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
                selected: admin_units.map((unit) => {
                    var parent_string = parents.join(".");
                    return parent_string + "." + unit.name;
                }),
                parents: parents
            });
        });
    }

    saveLayer(e) {
        e.preventDefault();

        var data = {features: this.state.selected};

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
                    <h1>{this.state.parents.map(
                        (unit) => { return unit + " > "; }
                    )}</h1>
                    <ul className="listing" style={
                        {height: 300, overflow: "scroll", marginBottom: 0}
                    }>
                        {this.state.level != 0 ?
                            <li><a href="javascript:"
                                onClick={this.back.bind(this)}
                            >&lt; Back</a></li>
                        : null}
                        {this.state.units.map((unit) => {
                            return <li><a href="javascript:"
                                onClick={this.forward.bind(this, unit)}
                            >{unit}</a></li>;
                        })}
                    </ul>
                    <div id="map" style={{height: 400}}></div>
                    <button className="button"
                        onClick={this.saveLayer.bind(this)}
                        disabled={this.state.level == 0}
                    >Save</button>
                </div>
            );
        }
    }
}
