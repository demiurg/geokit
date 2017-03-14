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
        // map.fitBounds(geoJsonLayer.getBounds());
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
        switch(this.props.type){
            case "map":
                return (
                    <div style={{height: 400}}>
                        <Map
                            color_ramp={[[0, "#4286f4"],[50, "#f48341"]]}
                            {...this.props}
                        />
                    </div>
                );
            case "graph":
                return (
                    <div>
                        <Graph
                            {...this.props}
                        />
                    </div>
                );
            case "table":
                return (
                    <div>
                        <Table
                            {...this.props}
                        />
                    </div>
                );
        }
    }
}

class VisualizationGroup extends React.Component {
    constructor(props) {
        super(props);

        var dimensions = {};
        for (let v of this.props.visualizations){
            if (v.dimensions == 'space'){
                dimensions['space'] = true;
            } else if (v.dimensions == 'time') {
                dimensions['time'] = true;
            } else if (v.dimensions == 'spacetime'){
                dimensions['space'] = dimensions['time'] = true;
            }
        }

        dimensions = (dimensions['space'] ? 'space' : '') +
            (dimensions['time'] ?  'time' : '');

        this.state = {
            dimensions: dimensions,
            space_index: null,
            time_index: null,
            current_space_bounds: null,
            current_time_range: null
        };

        this.child_indexes = [];
    }

    changeDateRange(range) {
        this.setState({
            currentDimensions: {min: range.min, max: range.max}
        });
    }

    changeSpaceBounds(bounds){

    }

    updateIndexes(index) {
        this.child_indexes.push(index);

        if (this.child_indexes.length == this.props.visualizations.length) {
            if (this.state.dimensions.indexOf('time') != -1) {
                var min = Plotly.d3.min(this.child_indexes.map((childDim) => {
                    return childDim[0];
                }));

                var max = Plotly.d3.max(this.child_indexes.map((childDim) => {
                    return childDim[1];
                }));

                this.setState({
                    current_time_range: {min: min, max: max}
                });
            } else {
                var merged_features = [].concat.apply([], this.child_indexes);
                this.setState({
                    dimensions: merged_features,
                    current_features: merged_features
                });
            }
        }
    }
    render() {
    console.log((this.state.dimensions));

        return (
            <div>
                {(this.state.dimensions.indexOf('time') != -1) ?
                    <SliderControl
                        date_range={this.state.date_range}
                        current_date_range={this.state.current_date_range}
                        changeDateRange={this.changeDateRange.bind(this)}
                    />
                :
                    null
                }
                {this.props.visualizations.map((v) => (
                    <Visualization
                        updateIndexes={this.updateIndexes.bind(this)}
                        changeDateRange={this.changeDateRange.bind(this)}
                        changeSpaceBounds={this.changeSpaceBounds.bind(this)}
                        {...v}
                    />
                ))}
            </div>
        );
    }
}
