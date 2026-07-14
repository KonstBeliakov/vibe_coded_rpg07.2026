// ========== Spawner Module ==========
// Handles spawning of all world objects (flowers, rocks, trees, webs, lava, etc.)

class Spawner {
    constructor(game) {
        this.game = game;
    }

    // ========== Flowers (mossy biome) ==========
    spawnFlowers() {
        const game = this.game;
        if (game.flowers.length >= 60) return;
        if (game.thornFlowers.length >= 30) return;

        const playerTileX = Math.floor(game.player.x / TILE_SIZE);
        const playerTileY = Math.floor(game.player.y / TILE_SIZE);

        for (let dy = -8; dy <= 8; dy++) {
            for (let dx = -8; dx <= 8; dx++) {
                const tx = playerTileX + dx;
                const ty = playerTileY + dy;

                if (game.tileMap.getBiome(tx, ty) !== BIOME_MOSSY) continue;
                if (game.tileMap.isWall(tx, ty)) continue;

                const worldX = tx * TILE_SIZE + TILE_SIZE / 2;
                const worldY = ty * TILE_SIZE + TILE_SIZE / 2;

                let alreadyHasFlower = false;
                for (const f of game.flowers) {
                    if (Math.floor(f.x / TILE_SIZE) === tx && Math.floor(f.y / TILE_SIZE) === ty) {
                        alreadyHasFlower = true;
                        break;
                    }
                }
                if (alreadyHasFlower) continue;

                let alreadyHasThorn = false;
                for (const f of game.thornFlowers) {
                    if (Math.floor(f.x / TILE_SIZE) === tx && Math.floor(f.y / TILE_SIZE) === ty) {
                        alreadyHasThorn = true;
                        break;
                    }
                }
                if (alreadyHasThorn) continue;

                if (Math.random() < 0.4) {
                    if (Math.random() < 0.7) {
                        game.flowers.push(new Flower(worldX, worldY));
                    } else {
                        game.thornFlowers.push(new ThornFlower(worldX, worldY));
                    }
                }
            }
        }
    }

    // ========== Webs (web biome) ==========
    spawnWebs() {
        const game = this.game;
        if (game.webs.length >= 50) return;

        const playerTileX = Math.floor(game.player.x / TILE_SIZE);
        const playerTileY = Math.floor(game.player.y / TILE_SIZE);

        for (let dy = -8; dy <= 8; dy++) {
            for (let dx = -8; dx <= 8; dx++) {
                const tx = playerTileX + dx;
                const ty = playerTileY + dy;

                if (game.tileMap.getBiome(tx, ty) !== BIOME_WEB) continue;
                if (game.tileMap.isWall(tx, ty)) continue;

                const worldX = tx * TILE_SIZE;
                const worldY = ty * TILE_SIZE;

                let alreadyHasWeb = false;
                for (const w of game.webs) {
                    if (Math.floor(w.x / TILE_SIZE) === tx && Math.floor(w.y / TILE_SIZE) === ty) {
                        alreadyHasWeb = true;
                        break;
                    }
                }
                if (alreadyHasWeb) continue;

                let nearWall = false;
                for (let wy = -1; wy <= 1; wy++) {
                    for (let wx = -1; wx <= 1; wx++) {
                        if (wx === 0 && wy === 0) continue;
                        if (game.tileMap.isWall(tx + wx, ty + wy)) {
                            nearWall = true;
                            break;
                        }
                    }
                    if (nearWall) break;
                }

                if (nearWall && Math.random() < 0.4) {
                    game.webs.push(new Web(worldX, worldY));
                }
            }
        }
    }

    // ========== Lava Pools (lava biome) ==========
    spawnLavaPools() {
        const game = this.game;
        if (game.lavaPools.length >= 20) return;

        const playerTileX = Math.floor(game.player.x / TILE_SIZE);
        const playerTileY = Math.floor(game.player.y / TILE_SIZE);

        for (let dy = -8; dy <= 8; dy++) {
            for (let dx = -8; dx <= 8; dx++) {
                const tx = playerTileX + dx;
                const ty = playerTileY + dy;

                if (game.tileMap.getBiome(tx, ty) !== BIOME_LAVA) continue;
                if (game.tileMap.isWall(tx, ty)) continue;

                const worldX = tx * TILE_SIZE;
                const worldY = ty * TILE_SIZE;

                let alreadyHasLava = false;
                for (const l of game.lavaPools) {
                    if (Math.floor(l.x / TILE_SIZE) === tx && Math.floor(l.y / TILE_SIZE) === ty) {
                        alreadyHasLava = true;
                        break;
                    }
                }
                if (alreadyHasLava) continue;

                if (Math.random() < 0.2) {
                    const poolSize = Math.random() < 0.3 ? TILE_SIZE * 2 : TILE_SIZE;
                    game.lavaPools.push(new LavaPool(worldX, worldY, poolSize));
                }
            }
        }
    }

    // ========== Rocks (default and web biomes) ==========
    spawnRocks() {
        const game = this.game;
        if (game.rocks.length >= 40) return;

        const playerTileX = Math.floor(game.player.x / TILE_SIZE);
        const playerTileY = Math.floor(game.player.y / TILE_SIZE);

        for (let dy = -8; dy <= 8; dy++) {
            for (let dx = -8; dx <= 8; dx++) {
                const tx = playerTileX + dx;
                const ty = playerTileY + dy;

                const biome = game.tileMap.getBiome(tx, ty);
                if (biome !== BIOME_DEFAULT && biome !== BIOME_WEB) continue;
                if (game.tileMap.isWall(tx, ty)) continue;

                const worldX = tx * TILE_SIZE + TILE_SIZE / 2;
                const worldY = ty * TILE_SIZE + TILE_SIZE / 2;

                let alreadyHasRock = false;
                for (const r of game.rocks) {
                    if (Math.floor(r.x / TILE_SIZE) === tx && Math.floor(r.y / TILE_SIZE) === ty) {
                        alreadyHasRock = true;
                        break;
                    }
                }
                if (alreadyHasRock) continue;

                if (Math.random() < 0.15) {
                    game.rocks.push(new Rock(worldX, worldY));
                }
            }
        }
    }

