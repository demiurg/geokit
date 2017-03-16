var d3 = Plotly.d3

class Map extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            error: false,
            data: [],
            space_index: [],
            time_index: []
        };

    }

    componentDidMount() {
        // make AJAX call
        var self = this;
        $.ajax('/variables/data_'+this.props.variable_id+'.json', {
            dataType: 'json',
            success: (data, status, xhr) => {
                var shas = Object.keys(data.data);
                var dates = [];
                if(self.props.dimensions == 'space'){
                    var values = shas.map((key) => {
                        return data.data[key][self.props.variable_name];
                    });
                    this.min_value = d3.min(values);
                    this.max_value = d3.max(values);
                } else if (self.props.dimensions == 'spacetime') {
                    var rows = shas.map((key) => {
                        if (dates.length == 0){
                            dates = Object.keys(data.data[key]);
                        }
                        return Object.values(data.data[key]);
                    });
                    let values = [].concat(rows);
                    this.min_value = d3.min(values);
                    this.max_value = d3.max(values);
                }

                this.color_scale = d3.scale.linear()
                    .domain([this.min_value, this.max_value])
                    .range(this.props.color_ramp.map((stop) => { return stop[1]; }));

                this.setState(
                    Object.assign(data, {loading: false}),
                    () => self.props.updateIndexes({'space': shas, 'time': dates})
                );
            },
            error: (xhr, status, error) => {
                console.log(error);
                this.setState({
                    loading: false,
                    error: status
                });
            }
        });
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (this.state.loading ||
            (this.props.dimensions &&
             this.props.dimensions.length != nextProps.dimensions.length)) {
            return true;
        }
        return false;
    }

    componentDidUpdate(prevProps, prevState) {
        var self = this;
        if (self.props.dimensions && self.props.dimensions.length != prevProps.dimensions.length) {
            console.log("update map");
        } else if (!self.state.error) {
            var map = L.map('map-'+self.props.unique_id);

            L.tileLayer('https://api.mapbox.com/v4/ags.map-g13j9y5m/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYWdzIiwiYSI6IjgtUzZQc0EifQ.POMKf3yBYLNl0vz1YjQFZQ').addTo(map);

            self.state.layers.map((id, idx) => {
                var geojsonURL = '/layers/'+id+'/{z}/{x}/{y}.json';
                var geojsonTileLayer = new L.TileLayer.GeoJSON(geojsonURL, {
                    clipTiles: true,
                    unique: function(feature) {
                        return feature.properties.shaid;
                    }
                }, {
                    style: (feature) => {
                        var s = self;
                        let fdata = self.state.data[feature.properties.shaid];
                        var color = "#000";
                        var opacity = 0.1;

                        if (fdata){
                            let value = fdata[self.props.variable_name];
                            color = self.color_scale(value)
                            opacity = 0.7;
                        } else {
                            console.log('no ' + feature.properties.shaid);
                        }
                        return {
                            color: "#000",
                            weight: 1,
                            fillColor: color,
                            fillOpacity: opacity
                        };
                    },
                    onEachFeature: self.featureHandler,
                    pointToLayer: function (feature, latlng) {
                        return new L.CircleMarker(latlng, {
                            radius: 4,
                            fillColor: "#A3C990",
                            color: "#000",
                            weight: 1,
                            opacity: 0.7,
                            fillOpacity: 0.3
                        });
                    },
                });
                map.addLayer(geojsonTileLayer);
            })
            if(self.props.bounds){
                map.fitBounds([
                    [self.props.bounds[1], self.props.bounds[0]],
                    [self.props.bounds[3], self.props.bounds[2]]
                ]);
            }
            var legend = L.control({position: 'bottomright'});

            legend.onAdd = (map) => {
                var div = L.DomUtil.create('div', 'info legend');
                self.addColorRamp(div);
                return div;
            };

            legend.addTo(map);
        }
    }

    featureHandler = (feature, layer) => {
        self = this;
        layer.on({
            mouseover: function() {
                layer.setStyle(self.activeStyle);
            },
            mouseout: function() {
                layer.setStyle(self.defaultStyle);
            },
            click: function(e) {
                var feature = e.target.feature;
                if (feature.properties) {
                    self.props.changeFeature(feature.properties.shaid);
                    var popupString = '<div class="popup">';
                    for (var k in feature.properties) {
                        var v = feature.properties[k];
                        popupString += k + ': ' + v + '<br />';
                    }
                    popupString += '</div>';
                    layer.bindPopup(popupString).openPopup();
                }
            }
        });
    }


    addColorRamp(dom_el) {
        var key = d3.select(dom_el).append("svg")
                    .attr("width", 80)
                    .attr("height", 135);

        var legend = key.append("defs")
                      .append("svg:linearGradient")
                      .attr("id", "gradient")
                      .attr("x1", "100%")
                      .attr("y1", "0%")
                      .attr("x2", "100%")
                      .attr("y2", "100%")
                      .attr("spreadMethod", "pad");

        var distance_between_offsets = 100/(this.props.color_ramp.length - 1)
        var offset = 0;
        for (var i = this.props.color_ramp.length - 1; i >= 0; i--) {
            var stop = this.props.color_ramp[i];
            legend.append("stop")
                    .attr("offset", offset + "%")
                    .attr("stop-color", stop[1])
                    .attr("stop-opacity", 1);

            offset += distance_between_offsets;
        }

        key.append("rect")
              .attr("width", 22)
              .attr("height", 120)
              .style("fill", "url(#gradient)")
              .attr("transform", "translate(0,10)");

        var y = d3.scale.linear().range([120, 0]).domain([this.min_value, this.max_value]);

        var yAxis = d3.svg.axis().scale(y).orient("right");
        key.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(26,10)")
            .call(yAxis)
            .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 39).attr("dy", ".71em")
                .style("text-anchor", "end")
                .text(this.props.variable_name);
    }

    render() {
        if (this.state.loading) {
            return <div>Loading...</div>
        } else if (this.state.error) {
            return <div>An error occured: <em>{this.state.error}</em></div>
        } else {
            return <div id={"map-"+this.props.unique_id} style={{height: "100%"}}></div>
        }
    }
}
