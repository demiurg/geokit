import React from 'react';

export default class Map extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            data: []
        };
    }

    componentDidMount() {
        // make AJAX call
        setTimeout(() => {
            this.setState({
                loading: false,
                data: [
                    {
                        type: "Feature",
                        geometry: {
                            type: "Point",
                            coordinates: [[0, 0], [30, 30], [30, 0], [0, 0]]
                        },
                        properties: {
                            t_norm_summer: 20
                        }
                    }
                ]
            });
        }, 3000);
    }

    componentDidUpdate(prevProps, prevState) {
        var map = L.map('map').setView([51.505, -0.09], 13);

        L.tileLayer('https://api.mapbox.com/v4/ags.map-g13j9y5m/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoiYWdzIiwiYSI6IjgtUzZQc0EifQ.POMKf3yBYLNl0vz1YjQFZQ').addTo(map);

        L.geoJson(this.state.data, {
            style: (layer) => {
                return {
                    color: "#000",
                    weight: 1,
                    fillColor: "#aaa",
                    fillOpacity: 0.7
                };
            },
            onEachFeature: (feature, layer) => {
                console.log(this.props.variable_id);
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

    render() {
        if (this.state.loading) {
            return <div>Loading...</div>
        } else {
            return <div id="map" style={{height: "100%"}}></div>
        }
    }
}
