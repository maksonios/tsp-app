const markerColor = ['black', 'red', 'blue', 'green', 'yellow'];

export class Map {
    #accessToken;
    #markers = [];
    #map;
    #onMarkerAdd;
    #onMarkerDragEnd;

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

    // Straight lines between markers
    // drawRoute(bestTour) {
    //     const coordinates = bestTour.map(index => [this.#markers[index].getLngLat().lng, this.#markers[index].getLngLat().lat]);
    //     const routeGeoJSON = {
    //         'type': 'Feature',
    //         'properties': {},
    //         'geometry': {
    //             'type': 'LineString',
    //             'coordinates': coordinates
    //         }
    //     };
    //
    //     if (this.#map.getSource('route')) {
    //         this.#map.removeLayer('route');
    //         this.#map.removeSource('route');
    //     }
    //
    //     this.#map.addSource('route', {
    //         'type': 'geojson',
    //         'data': routeGeoJSON
    //     });
    //
    //     this.#map.addLayer({
    //         'id': 'route',
    //         'type': 'line',
    //         'source': 'route',
    //         'layout': {
    //             'line-join': 'round',
    //             'line-cap': 'round'
    //         },
    //         'paint': {
    //             'line-color': '#888',
    //             'line-width': 6
    //         }
    //     });
    // }

    drawRoute(bestTour) {
        const waypoints = bestTour.map(index => {
            const { lng, lat } = this.#markers[index].getLngLat();
            return `${lng},${lat}`;
        }).join(';');

        const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${waypoints}?geometries=geojson&access_token=${this.#accessToken}`;

        fetch(directionsUrl)
            .then(response => response.json())
            .then(data => {
                const routeGeoJSON = data.routes[0].geometry;

                if (this.#map.getSource('route')) {
                    this.#map.removeLayer('route');
                    this.#map.removeSource('route');
                }

                this.#map.addSource('route', {
                    'type': 'geojson',
                    'data': {
                        'type': 'Feature',
                        'geometry': routeGeoJSON
                    }
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
                        'line-color': '#888',
                        'line-width': 6
                    }
                });
            })
            .catch(error => console.error('Error fetching Directions API data:', error));
    }


    async getDistanceMatrix() {
        const coordinates = this.#markers.map(marker => [marker.getLngLat().lng, marker.getLngLat().lat].join(',')).join(';');
        const query = await fetch(
            `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${coordinates}?annotations=distance&access_token=${this.#accessToken}`,
            { method: 'GET' }
        );
        const json = await query.json();
        return json.distances;
    }

    removeAll() {
        this.#markers.forEach(marker => marker.remove());
        this.#markers.length = 0;
        if (this.#map.getSource('route')) {
            this.#map.removeLayer('route');
            this.#map.removeSource('route');
        }
    }

    remove(index) {
        if (this.#map.getSource('route')) {
            this.#map.removeLayer('route');
            this.#map.removeSource('route');
        }

        if (this.#markers[index]) {
            this.#markers[index].remove();
        }
        this.#markers.splice(index, 1);
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

            const marker = new mapboxgl.Marker({color: randomColor, draggable: true})
                .setLngLat(e.lngLat)
                .addTo(this.#map);

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
}