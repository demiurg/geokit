class Graph extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            error: false,
            data: null
        }
    }

    componentDidMount() {
        // make AJAX call
        $.ajax('/variables/data_'+this.props.variable_id+'.json', {
            dataType: 'json',
            success: (data, status, xhr) => {
                var dates = [], shas = [], graph = {'x': [], 'y': []};

                if (data.dimensions == "time") {
                    graph.x = dates = Object.keys(data.data);
                    graph.y = Object.keys(data.data).map((key) => (
                        data.data[key]
                    ));
                    graph['type'] = 'scatter';
                    graph['mode'] = 'lines';
                } else if (data.dimensions == "space") {
                    graph.x = shas = Object.keys(data.data)
                    graph.y = Object.keys(data.data).map((key) => (
                        data.data[key][self.props.variable_name]
                    ));
                    graph['type'] = 'scatter';
                    graph['mode'] = 'markers';
                } else if (data.dimensions == "spacetime") {
                    //graph.x = dates = Object.keys(data.data[this.props.current_feature])
                    //graph.y = Object.keys(data.data[this.props.current_feature]).map((key) => (
                        //data.data[this.props.current_feature][key]
                    //));
                    graph['type'] = 'scatter';
                    graph['mode'] = 'lines';
                    graph.x = [];
                    graph.y = [];
                }

                this.setState({
                    ajax_data: data,
                    data: graph,
                    loading: false
                }, () => {
                    this.props.updateIndexes({
                        'time': dates, 'space': shas
                    });
                });
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

    componentDidUpdate(prevProps, prevState) {
        if (!this.state.error) {
            if (!prevState.data || prevProps.current_feature != this.props.current_feature) {
                var xaxis, data;

                if (this.props.dimensions == "time") {
                    xaxis = {
                        title: 'Date'
                    };
                    data = this.state.data
                } else if (this.props.dimensions == "space") {
                    xaxis = {title: 'Location'};
                    data = this.state.data;
                } else if (this.props.dimensions == "spacetime") {
                    xaxis = {title: 'Date'};
                    if (this.props.current_feature) {
                        var x = Object.keys(this.state.ajax_data.data[this.props.current_feature]);
                        var y = x.map((key) => (
                            this.state.ajax_data.data[this.props.current_feature][key]
                        ));
                        data = {x: x, y: y}; 
                    } else {
                        var data = {x: [], y: []};
                    }
                }

                Plotly.newPlot(
                    'graph-'+this.props.unique_id,
                    [data],
                    {
                        xaxis: xaxis,
                        yaxis: {title: this.props.variable_name}
                    }
                );

                var plot = document.getElementById('graph-'+this.props.unique_id);
                plot.on('plotly_click', (data) => {
                    this.props.changeTime(new Date(data.points[0].x));
                });
            } else if (this.props.time_range && prevProps.time_range) {
                if (this.props.time_range.min.getTime() != prevProps.time_range.min.getTime() ||
                        this.props.time_range.max.getTime() != prevProps.time_range.max.getTime()) {
                    var update = {
                        'xaxis.range': [this.props.time_range.min.getTime(), this.props.time_range.max.getTime()]
                    };
                    Plotly.relayout('graph-'+this.props.unique_id, update);
                }
            }
        }
    }

    render() {
        if (this.state.loading) {
            return <div>Loading...</div>
        } else if (this.state.error) {
            return <div>An error occured: <em>{this.state.error}</em></div>
        } else {
            return <div id={"graph-"+this.props.unique_id}></div>
        }
    }
}
