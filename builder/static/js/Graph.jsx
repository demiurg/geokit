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
            if (!prevState.data) {
                var xaxis;

                if (this.props.dimensions == "time") {
                    xaxis = {
                        title: 'Date'
                    };
                } else {
                    xaxis = {title: 'Location'};
                }

                Plotly.newPlot(
                    'graph-'+this.props.unique_id,
                    [this.state.data],
                    {
                        xaxis: xaxis,
                        yaxis: {title: this.props.variable_name}
                    }
                );
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
