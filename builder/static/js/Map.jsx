var d3 = Plotly.d3

class Map extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            error: false,
            data: []
        };

    }

    componentDidMount() {
        // make AJAX call
        $.ajax('/variables/map_'+this.props.variable_id+'.json', {
            dataType: 'json',
            success: (data, status, xhr) => {
                this.min_value = d3.min(
                    Object.keys(data.data).map((key) => {
                        return data.data[key][this.variable_name];
                    })
                );
                this.max_value = d3.max(
                    Object.keys(data.data).map((key) => {
                        return data.data[key][this.variable_name];
                    })
                );

                this.color_scale = d3.scale.linear()
                    .domain([this.min_value, this.max_value])
                    .range(this.props.color_ramp.map((stop) => { return stop[1]; }));

                this.setState(
                    Object.assign(data, {loading: false}),
                    () => this.props.setDimensions(Object.values(data.data))
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
                        return {
                            color: "#000",
                            weight: 1,
                            fillColor: self.color_scale(
                                self.state.data[feature.properties.shaid][self.props.variable_name]
                            ),
                            fillOpacity: 0.7
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
                map.fitBounds([
                    [self.state.bounds[idx][1], self.state.bounds[idx][0]],
                    [self.state.bounds[idx][3], self.state.bounds[idx][2]]
                ]);
            })

            var legend = L.control({position: 'bottomright'});

            legend.onAdd = (map) => {
                var div = L.DomUtil.create('div', 'info legend');
                self.addColorRamp(div);
                return div;
            };

            legend.addTo(map);
        }
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
