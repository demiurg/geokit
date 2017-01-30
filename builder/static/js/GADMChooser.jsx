function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

class GADMChooser extends React.Component {
    constructor() {
        super();

        this.state = {
            level: null,
            admin_units: [],
            parent: null,
            path: [],
            loading: true
        };
    }

    componentDidMount() {
        this.getAdminUnits(0, null, (admin_units) => {
            this.setState({
                level: 0,
                admin_units: admin_units,
                loading: false
            });
        });
    }

    getAdminUnits(level, parent_name, callback) {
        var url = '/layers/gadm';
        
        var query_params = '?level=' + level;

        if (level != 0) {
            var i = 0;
            this.state.path.forEach((unit) => {
                query_params += '&name_' + i + '=' + unit;
                i++;
            });
            query_params += '&name_' + i + '=' + parent_name;
        }

        $.ajax(url + query_params, {
            dataType: 'json',
            success: (data, status, xhr) => {
                callback(data);
            },
            error: (xhr, status, error) => {
            }
        });
    }

    back() {
        var level = this.state.level - 1,
            path = this.state.path;

        parent = path.pop();

        this.getAdminUnits(level, parent, (admin_units) => {
            this.setState({
                level: level,
                admin_units: admin_units,
                parent: parent,
                path: path
            });
        });
    }

    forward(parent_name) {
        var level = this.state.level + 1,
            path = this.state.path;

        if (this.state.parent) {
            path.push(this.state.parent);
        }

        this.getAdminUnits(level, parent_name, (admin_units) => {
            this.setState({
                level: level,
                admin_units: admin_units,
                parent: parent_name,
                path: path
            });
        });
    }

    saveLayer(e) {
        e.preventDefault();

        var data = {};
        for (var i = 0; i < this.state.path.length; i++) {
            data['name_' + i] = this.state.path[i];
        }
        data['name_' + (this.state.level - 1)] = this.state.parent;
        data.level = this.state.level;

        $.ajax('/layers/gadm/', {
            dataType: 'json',
            type: 'POST',
			headers: {
				'X-CSRFToken': getCookie('csrftoken')
			},
            data: data,
            success: (data, status, xhr) => {
                window.location = '/builder/admin/layers';
            },
            error: (xhr, status, error) => {
            }
        });
    }

    render() {
        if (this.state.loading) {
            return <div>Loading...</div>
        } else {
            return (
                <div>
                    <h1>{this.state.path.map((unit) => { return unit + " > "; })}<em>{this.state.parent}</em></h1>
                    <ul className="listing" style={{height: 300, overflow: "scroll", marginBottom: 0}}>
                        {this.state.level != 0 ? <li><a href="javascript:" onClick={this.back.bind(this)}>&lt; Back</a></li> : null}
                        {this.state.admin_units.map((unit) => {
                            return <li><a href="javascript:" onClick={this.forward.bind(this, unit)}>{unit}</a></li>
                        })}
                    </ul>
                    <button className="button" onClick={this.saveLayer.bind(this)} disabled={this.state.level == 0}>Save</button>
                </div>
            );
        }
    }
}
