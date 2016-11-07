import React from 'react';

export default class Map extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            error: false,
            data: []
        };
    }

    componentDidMount() {
        // make AJAX call
        $.ajax('/api/variables/'+this.props.variable_id+'map/', {
            dataType: 'json',
            success: (data, status, xhr) => {
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

    componentDidUpdate(prevProps, prevState) {
        if (!this.state.error) {
            var map = L.map('map').setView([37.178, -120.514105], 4);

            L.tileLayer('https://api.mapbox.com/v4/ags.map-g13j9y5m/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYWdzIiwiYSI6IjgtUzZQc0EifQ.POMKf3yBYLNl0vz1YjQFZQ').addTo(map);

            L.geoJson(this.state.data, {
                style: (feature) => {
                    return {
                        color: "#000",
                        weight: 1,
                        fillColor: this.getColor(feature.properties[this.props.variable_id]),
                        fillOpacity: 0.7
                    };
                },
                onEachFeature: (feature, layer) => {
                    layer.bindPopup(String(feature.properties[this.props.variable_id]));
                }
            }).addTo(map);

            var legend = L.control({position: 'bottomright'});

            legend.onAdd = function(map) {
                var div = L.DomUtil.create('div', 'info legend');
                div.innerHTML = "<h6>Something will go here in a sec...</h6>";
                return div;
            };

            legend.addTo(map);
        }
    }

    getColor(value) {
        // Hard-coded, either split up after finding min/max or have it passed in as props
        if (value >= 0 && value <= 10) {
            return "#FF8000";
        }
        if (value >= 10 && value <= 20) {
            return "#80FF00";
        }
        if (value >= 20 && value <= 30) {
            return "#1088AA";
        }
        if (value >= 30 && value <= 100) {
            return "#FFAABB";
        }
    }

    render() {
        if (this.state.loading) {
            return <div>Loading...</div>
        } else if (this.state.error) {
            return <div>An error occured: <em>{this.state.error}</em></div>
        } else {
            return <div id="map" style={{height: "100%"}}></div>
        }
    }
}
