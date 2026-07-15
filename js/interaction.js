// ========== Interaction Manager ==========
class InteractionManager {
    constructor(game) {
        this.game = game;
    }

    interact() {
        const px = this.game.player.x;
        const py = this.game.player.y;
        const tileX = Math.floor(px / TILE_SIZE);
        const tileY = Math.floor(py / TILE_SIZE);

        // If merchant UI is open, close it
        if (this.game.merchantUI.isOpen) {
            this.game.merchantUI.close();
            return;
        }

        // If chest UI is open, close it
        if (this.game.chestUI.isOpen) {
            this.game.chestUI.close();
            return;
        }

        // Check chests
        for (const chest of this.game.chests) {
            if (chest.opened) continue;
            const dx = chest.x - px;
            const dy = chest.y - py;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= chest.interactRange) {
                const loot = chest.open();
                if (loot) {
                    this.game.achievements.addChestOpen();
                    this.game.audio.playHit();
                    this.game.particles.emit(chest.x, chest.y, '#ffd700', 10, 3, 25, 4);
                    for (const item of loot) {
                        if (item === 'potion_health' || item === 'potion_speed') {
                            const type = item === 'potion_health' ? 'health' : 'speed';
                            this.game.potions.push(new Potion(chest.x + (Math.random() - 0.5) * 20, chest.y + (Math.random() - 0.5) * 20, type));
                        } else if (item === 'weapon') {
                            const dist = Math.sqrt(chest.x * chest.x + chest.y * chest.y);
                            const weapon = Item.generateWeapon(dist);
                            for (let i = 0; i < this.game.slots.length; i++) {
                                if (!this.game.slots[i]) {
                                    this.game.slots[i] = weapon;
                                    this.game.player.applyItemStats(this.game.slots[this.game.selectedSlot], this.game.armorDefense, this.game.getArmorHealthBonus());
                                    break;
                                }
                            }
                        }
                    }
                }
                if (chest.isStorage) {
                    this.game.chestUI.open(chest);
                }
                break;
            }
        }

        // Check merchant
        if (this.game.merchant) {
            const dx = this.game.merchant.x - px;
            const dy = this.game.merchant.y - py;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= this.game.merchant.interactRange) {
                this.game.merchantUI.open();
                return;
            }
        }

        // Check beds
        for (const bed of this.game.beds) {
            const dx = bed.x - px;
            const dy = bed.y - py;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= bed.interactRange) {
                if (!bed.activated) {
                    bed.activate();
                    this.game.spawnBedX = bed.x;
                    this.game.spawnBedY = bed.y;
                    this.game.audio.playLevelUp();
                    this.game.particles.emit(bed.x, bed.y, '#66bb6a', 10, 3, 25, 4);
                }
                break;
            }
        }

        // Check flowers (seed-based) - interact with tile player is on or adjacent
        const biome = this.game.tileMap.getBiome(tileX, tileY);
        if (biome === BIOME_MOSSY && Flower.hasAt(tileX, tileY, this.game.worldSeed)) {
            const key = `${tileX},${tileY}`;
            if (!this.game.collectedTiles.has(key)) {
                const isThorn = Flower.isThornAt(tileX, tileY, this.game.worldSeed);
                if (isThorn) {
                    // Thorn flower - collect to get essence
                    this.game.collectedTiles.add(key);
                    this.game.crafting.addResource('essence', 1);
                    this.game.audio.playLevelUp();
                    this.game.particles.emit(tileX * TILE_SIZE + TILE_SIZE / 2, tileY * TILE_SIZE + TILE_SIZE / 2, '#e53935', 8, 3, 20, 3);
                } else {
                    // Regular flower - heal
                    this.game.collectedTiles.add(key);
                    this.game.player.health = Math.min(this.game.player.health + 5, this.game.player.maxHealth);
                    if (this.game.player.eat) {
                        this.game.player.eat(15);
                    }
                    this.game.audio.playLevelUp();
                    this.game.particles.emit(tileX * TILE_SIZE + TILE_SIZE / 2, tileY * TILE_SIZE + TILE_SIZE / 2, '#42a5f5', 8, 3, 20, 3);
                }
            }
        }

        // Check rocks (seed-based) - interact with adjacent tiles
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const tx = tileX + dx;
                const ty = tileY + dy;
                const key = `${tx},${ty}`;
                if (this.game.collectedTiles.has(key)) continue;

                const b = this.game.tileMap.getBiome(tx, ty);
                if ((b === BIOME_NORMAL || b === BIOME_WEB) && Rock.hasAt(tx, ty, this.game.worldSeed)) {
                    this.game.collectedTiles.add(key);
                    this.game.crafting.addResource('stone', 1);
                    this.game.audio.playHit();
                    this.game.particles.emit(tx * TILE_SIZE + TILE_SIZE / 2, ty * TILE_SIZE + TILE_SIZE / 2, '#9e9e9e', 6, 2, 15, 3);
                    return;
                }
            }
        }

        // Check trees (seed-based) - chop to get wood
        const selectedItem = this.game.slots[this.game.selectedSlot];
        const isAxe = selectedItem && selectedItem.isAxe;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const tx = tileX + dx;
                const ty = tileY + dy;
                const key = `${tx},${ty}`;
                if (this.game.collectedTiles.has(key)) continue;

                const b = this.game.tileMap.getBiome(tx, ty);
                if ((b === BIOME_NORMAL || b === BIOME_MOSSY) && Tree.hasAt(tx, ty, this.game.worldSeed)) {
                    this.game.collectedTiles.add(key);
                    const woodAmount = isAxe ? 4 : 2;
                    this.game.crafting.addResource('wood', woodAmount);
                    this.game.audio.playHit();
                    const color = b === BIOME_NORMAL ? '#6d4c41' : '#388e3c';
                    this.game.particles.emit(tx * TILE_SIZE + TILE_SIZE / 2, ty * TILE_SIZE + TILE_SIZE / 2, color, 8, 3, 20, 3);
                    return;
                }
            }
        }

        // Check potions on ground
        for (const potion of this.game.potions) {
            if (potion.collected) continue;
            const dx = potion.x - px;
            const dy = potion.y - py;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 30) {
                potion.apply(this.game.player, this.game);
                this.game.audio.playLevelUp();
                const colorMap = {
                    'health': '#e53935', 'speed': '#42a5f5', 'invisibility': '#e0e0e0',
                    'regen': '#4caf50', 'attack_boost': '#ff6d00', 'slow_time': '#00bcd4'
                };
                this.game.particles.emit(potion.x, potion.y, colorMap[potion.type] || '#e53935', 8, 3, 20, 3);
            }
        }
    }
}
