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
        $.ajax('/api/variables/'+this.props.variable_id+'/graph/', {
            dataType: 'json',
            success: (data, status, xhr) => {
                this.setState({
                    data: data,
                    loading: false
                }, () => {
                    this.props.setDimensions([Plotly.d3.min(data.x), Plotly.d3.max(data.x)]);
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

                if (this.state.data.type == "timeseries") {
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
            } else if (this.props.dimensions && prevProps.dimensions) {
                if (this.props.dimensions.min.getTime() != prevProps.dimensions.min.getTime() ||
                        this.props.dimensions.max.getTime() != prevProps.dimensions.max.getTime()) {
                    var update = {
                        'xaxis.range': [this.props.dimensions.min.getTime(), this.props.dimensions.max.getTime()]
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
