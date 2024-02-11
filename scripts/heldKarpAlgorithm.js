export function heldKarp(distances) {
    const startTime = performance.now();

    const n = distances.length;
    const VISITED_ALL = (1 << n) - 1;
    let memo = Array.from({ length: n }, () => Array(VISITED_ALL).fill(null));

    function tsp(pos, mask) {
        if (mask === VISITED_ALL) {
            return { cost: distances[pos][0], path: [0] };
        }
        if (memo[pos][mask] != null) {
            return memo[pos][mask];
        }

        let ans = Infinity;
        let bestPath = [];
        for (let city = 0; city < n; city++) {
            if ((mask & (1 << city)) === 0) {
                let res = tsp(city, mask | (1 << city));
                let newAns = res.cost + distances[pos][city];

                if (newAns < ans) {
                    ans = newAns;
                    bestPath = [city, ...res.path];
                }
            }
        }

        memo[pos][mask] = { cost: ans, path: bestPath };
        return memo[pos][mask];
    }

    let result = tsp(0, 1);

    const path = [0, ...result.path];
    const distance = result.cost;
    const endTime = performance.now();

    console.log("Best tour: ", path);
    console.log("Distance: ", distance);
    console.log(`Held-Karp Execution Time: ${endTime - startTime} milliseconds`);

    return {
        distance: distance,
        path: path,
    };
}

