export function solveTSP(waypoints, distanceMatrix) {
    const startTime = performance.now();
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
    return {
        distance: minDistance,
        path: bestTour,
    };
}

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
