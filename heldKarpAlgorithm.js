import {drawRoute, buildMatrix, updateWaypointsList, clearCoordinates} from "./helpers.js";

mapboxgl.accessToken = 'pk.eyJ1IjoibWFrdXNvbmlvc3UiLCJhIjoiY2xuZzV3aWFjMHU3NDJqdGN5cXg3bm1lNyJ9.6T8prpHQy2DJ1lP8uOgJlg';

let map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [24.027, 49.842],
    zoom: 12
});

document.addEventListener('DOMContentLoaded', function() {
    const clearBtn = document.getElementById('clear-coordinates-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearCoordinates.bind(null, waypoints, map, currentMarkers));
    }
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
        updateWaypointsList(waypoints);
        const distanceMatrix = await buildMatrix(waypoints);
        const result = heldKarp(distanceMatrix);
        tour = result.path;
        drawRoute(map, tour, waypoints);
    });

    updateWaypointsList(waypoints);

    if (waypoints.length > 1) {
        drawRoute(map, tour, waypoints);
    }
});

function heldKarp(distances) {
    const startTime = performance.now();

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

    const path = findPath();
    const distance = memo[0][1];
    const endTime = performance.now();
    console.log("Best tour: ", path);
    console.log("Distance: ", distance);
    console.log(`Held-Karp Execution Time: ${endTime - startTime} milliseconds`);

    return {
        distance: distance,
        path: path,
    };
}
