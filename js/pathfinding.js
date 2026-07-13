// ========== A* Pathfinding ==========

class PriorityQueue {
    constructor() {
        this.items = [];
    }

    enqueue(item, priority) {
        this.items.push({ item, priority });
        this.items.sort((a, b) => a.priority - b.priority);
    }

    dequeue() {
        return this.items.shift().item;
    }

    isEmpty() {
        return this.items.length === 0;
    }
}

function heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function aStar(startX, startY, goalX, goalY, tileMap) {
    const start = { x: Math.floor(startX / TILE_SIZE), y: Math.floor(startY / TILE_SIZE) };
    const goal = { x: Math.floor(goalX / TILE_SIZE), y: Math.floor(goalY / TILE_SIZE) };

    // If start or goal is a wall, return null
    if (tileMap.isWall(start.x, start.y) || tileMap.isWall(goal.x, goal.y)) {
        return null;
    }

    // If start equals goal, return direct path
    if (start.x === goal.x && start.y === goal.y) {
        return [{ x: goalX, y: goalY }];
    }

    const openSet = new PriorityQueue();
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();

    const startKey = `${start.x},${start.y}`;
    gScore.set(startKey, 0);
    fScore.set(startKey, heuristic(start, goal));
    openSet.enqueue(start, fScore.get(startKey));

    const maxIterations = 500;
    let iterations = 0;

    while (!openSet.isEmpty() && iterations < maxIterations) {
        iterations++;
        const current = openSet.dequeue();
        const currentKey = `${current.x},${current.y}`;

        if (current.x === goal.x && current.y === goal.y) {
            // Reconstruct path
            const path = [];
            let node = current;
            while (node) {
                path.unshift({ x: node.x * TILE_SIZE + TILE_SIZE / 2, y: node.y * TILE_SIZE + TILE_SIZE / 2 });
                const key = `${node.x},${node.y}`;
                node = cameFrom.get(key);
            }
            return path;
        }

        const neighbors = [
            { x: current.x - 1, y: current.y },
            { x: current.x + 1, y: current.y },
            { x: current.x, y: current.y - 1 },
            { x: current.x, y: current.y + 1 }
        ];

        for (const neighbor of neighbors) {
            if (tileMap.isWall(neighbor.x, neighbor.y)) continue;

            const neighborKey = `${neighbor.x},${neighbor.y}`;
            const tentativeG = (gScore.get(currentKey) || Infinity) + 1;

            if (tentativeG < (gScore.get(neighborKey) || Infinity)) {
                cameFrom.set(neighborKey, current);
                gScore.set(neighborKey, tentativeG);
                const f = tentativeG + heuristic(neighbor, goal);
                fScore.set(neighborKey, f);
                openSet.enqueue(neighbor, f);
            }
        }
    }

    return null; // No path found
}
