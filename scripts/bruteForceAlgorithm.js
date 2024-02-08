import {updateWaypointsList, drawRoute, buildMatrix, clearCoordinates} from "./helpers.js";

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

map.on('click', async function (e) {
    if (waypoints.length >= 9) {
        alert('Maximum number of waypoints reached');
        return;
    }
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
    marker.getElement().setAttribute('data-waypoint-index', waypoints.length - 1);

    marker.on('dragend', async function() {
        const newLngLat = marker.getLngLat();
        const markerIndex = marker.getElement().getAttribute('data-waypoint-index');
        waypoints[markerIndex] = [newLngLat.lng, newLngLat.lat];
        updateWaypointsList(waypoints);
        const tour = await solveTSP(waypoints);
        drawRoute(map, tour, waypoints);
    });

    updateWaypointsList(waypoints);

    if (waypoints.length > 1) {
        const tour = await solveTSP(waypoints);
        drawRoute(map, tour, waypoints);
    }
});

function getAllTours(waypoints) {
    let indices = waypoints.map((_, index) => index);

    function swap(array, i, j) {
        [array[i], array[j]] = [array[j], array[i]];
    }

    function generatePermutations(n, arr, output) {
        if (n === 1) {
            output.push(arr.slice());
            return;
        }
        for (let i = 0; i < n; i++) {
            generatePermutations(n - 1, arr, output);
            swap(arr, n % 2 === 0 ? i : 0, n - 1);
        }
    }

    let allPermutations = [];
    let startIndex = indices[0];
    let remainingIndices = indices.slice(1);
    let permutations = [];
    generatePermutations(remainingIndices.length, remainingIndices, permutations);
    let tours = permutations.map(permutation => [startIndex, ...permutation, startIndex]);
    allPermutations.push(...tours);

    return allPermutations;
}

async function solveTSP(waypoints) {
    const startTime = performance.now();

    let distanceMatrix = await buildMatrix(waypoints);
    let tours = getAllTours(waypoints);
    let minDistance = Infinity;
    let bestTour = null;

    for (let tour of tours) {
        let tourDistance = 0;
        for (let i = 0; i < tour.length - 1; i++) {
            tourDistance += distanceMatrix[tour[i]][tour[i + 1]];
        }
        tourDistance += distanceMatrix[tour[tour.length - 1]][tour[0]];
        if (tourDistance < minDistance) {
            minDistance = tourDistance;
            bestTour = tour;
        }
    }

    console.log("Best Tour:", bestTour);
    console.log("Minimum Distance:", minDistance);
    const endTime = performance.now();
    console.log(`Brute Force Execution Time: ${endTime - startTime} milliseconds`);
    return bestTour;
}
