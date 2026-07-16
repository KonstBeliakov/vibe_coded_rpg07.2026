// ========== Spawner Module ==========
// Handles spawning of world objects that need to be instantiated (beds, chests, boss areas)
// All seed-based objects (trees, rocks, flowers, webs, lava) are now generated deterministically

class Spawner {
    constructor(game) {
        this.game = game;
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
            // Use deterministic furniture positions from safe zone
            if (zone.bedX !== undefined && zone.bedY !== undefined) {
                let hasBed = false;
                for (const bed of game.beds) {
                    const dx = bed.x - zone.bedX;
                    const dy = bed.y - zone.bedY;
                    if (Math.sqrt(dx * dx + dy * dy) < TILE_SIZE) {
                        hasBed = true;
                        break;
                    }
                }
                if (!hasBed) {
                    game.beds.push(new Bed(zone.bedX, zone.bedY));
                }
            }

            if (zone.chestX !== undefined && zone.chestY !== undefined) {
                let hasChest = false;
                for (const chest of game.chests) {
                    if (!chest.isStorage) continue;
                    const dx = chest.x - zone.chestX;
                    const dy = chest.y - zone.chestY;
                    if (Math.sqrt(dx * dx + dy * dy) < TILE_SIZE) {
                        hasChest = true;
                        break;
                    }
                }
                if (!hasChest) {
                    game.chests.push(new Chest(zone.chestX, zone.chestY, true));
                }
            }
        }
    }
}
