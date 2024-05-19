const markerColor = ['black', 'red', 'blue', 'green', 'yellow'];

export class Map {
    #accessToken;
    #markers = [];
    #map;
    #onMarkerAdd;
    #onMarkerDragEnd;
    #steps;
    #duration;

    constructor(accessToken, onMarkerAdd, onMarkerDragEnd) {
        this.#accessToken = accessToken;
        mapboxgl.accessToken = accessToken;
        this.#initMap();
        this.#onMarkerAdd = onMarkerAdd;
        this.#onMarkerDragEnd = onMarkerDragEnd;
    }

    get markers() {
        return this.#markers;
    }

    get steps() {
        return this.#steps;
    }

    get duration() {
        return this.#duration;
    }

    async drawRoute(bestTour) {
        const waypoints = bestTour.map(index => {
            const { lng, lat } = this.#markers[index].getLngLat();
            return `${lng},${lat}`;
        }).join(';');

        const query = await fetch(
            `https://api.mapbox.com/directions/v5/mapbox/driving/${waypoints}?steps=true&language=uk&geometries=geojson&access_token=${this.#accessToken}`,
            { method: 'GET' }
        );

        const json = await query.json();
        const data = json.routes[0];

        this.#steps = data.legs[0].steps;
        this.#duration = data.duration;

        const routeGeoJSON = json.routes[0].geometry;

        if (this.#map.getSource('route')) {
            this.#map.removeLayer('route');
            this.#map.removeSource('route');
        }

        this.#map.addSource('route', {
            'type': 'geojson',
            'data': {
                'type': 'Feature',
                'geometry': routeGeoJSON,
            },
            'lineMetrics': true
        });

        this.#map.addLayer({
            'id': 'route',
            'type': 'line',
            'source': 'route',
            'layout': {
                'line-join': 'round',
                'line-cap': 'round'
            },
            'paint': {
                'line-color': [
                    'interpolate',
                    ['linear'],
                    ['line-progress'],
                    0, "#FF0000",
                    0.1, "#FF7F00",
                    0.3, "#FFFF00",
                    0.5, "#00FF00",
                    0.7, "#0000FF",
                    1, "#8B00FF"
                ],
                'line-width': 6,
                'line-gradient': [
                    'interpolate',
                    ['linear'],
                    ['line-progress'],
                    0, 'rgba(255, 0, 0, 1)',
                    1, 'rgba(0, 0, 255, 1)'
                ],
                'line-dasharray': [1, 2]
            }
        });
    }

    async getDistanceMatrix() {
        const coordinates = this.#markers.map(marker => [marker.getLngLat().lng, marker.getLngLat().lat].join(',')).join(';');
        const query = await fetch(
            `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${coordinates}?annotations=distance&access_token=${this.#accessToken}`,
            { method: 'GET' }
        );
        const json = await query.json();
        const distances = json.distances;
        return this.#adjustDistancesWithParameters(distances);
    }

    removeAll() {
        this.#markers.forEach(marker => marker.remove());
        this.#markers.length = 0;
        if (this.#map.getSource('route')) {
            this.#map.removeLayer('route');
            this.#map.removeSource('route');
        }
    }

    #initMap() {
        this.#map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [24.027, 49.842],
            zoom: 12
        });
        this.#map.on('click', async function (e) {
            const randomColor = markerColor[Math.floor(Math.random() * markerColor.length)];

            const param1 = this.#promptForParameter('Enter value for Parameter 1 (1-10): ');
            const param2 = this.#promptForParameter('Enter value for Parameter 2 (1-10): ');
            const param3 = this.#promptForParameter('Enter value for Parameter 3 (1-10): ');

            const marker = new mapboxgl.Marker({color: randomColor, draggable: true})
                .setLngLat(e.lngLat)
                .addTo(this.#map);

            marker.parameters = {
                param1: parseInt(param1),
                param2: parseInt(param2),
                param3: parseInt(param3)
            }

            this.#markers.push(marker);
            this.#onMarkerAdd(marker, this.#markers.length - 1);

            marker.on('dragend', () => {
                const index = this.#markers.indexOf(marker);
                this.#onMarkerDragEnd(marker, index);

                if (this.#map.getSource('route')) {
                    this.#map.removeLayer('route');
                    this.#map.removeSource('route');
                }
            });
        }.bind(this));
    }

    #adjustDistancesWithParameters(distances) {
        const weights = { param1: 0.8, param2: 0.15, param3: 0.05 };

        this.#markers.forEach((marker, i) => {
            const param1 = marker.parameters.param1;
            const param2 = marker.parameters.param2;
            const param3 = marker.parameters.param3;

            const adjustmentFactor = 1 - (weights.param1 * param1 + weights.param2 * param2 + weights.param3 * param3) / 10;
            console.log("adjustmentFactor: ", adjustmentFactor);

            for (let j = 0; j < distances.length; j++) {
                if (i !== j) {
                    distances[j][i] *= adjustmentFactor;
                }
            }
        });

        return distances;
    }

    #promptForParameter(message) {
        let value;
        while (true) {
            value = prompt(message);
            if (value !== null && !isNaN(value) && value >= 1 && value <= 10) {
                break;
            }
            alert("Please enter a valid number between 1 and 10.");
        }
        return value;
    }
}