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
        var start = new Date(this.props.time_range.min).getTime();
        var stop = new Date(this.props.time_range.max).getTime();
        noUiSlider.create(dateSlider, {
            range: {
                min: start,
                max: stop
            },
            start: [
                start,
                start + (stop - start) / 2,
                stop
            ],
            step: /*7*/ 1 * 24 * 60 * 60 * 1000,
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
            this.props.changeTimeRange({
                min: new Date(values[0]),
                max: new Date(values[2])
            }, new Date(values[1]));
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
                return (this.props.dimensions.indexOf('space') != -1) ? (
                    <div style={{height: 400}}>
                        <Map
                            color_ramp={[[0, "#4286f4"],[50, "#f48341"]]}
                            {...this.props}
                        />
                    </div>
                ) : null;
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
            time_range: null,
            current_space_bounds: null,
            current_feature: null,
            current_time_range: null,
            current_time: null
        };

        this.child_indexes = [];
    }

    changeTimeRange(range, current_time) {
        var state = {
            current_time_range: {min: range.min, max: range.max}
        };
        if (current_time){
            state['current_time'] = current_time;
        }
        this.setState(state);
        console.log(state);
    }

    changeSpaceBounds(bounds){

    }

    changeFeature(shaid){
        this.setState({
            current_feature: shaid
        });
        console.log(shaid);
    }

    updateIndexes(indexes) {
        this.child_indexes.push(indexes);

        if (this.child_indexes.length == this.props.visualizations.length) {
            let state = {};
            if (this.state.dimensions.indexOf('time') != -1) {
                var time_index = this.child_indexes.map((both) => both['time']);
                time_index = [].concat.apply([], time_index);

                time_index = time_index.map((str) => new Date(str));
                time_index.sort((a, b) => a - b);

                var min = Plotly.d3.min(time_index);
                var max = Plotly.d3.max(time_index);

                state = {
                    time_index: time_index,
                    time_range: {min: min, max: max},
                    current_time_range: {min: min, max: max}
                };
            }
            if (this.state.dimensions.indexOf('space') != -1) {
                var space_index = this.child_indexes.map((both)=>both['space']);
                space_index = [].concat.apply([], space_index);

                //var merged_features = [].concat.apply([], this.child_indexes);
                state = Object.assign(state, {
                    space_index: space_index
                });
            }
            this.setState(state);
        }
    }
    render() {
        return (
            <div>
                {((this.state.dimensions.indexOf('time') != -1)
                  && this.state.time_range) ?
                    <SliderControl
                        time_range={this.state.time_range}
                        changeTimeRange={this.changeTimeRange.bind(this)}
                    />
                :
                    null
                }
                {this.props.visualizations.map((v) => (
                    <Visualization
                        updateIndexes={this.updateIndexes.bind(this)}
                        time_range={this.state.current_time_range}
                        changeTimeRange={this.changeTimeRange.bind(this)}
                        current_time={this.state.current_time}
                        changeSpaceBounds={this.changeSpaceBounds.bind(this)}
                        current_feature={this.state.current_feature}
                        changeFeature={this.changeFeature.bind(this)}
                        {...v}
                    />
                ))}
            </div>
        );
    }
}
