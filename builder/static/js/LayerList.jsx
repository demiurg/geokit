function fromNow(time_string) {
    var d = new Date(time_string),
        now = new Date();

    var time_delta = now - d;

    var days = Math.floor(time_delta/(1000*60*60*24)),
        hours = Math.floor(time_delta/(1000*60*60)),
        minutes = Math.floor(time_delta/(1000*60));

    if (days > 0) {
        return days + " days ago";
    } else if (hours > 0) {
        return hours + " hours ago";
    } else if (minutes > 0) {
        return minutes + " minutes ago";
    } else {
        return "0 minutes ago";
    }
}

class LayerList extends React.Component {
    render() {
        return (
            <table className="listing">
                <thead>
                    <tr className="table-headers">
                        <th>Name</th>
                        <th>Bounds</th>
                        <th>Field names</th>
                        <th>Features</th>
                        <th>Created</th>
                        <th>Modified</th>
                    </tr>
                </thead>
                <tbody>
                    {this.props.children}
                </tbody>
            </table>
        );
    }
}

class LayerListItem extends React.Component {
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
            layer: {
                name: props.name,
                bounds: props.bounds,
                field_names: props.field_names,
                feature_count: props.feature_count,
                created: props.created,
                modified: props.modified
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
        $.ajax('/api/layers/'+this.props.id, {
            dataType: 'json',
            success: (data, status, xhr) => {
                if (data.status == 0) {
                    this.setState({
                        status: 0,
                        layer: {
                            name: data.name,
                            bounds: data.bounds.join(", "),
                            field_names: data.field_names.join(", "),
                            feature_count: data.feature_count,
                            created: fromNow(data.created),
                            modified: fromNow(data.modified)
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
                        <a href={"/builder/admin/layers/edit/" + this.props.id}>
                            {this.state.layer.name}
                        </a>
                    </td>
                    <td>
                        {this.state.layer.bounds}
                    </td>
                    <td className="properties">
                        {this.state.layer.field_names}
                    </td>
                    <td>
                        {this.state.layer.feature_count}
                    </td>
                    <td>
                        <div className="human-readable-date" title={this.props.created}>
                            {this.state.layer.created}
                        </div>
                    </td>
                    <td>
                        <div className="human-readable-date" title={this.props.modified}>
                            {this.state.layer.modified}
                        </div>
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
            );
        } else {
            return null;
        }
    }
}
