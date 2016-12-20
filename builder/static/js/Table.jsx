const ASCENDING = true,
      DESCENDING = false;


class Table extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            error: false,
            data: [],
            sort: {
                field: 'key',
                direction: ASCENDING
            }
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
                        }
                    });
                }
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

    sortBy(field) {
        if (this.state.sort.field == field) {
            var direction = !this.state.sort.direction;
        } else {
            var direction = ASCENDING;
        }
        this.setState({
            sort: {
                field: field,
                direction: direction
            }
        });
    }

    sortedValues() {
        var field;
        if (this.state.sort.field == "key") {
            if (this.state.data.dimension == "time") {
                field = "date";
            } else if (this.state.data.dimension == "space") {
                field = "feature";
            }
        } else if (this.state.sort.field == "value") {
            field = "value";
        }

        return this.state.data.values.sort((a, b) => {
            if (a[field] == b[field]) {
                return 0;
            } else if (this.state.sort.direction == ASCENDING) {
                if (a[field] < b[field]) {
                    return -1;
                }
                return 1;
            } else if (this.state.sort.direction == DESCENDING) {
                if (b[field] < a[field]) {
                    return -1;
                }
                return 1;
            }
        });
    }

    renderSortIndicator(field) {
        if (this.state.sort.field == field) {
            if (this.state.sort.direction == ASCENDING) {
                return <span className="glyphicon glyphicon-chevron-down"></span>
            } else if (this.state.sort.direction == DESCENDING) {
                return <span className="glyphicon glyphicon-chevron-up"></span>
            }
        }
    }

    render() {
        if (this.state.loading) {
            return <div>Loading...</div>
        } else if (this.state.error) {
            return <div>An error occured: <em>{this.state.error}</em></div>
        } else {
            return (
                <table className="table">
                    <thead>
                        <tr>
                            <th><a href="#" onClick={this.sortBy.bind(this, "key")}>
                                {this.state.data.dimension == "time" ? "Date" : "Feature"} {this.renderSortIndicator("key")}
                            </a></th>
                            <th><a href="#" onClick={this.sortBy.bind(this, "value")}>
                                {this.props.variable_name} {this.renderSortIndicator("value")}
                            </a></th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.sortedValues().map((value) => {
                            return (
                                <tr key={this.state.data.dimension == "time" ? value.date.getTime() : value.feature}>
                                    <td>{this.state.data.dimension == "time" ? value.date.toLocaleDateString("en-US") : value.feature}</td>
                                    <td>{value.value}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            );
        }
    }
}