    // ========== Trees (default and mossy biomes) ==========
    spawnTrees() {
        const game = this.game;
        if (game.trees.length >= 40) return;

        const playerTileX = Math.floor(game.player.x / TILE_SIZE);
        const playerTileY = Math.floor(game.player.y / TILE_SIZE);

        for (let dy = -8; dy <= 8; dy++) {
            for (let dx = -8; dx <= 8; dx++) {
                const tx = playerTileX + dx;
                const ty = playerTileY + dy;

                const biome = game.tileMap.getBiome(tx, ty);
                if (biome !== BIOME_DEFAULT && biome !== BIOME_MOSSY) continue;
                if (game.tileMap.isWall(tx, ty)) continue;

                const worldX = tx * TILE_SIZE + TILE_SIZE / 2;
                const worldY = ty * TILE_SIZE + TILE_SIZE / 2;

                let alreadyHasTree = false;
                for (const t of game.trees) {
                    if (Math.floor(t.x / TILE_SIZE) === tx && Math.floor(t.y / TILE_SIZE) === ty) {
                        alreadyHasTree = true;
                        break;
                    }
                }
                if (alreadyHasTree) continue;

                if (Math.random() < 0.12) {
                    const isDead = biome === BIOME_DEFAULT;
                    game.trees.push(new Tree(worldX, worldY, isDead));
                }
            }
        }
    }

    // ========== Chests ==========
    spawnChest() {
        const game = this.game;
        for (let attempt = 0; attempt < 20; attempt++) {
            const tx = Math.floor(game.player.x / TILE_SIZE) + Math.floor((Math.random() - 0.5) * 20);
            const ty = Math.floor(game.player.y / TILE_SIZE) + Math.floor((Math.random() - 0.5) * 20);
            if (!game.tileMap.isWall(tx, ty)) {
                const cx = tx * TILE_SIZE + TILE_SIZE / 2;
                const cy = ty * TILE_SIZE + TILE_SIZE / 2;
                const dx = cx - game.player.x;
                const dy = cy - game.player.y;
                if (Math.sqrt(dx * dx + dy * dy) > 100) {
                    game.chests.push(new Chest(cx, cy));
                    break;
                }
            }
        }
    }

    // ========== Boss Areas ==========
    spawnBossArea() {
        const game = this.game;
        const distFromSpawn = Math.sqrt(game.player.x * game.player.x + game.player.y * game.player.y);
        const minDist = Math.max(300, distFromSpawn + 200);

        for (let attempt = 0; attempt < 30; attempt++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = minDist + Math.random() * 200;
            const bx = Math.cos(angle) * radius;
            const by = Math.sin(angle) * radius;
            const tileX = Math.floor(bx / TILE_SIZE);
            const tileY = Math.floor(by / TILE_SIZE);

            if (!game.tileMap.isWall(tileX, tileY)) {
                let tooClose = false;
                for (const area of game.bossAreas) {
                    const dx = area.x - bx;
                    const dy = area.y - by;
                    if (Math.sqrt(dx * dx + dy * dy) < TILE_SIZE * 8) {
                        tooClose = true;
                        break;
                    }
                }
                if (!tooClose) {
                    const cx = tileX * TILE_SIZE + TILE_SIZE / 2;
                    const cy = tileY * TILE_SIZE + TILE_SIZE / 2;
                    game.bossAreas.push(new BossArea(cx, cy, game.playerLevel));
                    return;
                }
            }
        }
    }

    // ========== Ensure safe zone furniture ==========
    ensureSafeZoneFurniture() {
        const game = this.game;
        for (const zone of game.tileMap.safeZones) {
            let hasBed = false;
            for (const bed of game.beds) {
                const dx = bed.x - zone.x;
                const dy = bed.y - zone.y;
                if (Math.sqrt(dx * dx + dy * dy) < TILE_SIZE * 5) {
                    hasBed = true;
                    break;
                }
            }

            if (!hasBed) {
                const zoneTileX = Math.floor(zone.x / TILE_SIZE);
                const zoneTileY = Math.floor(zone.y / TILE_SIZE);
                const bedPos = game.tileMap.findEmptyTile(zoneTileX, zoneTileY, 3);
                game.beds.push(new Bed(bedPos.x, bedPos.y));
            }

            let hasChest = false;
            for (const chest of game.chests) {
                if (!chest.isStorage) continue;
                const dx = chest.x - zone.x;
                const dy = chest.y - zone.y;
                if (Math.sqrt(dx * dx + dy * dy) < TILE_SIZE * 5) {
                    hasChest = true;
                    break;
                }
            }

            if (!hasChest) {
                const zoneTileX = Math.floor(zone.x / TILE_SIZE);
                const zoneTileY = Math.floor(zone.y / TILE_SIZE);
                const chestPos = game.tileMap.findEmptyTile(zoneTileX, zoneTileY, 4);
                game.chests.push(new Chest(chestPos.x, chestPos.y, true));
            }
        }
    }
}
