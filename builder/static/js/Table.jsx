class Table extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            error: false,
            data: null,
        };
    }

    componentDidMount() {
        $.ajax('/api/variables/'+this.props.variable_id+'/table/', {
            dataType: 'json',
            success: (data, status, xhr) => {
                if (data.dimension == "time") {
                    data.values = data.values.map((value) => {
                        return {
                            date: new Date(value.date),
                            value: value.value
                        };
                    })
                }

                this.setState({
                    data: data,
                    loading: false
                }, () => {
                    if (this.state.data.dimension == "time") {
                        this.props.setDimensions([
                            this.state.data.values[0].date,
                            this.state.data.values[this.state.data.values.length - 1].date
                        ]);
                    } else {
                        this.props.setDimensions(this.state.data.map((datum) => { return datum.feature; }));
                    }
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

    dimensionsChanged(old, next) {
        if (old && (old.min != next.min || old.max != next.max)) {
            return true;
        }
        return false
    }

    componentDidUpdate(prevProps, prevState) {
        if (!this.state.loading && !prevState.data) {
            $("#data-table").DataTable({
                data: this.state.data.values,
                columns: [
                    { data: 'date' },
                    { data: 'value' }
                ]
            });

            $.fn.dataTableExt.afnFiltering.push(
                (oSettings, aData, iDataIndex) => {
                    var d = new Date(aData[0]);
                    if (this.props.dimensions.min.getTime() <= d && d <= this.props.dimensions.max.getTime()) {
                        return true;
                    }
                    return false;
                }
            );
        } else if (this.dimensionsChanged(prevProps.dimensions, this.props.dimensions)) {
            //var filtered_data = $("#data-table").DataTable().column(0).data().filter((value, index) => {
                //var inside = this.props.dimensions.min <= value <= this.props.dimensions.max;
                //return inside;
            //});
            $("#data-table").DataTable().draw();
        }
    }

    render() {
        if (this.state.loading) {
            return <div>Loading...</div>
        } else if (this.state.error) {
            return <div>An error occured: <em>{this.state.error}</em></div>
        } else {
            return (
                <table id="data-table" className="display">
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
