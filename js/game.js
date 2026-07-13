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
        const spawnPos = this.tileMap.findEmptyTile(0, 0, 5);
        this.player = new Player(spawnPos.x, spawnPos.y);
        this.enemies = [];
        this.arrows = [];
        this.staffProjectiles = [];
        this.chests = [];
        this.potions = [];
        this.beds = [];
        this.boss = null;
        this.bossLevelInterval = 5;
        this.safeZoneRadius = TILE_SIZE * 5; // Safe zone radius around spawn (0,0)
        this.spawnBedX = spawnPos.x;
        this.spawnBedY = spawnPos.y;
        this.mouseX = 0;
        this.mouseY = 0;
        this.spawnTimer = 0;
        this.spawnInterval = 2000;
        this.baseSpawnInterval = 2000;
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
        this.chestUIOpen = false;
        this.activeChest = null;
        this.merchantUIOpen = false;
        this.activeMerchant = null;
        this.achievements = new AchievementSystem();
        this.effects = new EffectManager();

        // Fog of War
        this.exploredTiles = new Set();
        this.fogRevealRadius = 6; // tiles

        // Inventory slots
        this.slots = new Array(8).fill(null);
        this.selectedSlot = 0;

        // Create items
        this.slots[0] = new Item('Меч', 10, 10, 'no_texture.png');
        this.slots[1] = new Item('Лук', 5, 0, 'no_texture.png');
        this.player.applyItemStats(this.slots[this.selectedSlot]);

        // Create bed in safe zone
        const bedPos = this.tileMap.findEmptyTile(0, 0, 3);
        this.beds.push(new Bed(bedPos.x, bedPos.y));

        // Create storage chest in safe zone
        const storageChestPos = this.tileMap.findEmptyTile(0, 0, 4);
        this.chests.push(new Chest(storageChestPos.x, storageChestPos.y, true));

        // Create merchant in safe zone
        const merchantPos = this.tileMap.findEmptyTile(0, 0, 6);
        this.merchant = new Merchant(merchantPos.x, merchantPos.y);

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
            if (e.key === 'q' || e.key === 'Q') {
                if (this.chestUIOpen) {
                    this.depositItem();
                } else if (this.merchantUIOpen) {
                    this.sellToMerchant();
                }
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

        // If merchant UI is open, close it
        if (this.merchantUIOpen) {
            this.closeMerchantUI();
            return;
        }

        // If chest UI is open, close it
        if (this.chestUIOpen) {
            this.closeChestUI();
            return;
        }

        // Check chests
        for (const chest of this.chests) {
            if (chest.opened) continue;
            const dx = chest.x - px;
            const dy = chest.y - py;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= chest.interactRange) {
                const loot = chest.open();
                if (loot) {
                    this.achievements.addChestOpen();
                    this.audio.playHit();
                    this.particles.emit(chest.x, chest.y, '#ffd700', 10, 3, 25, 4);
                    for (const item of loot) {
                        if (item === 'potion_health' || item === 'potion_speed') {
                            const type = item === 'potion_health' ? 'health' : 'speed';
                            this.potions.push(new Potion(chest.x + (Math.random() - 0.5) * 20, chest.y + (Math.random() - 0.5) * 20, type));
                        } else if (item === 'weapon') {
                            const dist = Math.sqrt(chest.x * chest.x + chest.y * chest.y);
                            const weapon = Item.generateWeapon(dist);
                            // Put weapon in first empty slot
                            for (let i = 0; i < this.slots.length; i++) {
                                if (!this.slots[i]) {
                                    this.slots[i] = weapon;
                                    this.player.applyItemStats(this.slots[this.selectedSlot]);
                                    break;
                                }
                            }
                        }
                    }
                }
                // Open storage chest UI
                if (chest.isStorage) {
                    this.openChestUI(chest);
                }
                break;
            }
        }

        // Check merchant
        if (this.merchant) {
            const dx = this.merchant.x - px;
            const dy = this.merchant.y - py;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= this.merchant.interactRange) {
                this.openMerchantUI();
                return;
            }
        }

        // Check beds
        for (const bed of this.beds) {
            const dx = bed.x - px;
            const dy = bed.y - py;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= bed.interactRange) {
                if (!bed.activated) {
                    bed.activate();
                    this.spawnBedX = bed.x;
                    this.spawnBedY = bed.y;
                    this.audio.playLevelUp();
                    this.particles.emit(bed.x, bed.y, '#66bb6a', 10, 3, 25, 4);
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

        // Respawn at bed if activated, otherwise at spawn
        const bedActivated = this.beds.some(b => b.activated);
        if (bedActivated) {
            this.player.x = this.spawnBedX;
            this.player.y = this.spawnBedY;
        } else {
            const spawnPos = this.tileMap.findEmptyTile(0, 0, 5);
            this.player.x = spawnPos.x;
            this.player.y = spawnPos.y;
        }

        // Keep level and XP on death
        const keptLevel = this.playerLevel;
        const keptXP = this.playerXP;
        const keptXpToNext = this.xpToNextLevel;

        // Reset health based on kept level
        this.player.maxHealth = 100 + (keptLevel - 1) * 20;
        this.player.health = this.player.maxHealth;
        this.player.baseAttackDamage = 15 + (keptLevel - 1) * 3;
        this.player.baseAttackRange = 50 + (keptLevel - 1) * 2;

        // Reset inventory to starter items only
        this.slots = new Array(8).fill(null);
        this.slots[0] = new Item('Меч', 10, 10, 'no_texture.png');
        this.slots[1] = new Item('Лук', 5, 0, 'no_texture.png');
        this.selectedSlot = 0;
        this.player.applyItemStats(this.slots[this.selectedSlot]);

        this.playerLevel = keptLevel;
        this.playerXP = keptXP;
        this.xpToNextLevel = keptXpToNext;

        this.enemies = [];
        this.arrows = [];
        this.chests = [];
        this.potions = [];
        this.boss = null;
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
        // Ensure boss doesn't spawn in a wall
        const bossTileX = Math.floor(x / TILE_SIZE);
        const bossTileY = Math.floor(y / TILE_SIZE);
        if (this.tileMap.isWall(bossTileX, bossTileY)) {
            const emptyPos = this.tileMap.findEmptyTile(bossTileX, bossTileY, 3);
            x = emptyPos.x;
            y = emptyPos.y;
        }
        this.boss = new Boss(x, y, this.playerLevel);
        this.audio.playLevelUp();
        this.particles.emit(x, y, '#ffd700', 30, 5, 50, 6);
    }

    getDifficultyMultiplier() {
        const dist = Math.sqrt(this.player.x * this.player.x + this.player.y * this.player.y);
        // 1.0 at spawn, increases by ~0.1 per 500 pixels
        return 1.0 + dist / 5000;
    }

    isInSafeZone(x, y) {
        const dist = Math.sqrt(x * x + y * y);
        return dist < this.safeZoneRadius;
    }

    spawnEnemy() {
        // Limit enemies for performance
        if (this.enemies.length >= this.maxEnemies) return;

        const diffMult = this.getDifficultyMultiplier();

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

        // Don't spawn enemies inside safe zone
        if (this.isInSafeZone(x, y)) return;

        const roll = Math.random();
        let enemy;
        if (roll < 0.5) {
            enemy = new Enemy(x, y, {
                speed: (1.2 + this.playerLevel * 0.05) * diffMult,
                health: (50 + this.playerLevel * 10) * diffMult,
                attackDamage: (8 + this.playerLevel * 2) * diffMult,
                xpReward: Math.floor((10 + this.playerLevel * 2) * diffMult),
                type: 'normal'
            });
        } else if (roll < 0.75) {
            enemy = new FastEnemy(x, y);
            enemy.speed *= diffMult;
            enemy.health *= diffMult;
            enemy.attackDamage *= diffMult;
            enemy.xpReward = Math.floor(enemy.xpReward * diffMult);
        } else if (roll < 0.9) {
            enemy = new TankEnemy(x, y);
            enemy.speed *= diffMult;
            enemy.health *= diffMult;
            enemy.attackDamage *= diffMult;
            enemy.xpReward = Math.floor(enemy.xpReward * diffMult);
        } else {
            enemy = new FlyingEnemy(x, y);
            enemy.speed *= diffMult;
            enemy.health *= diffMult;
            enemy.attackDamage *= diffMult;
            enemy.xpReward = Math.floor(enemy.xpReward * diffMult);
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
        if (selectedItem && selectedItem.name.includes('Посох')) {
            // Staff: shoot projectiles in multiple directions
            const angles = [-0.5, -0.25, 0, 0.25, 0.5]; // 5 projectiles in a fan
            const speed = 4;
            const worldMouseX = px + (this.mouseX - this.width / 2);
            const worldMouseY = py + (this.mouseY - this.height / 2);
            const baseAngle = Math.atan2(worldMouseY - py, worldMouseX - px);
            for (const offset of angles) {
                const angle = baseAngle + offset;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;
                this.staffProjectiles.push(new StaffProjectile(px, py, vx, vy));
            }
            this.audio.playShoot();
        } else if (selectedItem && (selectedItem.name.includes('Лук') || selectedItem.name.includes('Огненный') || selectedItem.name.includes('Ледяной') || selectedItem.name.includes('Отравленный'))) {
            const worldMouseX = px + (this.mouseX - this.width / 2);
            const worldMouseY = py + (this.mouseY - this.height / 2);
            const arrowType = selectedItem.arrowType || 'normal';
            this.arrows.push(new Arrow(px, py, worldMouseX, worldMouseY, arrowType));
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
                        this.achievements.addKill();
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
            // Push enemies out of safe zone
            const enemyDistFromSpawn = Math.sqrt(enemy.x * enemy.x + enemy.y * enemy.y);
            if (enemyDistFromSpawn < this.safeZoneRadius) {
                const angle = Math.atan2(enemy.y, enemy.x);
                const pushDist = this.safeZoneRadius - enemyDistFromSpawn + 5;
                enemy.x += Math.cos(angle) * pushDist;
                enemy.y += Math.sin(angle) * pushDist;
            }

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
            arrow.update(this);

            let hit = false;
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                const dx = arrow.x - enemy.x;
                const dy = arrow.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < enemy.size / 2 + arrow.size) {
                    enemy.health -= arrow.damage;
                    arrow.onHit(enemy, this);
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
                    arrow.onHit(this.boss, this);
                    this.audio.playHit();
                    this.particles.emit(this.boss.x, this.boss.y, '#d500f9', 10, 3, 25, 4);
                    if (this.boss.health <= 0) {
                        this.addXP(this.boss.xpReward);
                        this.achievements.addBossKill();
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

        // Update staff projectiles
        for (let i = this.staffProjectiles.length - 1; i >= 0; i--) {
            const proj = this.staffProjectiles[i];
            proj.update();

            let hit = false;
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                const dx = proj.x - enemy.x;
                const dy = proj.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < enemy.size / 2 + proj.size) {
                    enemy.health -= proj.damage;
                    this.audio.playHit();
                    this.particles.emit(enemy.x, enemy.y, '#ce93d8', 8, 3, 20, 3);
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

            // Check hit on boss
            if (!hit && this.boss) {
                const dx = proj.x - this.boss.x;
                const dy = proj.y - this.boss.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < this.boss.size / 2 + proj.size) {
                    this.boss.health -= proj.damage;
                    this.audio.playHit();
                    this.particles.emit(this.boss.x, this.boss.y, '#ce93d8', 10, 3, 25, 4);
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
                this.staffProjectiles.splice(i, 1);
            }
        }

        // Update potions
        for (const potion of this.potions) {
            potion.update();
        }

        this.particles.update();
        this.effects.update(dt);

        // Adjust spawn interval based on distance from spawn
        const diffMult = this.getDifficultyMultiplier();
        this.spawnInterval = Math.max(500, this.baseSpawnInterval / diffMult);

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

        // Update achievements
        this.achievements.addLevel(this.playerLevel);
        const distFromSpawn = Math.sqrt(this.player.x * this.player.x + this.player.y * this.player.y);
        this.achievements.updateDistance(distFromSpawn);

        // Update fog of war
        const playerTileX = Math.floor(this.player.x / TILE_SIZE);
        const playerTileY = Math.floor(this.player.y / TILE_SIZE);
        for (let dy = -this.fogRevealRadius; dy <= this.fogRevealRadius; dy++) {
            for (let dx = -this.fogRevealRadius; dx <= this.fogRevealRadius; dx++) {
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= this.fogRevealRadius) {
                    this.exploredTiles.add(`${playerTileX + dx},${playerTileY + dy}`);
                }
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

        // Draw fog of war
        const viewTileW = Math.ceil(this.width / TILE_SIZE) + 2;
        const viewTileH = Math.ceil(this.height / TILE_SIZE) + 2;
        const playerTX = Math.floor(this.player.x / TILE_SIZE);
        const playerTY = Math.floor(this.player.y / TILE_SIZE);
        for (let dy = -Math.ceil(viewTileH / 2); dy <= Math.ceil(viewTileH / 2); dy++) {
            for (let dx = -Math.ceil(viewTileW / 2); dx <= Math.ceil(viewTileW / 2); dx++) {
                const tx = playerTX + dx;
                const ty = playerTY + dy;
                const key = `${tx},${ty}`;
                if (!this.exploredTiles.has(key)) {
                    const sx = tx * TILE_SIZE + offsetX;
                    const sy = ty * TILE_SIZE + offsetY;
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
                    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
                }
            }
        }

        // Draw safe zone
        ctx.save();
        ctx.strokeStyle = 'rgba(76, 175, 80, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(offsetX, offsetY, this.safeZoneRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(76, 175, 80, 0.05)';
        ctx.beginPath();
        ctx.arc(offsetX, offsetY, this.safeZoneRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Draw merchant
        if (this.merchant) {
            this.merchant.draw(ctx, offsetX, offsetY);
        }

        // Draw beds
        for (const bed of this.beds) {
            bed.draw(ctx, offsetX, offsetY);
        }

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

        // Draw staff projectiles
        for (const proj of this.staffProjectiles) {
            proj.draw(ctx, offsetX, offsetY);
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

        // Draw achievement notifications
        this.achievements.drawNotification(ctx);

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

        // Draw beds on minimap
        ctx.fillStyle = '#8d6e63';
        for (const bed of this.beds) {
            const dx = Math.floor(bed.x / TILE_SIZE) - centerTileX;
            const dy = Math.floor(bed.y / TILE_SIZE) - centerTileY;
            if (Math.abs(dx) <= viewRadius && Math.abs(dy) <= viewRadius) {
                const sx = mapX + (dx + viewRadius) * tileSize + 2;
                const sy = mapY + (dy + viewRadius) * tileSize + 16;
                ctx.fillRect(sx, sy, tileSize, tileSize);
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

    openChestUI(chest) {
        this.chestUIOpen = true;
        this.activeChest = chest;
        document.getElementById('chestUI').style.display = 'block';
        this.renderChestUI();
    }

    closeChestUI() {
        this.chestUIOpen = false;
        this.activeChest = null;
        document.getElementById('chestUI').style.display = 'none';
    }

    renderChestUI() {
        if (!this.activeChest) return;
        const container = document.getElementById('chestItems');
        container.innerHTML = '';

        // Show stored items
        for (let i = 0; i < this.activeChest.storedItems.length; i++) {
            const item = this.activeChest.storedItems[i];
            const el = document.createElement('div');
            el.style.cssText = 'padding:4px 8px; background:#444; border:1px solid #666; border-radius:3px; cursor:pointer; font-size:11px;';
            el.textContent = item.name;
            el.title = 'Нажми чтобы забрать';
            el.addEventListener('click', () => this.withdrawItem(i));
            container.appendChild(el);
        }

        if (this.activeChest.storedItems.length === 0) {
            const empty = document.createElement('div');
            empty.style.cssText = 'color:#666; font-size:12px; padding:8px;';
            empty.textContent = 'Сундук пуст';
            container.appendChild(empty);
        }

        document.getElementById('chestSelectedSlot').textContent = this.selectedSlot + 1;
    }

    depositItem() {
        if (!this.activeChest) return;
        const item = this.slots[this.selectedSlot];
        if (!item) return;
        // Don't allow depositing starter items
        if (this.selectedSlot === 0 && item.name === 'Меч') return;
        if (this.selectedSlot === 1 && item.name === 'Лук') return;

        this.activeChest.addItem(item);
        this.slots[this.selectedSlot] = null;
        this.player.applyItemStats(this.slots[this.selectedSlot]);
        this.renderChestUI();
        this.audio.playHit();
    }

    withdrawItem(index) {
        if (!this.activeChest) return;
        const item = this.activeChest.removeItem(index);
        if (!item) return;

        // Find first empty slot
        for (let i = 0; i < this.slots.length; i++) {
            if (!this.slots[i]) {
                this.slots[i] = item;
                this.player.applyItemStats(this.slots[this.selectedSlot]);
                this.renderChestUI();
                this.audio.playLevelUp();
                return;
            }
        }
    }

    openMerchantUI() {
        this.merchantUIOpen = true;
        document.getElementById('merchantUI').style.display = 'block';
        this.renderMerchantUI();
    }

    closeMerchantUI() {
        this.merchantUIOpen = false;
        document.getElementById('merchantUI').style.display = 'none';
    }

    renderMerchantUI() {
        if (!this.merchant) return;
        const container = document.getElementById('merchantStock');
        container.innerHTML = '';
        document.getElementById('merchantGold').textContent = this.merchant.gold;

        for (let i = 0; i < this.merchant.stock.length; i++) {
            const item = this.merchant.stock[i];
            const el = document.createElement('div');
            el.style.cssText = 'padding:4px 8px; background:#444; border:1px solid #7b1fa2; border-radius:3px; cursor:pointer; font-size:11px; display:flex; flex-direction:column; align-items:center; min-width:80px;';
            el.innerHTML = `<span>${item.icon} ${item.name}</span><span style="color:#ffd54f; font-size:10px;">${item.cost} монет</span>`;
            el.title = 'Нажми чтобы купить';
            el.addEventListener('click', () => this.buyFromMerchant(i));
            container.appendChild(el);
        }

        if (this.merchant.stock.length === 0) {
            const empty = document.createElement('div');
            empty.style.cssText = 'color:#666; font-size:12px; padding:8px;';
            empty.textContent = 'Товар закончился';
            container.appendChild(empty);
        }

        document.getElementById('merchantSelectedSlot').textContent = this.selectedSlot + 1;
    }

    buyFromMerchant(index) {
        if (!this.merchant) return;
        const result = this.merchant.buyItem(index, this.slots);
        if (!result) {
            this.audio.playPlayerHit();
            return;
        }

        if (result.type === 'potion') {
            const type = result.potionType;
            this.potions.push(new Potion(this.player.x + (Math.random() - 0.5) * 30, this.player.y + (Math.random() - 0.5) * 30, type));
        }

        this.player.applyItemStats(this.slots[this.selectedSlot]);
        this.renderMerchantUI();
        this.audio.playLevelUp();
    }

    sellToMerchant() {
        if (!this.merchant) return;
        const item = this.slots[this.selectedSlot];
        if (!item) return;

        if (this.merchant.sellItem(item, this.slots)) {
            this.slots[this.selectedSlot] = null;
            this.player.applyItemStats(this.slots[this.selectedSlot]);
            this.renderMerchantUI();
            this.audio.playLevelUp();
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
