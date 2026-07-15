// ========== Interaction Manager ==========
class InteractionManager {
    constructor(game) {
        this.game = game;
    }

    interact() {
        const px = this.game.player.x;
        const py = this.game.player.y;

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

        // Check flowers
        for (const flower of this.game.flowers) {
            if (flower.collected) continue;
            const dx = flower.x - px;
            const dy = flower.y - py;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= flower.interactRange) {
                if (flower.interact(this.game.player)) {
                    this.game.audio.playLevelUp();
                    this.game.particles.emit(flower.x, flower.y, '#42a5f5', 8, 3, 20, 3);
                }
                break;
            }
        }

        // Check thorn flowers (collect to get essence)
        for (const thorn of this.game.thornFlowers) {
            if (thorn.collected) continue;
            const dx = thorn.x - px;
            const dy = thorn.y - py;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= thorn.interactRange) {
                if (thorn.interact(this.game.player)) {
                    this.game.crafting.addResource('essence', thorn.essenceReward);
                    this.game.audio.playLevelUp();
                    this.game.particles.emit(thorn.x, thorn.y, '#e53935', 8, 3, 20, 3);
                }
                break;
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

        // Check rocks (collect to get stone)
        for (const rock of this.game.rocks) {
            if (rock.collected) continue;
            const dx = rock.x - px;
            const dy = rock.y - py;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= rock.interactRange) {
                if (rock.interact(this.game.player)) {
                    this.game.crafting.addResource('stone', rock.stoneAmount);
                    this.game.audio.playHit();
                    this.game.particles.emit(rock.x, rock.y, '#9e9e9e', 6, 2, 15, 3);
                }
                break;
            }
        }

        // Check trees (chop to get wood)
        const selectedItem = this.game.slots[this.game.selectedSlot];
        const isAxe = selectedItem && selectedItem.isAxe;
        for (const tree of this.game.trees) {
            if (tree.collected) continue;
            const dx = tree.x - px;
            const dy = tree.y - py;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= tree.interactRange) {
                if (tree.chop(this.game.player)) {
                    const woodAmount = isAxe ? tree.woodAmount + 2 : tree.woodAmount;
                    this.game.crafting.addResource('wood', woodAmount);
                    this.game.audio.playHit();
                    const color = tree.isDead ? '#6d4c41' : '#388e3c';
                    this.game.particles.emit(tree.x, tree.y, color, 8, 3, 20, 3);
                }
                break;
            }
        }
    }
}
