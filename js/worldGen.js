// ========== WorldGen ==========
// Единый модуль для всей логики генерации объектов на карте
// Все объекты генерируются детерминированно через seededRandom

// ========== Tree ==========
class Tree {
    static CHANCE = 0.005; // 0.5% chance per tile

    static hasAt(tx, ty, seed) {
        return seededRandom(seed, tx, ty, 2) < Tree.CHANCE;
    }

    static drawAt(ctx, offsetX, offsetY, tx, ty, isDead) {
        const screenX = tx * TILE_SIZE + TILE_SIZE / 2 + offsetX;
        const screenY = ty * TILE_SIZE + TILE_SIZE / 2 + offsetY;

        if (isDead) {
            // Dead tree (dry) - brown trunk, no leaves
            ctx.fillStyle = '#6d4c41';
            ctx.fillRect(screenX - 3, screenY - 10, 6, 20);

            // Branches
            ctx.strokeStyle = '#5d4037';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(screenX - 3, screenY - 5);
            ctx.lineTo(screenX - 10, screenY - 10 + 5);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(screenX + 3, screenY - 5);
            ctx.lineTo(screenX + 10, screenY - 10 + 5);
            ctx.stroke();
        } else {
            // Living tree - brown trunk with green crown
            ctx.fillStyle = '#5d4037';
            ctx.fillRect(screenX - 3, screenY - 5, 6, 10);

            // Crown (leaves)
            ctx.fillStyle = '#388e3c';
            ctx.beginPath();
            ctx.arc(screenX, screenY - 14, 10, 0, Math.PI * 2);
            ctx.fill();

            // Lighter leaves highlight
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(screenX - 3, screenY - 16, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// ========== Rock ==========
class Rock {
    static CHANCE = 0.005; // 0.5% chance per tile

    static hasAt(tx, ty, seed) {
        return seededRandom(seed, tx, ty, 1) < Rock.CHANCE;
    }

    static drawAt(ctx, offsetX, offsetY, tx, ty) {
        const screenX = tx * TILE_SIZE + TILE_SIZE / 2 + offsetX;
        const screenY = ty * TILE_SIZE + TILE_SIZE / 2 + offsetY;

        // Draw rock as a gray irregular shape
        ctx.fillStyle = '#757575';
        ctx.beginPath();
        ctx.arc(screenX, screenY, 7, 0, Math.PI * 2);
        ctx.fill();

        // Draw a lighter highlight
        ctx.fillStyle = '#9e9e9e';
        ctx.beginPath();
        ctx.arc(screenX - 2, screenY - 2, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(screenX, screenY, 7, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// ========== Flower ==========
class Flower {
    static CHANCE = 0.4; // 40% chance per tile in mossy biome
    static THORN_RATIO = 0.3; // 30% of flowers are thorn flowers

    static hasAt(tx, ty, seed) {
        return seededRandom(seed, tx, ty, 3) < Flower.CHANCE;
    }

    static isThornAt(tx, ty, seed) {
        return seededRandom(seed, tx, ty, 4) < Flower.THORN_RATIO;
    }

    static drawAt(ctx, offsetX, offsetY, tx, ty, isThorn) {
        const screenX = tx * TILE_SIZE + TILE_SIZE / 2 + offsetX;
        const screenY = ty * TILE_SIZE + TILE_SIZE / 2 + offsetY;

        if (isThorn) {
            // Draw thorn flower as a red circle with spikes
            ctx.fillStyle = '#e53935';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 7, 0, Math.PI * 2);
            ctx.fill();

            // Draw spikes around the flower
            ctx.strokeStyle = '#b71c1c';
            ctx.lineWidth = 2;
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const innerR = 5;
                const outerR = 11;
                ctx.beginPath();
                ctx.moveTo(
                    screenX + Math.cos(angle) * innerR,
                    screenY + Math.sin(angle) * innerR
                );
                ctx.lineTo(
                    screenX + Math.cos(angle) * outerR,
                    screenY + Math.sin(angle) * outerR
                );
                ctx.stroke();
            }

            // Draw a small dark center
            ctx.fillStyle = '#b71c1c';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 2.8, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Draw flower as a small blue circle
            ctx.fillStyle = '#42a5f5';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 6, 0, Math.PI * 2);
            ctx.fill();

            // Draw a small center
            ctx.fillStyle = '#90caf9';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// ========== Web (spider web) ==========
class Web {
    static CHANCE = 0.4; // 40% chance near walls in web biome

    static hasAt(tx, ty, seed) {
        return seededRandom(seed, tx, ty, 5) < Web.CHANCE;
    }

    static drawAt(ctx, offsetX, offsetY, tx, ty) {
        const screenX = tx * TILE_SIZE + offsetX;
        const screenY = ty * TILE_SIZE + offsetY;

        // Draw web as a semi-transparent white spider web pattern
        ctx.save();
        ctx.strokeStyle = 'rgba(200, 200, 220, 0.3)';
        ctx.lineWidth = 1;

        // Draw radial lines
        const cx = screenX + TILE_SIZE / 2;
        const cy = screenY + TILE_SIZE / 2;
        const radius = TILE_SIZE / 2 - 2;

        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
            ctx.stroke();
        }

        // Draw concentric circles
        for (let r = radius / 3; r <= radius; r += radius / 3) {
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }
}

// ========== Lava Pool ==========
class LavaPool {
    static CHANCE = 0.2; // 20% chance per tile in lava biome

    static hasAt(tx, ty, seed) {
        return seededRandom(seed, tx, ty, 6) < LavaPool.CHANCE;
    }

    static drawAt(ctx, offsetX, offsetY, tx, ty, animTimer) {
        const screenX = tx * TILE_SIZE + offsetX;
        const screenY = ty * TILE_SIZE + offsetY;

        const pulse = Math.sin(animTimer) * 0.15 + 0.85;

        // Main lava body
        ctx.fillStyle = `rgba(255, 80, 0, ${0.7 * pulse})`;
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        // Inner glow
        ctx.fillStyle = `rgba(255, 150, 0, ${0.4 * pulse})`;
        ctx.fillRect(screenX + 3, screenY + 3, TILE_SIZE - 6, TILE_SIZE - 6);

        // Center bright spot
        ctx.fillStyle = `rgba(255, 200, 50, ${0.3 * pulse})`;
        ctx.fillRect(screenX + 6, screenY + 6, TILE_SIZE - 12, TILE_SIZE - 12);

        // Border
        ctx.strokeStyle = `rgba(255, 60, 0, ${0.5 * pulse})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    }
}

// ========== Ice ==========
class Ice {
    static CHANCE = 0.3; // 30% chance per tile in ice biome

    static hasAt(tx, ty, seed) {
        return seededRandom(seed, tx, ty, 7) < Ice.CHANCE;
    }

    static drawAt(ctx, offsetX, offsetY, tx, ty) {
        const screenX = tx * TILE_SIZE + offsetX;
        const screenY = ty * TILE_SIZE + offsetY;

        // Draw ice as a semi-transparent blue-white overlay
        ctx.fillStyle = 'rgba(180, 230, 255, 0.4)';
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        // Shine effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE / 3, TILE_SIZE / 3);

        // Border
        ctx.strokeStyle = 'rgba(200, 240, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    }
}

// ========== WorldGen ==========
// Главный класс, объединяющий всю логику генерации объектов на карте
class WorldGen {
    constructor(tileMap, seed) {
        this.tileMap = tileMap;
        this.seed = seed;
        this._pendingChests = [];
    }

    // ========== Генерация объектов при создании чанка ==========
    generateObjects(cx, cy, tiles) {
        this.generateChests(cx, cy, tiles);
        this.generateSafeZone(cx, cy, tiles);
    }

    // ========== Chests ==========
    generateChests(cx, cy, tiles) {
        const r = seededRandom(this.seed, cx, cy, 999);
        if (r > 0.25) return; // 25% chance per chunk

        const centerTileX = cx * CHUNK_SIZE + Math.floor(CHUNK_SIZE / 2);
        const centerTileY = cy * CHUNK_SIZE + Math.floor(CHUNK_SIZE / 2);

        for (let attempt = 0; attempt < 10; attempt++) {
            const r2 = seededRandom(this.seed, cx, cy, attempt + 1000);
            const tx = centerTileX + Math.floor((r2 - 0.5) * CHUNK_SIZE);
            const ty = centerTileY + Math.floor((seededRandom(this.seed, cx, cy, attempt + 2000) - 0.5) * CHUNK_SIZE);
            
            const lx = ((tx % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
            const ly = ((ty % CHUNK_SIZE) + CHUNK_SIZE) % CHUNK_SIZE;
            
            if (lx >= 0 && lx < CHUNK_SIZE && ly >= 0 && ly < CHUNK_SIZE) {
                if (tiles[ly][lx] === TILE_EMPTY) {
                    const worldX = tx * TILE_SIZE + TILE_SIZE / 2;
                    const worldY = ty * TILE_SIZE + TILE_SIZE / 2;
                    
                    // Don't spawn chests too close to safe zones
                    let tooCloseToSafeZone = false;
                    for (const zone of this.tileMap.safeZones) {
                        const dx = zone.x - worldX;
                        const dy = zone.y - worldY;
                        if (Math.sqrt(dx * dx + dy * dy) < TILE_SIZE * 5) {
                            tooCloseToSafeZone = true;
                            break;
                        }
                    }
                    if (tooCloseToSafeZone) return;
                    
                    if (!this._pendingChests) this._pendingChests = [];
                    this._pendingChests.push({ x: worldX, y: worldY, isStorage: false });
                    return;
                }
            }
        }
    }

    // ========== Safe Zones ==========
    generateSafeZone(cx, cy, tiles) {
        if (cx === 0 && cy === 0) return;
        if (this.tileMap.safeZones.length >= 30) return;

        const r = seededRandom(this.seed, cx, cy, 500);
        
        const distFromCenter = Math.sqrt(cx * cx + cy * cy);
        const probability = Math.max(0.15, 0.40 - distFromCenter * 0.005);
        
        if (r > probability) return;

        const centerTileX = cx * CHUNK_SIZE + Math.floor(CHUNK_SIZE / 2);
        const centerTileY = cy * CHUNK_SIZE + Math.floor(CHUNK_SIZE / 2);

        const zoneRadius = TILE_SIZE * 4;
        const checkRadius = Math.ceil(zoneRadius / TILE_SIZE) + 2;

        if (!this.tileMap.isAreaEmpty(centerTileX, centerTileY, zoneRadius)) return;

        const zoneWorldX = centerTileX * TILE_SIZE + TILE_SIZE / 2;
        const zoneWorldY = centerTileY * TILE_SIZE + TILE_SIZE / 2;
        for (const existing of this.tileMap.safeZones) {
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
                if (Math.floor(tx / CHUNK_SIZE) === cx && Math.floor(ty / CHUNK_SIZE) === cy) {
                    if (ly >= 0 && ly < CHUNK_SIZE && lx >= 0 && lx < CHUNK_SIZE) {
                        tiles[ly][lx] = TILE_EMPTY;
                    }
                }
            }
        }

        const safeZone = new SafeZone(zoneWorldX, zoneWorldY, zoneRadius);
        
        // Deterministic furniture positions
        const bedR = seededRandom(this.seed, cx, cy, 501);
        const bedAngle = bedR * Math.PI * 2;
        const bedDist = TILE_SIZE * 1.5;
        safeZone.bedX = zoneWorldX + Math.cos(bedAngle) * bedDist;
        safeZone.bedY = zoneWorldY + Math.sin(bedAngle) * bedDist;
        
        const chestR = seededRandom(this.seed, cx, cy, 502);
        const chestAngle = chestR * Math.PI * 2;
        const chestDist = TILE_SIZE * 2.5;
        safeZone.chestX = zoneWorldX + Math.cos(chestAngle) * chestDist;
        safeZone.chestY = zoneWorldY + Math.sin(chestAngle) * chestDist;
        
        this.tileMap.safeZones.push(safeZone);
    }

    // ========== Отрисовка всех объектов на видимой области ==========
    drawObjects(ctx, offsetX, offsetY, tileMap, collectedTiles, lavaAnimTimer) {
        const startX = Math.floor(-offsetX / TILE_SIZE) - 1;
        const startY = Math.floor(-offsetY / TILE_SIZE) - 1;
        const endX = startX + Math.ceil(ctx.canvas.width / TILE_SIZE) + 2;
        const endY = startY + Math.ceil(ctx.canvas.height / TILE_SIZE) + 2;

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const key = `${x},${y}`;
                const isCollected = collectedTiles.has(key);
                const biome = tileMap.getBiome(x, y);
                const isWall = tileMap.isWall(x, y);

                if (isWall) continue;

                // Trees in normal and mossy biomes
                if ((biome === BIOME_NORMAL || biome === BIOME_MOSSY) && Tree.hasAt(x, y, this.seed)) {
                    if (!isCollected) {
                        const isDead = biome === BIOME_NORMAL;
                        Tree.drawAt(ctx, offsetX, offsetY, x, y, isDead);
                    }
                    continue;
                }

                // Rocks in normal and web biomes
                if ((biome === BIOME_NORMAL || biome === BIOME_WEB) && Rock.hasAt(x, y, this.seed)) {
                    if (!isCollected) {
                        Rock.drawAt(ctx, offsetX, offsetY, x, y);
                    }
                    continue;
                }

                // Flowers in mossy biome
                if (biome === BIOME_MOSSY && Flower.hasAt(x, y, this.seed)) {
                    if (!isCollected) {
                        const isThorn = Flower.isThornAt(x, y, this.seed);
                        Flower.drawAt(ctx, offsetX, offsetY, x, y, isThorn);
                    }
                    continue;
                }

                // Webs in web biome (near walls)
                if (biome === BIOME_WEB && Web.hasAt(x, y, this.seed)) {
                    let nearWall = false;
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (dx === 0 && dy === 0) continue;
                            if (tileMap.isWall(x + dx, y + dy)) {
                                nearWall = true;
                                break;
                            }
                        }
                        if (nearWall) break;
                    }
                    if (nearWall) {
                        Web.drawAt(ctx, offsetX, offsetY, x, y);
                    }
                    continue;
                }

                // Lava pools in lava biome
                if (biome === BIOME_LAVA && LavaPool.hasAt(x, y, this.seed)) {
                    LavaPool.drawAt(ctx, offsetX, offsetY, x, y, lavaAnimTimer);
                    continue;
                }

                // Ice in ice biome
                if (biome === BIOME_ICE && Ice.hasAt(x, y, this.seed)) {
                    Ice.drawAt(ctx, offsetX, offsetY, x, y);
                    continue;
                }
            }
        }
    }
}
