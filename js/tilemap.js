// ========== TileMap (Infinite) ==========
const TILE_SIZE = 40;
const TILE_EMPTY = 0;
const TILE_WALL = 1;
const CHUNK_SIZE = 16;

class TileMap {
    constructor(seed) {
        this.perlin = new PerlinNoise(seed);
        this.scale = 0.08;
        this.threshold = 0.15;
        this.chunks = new Map();
    }

    getChunkKey(cx, cy) {
        return `${cx},${cy}`;
    }

    generateChunk(cx, cy) {
        const key = this.getChunkKey(cx, cy);
        if (this.chunks.has(key)) return;

        const tiles = [];
        for (let y = 0; y < CHUNK_SIZE; y++) {
            tiles[y] = [];
            for (let x = 0; x < CHUNK_SIZE; x++) {
                const wx = cx * CHUNK_SIZE + x;
                const wy = cy * CHUNK_SIZE + y;
                const noiseVal = this.perlin.octaveNoise(wx * this.scale, wy * this.scale, 3, 0.5);
                tiles[y][x] = noiseVal > this.threshold ? TILE_WALL : TILE_EMPTY;
            }
        }

        if (cx === 0 && cy === 0) {
            const center = Math.floor(CHUNK_SIZE / 2);
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    const ty = center + dy;
                    const tx = center + dx;
                    if (ty >= 0 && ty < CHUNK_SIZE && tx >= 0 && tx < CHUNK_SIZE) {
                        tiles[ty][tx] = TILE_EMPTY;
                    }
                }
            }
        }

        this.chunks.set(key, tiles);
    }

    getTile(tileX, tileY) {
        const cx = Math.floor(tileX / CHUNK_SIZE);
        const cy = Math.floor(tileY / CHUNK_SIZE);
        const key = this.getChunkKey(cx, cy);

        if (!this.chunks.has(key)) {
            this.generateChunk(cx, cy);
        }

        const chunk = this.chunks.get(key);
        const lx = ((tileX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const ly = ((tileY % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        return chunk[ly][lx];
    }

    isWall(tileX, tileY) {
        return this.getTile(tileX, tileY) === TILE_WALL;
    }

    findEmptyTile(centerTileX, centerTileY, radius) {
        for (let attempt = 0; attempt < 50; attempt++) {
            const tx = centerTileX + Math.floor((Math.random() - 0.5) * radius * 2);
            const ty = centerTileY + Math.floor((Math.random() - 0.5) * radius * 2);
            if (!this.isWall(tx, ty)) {
                return { x: tx * TILE_SIZE + TILE_SIZE / 2, y: ty * TILE_SIZE + TILE_SIZE / 2 };
            }
        }
        // Fallback: return center of (0,0) tile
        return { x: TILE_SIZE / 2, y: TILE_SIZE / 2 };
    }

    draw(ctx, offsetX, offsetY) {
        const startX = Math.floor(-offsetX / TILE_SIZE) - 1;
        const startY = Math.floor(-offsetY / TILE_SIZE) - 1;
        const endX = startX + Math.ceil(ctx.canvas.width / TILE_SIZE) + 2;
        const endY = startY + Math.ceil(ctx.canvas.height / TILE_SIZE) + 2;

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const screenX = x * TILE_SIZE + offsetX;
                const screenY = y * TILE_SIZE + offsetY;

                if (this.isWall(x, y)) {
                    ctx.fillStyle = '#555';
                } else {
                    ctx.fillStyle = '#2a2a2a';
                }

                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

                ctx.strokeStyle = '#333';
                ctx.lineWidth = 1;
                ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            }
        }
    }
}
