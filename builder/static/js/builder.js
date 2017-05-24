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

        _this.state = {
            name: "",
            layer: "",
            featureIds: []
        };
        return _this;
    }

    GADMChooser.prototype.componentDidMount = function componentDidMount() {
        this.renderMap();
    };

    GADMChooser.prototype.componentDidUpdate = function componentDidUpdate(prevProps, prevState) {
        if (prevState.layer != this.state.layer) {
            this.switchLayer(this.state.layer);
        }
    };

    GADMChooser.prototype.renderMap = function renderMap() {
        var map = this.map = L.map('map').setView([0, 0], 2);
        $(document).on('shown.bs.tab', function (e) {
            map.invalidateSize();
        });

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
    };

    GADMChooser.prototype.switchLayer = function switchLayer(layer_name) {
        var _this2 = this;

        if (this.geojsonTileLayer) {
            this.map.removeLayer(this.geojsonTileLayer);
        }

        this.geojsonURL = '/layers/vector-catalog/' + layer_name + '/{z}/{x}/{y}.json';
        this.geojsonTileLayer = new L.TileLayer.GeoJSON(this.geojsonURL, {
            clipTiles: true,
            unique: function unique(feature) {
                return feature.properties.id;
            }
        }, {
            onEachFeature: function onEachFeature(feature, layer) {
                layer.on('click', function (e) {
                    var featureIdx = _this2.state.featureIds.indexOf(feature.properties.id);

                    var double_click = true;
                    if (_this2.click_ll != e.latlng) {
                        double_click = false;
                        _this2.click_ll = e.latlng;
                        _this2.last_featureIdx = featureIdx;
                    }

                    if (!double_click) {
                        if (featureIdx != -1) {
                            layer.setStyle({
                                fillColor: "grey"
                            });

                            var selected = _this2.state.featureIds.slice();
                            selected.splice(featureIdx, 1);
                            _this2.setState({
                                featureIds: selected
                            });
                        } else {
                            layer.setStyle({
                                fillColor: "blue"
                            });

                            var selected = _this2.state.featureIds.slice();
                            selected.push(feature.properties.id);
                            _this2.setState({
                                featureIds: selected
                            });
                        }
                    } else {
                        if (_this2.last_featureIdx != -1) {
                            layer.setStyle({ fillColor: "grey" });
                        } else {
                            layer.setStyle({ fillColor: "blue" });
                        }
                    }
                });

                window.addEventListener(feature.properties.id + "-deselect", function () {
                    layer.setStyle({
                        fillColor: "grey"
                    });
                });
            },
            style: function style(feature) {
                var featureIdx = _this2.state.featureIds.indexOf(feature.properties.id);
                if (featureIdx != -1) {
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
            _this2.geojsonTileLayer.geojsonLayer.eachLayer(function (layer) {
                if (e.layer.getBounds().contains(layer.getBounds())) {
                    layer.setStyle({ fillColor: "blue" });
                    new_selection.push(layer.feature.properties.id);
                } else {
                    layer.setStyle({ fillColor: "grey" });
                }
            });

            _this2.setState({ featureIds: new_selection });
        });

        //this.zoomMap();
    };

    GADMChooser.prototype.zoomMap = function zoomMap() {
        var _this3 = this;

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
                _this3.map.fitBounds(L.geoJson(data).getBounds());
            },
            error: function error(xhr, status, _error) {}
        });
    };

    GADMChooser.prototype.changeLayer = function changeLayer(newSelection) {
        var _this4 = this;

        if (this.state.layer && this.state.featureIds.length != 0) {
            $.ajax('/layers/vector-catalog/translate/' + this.state.layer + '/' + newSelection.value, {
                dataType: 'json',
                contentType: 'application/json',
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                },
                data: JSON.stringify({ features: this.state.featureIds }),
                success: function success(data, status, xhr) {
                    _this4.setState({
                        layer: newSelection.value,
                        featureIds: data
                    });
                },
                error: function error(xhr, status, _error2) {}
            });
        } else {
            this.setState({
                layer: newSelection.value
            });
        }
    };

    GADMChooser.prototype.saveLayer = function saveLayer(e) {
        e.preventDefault();

        var data = {
            name: this.state.name,
            layer: this.state.layer,
            features: this.state.featureIds
        };

        $.ajax('/layers/vector-catalog/', {
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

    GADMChooser.prototype.updateName = function updateName(e) {
        this.setState({ name: e.target.value });
    };

    GADMChooser.prototype.render = function render() {
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
                        null,
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
                                    React.createElement('input', { id: 'id_name',
                                        maxlength: '250',
                                        type: 'text',
                                        value: this.state.name,
                                        onChange: this.updateName.bind(this) })
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
                        React.createElement(Select, { value: this.state.layer,
                            options: this.props.layers.map(function (layer) {
                                return { value: layer, label: layer };
                            }),
                            onChange: this.changeLayer.bind(this) }),
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

var d3 = Plotly.d3;

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
                    graph['type'] = 'scatter';
                    graph['mode'] = 'lines';
                } else if (data.dimensions == "space") {
                    graph.x = shas = Object.keys(data.data);
                    graph.y = Object.keys(data.data).map(function (key) {
                        return data.data[key][self.props.variable_name];
                    });
                    graph['type'] = 'scatter';
                    graph['mode'] = 'markers';
                } else if (data.dimensions == "spacetime") {
                    //graph.x = dates = Object.keys(data.data[this.props.current_feature])
                    //graph.y = Object.keys(data.data[this.props.current_feature]).map((key) => (
                    //data.data[this.props.current_feature][key]
                    //));
                    graph['type'] = 'scatter';
                    graph['mode'] = 'lines';
                    graph.x = [];
                    graph.y = [];
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

    Graph.prototype.extractTimeseries = function extractTimeseries() {
        var _this3 = this;

        if (this.props.current_feature) {
            var x = Object.keys(this.state.ajax_data.data[this.props.current_feature]);
            var y = x.map(function (key) {
                return _this3.state.ajax_data.data[_this3.props.current_feature][key];
            });
            data = { x: x, y: y };
        } else {
            var data = { x: [], y: [] };
        }

        return data;
    };

    Graph.prototype.componentDidUpdate = function componentDidUpdate(prevProps, prevState) {
        var _this4 = this;

        if (!this.state.error) {
            if (!prevState.data || prevProps.current_feature != this.props.current_feature) {
                var xaxis, data;

                if (this.props.dimensions == "time") {
                    xaxis = {
                        title: 'Date'
                    };
                    data = this.state.data;
                } else if (this.props.dimensions == "space") {
                    xaxis = { title: 'Location' };
                    data = this.state.data;
                } else if (this.props.dimensions == "spacetime") {
                    xaxis = { title: 'Date' };
                    data = this.extractTimeseries();
                }

                if (data.x.length) {
                    var plot = document.getElementById('graph-' + this.props.unique_id);

                    Plotly.newPlot('graph-' + this.props.unique_id, [data, {
                        type: 'scatter',
                        y: [data.y[0]],
                        x: [data.x[0]],
                        marker: {
                            size: 12,
                            fillcolor: "#f49542"
                        },
                        hoverinfo: 'none'
                    }, {
                        type: 'scatter',
                        y: [data.y[0]],
                        x: [data.x[0]],
                        marker: {
                            symbol: 'circle-open',
                            size: 12,
                            color: "#f49542",
                            line: {
                                width: 2
                            }
                        },
                        hoverinfo: 'none'
                    }], {
                        xaxis: xaxis,
                        yaxis: { title: this.props.variable_name },
                        hovermode: 'x',
                        showlegend: false
                    });

                    plot.on('plotly_hover', function (new_data) {
                        var point = new_data.points[0];

                        Plotly.deleteTraces('graph-' + _this4.props.unique_id, -1);
                        Plotly.addTraces('graph-' + _this4.props.unique_id, [{
                            type: 'scatter',
                            y: [point.y],
                            x: [point.x],
                            marker: {
                                symbol: 'circle-open',
                                size: 12,
                                color: "#f49542",
                                line: {
                                    width: 2
                                }
                            },
                            hoverinfo: 'none'
                        }]);
                    });

                    plot.on('plotly_click', function (new_data) {
                        _this4.props.changeTime(new Date(new_data.points[0].x));

                        var point = new_data.points[0];

                        Plotly.deleteTraces('graph-' + _this4.props.unique_id, -2);
                        Plotly.addTraces('graph-' + _this4.props.unique_id, [{
                            type: 'scatter',
                            y: [point.y],
                            x: [point.x],
                            marker: {
                                size: 12,
                                fillcolor: "#f49542"
                            },
                            hoverinfo: 'none'
                        }]);
                        Plotly.moveTraces('graph-' + _this4.props.unique_id, -1, 1);
                    });
                }
            }

            if (this.props.time_range && prevProps.time_range) {
                if (this.props.time_range.min.getTime() != prevProps.time_range.min.getTime() || this.props.time_range.max.getTime() != prevProps.time_range.max.getTime()) {
                    var update = {
                        'xaxis.range': [this.props.time_range.min.getTime(), this.props.time_range.max.getTime()]
                    };
                    Plotly.relayout('graph-' + this.props.unique_id, update);
                }
            }

            if (this.props.current_time && prevProps.current_time) {
                if (this.props.current_time != prevProps.current_time) {
                    var data = this.extractTimeseries();

                    var dateString = moment(this.props.current_time).format('YYYY-MM-DD'),
                        index = data.x.indexOf(dateString);

                    Plotly.deleteTraces('graph-' + this.props.unique_id, -2);
                    Plotly.addTraces('graph-' + this.props.unique_id, [{
                        type: 'scatter',
                        y: [data.y[index]],
                        x: [this.props.current_time],
                        marker: {
                            size: 12,
                            fillColor: "#f49542"
                        },
                        hoverinfo: 'none'
                    }]);
                    Plotly.moveTraces('graph-' + this.props.unique_id, -1, 1);
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

        _this.getStyle = function (active, feature) {
            var self = _this;
            var fdata = self.state.data[feature.properties.shaid];
            var color = "#000";
            var opacity = 0.1;

            if (_this.props.current_feature == feature.properties.shaid) {
                var weight = 3;
            } else {
                var weight = 1;
            }

            if (fdata) {
                var value;
                if (self.state.dimensions == 'space') {
                    value = fdata[self.props.variable_name];
                    opacity = 0.7;
                } else if (self.props.current_time) {
                    var date = self.props.current_time.toISOString().slice(0, 10);
                    value = fdata[date];
                    opacity = 0.7;
                }
                if (!value) {
                    color = "#000";
                    opacity = 0;
                } else {
                    color = self.color_scale(value);
                }
            } else {
                //console.log('no ' + feature.properties.shaid);
            }

            if (active && value) {
                opacity = 0.9;
            }

            return {
                color: "#000",
                weight: weight,
                fillColor: color,
                fillOpacity: opacity
            };
        };

        _this.featureHandler = function (feature, layer) {
            self = _this;
            layer.on({
                mouseover: function mouseover() {
                    layer.setStyle(self.getStyle(true, feature));
                },
                mouseout: function mouseout() {
                    layer.setStyle(self.getStyle(false, feature));
                },
                click: function click(e) {
                    var feature = e.target.feature;
                    layer.setStyle(self.getStyle(true, feature));
                    if (feature.properties) {
                        self.props.changeFeature(feature.properties.shaid);

                        self.layers.forEach(function (layer) {
                            layer.geojsonLayer.eachLayer(function (l) {
                                l.setStyle(self.getStyle(false, l.feature));
                            });
                        });
                    }
                }
            });
        };

        _this.state = {
            loading: true,
            error: false,
            data_status: null,
            data: [],
            space_index: [],
            time_index: []
        };
        self.map = null;
        return _this;
    }

    Map.prototype.componentDidMount = function componentDidMount() {
        var _this2 = this;

        // make AJAX call
        var self = this;
        $.ajax('/variables/data_' + this.props.variable_id + '.json', {
            dataType: 'json',
            success: function success(data, status, xhr) {
                if (data.status == "incomplete") {
                    _this2.setState({
                        loading: false,
                        data_status: "incomplete"
                    });
                } else {
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
                        var _values = [].concat.apply([], rows);
                        _this2.min_value = d3.min(_values);
                        _this2.max_value = d3.max(_values);
                    }

                    _this2.color_scale = d3.scale.linear().domain([_this2.min_value, _this2.max_value]).range(_this2.props.color_ramp.map(function (stop) {
                        return stop[1];
                    }));

                    _this2.setState(Object.assign(data, { loading: false, data_status: 'complete' }), function () {
                        return self.props.updateIndexes({ 'space': shas, 'time': dates });
                    });
                }
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

    Map.prototype.loadLayers = function loadLayers() {
        var _this3 = this;

        var self = this;
        if (!self.map) {
            return;
        }

        self.layers = [];
        self.state.layers.map(function (id, idx) {
            var geojsonURL = '/layers/' + id + '/{z}/{x}/{y}.json';
            var geojsonTileLayer = new L.TileLayer.GeoJSON(geojsonURL, {
                clipTiles: true,
                unique: function unique(feature) {
                    return feature.properties.shaid;
                }
            }, {
                style: self.getStyle.bind(_this3, false),
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
            self.layers.push(geojsonTileLayer);
            self.map.addLayer(geojsonTileLayer);
        });
    };

    Map.prototype.reloadLayers = function reloadLayers() {
        var self = this;
        self.layers.map(function (l, idx) {
            self.map.removeLayer(l);
        });
        self.loadLayers();
    };

    Map.prototype.componentDidUpdate = function componentDidUpdate(prevProps, prevState) {
        var self = this;

        if (this.state.loading) {
            return;
        }

        if (!self.map && !self.state.error && self.state.data_status != 'incomplete') {
            var map = self.map = L.map('map-' + self.props.unique_id);

            L.tileLayer('https://api.mapbox.com/v4/ags.map-g13j9y5m/' + '{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYWdzIiwiYSI6IjgtUzZQc0EifQ.POMKf3yBYLNl0vz1YjQFZQ').addTo(map);

            self.loadLayers();

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
        } else if (self.map) {
            if (self.props.current_time && this.props.current_time != prevProps.current_time) {
                self.reloadLayers();
            }
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
        } else if (this.state.data_status == 'incomplete') {
            return React.createElement(
                'div',
                null,
                this.props.variable_name,
                ' is still being processed. Periodically refresh this page to check if it has finished.'
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
        var start = new Date(this.props.time_range.min).getTime();
        var stop = new Date(this.props.time_range.max).getTime();
        this.slider = noUiSlider.create(dateSlider, {
            range: {
                min: start,
                max: stop
            },
            start: [start],
            step: /*7*/1 * 24 * 60 * 60 * 1000,
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

        dateSlider.noUiSlider.on('end', function (values, handle) {
            _this4.props.changeTime(new Date(values[0]));
        });
    };

    SliderControl.prototype.componentDidUpdate = function componentDidUpdate() {
        this.slider.set(this.props.currentTime);
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

        _this6.changeTime = function (current_time) {
            _this6.setState({ current_time: current_time });
        };

        _this6.changeFeature = function (shaid) {
            _this6.setState({ current_feature: shaid });
        };

        _this6.updateIndexes = function (indexes) {
            _this6.child_indexes.push(indexes);

            if (_this6.child_indexes.length == _this6.props.visualizations.length) {
                var state = {};
                var date = new Date("2000-01-01");
                var offset = date.getTimezoneOffset() * 60 * 1000;

                if (_this6.state.dimensions.indexOf('time') != -1) {
                    var time_index = _this6.child_indexes.map(function (both) {
                        return both['time'];
                    });
                    time_index = [].concat.apply([], time_index);

                    time_index = time_index.map(function (str) {
                        var date = new Date(str);
                        date.setTime(date.getTime() + offset);
                        return date;
                    });
                    time_index.sort(function (a, b) {
                        return a - b;
                    });

                    var min = Plotly.d3.min(time_index);
                    var max = Plotly.d3.max(time_index);

                    state = {
                        time_index: time_index,
                        time_range: { min: min, max: max },
                        current_time: min
                    };
                }
                if (_this6.state.dimensions.indexOf('space') != -1) {
                    var space_index = _this6.child_indexes.map(function (both) {
                        return both['space'];
                    });
                    space_index = [].concat.apply([], space_index);

                    //var merged_features = [].concat.apply([], this.child_indexes);
                    state = Object.assign(state, {
                        space_index: space_index,
                        current_feature: space_index[0]
                    });
                }
                _this6.setState(state);
            }
        };

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
            space_bounds: null,
            current_space_bounds: null,
            current_feature: null,
            current_time: null
        };

        _this6.child_indexes = [];
        return _this6;
    }

    VisualizationGroup.prototype.render = function render() {
        var _this7 = this;

        return React.createElement(
            'div',
            null,
            this.state.dimensions.indexOf('time') != -1 && this.state.time_range ? React.createElement(SliderControl, {
                time_range: this.state.time_range,
                changeTime: this.changeTime.bind(this),
                currentTime: this.state.current_time
            }) : null,
            this.props.visualizations.map(function (v) {
                return React.createElement(Visualization, _extends({}, v, {
                    updateIndexes: _this7.updateIndexes,
                    time_range: _this7.state.time_range,
                    changeTime: _this7.changeTime,
                    current_time: _this7.state.current_time,
                    current_feature: _this7.state.current_feature,
                    changeFeature: _this7.changeFeature
                }));
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