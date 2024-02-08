export function updateWaypointsList(waypoints) {
    const waypointsList = document.getElementById("waypoints");
    waypointsList.innerHTML = '';
    waypoints.forEach(function(waypoint, index) {
        const li = document.createElement("li");
        li.textContent = `Point ${String.fromCharCode(65 + index)} (${waypoint[0].toFixed(3)}, ${waypoint[1].toFixed(3)})`;
        waypointsList.appendChild(li);
    });
}

export function clearCoordinates(waypoints, map, currentMarkers) {
    waypoints.length = 0;
    updateWaypointsList(waypoints);
    currentMarkers.forEach((marker) => marker.remove());
    currentMarkers.length = 0;
    map.removeLayer('route');
    map.removeSource('route');
}

export async function buildMatrix(waypoints) {
    if (waypoints.length < 2) {
        alert('Please add at least two waypoints');
        return;
    }

    const coordinates = waypoints.map(point => point.join(',')).join(';');
    const query1 = await fetch(
        `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${coordinates}?annotations=distance&access_token=${mapboxgl.accessToken}`,
        { method: 'GET' }
    );

    const json = await query1.json();
    return json.distances;
}

export function drawRoute(map, bestTour, waypoints) {
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
