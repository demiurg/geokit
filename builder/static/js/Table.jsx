class Table extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            error: false,
            data: null,
            current_feature: null
        };
    }

    componentDidMount() {
        var self = this;
        $.ajax('/variables/data_'+this.props.variable_id+'.json', {
            dataType: 'json',
            success: (data, status, xhr) => {
                var dates = [], shas = [];
                if (data.dimensions == "time") {
                    dates = Object.keys(data.data);
                    data.values = Object.keys(data.data).map((key) => {
                        return {
                            date: new Date(key),
                            value: data.data[key]
                        };
                    })
                } else if (data.dimensions == "space") {
                    shas = Object.keys(data.data)
                    data.values = Object.keys(data.data).map((key) => {
                        return {
                            name: key,
                            value: data.data[key][self.props.variable_name]
                        };
                    })
                }

                self.setState({
                    data: data,
                    time_index: dates,
                    space_index: shas,
                    loading: false
                }, () => {
                    self.props.updateIndexes({
                        'time_index': dates, 'space_index': shas
                    });
                });
            },
            error: (xhr, status, error) => {
                console.log(error);
                self.setState({
                    loading: false,
                    error: status
                });
            }
        });
    }

    stuffChanged(old, next) {
        if (this.state.data.dimensions == 'time') {
            if (old.time_range && (
                    old.time_range.min != next.time_range.min ||
                    old.time_range.max != next.time_range.max)
            ) {
                return true;
            }
        } else if (this.state.data.dimensions == 'space'){
            return this.state.current_feature != next.current_feature;
        }
        return false
    }

    componentDidUpdate(prevProps, prevState) {
        if (!this.state.loading && !prevState.data) {
            var columns = [],
                data;
            if (this.state.data.dimensions == 'space') {
                columns.push({data: 'name'});
            } else {
                columns.push({data: 'date'});
            }
            columns.push({data: 'value'});

            $("#data-table-"+this.props.unique_id).DataTable({
                data: this.state.data.values,
                columns: columns
            });

            if (this.state.data.dimensions == 'time') {
                $.fn.dataTableExt.afnFiltering.push(
                    (oSettings, aData, iDataIndex) => {
                        var d = new Date(aData[0]);
                        if (
                            this.props.time_range.min.getTime() <= d &&
                            d <= this.props.time_range.max.getTime()
                        ) {
                            return true;
                        }
                        return false;
                    }
                );
            } else {
                $.fn.dataTableExt.afnFiltering.push(
                    (oSettings, aData, iDataIndex) => {
                        var index = this.state.space_index.indexOf(
                            oSettings.aoData[iDataIndex]._aData.name
                        );
                        if (index != -1) {
                            return true;
                        }
                        return false;
                    }
                );
            }
        } else if (this.stuffChanged(prevProps, this.props)) {
            $("#data-table-"+this.props.unique_id).DataTable().draw();
        }
    }

    render() {
        if (this.state.loading) {
            return <div>Loading...</div>
        } else if (this.state.error) {
            return <div>An error occured: <em>{this.state.error}</em></div>
        } else {
            return (
                <table id={"data-table-"+this.props.unique_id} className="display">
                    <thead>
                        <tr>
                            <th>{this.state.data.dimension == "time" ? "Date" : "Feature" }</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody>
                    </tbody>
                </table>
            );
        }
    }
}
