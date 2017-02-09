"use strict";

function bindLayerDownload(layer, dom_element) {
    ReactDOM.render(React.createElement(LayerDownload, { layer: layer }), dom_element);
}

function bindTableDownload(table, dom_element) {
    ReactDOM.render(React.createElement(TableDownload, { table: table }), dom_element);
}

window.bindLayerDownload = bindLayerDownload;
window.bindTableDownload = bindTableDownload;
"use strict";

function bindMap(variable, color_ramp, dom_element) {
    ReactDOM.render(React.createElement(Map, {
        variable_id: variable.id,
        variable_name: variable.name,
        color_ramp: color_ramp
    }), dom_element);
}

function bindGraph(variable, dom_element) {
    ReactDOM.render(React.createElement(Graph, {
        variable_id: variable.id,
        variable_name: variable.name
    }), dom_element);
}

function bindTable(variable, dom_element) {
    ReactDOM.render(React.createElement(Table, {
        variable_id: variable.id,
        variable_name: variable.name
    }), dom_element);
}

window.bindMap = bindMap;
window.bindGraph = bindGraph;
window.bindTable = bindTable;
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === name + '=') {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

var GADMChooser = function (_React$Component) {
    _inherits(GADMChooser, _React$Component);

    function GADMChooser() {
        _classCallCheck(this, GADMChooser);

        var _this = _possibleConstructorReturn(this, _React$Component.call(this));

        _this.mapRendered = false;

        _this.state = {
            level: null,
            parents: [],
            units: [],
            selected: [],
            loading: true
        };
        return _this;
    }

    GADMChooser.prototype.componentDidMount = function componentDidMount() {
        var _this2 = this;

        this.getAdminUnits(0, null, function (admin_units) {
            _this2.setState({
                level: 0,
                units: admin_units.map(function (unit) {
                    return unit.name;
                }),
                selected: admin_units.map(function (unit) {
                    return unit.name;
                }),
                loading: false
            });
        });
    };

    GADMChooser.prototype.componentDidUpdate = function componentDidUpdate(prevProps, prevState) {
        var _this3 = this;

        if (!this.state.loading && !this.mapRendered) {
            this.renderMap();
        } else if (!this.state.loading && this.mapRendered) {
            if (this.state.level == 0) {
                // Don't bother rendering any admin units, just zoom out
                // to the world.

                if (this.unit_json_layer) {
                    this.map.removeLayer(this.unit_json_layer);
                }
                this.map.setView([0, 0], 1);
            } else {
                if (this.state.level == prevState.level) {
                    // Only the selected admin units have changed,
                    // no need to fetch the geometries again.

                    this.renderAdminUnits();
                } else {
                    var url = '/admin/layers/gadm.json';

                    var query_params = '?level=' + this.state.level;

                    var i = 0;

                    this.state.parents.forEach(function (unit) {
                        query_params += '&name_' + i + '=' + unit;
                        i++;
                    });

                    $.ajax(url + query_params, {
                        dataType: 'json',
                        success: function success(data, status, xhr) {
                            _this3.unit_geometries = data;
                            _this3.renderAdminUnits();
                        },
                        error: function error(xhr, status, _error) {}
                    });
                }
            }
        }
    };

    GADMChooser.prototype.renderAdminUnits = function renderAdminUnits() {
        var _this4 = this;

        if (this.unit_json_layer) {
            this.map.removeLayer(this.unit_json_layer);
        }

        var units = this.unit_geometries;
        var geometries = [];
        for (var unit in units) {
            var geometry = JSON.parse(units[unit]);
            geometry.properties = {};
            geometry.properties.name = unit;
            geometries.push(geometry);
        }

        this.unit_json_layer = L.geoJson(geometries, {
            style: function style(feature) {
                if (_this4.state.selected.indexOf(feature.geometry.properties.name) == -1) {
                    return { color: 'grey' };
                } else {
                    return { color: 'crimson' };
                }
            },
            onEachFeature: function onEachFeature(feature, layer) {
                layer.on('click', function () {
                    var selected = _this4.state.selected;
                    var i = selected.indexOf(feature.properties.name);
                    if (i == -1) {
                        selected.push(feature.properties.name);
                    } else {
                        selected.splice(i, 1);
                    }
                    _this4.setState({ selected: selected });
                });
            }
        }).addTo(this.map);
        this.map.fitBounds(this.unit_json_layer.getBounds());
    };

    GADMChooser.prototype.renderMap = function renderMap() {
        var map = this.map = L.map('map').setView([0, 0], 1);

        self.terrain = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
            maxZoom: 18,
            id: 'ags.n5m0p5ci',
            accessToken: 'pk.eyJ1IjoiYWdzIiwiYSI6IjgtUzZQc0EifQ.POMKf3yBYLNl0vz1YjQFZQ'
        }).addTo(map);

        this.mapRendered = true;
    };

    GADMChooser.prototype.getAdminUnits = function getAdminUnits(level, parent_name, callback) {
        var url = '/layers/gadm';

        var query_params = '?level=' + level;

        if (level != 0) {
            var i = 0;
            this.state.parents.forEach(function (unit) {
                query_params += '&name_' + i + '=' + unit;
                i++;
            });
        }

        $.ajax(url + query_params, {
            dataType: 'json',
            success: function success(data, status, xhr) {
                callback(data);
            },
            error: function error(xhr, status, _error2) {}
        });
    };

    GADMChooser.prototype.back = function back() {
        var _this5 = this;

        var level = this.state.level - 1,
            parents = this.state.parents;

        parents.pop();

        this.getAdminUnits(level, parents[parents.length - 1], function (admin_units) {
            _this5.setState({
                level: level,
                units: admin_units.map(function (unit) {
                    return unit.name;
                }),
                selected: admin_units.map(function (unit) {
                    return unit.name;
                }),
                parents: parents
            });
        });
    };

    GADMChooser.prototype.forward = function forward(parent_name) {
        var _this6 = this;

        var level = this.state.level + 1,
            parents = this.state.parents;

        parents.push(parent_name);

        this.getAdminUnits(level, parent_name, function (admin_units) {
            _this6.setState({
                level: level,
                units: admin_units.map(function (unit) {
                    return unit.name;
                }),
                selected: admin_units.map(function (unit) {
                    return unit.name;
                }),
                parents: parents
            });
        });
    };

    GADMChooser.prototype.saveLayer = function saveLayer(e) {
        var _this7 = this;

        e.preventDefault();

        var data = { features: [] };
        /*for (var i = 0; i < this.state.parents.length; i++) {
            data['name_' + i] = this.state.parents[i];
        }
        data.selected = this.state.selected;
        data.level = this.state.level;*/
        this.state.selected.forEach(function (unit) {
            data.features.push({
                geometry: _this7.unit_geometries[unit],
                name: unit
            });
        });

        data.name = this.state.parents[this.state.parents.length - 1];

        $.ajax('/layers/gadm/', {
            dataType: 'json',
            contentType: 'application/json',
            type: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            },
            data: JSON.stringify(data),
            success: function success(data, status, xhr) {
                window.location = '/builder/admin/layers';
            },
            error: function error(xhr, status, _error3) {}
        });
    };

    GADMChooser.prototype.render = function render() {
        var _this8 = this;

        if (this.state.loading) {
            return React.createElement(
                'div',
                null,
                'Loading...'
            );
        } else {
            return React.createElement(
                'div',
                null,
                React.createElement(
                    'h1',
                    null,
                    this.state.parents.map(function (unit) {
                        return unit + " > ";
                    })
                ),
                React.createElement(
                    'ul',
                    { className: 'listing', style: { height: 300, overflow: "scroll", marginBottom: 0 } },
                    this.state.level != 0 ? React.createElement(
                        'li',
                        null,
                        React.createElement(
                            'a',
                            { href: 'javascript:', onClick: this.back.bind(this) },
                            '< Back'
                        )
                    ) : null,
                    this.state.units.map(function (unit) {
                        return React.createElement(
                            'li',
                            null,
                            React.createElement(
                                'a',
                                { href: 'javascript:', onClick: _this8.forward.bind(_this8, unit) },
                                unit
                            )
                        );
                    })
                ),
                React.createElement('div', { id: 'map', style: { height: 400 } }),
                React.createElement(
                    'button',
                    { className: 'button', onClick: this.saveLayer.bind(this), disabled: this.state.level == 0 },
                    'Save'
                )
            );
        }
    };

    return GADMChooser;
}(React.Component);
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Graph = function (_React$Component) {
    _inherits(Graph, _React$Component);

    function Graph(props) {
        _classCallCheck(this, Graph);

        var _this = _possibleConstructorReturn(this, _React$Component.call(this, props));

        _this.state = {
            loading: true,
            error: false,
            data: {}
        };
        return _this;
    }

    Graph.prototype.componentDidMount = function componentDidMount() {
        var _this2 = this;

        // make AJAX call
        $.ajax('/api/variables/' + this.props.variable_id + '/graph/', {
            dataType: 'json',
            success: function success(data, status, xhr) {
                _this2.setState({
                    data: data,
                    loading: false
                });
            },
            error: function error(xhr, status, _error) {
                _this2.setState({
                    loading: false,
                    error: _error
                });
            }
        });
    };

    Graph.prototype.componentDidUpdate = function componentDidUpdate(prevProps, prevState) {
        if (!this.state.error) {
            var xaxis;

            if (this.state.data.type == "timeseries") {
                xaxis = {
                    title: 'Date'
                };
            } else {
                xaxis = { title: 'Location' };
            }

            Plotly.newPlot('graph', [this.state.data], {
                xaxis: xaxis,
                yaxis: { title: this.props.variable_name }
            });
        }
    };

    Graph.prototype.render = function render() {
        if (this.state.loading) {
            return React.createElement(
                'div',
                null,
                'Loading...'
            );
        } else if (this.state.error) {
            return React.createElement(
                'div',
                null,
                'An error occured: ',
                React.createElement(
                    'em',
                    null,
                    this.state.error
                )
            );
        } else {
            return React.createElement('div', { id: 'graph' });
        }
    };

    return Graph;
}(React.Component);
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var NOT_STARTED = 0,
    PROCESSING = 1,
    READY = 2;

