mapboxgl.accessToken = 'pk.eyJ1IjoibWFrdXNvbmlvc3UiLCJhIjoiY2xuZzV3aWFjMHU3NDJqdGN5cXg3bm1lNyJ9.6T8prpHQy2DJ1lP8uOgJlg';

let map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [-73.989, 40.733],
    zoom: 12
});

const currentMarkers = [];
const waypoints = [];
const markerColor = ['black', 'red', 'blue', 'green', 'yellow'];
let tour;

map.on('click', async function (e) {
    const randomColor = markerColor[Math.floor(Math.random() * markerColor.length)];
    const coords = [(e.lngLat.lng), e.lngLat.lat];
    waypoints.push(coords);

    const marker = new mapboxgl.Marker({
        color: randomColor,
        draggable: true
    })
        .setLngLat(e.lngLat)
        .addTo(map);

    currentMarkers.push(marker);

    if (waypoints.length > 1) {
        const distanceMatrix = await buildMatrix(waypoints);
        const result = heldKarp(distanceMatrix);
        tour = result.path;
    }

    marker.getElement().setAttribute('data-waypoint-index', waypoints.length - 1);

    marker.on('dragend', async function() {
        const newLngLat = marker.getLngLat();
        const markerIndex = marker.getElement().getAttribute('data-waypoint-index');
        waypoints[markerIndex] = [newLngLat.lng, newLngLat.lat];
        updateWaypointsList();
        const distanceMatrix = await buildMatrix(waypoints);
        const result = heldKarp(distanceMatrix);
        tour = result.path;
        drawRoute(tour);
    });

    updateWaypointsList();

    if (waypoints.length > 1) {
        drawRoute(tour);
    }
});

function updateWaypointsList() {
    const waypointsList = document.getElementById("waypoints");
    waypointsList.innerHTML = '';
    waypoints.forEach(function(waypoint, index) {
        const li = document.createElement("li");
        li.textContent = `Point ${String.fromCharCode(65 + index)} (${waypoint[0].toFixed(3)}, ${waypoint[1].toFixed(3)})`;
        waypointsList.appendChild(li);
    });
}

function clearCoordinates() {
    waypoints.length = 0;
    updateWaypointsList();
    currentMarkers.forEach((marker) => marker.remove());
    currentMarkers.length = 0;
}

async function buildMatrix(waypoints) {
    const coordinates = waypoints.map(point => point.join(',')).join(';');
    const query1 = await fetch(
        `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${coordinates}?annotations=distance&access_token=${mapboxgl.accessToken}`,
        { method: 'GET' }
    );

    const json = await query1.json();
    return json.distances;
}

function heldKarp(distances) {
    const n = distances.length;
    const VISITED_ALL = (1 << n) - 1;
    let memo = Array.from({ length: n }, () => Array(VISITED_ALL).fill(null));
    let next = Array.from({ length: n }, () => Array(VISITED_ALL).fill(null));

    function tsp(pos, mask) {
        if (mask === VISITED_ALL) {
            return [distances[pos][0], 0];
        }
        if (memo[pos][mask] != null) {
            return [memo[pos][mask], next[pos][mask]];
        }

        let ans = Infinity;
        let nextCity = -1;
        for (let city = 0; city < n; city++) {
            if ((mask & (1 << city)) === 0) {
                let [newAns, _] = tsp(city, mask | (1 << city));
                newAns += distances[pos][city];

                if (newAns < ans) {
                    ans = newAns;
                    nextCity = city;
                }
            }
        }
        memo[pos][mask] = ans;
        next[pos][mask] = nextCity;
        return [ans, nextCity];
    }

    function findPath() {
        let mask = 1;
        let pos = 0;
        let path = [0];

        while (true) {
            let nextPos = next[pos][mask];
            if (nextPos === -1 || nextPos === undefined) break;

            path.push(nextPos);
            mask |= (1 << nextPos);
            pos = nextPos;

            if (mask === VISITED_ALL) break;
        }

        path.push(0);
        return path;
    }

    tsp(0, 1);

    return {
        distance: memo[0][1],
        path: findPath(),
    };
}

function drawRoute(bestTour) {
    const coordinates = bestTour.map(index => waypoints[index]);
    const routeGeoJSON = {
        'type': 'Feature',
        'properties': {},
        'geometry': {
            'type': 'LineString',
            'coordinates': coordinates
        }
    };

    if (map.getSource('route')) {
        map.removeLayer('route');
        map.removeSource('route');
    }

    map.addSource('route', {
        'type': 'geojson',
        'data': routeGeoJSON
    });

    map.addLayer({
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
}
