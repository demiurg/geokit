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
            layer_name: "",
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
        var _this3 = this;

        if (!this.state.loading && !this.mapRendered) {
            this.renderMap();
        } else if (!this.state.loading && this.mapRendered) {
            if (prevState.level != this.state.level) {
                this.setGadmLayer(this.state.level);
            } else {
                prevState.selected.map(function (selection) {
                    if (_this3.state.selected.indexOf(selection) == -1) {
                        var e = new Event(selection + "-deselect");
                        window.dispatchEvent(e);
                    }
                });
            }
        }
    };

    GADMChooser.prototype.renderMap = function renderMap() {
        var map = this.map = L.map('map').setView([0, 0], 2);

        this.terrain = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
            attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
            maxZoom: 18,
            id: 'ags.n5m0p5ci',
            accessToken: 'pk.eyJ1IjoiYWdzIiwiYSI6IjgtUzZQc0EifQ.POMKf3yBYLNl0vz1YjQFZQ'
        }).addTo(map);

        var drawControl = new L.Control.Draw({
            draw: {
                marker: false,
                polyline: false
            }
        });
        map.addControl(drawControl);

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

    GADMChooser.prototype.extractNameFromIdString = function extractNameFromIdString(id_string) {
        var names_split = id_string.split('.');

        var name = names_split.slice(-1)[0];

        if (name == "null") {
            return names_split.slice(-2)[0];
        } else {
            return name;
        }
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
        var _this4 = this;

        if (this.geojsonTileLayer) {
            this.map.removeLayer(this.geojsonTileLayer);
        }
        if (this.super_layer) {
            this.map.removeLayer(this.super_layer);
        }

        if (this.state.level > 0) {
            var geojson_super_URL = '/layers/gadm/' + (level - 1) + '/{z}/{x}/{y}.json';
            this.sub_layer = new L.TileLayer.GeoJSON(geojson_super_URL, {
                clipTiles: true
            }, {
                style: {
                    weight: 4,
                    color: "green",
                    fillColor: "grey"
                }
            }).addTo(this.map);
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
                var featureIdString = _this4.getIdString(feature, _this4.state.level);

                layer.on('click', function (e) {
                    var featureIdx = _this4.state.selected.indexOf(featureIdString);

                    var double_click = true;
                    if (_this4.click_ll != e.latlng) {
                        double_click = false;
                        _this4.click_ll = e.latlng;
                        _this4.last_featureIdx = featureIdx;
                    }

                    if (!double_click) {
                        if (featureIdx != -1) {
                            layer.setStyle({
                                fillColor: "grey"
                            });

                            var selected = _this4.state.selected.slice();
                            selected.splice(featureIdx, 1);
                            _this4.setState({
                                selected: selected
                            });
                        } else {
                            layer.setStyle({
                                fillColor: "blue"
                            });

                            var selected = _this4.state.selected.slice();
                            selected.push(featureIdString);
                            _this4.setState({
                                selected: selected
                            });
                        }
                    } else {
                        if (_this4.last_featureIdx != -1) {
                            layer.setStyle({ fillColor: "grey" });
                        } else {
                            layer.setStyle({ fillColor: "blue" });
                        }
                    }
                });

                window.addEventListener(featureIdString + "-deselect", function () {
                    layer.setStyle({
                        fillColor: "grey"
                    });
                });
            },
            style: function style(feature) {
                if (_this4.isSelected(feature)) {
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

        this.map.on(L.Draw.Event.CREATED, function (e) {
            var new_selection = [];
            _this4.geojsonTileLayer.geojsonLayer.eachLayer(function (layer) {
                if (e.layer.getBounds().contains(layer.getBounds())) {
                    layer.setStyle({ fillColor: "blue" });
                    new_selection.push(_this4.getIdString(layer.feature, _this4.state.level));
                } else {
                    layer.setStyle({ fillColor: "grey" });
                }
            });

            _this4.setState({ selected: new_selection });
        });

        this.zoomMap();
    };

    GADMChooser.prototype.zoomMap = function zoomMap() {
        var _this5 = this;

        if (this.state.level == 0) {
            this.map.setView([0, 0], 2);
            return;
        }

        var url = '/admin/layers/gadm-bounds.json';
        var query_params = '?level=' + this.state.level;

        var i = 0;
        this.state.parents.forEach(function (unit) {
            query_params += '&name_' + i + '=' + unit;
            i++;
        });

        $.ajax(url + query_params, {
            dataType: 'json',
            success: function success(data, status, xhr) {
                _this5.map.fitBounds(L.geoJson(data).getBounds());
            },
            error: function error(xhr, status, _error) {}
        });
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

    GADMChooser.prototype.back = function back(parent_index) {
        var _this6 = this;

        var level = parent_index,
            parents = this.state.parents.slice();

        parents.splice(parent_index);

        this.getAdminUnits(level, parents[parents.length - 1], function (admin_units) {
            _this6.setState({
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

    GADMChooser.prototype.forward = function forward(parent) {
        var _this7 = this;

        var level = this.state.level + 1,
            parents = this.state.parents,
            parent_name = parent.value;

        parents.push(parent_name);

        this.getAdminUnits(level, parent_name, function (admin_units) {

            _this7.setState({
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

    GADMChooser.prototype.changeSelection = function changeSelection(newSelection) {
        this.setState({
            selected: newSelection.map(function (unit) {
                return unit.value;
            })
        });
    };

    GADMChooser.prototype.saveLayer = function saveLayer(e) {
        e.preventDefault();

        var data = { features: this.state.selected };

        data.name = this.state.layer_name;

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

    GADMChooser.prototype.updateLayerName = function updateLayerName(e) {
        this.setState({ layer_name: e.target.value });
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
                    'ul',
                    { className: 'fields' },
                    React.createElement(
                        'li',
                        { className: 'required' },
                        React.createElement(
                            'div',
                            { className: 'field slug_field text_input' },
                            React.createElement(
                                'label',
                                { htmlFor: 'id_name' },
                                'Name:'
                            ),
                            React.createElement(
                                'div',
                                { className: 'field-content' },
                                React.createElement(
                                    'div',
                                    { className: 'input' },
                                    React.createElement('input', { id: 'id_name', maxlength: '250', name: 'name', type: 'text', required: true, value: this.state.layer_name, onChange: this.updateLayerName.bind(this) })
                                ),
                                React.createElement(
                                    'p',
                                    { className: 'help' },
                                    'The name of the layer as it will appear in URLs e.g http://domain.com/blog/my-slug/ and expression e.g map(my-slug)'
                                )
                            )
                        )
                    ),
                    React.createElement(
                        'li',
                        null,
                        React.createElement(
                            'h1',
                            null,
                            React.createElement(
                                'span',
                                null,
                                React.createElement(
                                    'a',
                                    { href: 'javascript:void(0)',
                                        onClick: this.back.bind(this, 0) },
                                    'World'
                                ),
                                ' >'
                            ),
                            this.state.parents.map(function (unit, i) {
                                return React.createElement(
                                    'span',
                                    null,
                                    React.createElement(
                                        'a',
                                        { href: 'javascript:void(0)',
                                            onClick: _this8.back.bind(_this8, i + 1) },
                                        unit
                                    ),
                                    ' >'
                                );
                            }),
                            React.createElement(
                                'div',
                                { style: { display: "inline-block", width: 400 } },
                                React.createElement(Select, { name: 'parent-selector',
                                    options: this.state.units.map(function (unit) {
                                        return { value: unit, label: unit };
                                    }),
                                    onChange: this.forward.bind(this) })
                            )
                        ),
                        React.createElement(Select, { multi: true,
                            value: this.state.selected.map(function (selection) {
                                var name = _this8.extractNameFromIdString(selection);
                                return { value: selection, label: name };
                            }),
                            options: this.state.selected.map(function (selection) {
                                var name = _this8.extractNameFromIdString(selection);
                                return { value: selection, label: name };
                            }),
                            onChange: this.changeSelection.bind(this) }),
                        React.createElement('div', { id: 'map', style: { height: 400 } })
                    ),
                    React.createElement(
                        'li',
                        null,
                        React.createElement(
                            'button',
                            { className: 'button',
                                onClick: this.saveLayer.bind(this) },
                            'Save'
                        )
                    )
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
        $.ajax('/variables/data_' + this.props.variable_id + '.json', {
            dataType: 'json',
            success: function success(data, status, xhr) {
                var dates = [],
                    shas = [],
                    graph = { 'x': [], 'y': [] };

                if (data.dimensions == "time") {
                    graph.x = dates = Object.keys(data.data);
                    graph.y = Object.keys(data.data).map(function (key) {
                        return data.data[key];
                    });
                } else if (data.dimensions == "space") {
                    graph.x = shas = Object.keys(data.data);
                    graph.y = Object.keys(data.data).map(function (key) {
                        return data.data[key][self.props.variable_name];
                    });
                }

                _this2.setState({
                    ajax_data: data,
                    data: graph,
                    loading: false
                }, function () {
                    _this2.props.updateIndexes({
                        'time': dates, 'space': shas
                    });
                });
            },
            error: function error(xhr, status, _error) {
                console.log(_error);
                _this2.setState({
                    loading: false,
                    error: status
                });
            }
        });
    };

    Graph.prototype.componentDidUpdate = function componentDidUpdate(prevProps, prevState) {
        if (!this.state.error) {
            if (!prevState.data) {
                var xaxis;

                if (this.props.dimensions == "time") {
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
            } else if (this.props.time_range && prevProps.time_range) {
                if (this.props.time_range.min.getTime() != prevProps.time_range.min.getTime() || this.props.time_range.max.getTime() != prevProps.time_range.max.getTime()) {
                    var update = {
                        'xaxis.range': [this.props.time_range.min.getTime(), this.props.time_range.max.getTime()]
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

        _this.featureHandler = function (feature, layer) {
            self = _this;
            layer.on({
                mouseover: function mouseover() {
                    layer.setStyle(self.activeStyle);
                },
                mouseout: function mouseout() {
                    layer.setStyle(self.defaultStyle);
                },
                click: function click(e) {
                    var feature = e.target.feature;
                    if (feature.properties) {
                        self.props.changeFeature(feature.properties.shaid);
                        var popupString = '<div class="popup">';
                        for (var k in feature.properties) {
                            var v = feature.properties[k];
                            popupString += k + ': ' + v + '<br />';
                        }
                        popupString += '</div>';
                        layer.bindPopup(popupString).openPopup();
                    }
                }
            });
        };

        _this.state = {
            loading: true,
            error: false,
            data: [],
            space_index: [],
            time_index: []
        };

        return _this;
    }

    Map.prototype.componentDidMount = function componentDidMount() {
        var _this2 = this;

        // make AJAX call
        var self = this;
        $.ajax('/variables/data_' + this.props.variable_id + '.json', {
            dataType: 'json',
            success: function success(data, status, xhr) {
                var shas = Object.keys(data.data);
                var dates = [];
                if (self.props.dimensions == 'space') {
                    var values = shas.map(function (key) {
                        return data.data[key][self.props.variable_name];
                    });
                    _this2.min_value = d3.min(values);
                    _this2.max_value = d3.max(values);
                } else if (self.props.dimensions == 'spacetime') {
                    var rows = shas.map(function (key) {
                        if (dates.length == 0) {
                            dates = Object.keys(data.data[key]);
                        }
                        return Object.values(data.data[key]);
                    });
                    var _values = [].concat(rows);
                    _this2.min_value = d3.min(_values);
                    _this2.max_value = d3.max(_values);
                }

                _this2.color_scale = d3.scale.linear().domain([_this2.min_value, _this2.max_value]).range(_this2.props.color_ramp.map(function (stop) {
                    return stop[1];
                }));

                _this2.setState(Object.assign(data, { loading: false }), function () {
                    return self.props.updateIndexes({ 'space': shas, 'time': dates });
                });
            },
            error: function error(xhr, status, _error) {
                console.log(_error);
                _this2.setState({
                    loading: false,
                    error: status
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
        var self = this;
        if (self.props.dimensions && self.props.dimensions.length != prevProps.dimensions.length) {
            console.log("update map");
        } else if (!self.state.error) {
            var map = L.map('map-' + self.props.unique_id);

            L.tileLayer('https://api.mapbox.com/v4/ags.map-g13j9y5m/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYWdzIiwiYSI6IjgtUzZQc0EifQ.POMKf3yBYLNl0vz1YjQFZQ').addTo(map);

            self.state.layers.map(function (id, idx) {
                var geojsonURL = '/layers/' + id + '/{z}/{x}/{y}.json';
                var geojsonTileLayer = new L.TileLayer.GeoJSON(geojsonURL, {
                    clipTiles: true,
                    unique: function unique(feature) {
                        return feature.properties.shaid;
                    }
                }, {
                    style: function style(feature) {
                        var s = self;
                        var fdata = self.state.data[feature.properties.shaid];
                        var color = "#000";
                        var opacity = 0.1;

                        if (fdata) {
                            var value = fdata[self.props.variable_name];
                            color = self.color_scale(value);
                            opacity = 0.7;
                        } else {
                            console.log('no ' + feature.properties.shaid);
                        }
                        return {
                            color: "#000",
                            weight: 1,
                            fillColor: color,
                            fillOpacity: opacity
                        };
                    },
                    onEachFeature: self.featureHandler,
                    pointToLayer: function pointToLayer(feature, latlng) {
                        return new L.CircleMarker(latlng, {
                            radius: 4,
                            fillColor: "#A3C990",
                            color: "#000",
                            weight: 1,
                            opacity: 0.7,
                            fillOpacity: 0.3
                        });
                    }
                });
                map.addLayer(geojsonTileLayer);
            });
            if (self.props.bounds) {
                map.fitBounds([[self.props.bounds[1], self.props.bounds[0]], [self.props.bounds[3], self.props.bounds[2]]]);
            }
            var legend = L.control({ position: 'bottomright' });

            legend.onAdd = function (map) {
                var div = L.DomUtil.create('div', 'info legend');
                self.addColorRamp(div);
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
            data: null,
            current_feature: null
        };
        return _this;
    }

    Table.prototype.componentDidMount = function componentDidMount() {
        var self = this;
        $.ajax('/variables/data_' + this.props.variable_id + '.json', {
            dataType: 'json',
            success: function success(data, status, xhr) {
                var dates = [],
                    shas = [];
                if (data.dimensions == "time") {
                    dates = Object.keys(data.data);
                    data.values = Object.keys(data.data).map(function (key) {
                        return {
                            date: new Date(key),
                            value: data.data[key]
                        };
                    });
                } else if (data.dimensions == "space") {
                    shas = Object.keys(data.data);
                    data.values = Object.keys(data.data).map(function (key) {
                        return {
                            name: key,
                            value: data.data[key][self.props.variable_name]
                        };
                    });
                }

                self.setState({
                    data: data,
                    time_index: dates,
                    space_index: shas,
                    loading: false
                }, function () {
                    self.props.updateIndexes({
                        'time_index': dates, 'space_index': shas
                    });
                });
            },
            error: function error(xhr, status, _error) {
                console.log(_error);
                self.setState({
                    loading: false,
                    error: status
                });
            }
        });
    };

    Table.prototype.stuffChanged = function stuffChanged(old, next) {
        if (this.props.dimensions == 'time') {
            if (old.time_range && (old.time_range.min != next.time_range.min || old.time_range.max != next.time_range.max)) {
                return true;
            }
        } else if (this.props.dimensions == 'space') {
            return this.state.current_feature != next.current_feature;
        }
        return false;
    };

    Table.prototype.componentDidUpdate = function componentDidUpdate(prevProps, prevState) {
        var _this2 = this;

        if (!this.state.loading && !prevState.data && !this.state.error) {
            var columns = [],
                data;
            if (this.props.dimensions == 'space') {
                columns.push({ data: 'name' });
            } else {
                columns.push({ data: 'date' });
            }
            columns.push({ data: 'value' });

            $("#data-table-" + this.props.unique_id).DataTable({
                data: this.state.data.values,
                columns: columns
            });

            if (this.props.dimensions == 'time') {
                $.fn.dataTableExt.afnFiltering.push(function (oSettings, aData, iDataIndex) {
                    var d = new Date(aData[0]);
                    if (_this2.props.time_range.min.getTime() <= d && d <= _this2.props.time_range.max.getTime()) {
                        return true;
                    }
                    return false;
                });
            } else {
                $.fn.dataTableExt.afnFiltering.push(function (oSettings, aData, iDataIndex) {
                    var index = _this2.state.space_index.indexOf(oSettings.aoData[iDataIndex]._aData.name);
                    if (index != -1) {
                        return true;
                    }
                    return false;
                });
            }
        } else if (this.stuffChanged(prevProps, this.props)) {
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

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

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
        // map.fitBounds(geoJsonLayer.getBounds());
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
                min: new Date(this.props.time_range.min).getTime(),
                max: new Date(this.props.time_range.max).getTime()
            },
            start: [new Date(this.props.time_range.min).getTime(), new Date(this.props.time_range.max).getTime()],
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
            _this4.props.changeTimeRange({
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
        switch (this.props.type) {
            case "map":
                return this.props.dimensions.indexOf('space') != -1 ? React.createElement(
                    'div',
                    { style: { height: 400 } },
                    React.createElement(Map, _extends({
                        color_ramp: [[0, "#4286f4"], [50, "#f48341"]]
                    }, this.props))
                ) : null;
            case "graph":
                return React.createElement(
                    'div',
                    null,
                    React.createElement(Graph, this.props)
                );
            case "table":
                return React.createElement(
                    'div',
                    null,
                    React.createElement(Table, this.props)
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

        var dimensions = {};
        for (var _iterator = _this6.props.visualizations, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
            var _ref;

            if (_isArray) {
                if (_i >= _iterator.length) break;
                _ref = _iterator[_i++];
            } else {
                _i = _iterator.next();
                if (_i.done) break;
                _ref = _i.value;
            }

            var v = _ref;

            if (v.dimensions == 'space') {
                dimensions['space'] = true;
            } else if (v.dimensions == 'time') {
                dimensions['time'] = true;
            } else if (v.dimensions == 'spacetime') {
                dimensions['space'] = dimensions['time'] = true;
            }
        }

        dimensions = (dimensions['space'] ? 'space' : '') + (dimensions['time'] ? 'time' : '');

        _this6.state = {
            dimensions: dimensions,
            space_index: null,
            time_index: null,
            time_range: null,
            current_space_bounds: null,
            current_time_range: null,
            current_feature: null
        };

        _this6.child_indexes = [];
        return _this6;
    }

    VisualizationGroup.prototype.changeTimeRange = function changeTimeRange(range) {
        this.setState({
            current_time_range: { min: range.min, max: range.max }
        });
    };

    VisualizationGroup.prototype.changeSpaceBounds = function changeSpaceBounds(bounds) {};

    VisualizationGroup.prototype.changeFeature = function changeFeature(shaid) {
        this.setState({
            current_feature: shaid
        });
    };

    VisualizationGroup.prototype.updateIndexes = function updateIndexes(indexes) {
        this.child_indexes.push(indexes);

        if (this.child_indexes.length == this.props.visualizations.length) {
            var state = {};
            if (this.state.dimensions.indexOf('time') != -1) {
                var time_index = this.child_indexes.map(function (both) {
                    return both['time'];
                });
                time_index = [].concat.apply([], time_index);

                time_index = time_index.map(function (str) {
                    return new Date(str);
                });
                time_index.sort(function (a, b) {
                    return a - b;
                });

                var min = Plotly.d3.min(time_index);
                var max = Plotly.d3.max(time_index);

                state = {
                    time_index: time_index,
                    time_range: { min: min, max: max },
                    current_time_range: { min: min, max: max }
                };
            }
            if (this.state.dimensions.indexOf('space') != -1) {
                var space_index = this.child_indexes.map(function (both) {
                    return both['space'];
                });
                space_index = [].concat.apply([], space_index);

                //var merged_features = [].concat.apply([], this.child_indexes);
                state = Object.assign(state, {
                    space_index: space_index
                });
            }
            this.setState(state);
        }
    };

    VisualizationGroup.prototype.render = function render() {
        var _this7 = this;

        return React.createElement(
            'div',
            null,
            this.state.dimensions.indexOf('time') != -1 && this.state.time_range ? React.createElement(SliderControl, {
                time_range: this.state.time_range,
                changeTimeRange: this.changeTimeRange.bind(this)
            }) : null,
            this.props.visualizations.map(function (v) {
                return React.createElement(Visualization, _extends({
                    updateIndexes: _this7.updateIndexes.bind(_this7),
                    time_range: _this7.state.current_time_range,
                    changeTimeRange: _this7.changeTimeRange.bind(_this7),
                    changeSpaceBounds: _this7.changeSpaceBounds.bind(_this7),
                    current_feature: _this7.state.current_feature,
                    changeFeature: _this7.changeFeature.bind(_this7)
                }, v));
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