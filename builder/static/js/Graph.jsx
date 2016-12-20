import React from 'react';

export default class Graph extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            error: false,
            data: {}
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

    componentDidUpdate(prevProps, prevState) {
        if (!this.state.error) {
            var xaxis;

            if (this.state.data.type == "timeseries") {
                xaxis = {
                    title: 'Date'
                };
            } else {
                xaxis = {title: 'Location'};
            }

            Plotly.newPlot(
                'graph',
                [this.state.data],
                {
                    xaxis: xaxis,
                    yaxis: {title: this.props.variable_name}
                }
            );
        }
    }

    render() {
        if (this.state.loading) {
            return <div>Loading...</div>
        } else if (this.state.error) {
            return <div>An error occured: <em>{this.state.error}</em></div>
        } else {
            return <div id="graph"></div>
        }
    }
}
