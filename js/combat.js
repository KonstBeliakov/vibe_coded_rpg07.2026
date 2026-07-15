// ========== Combat Manager ==========
class CombatManager {
    constructor(game) {
        this.game = game;
    }

    playerAttack() {
        if (!this.game.player.attack()) return;

        const px = this.game.player.x;
        const py = this.game.player.y;

        const selectedItem = this.game.slots[this.game.selectedSlot];
        if (selectedItem && selectedItem.name.includes('Посох')) {
            // Staff: shoot projectiles in multiple directions
            const angles = [-0.5, -0.25, 0, 0.25, 0.5]; // 5 projectiles in a fan
            const speed = 4;
            const worldMouseX = px + (this.game.mouseX - this.game.width / 2);
            const worldMouseY = py + (this.game.mouseY - this.game.height / 2);
            const baseAngle = Math.atan2(worldMouseY - py, worldMouseX - px);
            for (const offset of angles) {
                const angle = baseAngle + offset;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;
                this.game.staffProjectiles.push(new StaffProjectile(px, py, vx, vy));
            }
            this.game.audio.playShoot();
        } else if (selectedItem && (selectedItem.name.includes('Лук') || selectedItem.name.includes('Огненный') || selectedItem.name.includes('Ледяной') || selectedItem.name.includes('Отравленный'))) {
            const worldMouseX = px + (this.game.mouseX - this.game.width / 2);
            const worldMouseY = py + (this.game.mouseY - this.game.height / 2);
            const arrowType = selectedItem.arrowType || 'normal';
            this.game.arrows.push(new Arrow(px, py, worldMouseX, worldMouseY, arrowType));
            this.game.audio.playShoot();
        } else {
            const range = this.game.player.attackRange;
            const damage = Math.floor(this.game.player.attackDamage * this.game.player.attackDamageMultiplier);

            for (let i = this.game.enemies.length - 1; i >= 0; i--) {
                const enemy = this.game.enemies[i];
                const dx = enemy.x - px;
                const dy = enemy.y - py;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= range) {
                    enemy.health -= damage;
                    this.game.audio.playHit();
                    this.game.particles.emit(enemy.x, enemy.y, '#ff5252', 8, 3, 20, 3);
                    if (enemy.health <= 0) {
                        this.game.addXP(enemy.xpReward);
                        this.game.achievements.addKill();
                        this.game.audio.playEnemyDeath();
                        this.game.particles.emit(enemy.x, enemy.y, enemy.color, 15, 4, 30, 4);
                        // Drop gold
                        const goldDrop = Math.floor(2 + Math.random() * 4 + this.game.playerLevel * 0.5);
                        this.game.playerGold += goldDrop;
                        this.game.enemies.splice(i, 1);
                    }
                }
            }

            // Try to mine ore if attacking with melee weapon
            const isPickaxe = selectedItem && selectedItem.isPickaxe;
            const oreRange = this.game.player.attackRange + 20;
            const playerTileX = Math.floor(this.game.player.x / TILE_SIZE);
            const playerTileY = Math.floor(this.game.player.y / TILE_SIZE);
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    const tx = playerTileX + dx;
                    const ty = playerTileY + dy;
                    if (this.game.tileMap.isOre(tx, ty)) {
                        const oreWorldX = tx * TILE_SIZE + TILE_SIZE / 2;
                        const oreWorldY = ty * TILE_SIZE + TILE_SIZE / 2;
                        const dx2 = oreWorldX - this.game.player.x;
                        const dy2 = oreWorldY - this.game.player.y;
                        const dist = Math.sqrt(dx2 * dx2 + dy2 * dy2);
                        if (dist <= oreRange) {
                            this.game.tileMap.mineOre(tx, ty);
                            const metalAmount = isPickaxe ? 3 : 1;
                            this.game.crafting.addResource('metal', metalAmount);
                            this.game.audio.playHit();
                            this.game.particles.emit(oreWorldX, oreWorldY, '#ffd54f', 8, 3, 20, 3);
                        }
                    }
                }
            }

            // Attack boss with melee
            if (this.game.boss) {
                const dx = this.game.boss.x - px;
                const dy = this.game.boss.y - py;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= range) {
                    this.game.boss.health -= damage;
                    this.game.audio.playHit();
                    this.game.particles.emit(this.game.boss.x, this.game.boss.y, '#d500f9', 10, 3, 25, 4);
                    if (this.game.boss.health <= 0) {
                        this.game.addXP(this.game.boss.xpReward);
                        this.game.audio.playEnemyDeath();
                        this.game.particles.emit(this.game.boss.x, this.game.boss.y, '#ffd700', 30, 5, 50, 6);
                        this.game.boss = null;
                    }
                }
            }
        }
    }
}
