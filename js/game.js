// ========== Game ==========
class Game {
    constructor(canvasId, uiId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.ui = document.getElementById(uiId);
        this.deathScreen = document.getElementById('deathScreen');
        this.deathStats = document.getElementById('deathStats');
        this.restartBtn = document.getElementById('restartBtn');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.keys = {};
        this.gameOver = false;

        this.tileMap = new TileMap(42);
        this.player = new Player(0, 0);
        this.enemies = [];
        this.arrows = [];
        this.chests = [];
        this.potions = [];
        this.boss = null;
        this.bossLevelInterval = 5;
        this.mouseX = 0;
        this.mouseY = 0;
        this.spawnTimer = 0;
        this.spawnInterval = 2000;
        this.chestSpawnTimer = 0;
        this.chestSpawnInterval = 15000;
        this.playerXP = 0;
        this.playerLevel = 1;
        this.xpToNextLevel = 50;

        this.settings = new Settings();
        this.particles = new ParticleSystem();
        this.audio = new AudioSystem();
        this.maxEnemies = 20;
        this.settingsOpen = false;

        // Inventory slots
        this.slots = new Array(8).fill(null);
        this.selectedSlot = 0;

        // Create items
        this.slots[0] = new Item('Меч', 10, 10, 'no_texture.png');
        this.slots[1] = new Item('Лук', 5, 0, 'no_texture.png');
        this.player.applyItemStats(this.slots[this.selectedSlot]);

        // Load saved game
        this.loadGame();

        // Restart button
        this.restartBtn.addEventListener('click', () => this.restartGame());

        // Settings UI
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsScreen = document.getElementById('settingsScreen');
        this.settingsContent = document.getElementById('settingsContent');
        this.settingsCloseBtn = document.getElementById('settingsCloseBtn');

        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.settingsCloseBtn.addEventListener('click', () => this.closeSettings());

        // Input handling
        window.addEventListener('keydown', (e) => {
            if (this.gameOver) return;
            if (this.settingsOpen) {
                // Handle key rebinding
                if (this.rebindingAction) {
                    e.preventDefault();
                    this.settings.bindKey(this.rebindingAction, e.key);
                    this.rebindingAction = null;
                    this.renderSettings();
                    return;
                }
                if (e.key === 'Escape') {
                    this.closeSettings();
                    return;
                }
                return;
            }
            this.keys[e.key] = true;
            if (e.key === this.settings.getKey('attack')) {
                e.preventDefault();
                this.playerAttack();
            }
            if (e.key === this.settings.getKey('interact')) {
                this.interact();
            }
            const num = parseInt(e.key);
            if (num >= 1 && num <= 8) {
                this.selectedSlot = num - 1;
                this.player.applyItemStats(this.slots[this.selectedSlot]);
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        window.addEventListener('wheel', (e) => {
            if (this.gameOver) return;
            if (e.deltaY > 0) {
                this.selectedSlot = (this.selectedSlot + 1) % 8;
            } else {
                this.selectedSlot = (this.selectedSlot - 1 + 8) % 8;
            }
            this.player.applyItemStats(this.slots[this.selectedSlot]);
        });

        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });

        // Auto-save every 10 seconds
        setInterval(() => this.saveGame(), 10000);

        // Start game loop
        this.lastTime = performance.now();
        this.gameLoop = this.gameLoop.bind(this);
        requestAnimationFrame(this.gameLoop);
    }

    interact() {
        const px = this.player.x;
        const py = this.player.y;

        // Check chests
        for (const chest of this.chests) {
            if (chest.opened) continue;
            const dx = chest.x - px;
            const dy = chest.y - py;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= chest.interactRange) {
                const loot = chest.open();
                if (loot) {
                    this.audio.playHit();
                    this.particles.emit(chest.x, chest.y, '#ffd700', 10, 3, 25, 4);
                    for (const item of loot) {
                        if (item === 'potion_health' || item === 'potion_speed') {
                            const type = item === 'potion_health' ? 'health' : 'speed';
                            this.potions.push(new Potion(chest.x + (Math.random() - 0.5) * 20, chest.y + (Math.random() - 0.5) * 20, type));
                        }
                    }
                }
                break;
            }
        }

        // Check potions on ground
        for (const potion of this.potions) {
            if (potion.collected) continue;
            const dx = potion.x - px;
            const dy = potion.y - py;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 30) {
                potion.apply(this.player);
                this.audio.playLevelUp();
                this.particles.emit(potion.x, potion.y, potion.type === 'health' ? '#e53935' : '#42a5f5', 8, 3, 20, 3);
            }
        }
    }

    saveGame() {
        if (this.gameOver) return;
        const data = {
            x: this.player.x,
            y: this.player.y,
            health: this.player.health,
            maxHealth: this.player.maxHealth,
            level: this.playerLevel,
            xp: this.playerXP,
            xpToNext: this.xpToNextLevel,
            baseDamage: this.player.baseAttackDamage,
            baseRange: this.player.baseAttackRange
        };
        try {
            localStorage.setItem('rpg3_save', JSON.stringify(data));
        } catch (e) {
            // ignore storage errors
        }
    }

    loadGame() {
        try {
            const raw = localStorage.getItem('rpg3_save');
            if (!raw) return;
            const data = JSON.parse(raw);
            this.player.x = data.x || 0;
            this.player.y = data.y || 0;
            this.player.health = data.health || 100;
            this.player.maxHealth = data.maxHealth || 100;
            this.playerLevel = data.level || 1;
            this.playerXP = data.xp || 0;
            this.xpToNextLevel = data.xpToNext || 50;
            this.player.baseAttackDamage = data.baseDamage || 15;
            this.player.baseAttackRange = data.baseRange || 50;
            this.player.applyItemStats(this.slots[this.selectedSlot]);
        } catch (e) {
            // ignore
        }
    }

    restartGame() {
        this.gameOver = false;
        this.deathScreen.style.display = 'none';
        this.player.x = 0;
        this.player.y = 0;
        this.player.health = 100;
        this.player.maxHealth = 100;
        this.playerLevel = 1;
        this.playerXP = 0;
        this.xpToNextLevel = 50;
        this.player.baseAttackDamage = 15;
        this.player.baseAttackRange = 50;
        this.player.applyItemStats(this.slots[this.selectedSlot]);
        this.enemies = [];
        this.arrows = [];
        this.chests = [];
        this.potions = [];
        this.particles = new ParticleSystem();
        this.spawnTimer = 0;
        this.tileMap = new TileMap(42);
        localStorage.removeItem('rpg3_save');
    }

    addXP(amount) {
        this.playerXP += amount;
        while (this.playerXP >= this.xpToNextLevel) {
            this.playerXP -= this.xpToNextLevel;
            this.playerLevel++;
            this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.5);
            this.player.maxHealth += 20;
            this.player.health = Math.min(this.player.health + 20, this.player.maxHealth);
            this.player.baseAttackDamage += 3;
            this.player.baseAttackRange += 2;
            this.player.applyItemStats(this.slots[this.selectedSlot]);
            this.audio.playLevelUp();
            this.particles.emit(this.player.x, this.player.y, '#ffd700', 20, 5, 40, 5);

            // Spawn boss every N levels
            if (this.playerLevel % this.bossLevelInterval === 0 && !this.boss) {
                this.spawnBoss();
            }
        }
    }

    spawnBoss() {
        const margin = 150;
        const side = Math.floor(Math.random() * 4);
        let x, y;
        if (side === 0) {
            x = this.player.x + (Math.random() - 0.5) * this.width;
            y = this.player.y - this.height / 2 - margin;
        } else if (side === 1) {
            x = this.player.x + this.width / 2 + margin;
            y = this.player.y + (Math.random() - 0.5) * this.height;
        } else if (side === 2) {
            x = this.player.x + (Math.random() - 0.5) * this.width;
            y = this.player.y + this.height / 2 + margin;
        } else {
            x = this.player.x - this.width / 2 - margin;
            y = this.player.y + (Math.random() - 0.5) * this.height;
        }
        this.boss = new Boss(x, y, this.playerLevel);
        this.audio.playLevelUp();
        this.particles.emit(x, y, '#ffd700', 30, 5, 50, 6);
    }

    spawnEnemy() {
        // Limit enemies for performance
        if (this.enemies.length >= this.maxEnemies) return;

        const margin = 100;
        const side = Math.floor(Math.random() * 4);
        let x, y;
        if (side === 0) {
            x = this.player.x + (Math.random() - 0.5) * this.width;
            y = this.player.y - this.height / 2 - margin;
        } else if (side === 1) {
            x = this.player.x + this.width / 2 + margin;
            y = this.player.y + (Math.random() - 0.5) * this.height;
        } else if (side === 2) {
            x = this.player.x + (Math.random() - 0.5) * this.width;
            y = this.player.y + this.height / 2 + margin;
        } else {
            x = this.player.x - this.width / 2 - margin;
            y = this.player.y + (Math.random() - 0.5) * this.height;
        }

        const roll = Math.random();
        let enemy;
        if (roll < 0.5) {
            enemy = new Enemy(x, y, {
                speed: 1.2 + this.playerLevel * 0.05,
                health: 50 + this.playerLevel * 10,
                attackDamage: 8 + this.playerLevel * 2,
                xpReward: 10 + this.playerLevel * 2,
                type: 'normal'
            });
        } else if (roll < 0.75) {
            enemy = new FastEnemy(x, y);
        } else if (roll < 0.9) {
            enemy = new TankEnemy(x, y);
        } else {
            enemy = new FlyingEnemy(x, y);
        }
        this.enemies.push(enemy);
    }

    spawnChest() {
        // Find a random empty tile near the player
        for (let attempt = 0; attempt < 20; attempt++) {
            const tx = Math.floor(this.player.x / TILE_SIZE) + Math.floor((Math.random() - 0.5) * 20);
            const ty = Math.floor(this.player.y / TILE_SIZE) + Math.floor((Math.random() - 0.5) * 20);
            if (!this.tileMap.isWall(tx, ty)) {
                const cx = tx * TILE_SIZE + TILE_SIZE / 2;
                const cy = ty * TILE_SIZE + TILE_SIZE / 2;
                // Check not too close to player
                const dx = cx - this.player.x;
                const dy = cy - this.player.y;
                if (Math.sqrt(dx * dx + dy * dy) > 100) {
                    this.chests.push(new Chest(cx, cy));
                    break;
                }
            }
        }
    }

    playerAttack() {
        if (!this.player.attack()) return;

        const px = this.player.x;
        const py = this.player.y;

        const selectedItem = this.slots[this.selectedSlot];
        if (selectedItem && selectedItem.name === 'Лук') {
            const worldMouseX = px + (this.mouseX - this.width / 2);
            const worldMouseY = py + (this.mouseY - this.height / 2);
            this.arrows.push(new Arrow(px, py, worldMouseX, worldMouseY));
            this.audio.playShoot();
        } else {
            const range = this.player.attackRange;
            const damage = this.player.attackDamage;

            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                const dx = enemy.x - px;
                const dy = enemy.y - py;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= range) {
                    enemy.health -= damage;
                    this.audio.playHit();
                    this.particles.emit(enemy.x, enemy.y, '#ff5252', 8, 3, 20, 3);
                    if (enemy.health <= 0) {
                        this.addXP(enemy.xpReward);
                        this.audio.playEnemyDeath();
                        this.particles.emit(enemy.x, enemy.y, enemy.color, 15, 4, 30, 4);
                        this.enemies.splice(i, 1);
                    }
                }
            }

            // Attack boss with melee
            if (this.boss) {
                const dx = this.boss.x - px;
                const dy = this.boss.y - py;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= range) {
                    this.boss.health -= damage;
                    this.audio.playHit();
                    this.particles.emit(this.boss.x, this.boss.y, '#d500f9', 10, 3, 25, 4);
                    if (this.boss.health <= 0) {
                        this.addXP(this.boss.xpReward);
                        this.audio.playEnemyDeath();
                        this.particles.emit(this.boss.x, this.boss.y, '#ffd700', 30, 5, 50, 6);
                        this.boss = null;
                    }
                }
            }
        }
    }

    update(dt) {
        if (this.gameOver) return;

        const prevX = this.player.x;
        const prevY = this.player.y;

        this.player.update(this.keys);

        const half = this.player.size / 2;
        const corners = [
            { x: this.player.x - half, y: this.player.y - half },
            { x: this.player.x + half, y: this.player.y - half },
            { x: this.player.x - half, y: this.player.y + half },
            { x: this.player.x + half, y: this.player.y + half }
        ];

        let collision = false;
        for (const corner of corners) {
            const tileX = Math.floor(corner.x / TILE_SIZE);
            const tileY = Math.floor(corner.y / TILE_SIZE);
            if (this.tileMap.isWall(tileX, tileY)) {
                collision = true;
                break;
            }
        }

        if (collision) {
            this.player.x = prevX;
            this.player.y = prevY;
        }

        for (const enemy of this.enemies) {
            enemy.update(this.player.x, this.player.y);
            if (enemy.tryAttack(this.player.x, this.player.y)) {
                this.player.health -= enemy.attackDamage;
                this.audio.playPlayerHit();
                this.particles.emit(this.player.x, this.player.y, '#ff1744', 10, 3, 20, 3);
                if (this.player.health < 0) this.player.health = 0;
            }
        }

        // Update boss
        if (this.boss) {
            this.boss.update(this.player.x, this.player.y);
            if (this.boss.tryAttack(this.player.x, this.player.y)) {
                this.player.health -= this.boss.attackDamage;
                this.audio.playPlayerHit();
                this.particles.emit(this.player.x, this.player.y, '#d500f9', 15, 4, 30, 4);
                if (this.player.health < 0) this.player.health = 0;
            }
        }

        for (let i = this.arrows.length - 1; i >= 0; i--) {
            const arrow = this.arrows[i];
            arrow.update();

            let hit = false;
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                const dx = arrow.x - enemy.x;
                const dy = arrow.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < enemy.size / 2 + arrow.size) {
                    enemy.health -= arrow.damage;
                    this.audio.playHit();
                    this.particles.emit(enemy.x, enemy.y, '#ff5252', 8, 3, 20, 3);
                    if (enemy.health <= 0) {
                        this.addXP(enemy.xpReward);
                        this.audio.playEnemyDeath();
                        this.particles.emit(enemy.x, enemy.y, enemy.color, 15, 4, 30, 4);
                        this.enemies.splice(j, 1);
                    }
                    hit = true;
                    break;
                }
            }

            // Check arrow hit on boss
            if (!hit && this.boss) {
                const dx = arrow.x - this.boss.x;
                const dy = arrow.y - this.boss.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < this.boss.size / 2 + arrow.size) {
                    this.boss.health -= arrow.damage;
                    this.audio.playHit();
                    this.particles.emit(this.boss.x, this.boss.y, '#d500f9', 10, 3, 25, 4);
                    if (this.boss.health <= 0) {
                        this.addXP(this.boss.xpReward);
                        this.audio.playEnemyDeath();
                        this.particles.emit(this.boss.x, this.boss.y, '#ffd700', 30, 5, 50, 6);
                        this.boss = null;
                    }
                    hit = true;
                }
            }

            if (hit) {
                this.arrows.splice(i, 1);
            }
        }

        // Update potions
        for (const potion of this.potions) {
            potion.update();
        }

        this.particles.update();

        this.spawnTimer += dt;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnEnemy();
        }

        this.chestSpawnTimer += dt;
        if (this.chestSpawnTimer >= this.chestSpawnInterval) {
            this.chestSpawnTimer = 0;
            if (this.chests.length < 5) {
                this.spawnChest();
            }
        }

        // Check death
        if (this.player.health <= 0) {
            this.gameOver = true;
            this.deathScreen.style.display = 'flex';
            this.deathStats.textContent = `Уровень: ${this.playerLevel} | XP: ${this.playerXP}`;
            localStorage.removeItem('rpg3_save');
        }
    }

    draw() {
        const ctx = this.ctx;
        const offsetX = this.width / 2 - this.player.x;
        const offsetY = this.height / 2 - this.player.y;

        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, this.width, this.height);

        this.tileMap.draw(ctx, offsetX, offsetY);

        // Draw chests
        for (const chest of this.chests) {
            chest.draw(ctx, offsetX, offsetY);
        }

        // Draw potions
        for (const potion of this.potions) {
            potion.draw(ctx, offsetX, offsetY);
        }

        for (const arrow of this.arrows) {
            arrow.draw(ctx, offsetX, offsetY);
        }

        for (const enemy of this.enemies) {
            enemy.draw(ctx, offsetX, offsetY);
        }

        // Draw boss
        if (this.boss) {
            this.boss.draw(ctx, offsetX, offsetY);
        }

        this.player.draw(ctx, offsetX, offsetY);

        this.particles.draw(ctx, offsetX, offsetY);

        // Draw player HP bar (top-left corner)
        const hpBarWidth = 200;
        const hpBarHeight = 20;
        const hpX = 15;
        const hpY = 50;
        const hpPercent = this.player.health / this.player.maxHealth;

        ctx.fillStyle = '#333';
        ctx.fillRect(hpX, hpY, hpBarWidth, hpBarHeight);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.strokeRect(hpX, hpY, hpBarWidth, hpBarHeight);

        const hpColor = hpPercent > 0.5 ? '#4caf50' : hpPercent > 0.25 ? '#ff9800' : '#e53935';
        ctx.fillStyle = hpColor;
        ctx.fillRect(hpX + 1, hpY + 1, (hpBarWidth - 2) * hpPercent, hpBarHeight - 2);

        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.ceil(this.player.health)} / ${this.player.maxHealth}`, hpX + hpBarWidth / 2, hpY + 15);
        ctx.textAlign = 'left';

        // Draw inventory
        const slotSize = 50;
        const slotMargin = 5;
        const totalWidth = this.slots.length * (slotSize + slotMargin) - slotMargin;
        const startX = (this.width - totalWidth) / 2;
        const startY = this.height - slotSize - 15;

        for (let i = 0; i < this.slots.length; i++) {
            const sx = startX + i * (slotSize + slotMargin);
            const sy = startY;

            ctx.fillStyle = i === this.selectedSlot ? '#666' : '#444';
            ctx.fillRect(sx, sy, slotSize, slotSize);
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 1;
            ctx.strokeRect(sx, sy, slotSize, slotSize);

            ctx.fillStyle = '#aaa';
            ctx.font = '10px monospace';
            ctx.fillText(i + 1, sx + 3, sy + 12);

            if (this.slots[i]) {
                const item = this.slots[i];
                if (item.loaded) {
                    ctx.drawImage(item.texture, sx + 5, sy + 5, slotSize - 10, slotSize - 10);
                } else {
                    ctx.fillStyle = '#888';
                    ctx.font = '10px monospace';
                    ctx.fillText(item.name, sx + 5, sy + slotSize / 2 + 5);
                }
            }
        }

        // Draw minimap
        this.drawMinimap(ctx);

        // UI text
        this.ui.innerHTML = `X: ${Math.round(this.player.x)}, Y: ${Math.round(this.player.y)}<br>Lv.${this.playerLevel} XP: ${this.playerXP}/${this.xpToNextLevel}`;
    }

    drawMinimap(ctx) {
        const mapSize = 150;
        const mapX = this.width - mapSize - 15;
        const mapY = this.height - mapSize - 15;
        const tileSize = 4;
        const viewRadius = Math.floor(mapSize / tileSize / 2);

        // Background
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(mapX, mapY, mapSize, mapSize);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.strokeRect(mapX, mapY, mapSize, mapSize);

        // Label
        ctx.fillStyle = '#aaa';
        ctx.font = '9px monospace';
        ctx.fillText('Карта', mapX + 4, mapY + 12);

        // Center tile (player position)
        const centerTileX = Math.floor(this.player.x / TILE_SIZE);
        const centerTileY = Math.floor(this.player.y / TILE_SIZE);

        // Draw tiles
        for (let dy = -viewRadius; dy <= viewRadius; dy++) {
            for (let dx = -viewRadius; dx <= viewRadius; dx++) {
                const tx = centerTileX + dx;
                const ty = centerTileY + dy;
                const sx = mapX + (dx + viewRadius) * tileSize + 2;
                const sy = mapY + (dy + viewRadius) * tileSize + 16;

                if (this.tileMap.isWall(tx, ty)) {
                    ctx.fillStyle = '#555';
                    ctx.fillRect(sx, sy, tileSize, tileSize);
                } else {
                    ctx.fillStyle = '#222';
                    ctx.fillRect(sx, sy, tileSize, tileSize);
                }
            }
        }

        // Draw chests on minimap
        ctx.fillStyle = '#ffd54f';
        for (const chest of this.chests) {
            if (chest.opened) continue;
            const dx = Math.floor(chest.x / TILE_SIZE) - centerTileX;
            const dy = Math.floor(chest.y / TILE_SIZE) - centerTileY;
            if (Math.abs(dx) <= viewRadius && Math.abs(dy) <= viewRadius) {
                const sx = mapX + (dx + viewRadius) * tileSize + 2;
                const sy = mapY + (dy + viewRadius) * tileSize + 16;
                ctx.fillRect(sx, sy, tileSize, tileSize);
            }
        }

        // Draw potions on minimap
        ctx.fillStyle = '#42a5f5';
        for (const potion of this.potions) {
            if (potion.collected) continue;
            const dx = Math.floor(potion.x / TILE_SIZE) - centerTileX;
            const dy = Math.floor(potion.y / TILE_SIZE) - centerTileY;
            if (Math.abs(dx) <= viewRadius && Math.abs(dy) <= viewRadius) {
                const sx = mapX + (dx + viewRadius) * tileSize + 2;
                const sy = mapY + (dy + viewRadius) * tileSize + 16;
                ctx.fillRect(sx, sy, tileSize, tileSize);
            }
        }

        // Draw boss on minimap
        if (this.boss) {
            ctx.fillStyle = '#d500f9';
            const dx = Math.floor(this.boss.x / TILE_SIZE) - centerTileX;
            const dy = Math.floor(this.boss.y / TILE_SIZE) - centerTileY;
            if (Math.abs(dx) <= viewRadius && Math.abs(dy) <= viewRadius) {
                const sx = mapX + (dx + viewRadius) * tileSize + 2;
                const sy = mapY + (dy + viewRadius) * tileSize + 16;
                ctx.fillRect(sx - 1, sy - 1, tileSize + 2, tileSize + 2);
            }
        }

        // Draw enemies on minimap
        ctx.fillStyle = '#e53935';
        for (const enemy of this.enemies) {
            const dx = Math.floor(enemy.x / TILE_SIZE) - centerTileX;
            const dy = Math.floor(enemy.y / TILE_SIZE) - centerTileY;
            if (Math.abs(dx) <= viewRadius && Math.abs(dy) <= viewRadius) {
                const sx = mapX + (dx + viewRadius) * tileSize + 2;
                const sy = mapY + (dy + viewRadius) * tileSize + 16;
                ctx.fillRect(sx, sy, tileSize, tileSize);
            }
        }

        // Draw player on minimap
        ctx.fillStyle = '#4caf50';
        const playerDX = 0;
        const playerDY = 0;
        const psx = mapX + (playerDX + viewRadius) * tileSize + 2;
        const psy = mapY + (playerDY + viewRadius) * tileSize + 16;
        ctx.fillRect(psx - 1, psy - 1, tileSize + 2, tileSize + 2);
    }

    openSettings() {
        this.settingsOpen = true;
        this.settingsScreen.style.display = 'flex';
        this.renderSettings();
    }

    closeSettings() {
        this.settingsOpen = false;
        this.settingsScreen.style.display = 'none';
        this.rebindingAction = null;
    }

    renderSettings() {
        const actions = [
            { action: 'up', label: 'Вверх' },
            { action: 'down', label: 'Вниз' },
            { action: 'left', label: 'Влево' },
            { action: 'right', label: 'Вправо' },
            { action: 'attack', label: 'Атака' },
            { action: 'interact', label: 'Взаимодействие (E)' }
        ];

        this.settingsContent.innerHTML = '';
        for (const { action, label } of actions) {
            const row = document.createElement('div');
            row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:6px 10px; background:rgba(255,255,255,0.05); border-radius:4px;';

            const labelEl = document.createElement('span');
            labelEl.textContent = label;
            labelEl.style.cssText = 'color:#ccc; font-size:14px;';

            const keyEl = document.createElement('button');
            const keyName = this.settings.getKey(action);
            keyEl.textContent = keyName === ' ' ? 'Пробел' : keyName.toUpperCase();
            keyEl.style.cssText = 'padding:4px 12px; background:#444; color:#fff; border:1px solid #666; border-radius:3px; cursor:pointer; font-family:monospace; font-size:13px; min-width:80px; text-align:center;';

            keyEl.addEventListener('click', () => {
                this.rebindingAction = action;
                keyEl.textContent = '...';
                keyEl.style.background = '#666';
                setTimeout(() => {
                    if (this.rebindingAction === action) {
                        keyEl.textContent = keyName === ' ' ? 'Пробел' : keyName.toUpperCase();
                        keyEl.style.background = '#444';
                    }
                }, 3000);
            });

            row.appendChild(labelEl);
            row.appendChild(keyEl);
            this.settingsContent.appendChild(row);
        }
    }

    gameLoop(time) {
        const dt = time - this.lastTime;
        this.lastTime = time;

        this.update(dt);
        this.draw();

        requestAnimationFrame(this.gameLoop);
    }
}
