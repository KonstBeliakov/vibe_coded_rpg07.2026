// ========== TileMap (Infinite) ==========
const TILE_SIZE = 40;
const TILE_EMPTY = 0;
const TILE_WALL = 1;
const TILE_ORE = 2;
const CHUNK_SIZE = 16;

class TileMap {
    constructor(seed) {
        this.perlin = new PerlinNoise(seed);
        this.scale = 0.08;
        this.threshold = 0.15;
        this.chunks = new Map();
        this.safeZones = [];
        this.safeZoneChunks = new Set(); // Track which chunks have safe zones
    }

    getBiome(tileX, tileY) {
        return getBiomeAt(this.perlin, tileX, tileY);
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

        // Convert some wall tiles to ore (walls that border empty tiles)
        for (let y = 0; y < CHUNK_SIZE; y++) {
            for (let x = 0; x < CHUNK_SIZE; x++) {
                if (tiles[y][x] !== TILE_WALL) continue;
                // Check if this wall borders an empty tile
                const wx = cx * CHUNK_SIZE + x;
                const wy = cy * CHUNK_SIZE + y;
                let bordersEmpty = false;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        const nx = wx + dx;
                        const ny = wy + dy;
                        // Check neighboring chunks if needed
                        const ncx = Math.floor(nx / CHUNK_SIZE);
                        const ncy = Math.floor(ny / CHUNK_SIZE);
                        if (ncx !== cx || ncy !== cy) continue; // Skip cross-chunk for simplicity
                        const lx = ((nx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
                        const ly = ((ny % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
                        if (ly >= 0 && ly < CHUNK_SIZE && lx >= 0 && lx < CHUNK_SIZE) {
                            if (tiles[ly][lx] === TILE_EMPTY) {
                                bordersEmpty = true;
                                break;
                            }
                        }
                    }
                    if (bordersEmpty) break;
                }
                if (bordersEmpty && Math.random() < 0.15) {
                    tiles[y][x] = TILE_ORE;
                }
            }
        }

        this.chunks.set(key, tiles);

        // Generate safe zones procedurally - every few chunks
        this.tryGenerateSafeZone(cx, cy, tiles);

        // Generate chests deterministically using seeded random
        this.generateChests(cx, cy, tiles);
    }

    generateChests(cx, cy, tiles) {
        // Generate chests deterministically using seeded random
        // About 1 chest per 4 chunks on average
        const seed = this.perlin.seed;
        const r = seededRandom(seed, cx, cy, 999);
        if (r > 0.25) return; // 25% chance per chunk

        // Find a good empty spot in this chunk
        const centerTileX = cx * CHUNK_SIZE + Math.floor(CHUNK_SIZE / 2);
        const centerTileY = cy * CHUNK_SIZE + Math.floor(CHUNK_SIZE / 2);

        // Try to find an empty tile for the chest
        for (let attempt = 0; attempt < 10; attempt++) {
            const r2 = seededRandom(seed, cx, cy, attempt + 1000);
            const tx = centerTileX + Math.floor((r2 - 0.5) * CHUNK_SIZE);
            const ty = centerTileY + Math.floor((seededRandom(seed, cx, cy, attempt + 2000) - 0.5) * CHUNK_SIZE);
            
            const lx = ((tx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
            const ly = ((ty % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
            
            if (lx >= 0 && lx < CHUNK_SIZE && ly >= 0 && ly < CHUNK_SIZE) {
                if (tiles[ly][lx] === TILE_EMPTY) {
                    // Check area is big enough for chest interaction
                    const worldX = tx * TILE_SIZE + TILE_SIZE / 2;
                    const worldY = ty * TILE_SIZE + TILE_SIZE / 2;
                    
                    // Don't spawn chests too close to safe zones
                    let tooCloseToSafeZone = false;
                    for (const zone of this.safeZones) {
                        const dx = zone.x - worldX;
                        const dy = zone.y - worldY;
                        if (Math.sqrt(dx * dx + dy * dy) < TILE_SIZE * 5) {
                            tooCloseToSafeZone = true;
                            break;
                        }
                    }
                    if (tooCloseToSafeZone) return;
                    
                    // Don't spawn chests too close to each other
                    // (We can't check existing chests here since they're in game.chests)
                    // Instead, just spawn it - the game will handle duplicates
                    
                    // Store chest data for later instantiation
                    if (!this._pendingChests) this._pendingChests = [];
                    this._pendingChests.push({ x: worldX, y: worldY, isStorage: false });
                    return;
                }
            }
        }
    }

    tryGenerateSafeZone(cx, cy, tiles) {
        // Skip center chunk (already has safe zone at 0,0)
        if (cx === 0 && cy === 0) return;

        // Check that we don't have too many safe zones already
        if (this.safeZones.length >= 30) return;

        // Deterministic safe zone generation using seededRandom
        const seed = this.perlin.seed;
        const r = seededRandom(seed, cx, cy, 500);
        
        // Safe zones are more frequent near spawn (0,0)
        // Distance from center in chunks
        const distFromCenter = Math.sqrt(cx * cx + cy * cy);
        // Probability: 40% near spawn, decreasing to 15% far away
        const probability = Math.max(0.15, 0.40 - distFromCenter * 0.005);
        
        if (r > probability) return;

        // Find a good spot for the safe zone center in this chunk
        const centerTileX = cx * CHUNK_SIZE + Math.floor(CHUNK_SIZE / 2);
        const centerTileY = cy * CHUNK_SIZE + Math.floor(CHUNK_SIZE / 2);

        // Need a large empty area for the safe zone
        const zoneRadius = TILE_SIZE * 4; // Slightly smaller than spawn zone
        const checkRadius = Math.ceil(zoneRadius / TILE_SIZE) + 2;

        if (!this.isAreaEmpty(centerTileX, centerTileY, zoneRadius)) return;

        // Make sure this safe zone isn't too close to another one
        const zoneWorldX = centerTileX * TILE_SIZE + TILE_SIZE / 2;
        const zoneWorldY = centerTileY * TILE_SIZE + TILE_SIZE / 2;
        for (const existing of this.safeZones) {
            const dx = existing.x - zoneWorldX;
            const dy = existing.y - zoneWorldY;
            if (Math.sqrt(dx * dx + dy * dy) < TILE_SIZE * 15) return;
        }

        // Clear a larger area for the safe zone
        for (let dy = -checkRadius; dy <= checkRadius; dy++) {
            for (let dx = -checkRadius; dx <= checkRadius; dx++) {
                const tx = centerTileX + dx;
                const ty = centerTileY + dy;
                const lx = ((tx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
                const ly = ((ty % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
                // Only clear tiles in this chunk
                if (Math.floor(tx / CHUNK_SIZE) === cx && Math.floor(ty / CHUNK_SIZE) === cy) {
                    if (ly >= 0 && ly < CHUNK_SIZE && lx >= 0 && lx < CHUNK_SIZE) {
                        tiles[ly][lx] = TILE_EMPTY;
                    }
                }
            }
        }

        // Create the safe zone with deterministic furniture positions
        const safeZone = new SafeZone(zoneWorldX, zoneWorldY, zoneRadius);
        
        // Deterministic furniture positions relative to safe zone center
        const bedR = seededRandom(seed, cx, cy, 501);
        const bedAngle = bedR * Math.PI * 2;
        const bedDist = TILE_SIZE * 1.5;
        safeZone.bedX = zoneWorldX + Math.cos(bedAngle) * bedDist;
        safeZone.bedY = zoneWorldY + Math.sin(bedAngle) * bedDist;
        
        const chestR = seededRandom(seed, cx, cy, 502);
        const chestAngle = chestR * Math.PI * 2;
        const chestDist = TILE_SIZE * 2.5;
        safeZone.chestX = zoneWorldX + Math.cos(chestAngle) * chestDist;
        safeZone.chestY = zoneWorldY + Math.sin(chestAngle) * chestDist;
        
        this.safeZones.push(safeZone);
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
        const tile = this.getTile(tileX, tileY);
        return tile === TILE_WALL || tile === TILE_ORE;
    }

    isOre(tileX, tileY) {
        return this.getTile(tileX, tileY) === TILE_ORE;
    }

    mineOre(tileX, tileY) {
        // Mine ore tile, turning it into a regular wall
        const cx = Math.floor(tileX / CHUNK_SIZE);
        const cy = Math.floor(tileY / CHUNK_SIZE);
        const key = this.getChunkKey(cx, cy);
        if (!this.chunks.has(key)) return false;
        const chunk = this.chunks.get(key);
        const lx = ((tileX % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        const ly = ((tileY % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
        if (chunk[ly][lx] === TILE_ORE) {
            chunk[ly][lx] = TILE_WALL;
            return true;
        }
        return false;
    }

    isAreaEmpty(tileX, tileY, halfSize) {
        // Check if a square area of halfSize radius around tileX,tileY is free of walls
        const tilesToCheck = Math.ceil(halfSize / TILE_SIZE) + 1;
        for (let dy = -tilesToCheck; dy <= tilesToCheck; dy++) {
            for (let dx = -tilesToCheck; dx <= tilesToCheck; dx++) {
                if (this.isWall(tileX + dx, tileY + dy)) {
                    return false;
                }
            }
        }
        return true;
    }

    findEmptyTile(centerTileX, centerTileY, radius, entityHalfSize) {
        entityHalfSize = entityHalfSize || 12; // Default player half-size
        for (let attempt = 0; attempt < 50; attempt++) {
            const tx = centerTileX + Math.floor((Math.random() - 0.5) * radius * 2);
            const ty = centerTileY + Math.floor((Math.random() - 0.5) * radius * 2);
            if (!this.isWall(tx, ty) && this.isAreaEmpty(tx, ty, entityHalfSize)) {
                return { x: tx * TILE_SIZE + TILE_SIZE / 2, y: ty * TILE_SIZE + TILE_SIZE / 2 };
            }
        }
        // Fallback: search more aggressively
        for (let r = 0; r <= radius; r++) {
            for (let dx = -r; dx <= r; dx++) {
                for (let dy = -r; dy <= r; dy++) {
                    const tx = centerTileX + dx;
                    const ty = centerTileY + dy;
                    if (!this.isWall(tx, ty) && this.isAreaEmpty(tx, ty, entityHalfSize)) {
                        return { x: tx * TILE_SIZE + TILE_SIZE / 2, y: ty * TILE_SIZE + TILE_SIZE / 2 };
                    }
                }
            }
        }
        // Ultimate fallback: return center of (0,0) tile
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

                const tile = this.getTile(x, y);
                const biome = this.getBiome(x, y);
                if (tile === TILE_ORE) {
                    ctx.fillStyle = '#8d6e00'; // Gold/ore color
                } else if (tile === TILE_WALL) {
                    ctx.fillStyle = getBiomeWallColor(biome);
                } else {
                    // Choose floor color based on biome
                    ctx.fillStyle = getBiomeFloorColor(biome);
                }

                ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

                ctx.strokeStyle = '#333';
                ctx.lineWidth = 1;
                ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
            }
        }
    }
}
