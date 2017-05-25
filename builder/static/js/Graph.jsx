var d3 = Plotly.d3;

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

    extractTimeseries() {
        if (this.props.current_feature) {
            var x = Object.keys(this.state.ajax_data.data[this.props.current_feature]);
            var y = x.map((key) => (
                this.state.ajax_data.data[this.props.current_feature][key]
            ));
            data = {x: x, y: y}; 
        } else {
            var data = {x: [], y: []};
        }

        return data;
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
                    data = this.extractTimeseries();
                }

                if (data.x.length) {
                    var plot = document.getElementById('graph-'+this.props.unique_id);

                    Plotly.newPlot(
                        'graph-'+this.props.unique_id,
                        [
                            data,
                            {
                                type: 'scatter',
                                y: [data.y[0]],
                                x: [data.x[0]],
                                marker: {
                                    size: 12,
                                    fillcolor: "#f49542"
                                },
                                hoverinfo: 'none'
                            },
                            {
                                type: 'scatter',
                                y: [data.y[0]],
                                x: [data.x[0]],
                                marker: {
                                    symbol: 'circle-open',
                                    size: 12,
                                    color: "#f49542",
                                    line: {
                                        width: 2
                                    }
                                },
                                hoverinfo: 'none'
                            }
                        ],
                        {
                            xaxis: xaxis,
                            yaxis: {title: `${this.props.variable_name} (${this.state.ajax_data.units})`},
                            hovermode: 'x',
                            showlegend: false,
                        }
                    );

                    plot.on('plotly_hover', (new_data) => {
                        var point = new_data.points[0];

                        Plotly.deleteTraces('graph-'+this.props.unique_id, -1);
                        Plotly.addTraces(
                            'graph-'+this.props.unique_id,
                            [{
                                type:'scatter',
                                y: [point.y],
                                x: [point.x],
                                marker: {
                                    symbol: 'circle-open',
                                    size: 12,
                                    color: "#f49542",
                                    line: {
                                        width: 2
                                    }
                                },
                                hoverinfo: 'none'
                            }]
                        );
                    });

                    plot.on('plotly_click', (new_data) => {
                        this.props.changeTime(new Date(new_data.points[0].x));

                        var point = new_data.points[0];

                        Plotly.deleteTraces('graph-'+this.props.unique_id, -2);
                        Plotly.addTraces(
                            'graph-'+this.props.unique_id,
                            [{
                                type: 'scatter',
                                y: [point.y],
                                x: [point.x],
                                marker: {
                                    size: 12,
                                    fillcolor: "#f49542"
                                },
                                hoverinfo: 'none'
                            }]
                        );
                        Plotly.moveTraces('graph-'+this.props.unique_id, -1, 1);
                    });
                }
            }
            
            if (this.props.time_range && prevProps.time_range) {
                if (this.props.time_range.min.getTime() != prevProps.time_range.min.getTime() ||
                        this.props.time_range.max.getTime() != prevProps.time_range.max.getTime()) {
                    var update = {
                        'xaxis.range': [this.props.time_range.min.getTime(), this.props.time_range.max.getTime()]
                    };
                    Plotly.relayout('graph-'+this.props.unique_id, update);
                }
            }

            if (this.props.current_time && prevProps.current_time) {
                if (this.props.current_time != prevProps.current_time) {
                    var data = this.extractTimeseries();

                    var dateString = moment(this.props.current_time).format('YYYY-MM-DD'),
                        index = data.x.indexOf(dateString);

                    Plotly.deleteTraces('graph-'+this.props.unique_id, -2);
                    Plotly.addTraces(
                        'graph-'+this.props.unique_id,
                        [{
                            type: 'scatter',
                            y: [data.y[index]],
                            x: [this.props.current_time],
                            marker: {
                                size: 12,
                                fillColor: "#f49542"
                            },
                            hoverinfo: 'none'
                        }]
                    );
                    Plotly.moveTraces('graph-'+this.props.unique_id, -1, 1);
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
