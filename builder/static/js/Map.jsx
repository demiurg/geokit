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
        $.ajax('/api/variables/'+this.props.variable_id+'/map/', {
            dataType: 'json',
            success: (data, status, xhr) => {
                this.min_value = d3.min(data.map((feature) => { return feature.properties[this.props.variable_name]; }));
                this.max_value = d3.max(data.map((feature) => { return feature.properties[this.props.variable_name]; }));

                this.color_scale = d3.scale.linear()
                    .domain([this.min_value, this.max_value])
                    .range(this.props.color_ramp.map((stop) => { return stop[1]; }));

                this.setState({
                    data: data,
                    loading: false
                }, () => {
                    this.props.setDimensions(data);
                });
            },
            error: (xhr, status, error) => {
                this.setState({
                    loading: false,
                    error: error
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
        if (this.props.dimensions && this.props.dimensions.length != prevProps.dimensions.length) {
            console.log("update map");
        } else if (!this.state.error) {
            var vals = this.state.data.map((feature) => {
                return feature.properties[this.props.variable_name];
            });

            var map = L.map('map-'+this.props.unique_id);

            L.tileLayer('https://api.mapbox.com/v4/ags.map-g13j9y5m/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYWdzIiwiYSI6IjgtUzZQc0EifQ.POMKf3yBYLNl0vz1YjQFZQ').addTo(map);

            var geojson_layer = L.geoJson(this.state.data, {
                style: (feature) => {
                    return {
                        color: "#000",
                        weight: 1,
                        fillColor: this.color_scale(feature.properties[this.props.variable_name]),
                        fillOpacity: 0.7
                    };
                },
                onEachFeature: (feature, layer) => {
                    layer.bindPopup(String(feature.properties[this.props.variable_name]));
                }
            }).addTo(map);

            map.fitBounds(geojson_layer.getBounds());

            var legend = L.control({position: 'bottomright'});

            legend.onAdd = (map) => {
                var div = L.DomUtil.create('div', 'info legend');
                this.addColorRamp(div);
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
