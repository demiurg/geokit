class TableList extends React.Component {
    render() {
        return (
            <table className="listing">
                <thead>
                    <tr className="table-headers">
                        <th>Name</th>
                        <th>Description</th>
                        <th>Field names</th>
                        <th>Rows</th>
                    </tr>
                </thead>
                <tbody>
                    {this.props.children}
                </tbody>
            </table>
        );
    }
}

class TableListItem extends React.Component {
    constructor() {
        super();

        this.state = {
            status: null,
            layer: {}
        };
    }

    componentDidMount() {
        var props = this.props;
        this.setState({
            status: props.status,
            table: {
                name: props.name,
                description: props.description,
                field_names: props.field_names,
                row_count: props.row_count
            }
        }, () => {
            if (this.state.status == 1) {
                this.checkStatus();
            }
        });
    }

    startPoll() {
        setTimeout(() => {
            this.checkStatus();
        }, 1000);
    }

    checkStatus() {
        $.ajax('/api/tables/'+this.props.id, {
            dataType: 'json',
            success: (data, status, xhr) => {
                if (data.status == 0) {
                    this.setState({
                        status: 0,
                        table: {
                            name: data.name,
                            description: data.description,
                            field_names: data.field_names.join(", "),
                            row_count: data.row_count
                        }
                    });
                } else if (data.status == 2) {
                    this.setState({
                        status: 2
                    });
                } else {
                    this.startPoll();
                }
            },
            error: (xhr, status, error) => {
                console.error(error);
                this.setState({
                    status: 2
                });
            }
        });
    }

    render() {
        if (this.state.status == 0) {
            return (
                <tr>
                    <td className="title">
                        <a href={"/builder/admin/tables/edit/" + this.props.id}>
                            {this.state.table.name}
                        </a>
                    </td>
                    <td>
                        {this.state.table.description}
                    </td>
                    <td>
                        {this.state.table.field_names}
                    </td>
                    <td>
                        {this.state.table.row_count}
                    </td>
                </tr>
            );
        } else if (this.state.status == 1) {
            return (
                <tr>
                    <td className="title">{this.props.name}</td>
                    <td>Processing...</td>
                </tr>
            );
        } else if (this.state.status == 2) {
            return (
                <tr>
                    <td className="title">{this.props.name}</td>
                    <td>An error occurred while processing this layer.</td>
                </tr>
            )
        } else {
            return null;
        }
    }
}
