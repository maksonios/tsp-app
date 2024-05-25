export function visitInOrder(distances) {
    const n = distances.length;
    let path = [...Array(n).keys()];
    let distance = 0;

    for (let i = 0; i < n - 1; i++) {
        distance += distances[path[i]][path[i + 1]];
    }
    distance += distances[path[n - 1]][path[0]];
    path.push(path[0]);

    console.log("Tour in order: ", path);
    console.log("Distance: ", distance);

    return {
        distance: distance,
        path: path,
    };
}
