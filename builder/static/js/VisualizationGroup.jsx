class MapControl extends React.Component {
    componentDidMount() {
        var map = L.map('map-control').setView([0, 0], 1);

        L.tileLayer('https://api.mapbox.com/v4/ags.map-g13j9y5m/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYWdzIiwiYSI6IjgtUzZQc0EifQ.POMKf3yBYLNl0vz1YjQFZQ').addTo(map);

        var geoJsonLayer = L.geoJson(this.props.dims, {
            onEachFeature: (feature, layer) => {
                layer.on('click', (e) => {
                    var dims = this.props.currentDims.slice();
                    var dim_index = dims.map((dim) => {return dim.properties.id;}).indexOf(feature.properties.id);
                    if (dim_index != -1) {
                        layer.setStyle({color: 'grey'});
                        dims.splice(dim_index, 1);
                        this.props.changeDimensions(dims);
                    } else {
                        layer.setStyle({color: 'maroon'});
                        var index = this.props.dims.map((dim) => {return dim.properties.id;}).indexOf(feature.properties.id);
                        dims.push(this.props.dims[index]);
                        this.props.changeDimensions(dims);
                    }
                });
            }, style: (feature) => {
                var dims = this.props.currentDims.map((dim) => {return dim.properties.id;});
                if (dims.indexOf(feature.properties.id) != -1) {
                    return {color: "maroon"};
                } else {
                    return {color: "grey"};
                }
            }
        }).addTo(map);
        map.fitBounds(geoJsonLayer.getBounds());
    }

    render() {
        return (
            <div id="map-control" style={{height: 400}}></div>
        );
    }
}

class SliderControl extends React.Component {
    componentDidMount() {
        var dateSlider = document.getElementById('date-slider-control');

        noUiSlider.create(dateSlider, {
            range: {
                min: new Date(this.props.dims.min).getTime(),
                max: new Date(this.props.dims.max).getTime()
            },
            start: [new Date('2010').getTime(), new Date('2015').getTime()],
            step: 7 * 24 * 60 * 60 * 1000,
            connect: true,
            behaviour: 'drag',
            tooltips: true,
            format: {
                to: (value) => {
                    var format = Plotly.d3.time.format("%B %e, %Y");
                    return format(new Date(value));
                },
                from: (value) => { 
                    return value;
                }
            }
        });

        dateSlider.noUiSlider.on('update', (values, handle) => {
            this.props.changeDimensions({
                min: new Date(values[0]),
                max: new Date(values[1])}
            );
        });
    }

    render() {
        return (
            <div id="date-slider-control"></div>
        );
    }
}

class Visualization extends React.Component {
    render() {
        if (this.props.type == "map") {
            return (
                <div style={{height: 400}}>
                    <Map
                        variable_id={this.props.variable_id}
                        variable_name={this.props.variable_name}
                        color_ramp={[[0, "#000"],[50, "#aaa"]]}
                        dimensions={this.props.dimensions} />
                </div>
            );
        } else if (this.props.type == "graph") {
            return (
                <div>
                    <Graph
                        variable_id={this.props.variable_id}
                        variable_name={this.props.variable_name}
                        setDimensions={this.props.getChildDimensions}
                        dimensions={this.props.dimensions} />
                </div>
            );
        } else if (this.props.type == "table") {
            return (
                <div>
                    <Table
                        variable_id={this.props.variable_id}
                        variable_name={this.props.variable_name}
                        setDimensions={this.props.getChildDimensions}
                        dimensions={this.props.dimensions} />
                </div>
            );
        }
    }
}

class VisualizationGroup extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            dimensions: null,
            currentDimensions: null
        };

        this.childStartingDimensions = [];
    }

    changeDimensions(newDims) {
        console.log(newDims.length);
        if (this.props.control == 'time') {
            this.setState({
                currentDimensions: {min: newDims.min, max: newDims.max}
            });
        } else {
            this.setState({currentDimensions: newDims});
        }
    }

    getChildDimensions(dimensions) {
        this.childStartingDimensions.push(dimensions);

        if (this.childStartingDimensions.length == this.props.children.length) {
            if (this.props.control == "slider") {
                var min = Plotly.d3.min(this.childStartingDimensions.map((childDim) => {
                    return childDim[0];
                }));

                var max = Plotly.d3.max(this.childStartingDimensions.map((childDim) => {
                    return childDim[1];
                }));

                this.setState({
                    dimensions: {min: min, max: max},
                    currentDimensions: {min: min, max: max}
                });
            } else {
                var merged_features = [].concat.apply([], this.childStartingDimensions);
                this.setState({
                    dimensions: merged_features,
                    currentDimensions: merged_features
                });
            }
        }
    }

    getChildVariables() {
        var vars = this.props.children.map((child) => {
            console.log(child.props);
        });
    }

    render() {
        var Control = null;
        if (this.props.control == "map") {
            Control = MapControl;
        } else if (this.props.control == "slider") {
            Control = SliderControl;
        }

        return (
            <div>
                {(Control && this.state.dimensions) ?
                    <Control dims={this.state.dimensions} currentDims={this.state.currentDimensions} changeDimensions={this.changeDimensions.bind(this)} /> :
                    null}
                {this.props.children.map((child) => {
                    return React.cloneElement(child, {
                        dimensions: this.state.currentDimensions,
                        getChildDimensions: this.getChildDimensions.bind(this)
                    });
                })}
            </div>
        );
    }
}