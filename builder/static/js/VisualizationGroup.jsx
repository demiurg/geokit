class MapControl extends React.Component {
    componentDidMount() {
        var map = L.map('map-control').setView([0, 0], 1);

        L.tileLayer('https://api.mapbox.com/v4/ags.map-g13j9y5m/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYWdzIiwiYSI6IjgtUzZQc0EifQ.POMKf3yBYLNl0vz1YjQFZQ').addTo(map);
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
        this.setState({
            currentDimensions: {min: newDims.min, max: newDims.max}
        });
    }

    getChildDimensions(dimensions) {
        this.childStartingDimensions.push(dimensions);

        if (this.childStartingDimensions.length == this.props.children.length) {
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
        }
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
                    <Control dims={this.state.dimensions} changeDimensions={this.changeDimensions.bind(this)} /> :
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