var LayerDownload = function (_React$Component) {
    _inherits(LayerDownload, _React$Component);

    function LayerDownload() {
        _classCallCheck(this, LayerDownload);

        var _this = _possibleConstructorReturn(this, _React$Component.call(this));

        _this.requestDownload = function () {
            $.ajax('/admin/layers/download/' + _this.props.layer, {
                dataType: 'json',
                success: function success(data, status, xhr) {
                    _this.setState({
                        download: PROCESSING
                    });
                    _this.checkStatus();
                },
                error: function error(xhr, status, _error) {
                    console.error(_error);
                }
            });
        };

        _this.state = {
            download: NOT_STARTED,
            download_link: null
        };
        return _this;
    }

    LayerDownload.prototype.startPoll = function startPoll() {
        var _this2 = this;

        setTimeout(function () {
            _this2.checkStatus();
        }, 1000);
    };

    LayerDownload.prototype.checkStatus = function checkStatus() {
        var _this3 = this;

        $.ajax('/api/layers/' + this.props.layer, {
            dataType: 'json',
            success: function success(data, status, xhr) {
                if (data.layer_file.file) {
                    _this3.setState({
                        download: READY,
                        download_link: data.layer_file.file
                    });
                } else {
                    _this3.startPoll();
                }
            },
            error: function error(xhr, status, _error2) {
                console.error(_error2);
            }
        });
    };

    LayerDownload.prototype.render = function render() {
        if (this.state.download == NOT_STARTED) {
            return React.createElement(
                'a',
                { href: '#', className: 'button button-secondary', onClick: this.requestDownload },
                'Request Download'
            );
        } else if (this.state.download == PROCESSING) {
            return React.createElement(
                'a',
                { href: '#', className: 'button button-secondary disabled' },
                'Layer Processing...'
            );
        } else {
            return React.createElement(
                'a',
                { href: this.state.download_link, className: 'button button-secondary' },
                'Download Layer'
            );
        }
    };

    return LayerDownload;
}(React.Component);
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function fromNow(time_string) {
    var d = new Date(time_string),
        now = new Date();

    var time_delta = now - d;

    var days = Math.floor(time_delta / (1000 * 60 * 60 * 24)),
        hours = Math.floor(time_delta / (1000 * 60 * 60)),
        minutes = Math.floor(time_delta / (1000 * 60));

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

var LayerList = function (_React$Component) {
    _inherits(LayerList, _React$Component);

    function LayerList() {
        _classCallCheck(this, LayerList);

        return _possibleConstructorReturn(this, _React$Component.apply(this, arguments));
    }

    LayerList.prototype.render = function render() {
        return React.createElement(
            "table",
            { className: "listing" },
            React.createElement(
                "thead",
                null,
                React.createElement(
                    "tr",
                    { className: "table-headers" },
                    React.createElement(
                        "th",
                        null,
                        "Name"
                    ),
                    React.createElement(
                        "th",
                        null,
                        "Bounds"
                    ),
                    React.createElement(
                        "th",
                        null,
                        "Field names"
                    ),
                    React.createElement(
                        "th",
                        null,
                        "Features"
                    ),
                    React.createElement(
                        "th",
                        null,
                        "Created"
                    ),
                    React.createElement(
                        "th",
                        null,
                        "Modified"
                    )
                )
            ),
            React.createElement(
                "tbody",
                null,
                this.props.children
            )
        );
    };

    return LayerList;
}(React.Component);

var LayerListItem = function (_React$Component2) {
    _inherits(LayerListItem, _React$Component2);

    function LayerListItem() {
        _classCallCheck(this, LayerListItem);

        var _this2 = _possibleConstructorReturn(this, _React$Component2.call(this));

        _this2.state = {
            status: null,
            layer: {}
        };
        return _this2;
    }

    LayerListItem.prototype.componentDidMount = function componentDidMount() {
        var _this3 = this;

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
        }, function () {
            if (_this3.state.status == 1) {
                _this3.checkStatus();
            }
        });
    };

    LayerListItem.prototype.startPoll = function startPoll() {
        var _this4 = this;

        setTimeout(function () {
            _this4.checkStatus();
        }, 1000);
    };

    LayerListItem.prototype.checkStatus = function checkStatus() {
        var _this5 = this;

        $.ajax('/api/layers/' + this.props.id, {
            dataType: 'json',
            success: function success(data, status, xhr) {
                if (data.status == 0) {
                    _this5.setState({
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
                    _this5.setState({
                        status: 2
                    });
                } else {
                    _this5.startPoll();
                }
            },
            error: function error(xhr, status, _error) {
                console.error(_error);
                _this5.setState({
                    status: 2
                });
            }
        });
    };

    LayerListItem.prototype.render = function render() {
        if (this.state.status == 0) {
            return React.createElement(
                "tr",
                null,
                React.createElement(
                    "td",
                    { className: "title" },
                    React.createElement(
                        "a",
                        { href: "/builder/admin/layers/edit/" + this.props.id },
                        this.state.layer.name
                    )
                ),
                React.createElement(
                    "td",
                    null,
                    this.state.layer.bounds
                ),
                React.createElement(
                    "td",
                    { className: "properties" },
                    this.state.layer.field_names
                ),
                React.createElement(
                    "td",
                    null,
                    this.state.layer.feature_count
                ),
                React.createElement(
                    "td",
                    null,
                    React.createElement(
                        "div",
                        { className: "human-readable-date", title: this.props.created },
                        this.state.layer.created
                    )
                ),
                React.createElement(
                    "td",
                    null,
                    React.createElement(
                        "div",
                        { className: "human-readable-date", title: this.props.modified },
                        this.state.layer.modified
                    )
                )
            );
        } else if (this.state.status == 1) {
            return React.createElement(
                "tr",
                null,
                React.createElement(
                    "td",
                    { className: "title" },
                    this.props.name
                ),
                React.createElement(
                    "td",
                    null,
                    "Processing..."
                )
            );
        } else if (this.state.status == 2) {
            return React.createElement(
                "tr",
                null,
                React.createElement(
                    "td",
                    { className: "title" },
                    this.props.name
                ),
                React.createElement(
                    "td",
                    null,
                    "An error occurred while processing this layer."
                )
            );
        } else {
            return null;
        }
    };

    return LayerListItem;
}(React.Component);
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var d3 = Plotly.d3;

var Map = function (_React$Component) {
    _inherits(Map, _React$Component);

    function Map(props) {
        _classCallCheck(this, Map);

        var _this = _possibleConstructorReturn(this, _React$Component.call(this, props));

        _this.state = {
            loading: true,
            error: false,
            data: []
        };

        _this.color_scale = d3.scale.linear().domain(_this.props.color_ramp.map(function (stop) {
            return stop[0];
        })).range(_this.props.color_ramp.map(function (stop) {
            return stop[1];
        }));
        return _this;
    }

    Map.prototype.componentDidMount = function componentDidMount() {
        var _this2 = this;

        // make AJAX call
        $.ajax('/api/variables/' + this.props.variable_id + '/map/', {
            dataType: 'json',
            success: function success(data, status, xhr) {
                _this2.setState({
                    data: data,
                    loading: false
                });
            },
            error: function error(xhr, status, _error) {
                _this2.setState({
                    loading: false,
                    error: _error
                });
            }
        });
    };

    Map.prototype.componentDidUpdate = function componentDidUpdate(prevProps, prevState) {
        var _this3 = this;

        if (!this.state.error) {
            var vals = this.state.data.map(function (feature) {
                return feature.properties[_this3.props.variable_name];
            });

            var map = L.map('map');

            L.tileLayer('https://api.mapbox.com/v4/ags.map-g13j9y5m/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYWdzIiwiYSI6IjgtUzZQc0EifQ.POMKf3yBYLNl0vz1YjQFZQ').addTo(map);

            var geojson_layer = L.geoJson(this.state.data, {
                style: function style(feature) {
                    return {
                        color: "#000",
                        weight: 1,
                        fillColor: _this3.color_scale(feature.properties[_this3.props.variable_name]),
                        fillOpacity: 0.7
                    };
                },
                onEachFeature: function onEachFeature(feature, layer) {
                    layer.bindPopup(String(feature.properties[_this3.props.variable_name]));
                }
            }).addTo(map);

            map.fitBounds(geojson_layer.getBounds());

            var legend = L.control({ position: 'bottomright' });

            legend.onAdd = function (map) {
                var div = L.DomUtil.create('div', 'info legend');
                _this3.addColorRamp(div);
                return div;
            };

            legend.addTo(map);
        }
    };

    Map.prototype.addColorRamp = function addColorRamp(dom_el) {
        var key = d3.select(dom_el).append("svg").attr("width", 80).attr("height", 135);

        var legend = key.append("defs").append("svg:linearGradient").attr("id", "gradient").attr("x1", "100%").attr("y1", "0%").attr("x2", "100%").attr("y2", "100%").attr("spreadMethod", "pad");

        var distance_between_offsets = 100 / (this.props.color_ramp.length - 1);
        var offset = 0;
        for (var i = this.props.color_ramp.length - 1; i >= 0; i--) {
            var stop = this.props.color_ramp[i];
            legend.append("stop").attr("offset", offset + "%").attr("stop-color", stop[1]).attr("stop-opacity", 1);

            offset += distance_between_offsets;
        }

        key.append("rect").attr("width", 22).attr("height", 120).style("fill", "url(#gradient)").attr("transform", "translate(0,10)");

        var min_value = this.props.color_ramp[0][0],
            max_value = this.props.color_ramp[this.props.color_ramp.length - 1][0];
        var y = d3.scale.linear().range([120, 0]).domain([min_value, max_value]);

        var yAxis = d3.svg.axis().scale(y).orient("right");
        key.append("g").attr("class", "y axis").attr("transform", "translate(26,10)").call(yAxis).append("text").attr("transform", "rotate(-90)").attr("y", 39).attr("dy", ".71em").style("text-anchor", "end").text(this.props.variable_name);
    };

    Map.prototype.render = function render() {
        if (this.state.loading) {
            return React.createElement(
                'div',
                null,
                'Loading...'
            );
        } else if (this.state.error) {
            return React.createElement(
                'div',
                null,
                'An error occured: ',
                React.createElement(
                    'em',
                    null,
                    this.state.error
                )
            );
        } else {
            return React.createElement('div', { id: 'map', style: { height: "100%" } });
        }
    };

    return Map;
}(React.Component);
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var NOT_STARTED = 0,
    PROCESSING = 1,
    READY = 2;

var TableDownload = function (_React$Component) {
    _inherits(TableDownload, _React$Component);

    function TableDownload() {
        _classCallCheck(this, TableDownload);

        var _this = _possibleConstructorReturn(this, _React$Component.call(this));

        _this.requestDownload = function () {
            $.ajax('/admin/tables/download/' + _this.props.table, {
                dataType: 'json',
                success: function success(data, status, xhr) {
                    _this.setState({
                        download: PROCESSING
                    });
                    _this.checkStatus();
                },
                error: function error(xhr, status, _error) {
                    console.error(_error);
                }
            });
        };

        _this.state = {
            download: NOT_STARTED,
            download_link: null
        };
        return _this;
    }

    TableDownload.prototype.startPoll = function startPoll() {
        var _this2 = this;

        setTimeout(function () {
            _this2.checkStatus();
        }, 1000);
    };

    TableDownload.prototype.checkStatus = function checkStatus() {
        var _this3 = this;

        $.ajax('/api/tables/' + this.props.table, {
            dataType: 'json',
            success: function success(data, status, xhr) {
                if (data.table_file.file) {
                    _this3.setState({
                        download: READY,
                        download_link: data.table_file.file
                    });
                } else {
                    _this3.startPoll();
                }
            },
            error: function error(xhr, status, _error2) {
                console.error(_error2);
            }
        });
    };

    TableDownload.prototype.render = function render() {
        if (this.state.download == NOT_STARTED) {
            return React.createElement(
                'a',
                { href: '#', className: 'button button-secondary', onClick: this.requestDownload },
                'Request Download'
            );
        } else if (this.state.download == PROCESSING) {
            return React.createElement(
                'a',
                { href: '#', className: 'button button-secondary disabled' },
                'Layer Processing...'
            );
        } else {
            return React.createElement(
                'a',
                { href: this.state.download_link, className: 'button button-secondary' },
                'Download Table'
            );
        }
    };

    return TableDownload;
}(React.Component);
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ASCENDING = true,
    DESCENDING = false;

var Table = function (_React$Component) {
    _inherits(Table, _React$Component);

    function Table(props) {
        _classCallCheck(this, Table);

        var _this = _possibleConstructorReturn(this, _React$Component.call(this, props));

        _this.state = {
            loading: true,
            error: false,
            data: [],
            sort: {
                field: 'key',
                direction: ASCENDING
            }
        };
        return _this;
    }

    Table.prototype.componentDidMount = function componentDidMount() {
        var _this2 = this;

        $.ajax('/api/variables/' + this.props.variable_id + '/table/', {
            dataType: 'json',
            success: function success(data, status, xhr) {
                if (data.dimension == "time") {
                    data.values = data.values.map(function (value) {
                        return {
                            date: new Date(value.date),
                            value: value.value
                        };
                    });
                }
                _this2.setState({
                    data: data,
                    loading: false
                });
            },
            error: function error(xhr, status, _error) {
                _this2.setState({
                    loading: false,
                    error: _error
                });
            }
        });
    };

    Table.prototype.sortBy = function sortBy(field) {
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
    };

    Table.prototype.sortedValues = function sortedValues() {
        var _this3 = this;

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

        return this.state.data.values.sort(function (a, b) {
            if (a[field] == b[field]) {
                return 0;
            } else if (_this3.state.sort.direction == ASCENDING) {
                if (a[field] < b[field]) {
                    return -1;
                }
                return 1;
            } else if (_this3.state.sort.direction == DESCENDING) {
                if (b[field] < a[field]) {
                    return -1;
                }
                return 1;
            }
        });
    };

    Table.prototype.renderSortIndicator = function renderSortIndicator(field) {
        if (this.state.sort.field == field) {
            if (this.state.sort.direction == ASCENDING) {
                return React.createElement('span', { className: 'glyphicon glyphicon-chevron-down' });
            } else if (this.state.sort.direction == DESCENDING) {
                return React.createElement('span', { className: 'glyphicon glyphicon-chevron-up' });
            }
        }
    };

    Table.prototype.render = function render() {
        var _this4 = this;

        if (this.state.loading) {
            return React.createElement(
                'div',
                null,
                'Loading...'
            );
        } else if (this.state.error) {
            return React.createElement(
                'div',
                null,
                'An error occured: ',
                React.createElement(
                    'em',
                    null,
                    this.state.error
                )
            );
        } else {
            return React.createElement(
                'table',
                { className: 'table' },
                React.createElement(
                    'thead',
                    null,
                    React.createElement(
                        'tr',
                        null,
                        React.createElement(
                            'th',
                            null,
                            React.createElement(
                                'a',
                                { href: '#', onClick: this.sortBy.bind(this, "key") },
                                this.state.data.dimension == "time" ? "Date" : "Feature",
                                ' ',
                                this.renderSortIndicator("key")
                            )
                        ),
                        React.createElement(
                            'th',
                            null,
                            React.createElement(
                                'a',
                                { href: '#', onClick: this.sortBy.bind(this, "value") },
                                this.props.variable_name,
                                ' ',
                                this.renderSortIndicator("value")
                            )
                        )
                    )
                ),
                React.createElement(
                    'tbody',
                    null,
                    this.sortedValues().map(function (value) {
                        return React.createElement(
                            'tr',
                            { key: _this4.state.data.dimension == "time" ? value.date.getTime() : value.feature },
                            React.createElement(
                                'td',
                                null,
                                _this4.state.data.dimension == "time" ? value.date.toLocaleDateString("en-US") : value.feature
                            ),
                            React.createElement(
                                'td',
                                null,
                                value.value
                            )
                        );
                    })
                )
            );
        }
    };

    return Table;
}(React.Component);
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var TableList = function (_React$Component) {
    _inherits(TableList, _React$Component);

    function TableList() {
        _classCallCheck(this, TableList);

        return _possibleConstructorReturn(this, _React$Component.apply(this, arguments));
    }

    TableList.prototype.render = function render() {
        return React.createElement(
            "table",
            { className: "listing" },
            React.createElement(
                "thead",
                null,
                React.createElement(
                    "tr",
                    { className: "table-headers" },
                    React.createElement(
                        "th",
                        null,
                        "Name"
                    ),
                    React.createElement(
                        "th",
                        null,
                        "Description"
                    ),
                    React.createElement(
                        "th",
                        null,
                        "Field names"
                    ),
                    React.createElement(
                        "th",
                        null,
                        "Rows"
                    )
                )
            ),
            React.createElement(
                "tbody",
                null,
                this.props.children
            )
        );
    };

    return TableList;
}(React.Component);

var TableListItem = function (_React$Component2) {
    _inherits(TableListItem, _React$Component2);

    function TableListItem() {
        _classCallCheck(this, TableListItem);

        var _this2 = _possibleConstructorReturn(this, _React$Component2.call(this));

        _this2.state = {
            status: null,
            layer: {}
        };
        return _this2;
    }

    TableListItem.prototype.componentDidMount = function componentDidMount() {
        var _this3 = this;

        var props = this.props;
        this.setState({
            status: props.status,
            table: {
                name: props.name,
                description: props.description,
                field_names: props.field_names,
                row_count: props.row_count
            }
        }, function () {
            if (_this3.state.status == 1) {
                _this3.checkStatus();
            }
        });
    };

    TableListItem.prototype.startPoll = function startPoll() {
        var _this4 = this;

        setTimeout(function () {
            _this4.checkStatus();
        }, 1000);
    };

    TableListItem.prototype.checkStatus = function checkStatus() {
        var _this5 = this;

        $.ajax('/api/tables/' + this.props.id, {
            dataType: 'json',
            success: function success(data, status, xhr) {
                if (data.status == 0) {
                    _this5.setState({
                        status: 0,
                        table: {
                            name: data.name,
                            description: data.description,
                            field_names: data.field_names.join(", "),
                            row_count: data.row_count
                        }
                    });
                } else if (data.status == 2) {
                    _this5.setState({
                        status: 2
                    });
                } else {
                    _this5.startPoll();
                }
            },
            error: function error(xhr, status, _error) {
                console.error(_error);
                _this5.setState({
                    status: 2
                });
            }
        });
    };

    TableListItem.prototype.render = function render() {
        if (this.state.status == 0) {
            return React.createElement(
                "tr",
                null,
                React.createElement(
                    "td",
                    { className: "title" },
                    React.createElement(
                        "a",
                        { href: "/builder/admin/tables/edit/" + this.props.id },
                        this.state.table.name
                    )
                ),
                React.createElement(
                    "td",
                    null,
                    this.state.table.description
                ),
                React.createElement(
                    "td",
                    null,
                    this.state.table.field_names
                ),
                React.createElement(
                    "td",
                    null,
                    this.state.table.row_count
                )
            );
        } else if (this.state.status == 1) {
            return React.createElement(
                "tr",
                null,
                React.createElement(
                    "td",
                    { className: "title" },
                    this.props.name
                ),
                React.createElement(
                    "td",
                    null,
                    "Processing..."
                )
            );
        } else if (this.state.status == 2) {
            return React.createElement(
                "tr",
                null,
                React.createElement(
                    "td",
                    { className: "title" },
                    this.props.name
                ),
                React.createElement(
                    "td",
                    null,
                    "An error occurred while processing this layer."
                )
            );
        } else {
            return null;
        }
    };

    return TableListItem;
}(React.Component);

//# sourceMappingURL=builder.js.map