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
            selected: {},
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
        if (!this.state.loading && !this.mapRendered) {
            this.renderMap();
        } else if (!this.state.loading && this.mapRendered) {
            if (prevState.level != this.state.level) {
                this.setGadmLayer(this.state.level);
            }
        }
    };

    GADMChooser.prototype.renderMap = function renderMap() {
        var map = this.map = L.map('map').setView([0, 0], 1);

        this.terrain = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
            maxZoom: 18,
            id: 'ags.n5m0p5ci',
            accessToken: 'pk.eyJ1IjoiYWdzIiwiYSI6IjgtUzZQc0EifQ.POMKf3yBYLNl0vz1YjQFZQ'
        }).addTo(map);

        this.setGadmLayer(0);
        this.mapRendered = true;
    };

    GADMChooser.prototype.getIdString = function getIdString(feature, level) {
        var parent_string = '';

        for (var i = 0; i < level; i++) {
            var level_name = feature.properties['name_' + i];

            if (level_name) {
                parent_string += level_name + ".";
            }
        }

        parent_string += feature.properties['name_' + level];
        return parent_string;
    };

    GADMChooser.prototype.isSelected = function isSelected(feature) {
        var parent_string = '';

        for (var i = 0; i < this.state.level; i++) {
            var level_name = feature.properties['name_' + i];

            if (level_name) {
                parent_string += level_name + ".";
            }
        }

        parent_string += feature.properties['name_' + this.state.level];

        if (this.state.selected.indexOf(parent_string) == -1) {
            return false;
        }

        return true;
    };

    GADMChooser.prototype.setGadmLayer = function setGadmLayer(level) {
        var _this3 = this;

        if (this.geojsonTileLayer) {
            this.map.removeLayer(this.geojsonTileLayer);
        }
        this.geojsonURL = '/layers/gadm/' + level + '/{z}/{x}/{y}.json';
        this.geojsonTileLayer = new L.TileLayer.GeoJSON(this.geojsonURL, {
            clipTiles: true,
            unique: function unique(feature) {
                var hasc_id = '';
                for (var i = 0; i <= Number.parseInt(level); i++) {
                    hasc_id += feature.properties['name_' + i];
                }
                return hasc_id;
            }
        }, {
            onEachFeature: function onEachFeature(feature, layer) {
                layer.on('click', function (e) {
                    var featureIdString = _this3.getIdString(feature, _this3.state.level);
                    var featureIdx = _this3.state.selected.indexOf(featureIdString);
                    if (featureIdx != -1) {
                        layer.setStyle({
                            fillColor: "grey"
                        });

                        var selected = _this3.state.selected.slice();
                        selected.splice(featureIdx, 1);
                        _this3.setState({
                            selected: selected
                        });
                    } else {
                        layer.setStyle({
                            fillColor: "blue"
                        });

                        var selected = _this3.state.selected.slice();
                        selected.push(featureIdString);
                        _this3.setState({
                            selected: selected
                        });
                    }
                });
            },
            style: function style(feature) {
                if (_this3.isSelected(feature)) {
                    return {
                        fillColor: "blue",
                        weight: 1
                    };
                } else {
                    return {
                        fillColor: "grey",
                        weight: 1
                    };
                }
            }
        }).addTo(this.map);
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
            error: function error(xhr, status, _error) {}
        });
    };

    GADMChooser.prototype.back = function back() {
        var _this4 = this;

        var level = this.state.level - 1,
            parents = this.state.parents;

        parents.pop();

        this.getAdminUnits(level, parents[parents.length - 1], function (admin_units) {
            _this4.setState({
                level: level,
                units: admin_units.map(function (unit) {
                    return unit.name;
                }),
                selected: admin_units.map(function (unit) {
                    var parent_string = parents.join(".");
                    return parent_string + "." + unit.name;
                }),
                parents: parents
            });
        });
    };

    GADMChooser.prototype.forward = function forward(parent_name) {
        var _this5 = this;

        var level = this.state.level + 1,
            parents = this.state.parents;

        parents.push(parent_name);

        this.getAdminUnits(level, parent_name, function (admin_units) {

            _this5.setState({
                level: level,
                units: admin_units.map(function (unit) {
                    return unit.name;
                }),
                selected: admin_units.map(function (unit) {
                    var parent_string = parents.join(".");
                    return parent_string + "." + unit.name;
                }),
                parents: parents
            });
        });
    };

    GADMChooser.prototype.saveLayer = function saveLayer(e) {
        e.preventDefault();

        var data = { features: this.state.selected };

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
            error: function error(xhr, status, _error2) {}
        });
    };

    GADMChooser.prototype.render = function render() {
        var _this6 = this;

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
                            { href: 'javascript:',
                                onClick: this.back.bind(this)
                            },
                            '< Back'
                        )
                    ) : null,
                    this.state.units.map(function (unit) {
                        return React.createElement(
                            'li',
                            null,
                            React.createElement(
                                'a',
                                { href: 'javascript:',
                                    onClick: _this6.forward.bind(_this6, unit)
                                },
                                unit
                            )
                        );
                    })
                ),
                React.createElement('div', { id: 'map', style: { height: 400 } }),
                React.createElement(
                    'button',
                    { className: 'button',
                        onClick: this.saveLayer.bind(this),
                        disabled: this.state.level == 0
                    },
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
            data: null
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
                }, function () {
                    _this2.props.setDimensions([Plotly.d3.min(data.x), Plotly.d3.max(data.x)]);
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
            if (!prevState.data) {
                var xaxis;

                if (this.state.data.type == "timeseries") {
                    xaxis = {
                        title: 'Date'
                    };
                } else {
                    xaxis = { title: 'Location' };
                }

                Plotly.newPlot('graph-' + this.props.unique_id, [this.state.data], {
                    xaxis: xaxis,
                    yaxis: { title: this.props.variable_name }
                });
            } else if (this.props.dimensions && prevProps.dimensions) {
                if (this.props.dimensions.min.getTime() != prevProps.dimensions.min.getTime() || this.props.dimensions.max.getTime() != prevProps.dimensions.max.getTime()) {
                    var update = {
                        'xaxis.range': [this.props.dimensions.min.getTime(), this.props.dimensions.max.getTime()]
                    };
                    Plotly.relayout('graph-' + this.props.unique_id, update);
                }
            }
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
            return React.createElement('div', { id: "graph-" + this.props.unique_id });
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

        return _this;
    }

    Map.prototype.componentDidMount = function componentDidMount() {
        var _this2 = this;

        // make AJAX call
        $.ajax('/api/variables/' + this.props.variable_id + '/map/', {
            dataType: 'json',
            success: function success(data, status, xhr) {
                _this2.min_value = d3.min(data.map(function (feature) {
                    return feature.properties[_this2.props.variable_name];
                }));
                _this2.max_value = d3.max(data.map(function (feature) {
                    return feature.properties[_this2.props.variable_name];
                }));

                _this2.color_scale = d3.scale.linear().domain([_this2.min_value, _this2.max_value]).range(_this2.props.color_ramp.map(function (stop) {
                    return stop[1];
                }));

                _this2.setState({
                    data: data,
                    loading: false
                }, function () {
                    _this2.props.setDimensions(data);
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

    Map.prototype.shouldComponentUpdate = function shouldComponentUpdate(nextProps, nextState) {
        if (this.state.loading || this.props.dimensions && this.props.dimensions.length != nextProps.dimensions.length) {
            return true;
        }
        return false;
    };

    Map.prototype.componentDidUpdate = function componentDidUpdate(prevProps, prevState) {
        var _this3 = this;

        if (this.props.dimensions && this.props.dimensions.length != prevProps.dimensions.length) {
            console.log("update map");
        } else if (!this.state.error) {
            var vals = this.state.data.map(function (feature) {
                return feature.properties[_this3.props.variable_name];
            });

            var map = L.map('map-' + this.props.unique_id);

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

        var y = d3.scale.linear().range([120, 0]).domain([this.min_value, this.max_value]);

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
            return React.createElement('div', { id: "map-" + this.props.unique_id, style: { height: "100%" } });
        }
    };

    return Map;
}(React.Component);
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Table = function (_React$Component) {
    _inherits(Table, _React$Component);

    function Table(props) {
        _classCallCheck(this, Table);

        var _this = _possibleConstructorReturn(this, _React$Component.call(this, props));

        _this.state = {
            loading: true,
            error: false,
            data: null
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
                }, function () {
                    if (_this2.state.data.dimension == "time") {
                        _this2.props.setDimensions([_this2.state.data.values[0].date, _this2.state.data.values[_this2.state.data.values.length - 1].date]);
                    } else {
                        _this2.props.setDimensions(_this2.state.data.values.map(function (datum) {
                            return datum.feature;
                        }));
                    }
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

    Table.prototype.dimensionsChanged = function dimensionsChanged(old, next) {
        if (this.state.data.dimension == 'time') {
            if (old && (old.min != next.min || old.max != next.max)) {
                return true;
            }
        } else if (old && old.length != next.length) {
            return true;
        }
        return false;
    };

    Table.prototype.componentDidUpdate = function componentDidUpdate(prevProps, prevState) {
        var _this3 = this;

        if (!this.state.loading && !prevState.data) {
            var columns = [],
                data;
            if (this.state.data.dimension == 'space') {
                columns.push({ data: 'feature.properties', render: 'name' });
            } else {
                columns.push({ data: 'date' });
            }
            columns.push({ data: 'value' });

            $("#data-table-" + this.props.unique_id).DataTable({
                data: this.state.data.values,
                columns: columns
            });

            if (this.state.data.dimension == 'time') {
                $.fn.dataTableExt.afnFiltering.push(function (oSettings, aData, iDataIndex) {
                    var d = new Date(aData[0]);
                    if (_this3.props.dimensions.min.getTime() <= d && d <= _this3.props.dimensions.max.getTime()) {
                        return true;
                    }
                    return false;
                });
            } else {
                $.fn.dataTableExt.afnFiltering.push(function (oSettings, aData, iDataIndex) {
                    var dims = _this3.props.dimensions.map(function (dim) {
                        return dim.properties.id;
                    });
                    var index = dims.indexOf(oSettings.aoData[iDataIndex]._aData.feature.properties.id);
                    if (index != -1) {
                        return true;
                    }
                    return false;
                });
            }
        } else if (this.dimensionsChanged(prevProps.dimensions, this.props.dimensions)) {
            $("#data-table-" + this.props.unique_id).DataTable().draw();
        }
    };

    Table.prototype.render = function render() {
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
                { id: "data-table-" + this.props.unique_id, className: 'display' },
                React.createElement(
                    'thead',
                    null,
                    React.createElement(
                        'tr',
                        null,
                        React.createElement(
                            'th',
                            null,
                            this.state.data.dimension == "time" ? "Date" : "Feature"
                        ),
                        React.createElement(
                            'th',
                            null,
                            'Value'
                        )
                    )
                ),
                React.createElement('tbody', null)
            );
        }
    };

    return Table;
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
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var MapControl = function (_React$Component) {
    _inherits(MapControl, _React$Component);

    function MapControl() {
        _classCallCheck(this, MapControl);

        return _possibleConstructorReturn(this, _React$Component.apply(this, arguments));
    }

    MapControl.prototype.componentDidMount = function componentDidMount() {
        var _this2 = this;

        var map = L.map('map-control').setView([0, 0], 1);

        L.tileLayer('https://api.mapbox.com/v4/ags.map-g13j9y5m/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYWdzIiwiYSI6IjgtUzZQc0EifQ.POMKf3yBYLNl0vz1YjQFZQ').addTo(map);

        var geoJsonLayer = L.geoJson(this.props.dims, {
            onEachFeature: function onEachFeature(feature, layer) {
                layer.on('click', function (e) {
                    var dims = _this2.props.currentDims.slice();
                    var dim_index = dims.map(function (dim) {
                        return dim.properties.id;
                    }).indexOf(feature.properties.id);
                    if (dim_index != -1) {
                        layer.setStyle({ color: 'grey' });
                        dims.splice(dim_index, 1);
                        _this2.props.changeDimensions(dims);
                    } else {
                        layer.setStyle({ color: 'maroon' });
                        var index = _this2.props.dims.map(function (dim) {
                            return dim.properties.id;
                        }).indexOf(feature.properties.id);
                        dims.push(_this2.props.dims[index]);
                        _this2.props.changeDimensions(dims);
                    }
                });
            }, style: function style(feature) {
                var dims = _this2.props.currentDims.map(function (dim) {
                    return dim.properties.id;
                });
                if (dims.indexOf(feature.properties.id) != -1) {
                    return { color: "maroon" };
                } else {
                    return { color: "grey" };
                }
            }
        }).addTo(map);
        map.fitBounds(geoJsonLayer.getBounds());
    };

    MapControl.prototype.render = function render() {
        return React.createElement('div', { id: 'map-control', style: { height: 400 } });
    };

    return MapControl;
}(React.Component);

var SliderControl = function (_React$Component2) {
    _inherits(SliderControl, _React$Component2);

    function SliderControl() {
        _classCallCheck(this, SliderControl);

        return _possibleConstructorReturn(this, _React$Component2.apply(this, arguments));
    }

    SliderControl.prototype.componentDidMount = function componentDidMount() {
        var _this4 = this;

        var dateSlider = document.getElementById('date-slider-control');

        noUiSlider.create(dateSlider, {
            range: {
                min: new Date(this.props.dims.min).getTime(),
                max: new Date(this.props.dims.max).getTime()
            },
            start: [new Date('2010').getTime(), new Date('2015').getTime()],
            step: 7 * 24 * 60 * 60 * 1000,
            connect: true,
            behaviour: 'drag',
            tooltips: true,
            format: {
                to: function to(value) {
                    var format = Plotly.d3.time.format("%B %e, %Y");
                    return format(new Date(value));
                },
                from: function from(value) {
                    return value;
                }
            }
        });

        dateSlider.noUiSlider.on('update', function (values, handle) {
            _this4.props.changeDimensions({
                min: new Date(values[0]),
                max: new Date(values[1]) });
        });
    };

    SliderControl.prototype.render = function render() {
        return React.createElement('div', { id: 'date-slider-control' });
    };

    return SliderControl;
}(React.Component);

var Visualization = function (_React$Component3) {
    _inherits(Visualization, _React$Component3);

    function Visualization() {
        _classCallCheck(this, Visualization);

        return _possibleConstructorReturn(this, _React$Component3.apply(this, arguments));
    }

    Visualization.prototype.render = function render() {
        if (this.props.type == "map") {
            return React.createElement(
                'div',
                { style: { height: 400 } },
                React.createElement(Map, {
                    variable_id: this.props.variable_id,
                    variable_name: this.props.variable_name,
                    color_ramp: [[0, "#4286f4"], [50, "#f48341"]],
                    setDimensions: this.props.getChildDimensions,
                    dimensions: this.props.dimensions,
                    unique_id: this.props.unique_id })
            );
        } else if (this.props.type == "graph") {
            return React.createElement(
                'div',
                null,
                React.createElement(Graph, {
                    variable_id: this.props.variable_id,
                    variable_name: this.props.variable_name,
                    setDimensions: this.props.getChildDimensions,
                    dimensions: this.props.dimensions,
                    unique_id: this.props.unique_id })
            );
        } else if (this.props.type == "table") {
            return React.createElement(
                'div',
                null,
                React.createElement(Table, {
                    variable_id: this.props.variable_id,
                    variable_name: this.props.variable_name,
                    setDimensions: this.props.getChildDimensions,
                    dimensions: this.props.dimensions,
                    unique_id: this.props.unique_id })
            );
        }
    };

    return Visualization;
}(React.Component);

var VisualizationGroup = function (_React$Component4) {
    _inherits(VisualizationGroup, _React$Component4);

    function VisualizationGroup(props) {
        _classCallCheck(this, VisualizationGroup);

        var _this6 = _possibleConstructorReturn(this, _React$Component4.call(this, props));

        _this6.state = {
            dimensions: null,
            currentDimensions: null
        };

        _this6.childStartingDimensions = [];
        return _this6;
    }

    VisualizationGroup.prototype.changeDimensions = function changeDimensions(newDims) {
        if (this.props.control == 'time') {
            this.setState({
                currentDimensions: { min: newDims.min, max: newDims.max }
            });
        } else {
            this.setState({ currentDimensions: newDims });
        }
    };

    VisualizationGroup.prototype.getChildDimensions = function getChildDimensions(dimensions) {
        this.childStartingDimensions.push(dimensions);

        if (this.childStartingDimensions.length == this.props.children.length) {
            if (this.props.control == "slider") {
                var min = Plotly.d3.min(this.childStartingDimensions.map(function (childDim) {
                    return childDim[0];
                }));

                var max = Plotly.d3.max(this.childStartingDimensions.map(function (childDim) {
                    return childDim[1];
                }));

                this.setState({
                    dimensions: { min: min, max: max },
                    currentDimensions: { min: min, max: max }
                });
            } else {
                var merged_features = [].concat.apply([], this.childStartingDimensions);
                this.setState({
                    dimensions: merged_features,
                    currentDimensions: merged_features
                });
            }
        }
    };

    VisualizationGroup.prototype.render = function render() {
        var _this7 = this;

        var Control = null;
        if (this.props.control == "map") {
            Control = MapControl;
        } else if (this.props.control == "slider") {
            Control = SliderControl;
        }

        return React.createElement(
            'div',
            null,
            Control && this.state.dimensions ? React.createElement(Control, { dims: this.state.dimensions, currentDims: this.state.currentDimensions, changeDimensions: this.changeDimensions.bind(this) }) : null,
            this.props.children.map(function (child) {
                return React.cloneElement(child, {
                    dimensions: _this7.state.currentDimensions,
                    getChildDimensions: _this7.getChildDimensions.bind(_this7)
                });
            })
        );
    };

    return VisualizationGroup;
}(React.Component);
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

//# sourceMappingURL=builder.js.map