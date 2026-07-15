// ========== Game ==========
class Game {
    constructor(canvasId, uiId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.ui = document.getElementById(uiId);
        this.deathScreen = document.getElementById('deathScreen');
        this.deathStats = document.getElementById('deathStats');
        this.restartBtn = document.getElementById('restartBtn');
        this.resizeCanvas();
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.keys = {};
        this.gameOver = false;

        this.worldSeed = Math.floor(Math.random() * 2147483647);
        this.tileMap = new TileMap(42);
        const spawnPos = this.tileMap.findEmptyTile(0, 0, 5);
        this.player = new Player(spawnPos.x, spawnPos.y);
        this.ensurePlayerSafePosition();
        this.enemies = [];
        this.arrows = [];
        this.staffProjectiles = [];
        this.chests = [];
        this.potions = [];
        this.beds = [];
        this.boss = null;
        this.bossLevelInterval = 5;
        this.bossAreas = [];
        this.spawnBedX = spawnPos.x;
        this.spawnBedY = spawnPos.y;
        this.mouseX = 0;
        this.mouseY = 0;
        this.spawnTimer = 0;
        this.spawnInterval = 4000;
        this.baseSpawnInterval = 4000;
        this.chestSpawnTimer = 0;
        this.chestSpawnInterval = 15000;
        this.playerXP = 0;
        this.playerLevel = 1;
        this.xpToNextLevel = 50;
        this.playerGold = 0;
        this.timeSlowMultiplier = 1.0;
        this.timeSlowTimer = 0;

        // Seed-based generation: track collected/interacted tiles
        this.collectedTiles = new Set();
        this.lavaAnimTimer = Math.random() * Math.PI * 2;

        // Spawner module
        this.spawner = new Spawner(this);

        // Day/night cycle
        this.gameTime = 0; // in ms
        this.dayLength = 120000; // 2 minutes per full day/night cycle
        this.nightStart = this.dayLength * 0.6; // night starts at 60% of cycle
        this.nightEnd = this.dayLength * 0.9; // night ends at 90% of cycle
        this.isNight = false;

        this.settings = new Settings();
        this.particles = new ParticleSystem();
        this.audio = new AudioSystem();
        this.maxEnemies = 12;
        this.chestUI = new ChestUIManager(this);
        this.merchantUI = new MerchantUIManager(this);
        this.achievements = new AchievementSystem();
        this.effects = new EffectManager();
        this.crafting = new CraftingSystem();
        this.craftingUI = new CraftingUIManager(this);
        this.ui = new UIManager(this);
        this.interaction = new InteractionManager(this);
        this.combat = new CombatManager(this);
        this.settingsUI = new SettingsUIManager(this);
        this.skills = SKILL_SLOTS.map(s => ({ key: s.key, skill: s.skill }));
        this.damageFlashTimer = 0;
        this.damageFlashDuration = 300;

        // Fog of War
        this.exploredTiles = new Set();
        this.fogRevealRadius = 6; // tiles

        // Inventory slots
        this.slots = new Array(8).fill(null);
        this.selectedSlot = 0;

        // Armor slots
        this.armorSlots = {
            helmet: null,
            chestplate: null,
            leggings: null
        };
        this.armorDefense = 0;

        // Create items
        this.slots[0] = new Item('Меч', 10, 10, 'no_texture.png');
        this.slots[1] = new Item('Лук', 5, 0, 'no_texture.png');
        this.player.applyItemStats(this.slots[this.selectedSlot], this.armorDefense, this.getArmorHealthBonus());

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

        // Input handling
        window.addEventListener('keydown', (e) => {
            if (this.gameOver) return;
            if (this.settingsUI.isOpen) {
                // Handle key rebinding
                if (this.settingsUI.rebindingAction) {
                    e.preventDefault();
                    this.settings.bindKey(this.settingsUI.rebindingAction, e.key);
                    this.settingsUI.rebindingAction = null;
                    this.settingsUI.render();
                    return;
                }
                if (e.key === 'Escape') {
                    this.settingsUI.close();
                    return;
                }
                return;
            }
            this.keys[e.key] = true;
            if (e.key === this.settings.getKey('attack')) {
                e.preventDefault();
                this.combat.playerAttack();
            }
            if (e.key === this.settings.getKey('interact')) {
                this.interaction.interact();
            }
            if (e.key === 'c' || e.key === 'C') {
                if (this.craftingUI.isOpen) {
                    this.craftingUI.close();
                } else {
                    this.craftingUI.open();
                }
            }
            // Skill keys
            for (const slot of this.skills) {
                if (e.key === slot.key) {
                    slot.skill.use(this.player, this);
                }
            }

            if (e.key === 'q' || e.key === 'Q') {
                if (this.chestUI.isOpen) {
                    this.chestUI.deposit();
                } else if (this.merchantUI.isOpen) {
                    this.merchantUI.sell();
                }
            }
            const num = parseInt(e.key);
            if (num >= 1 && num <= 8) {
                this.selectedSlot = num - 1;
                this.player.applyItemStats(this.slots[this.selectedSlot], this.armorDefense, this.getArmorHealthBonus());
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
            this.player.applyItemStats(this.slots[this.selectedSlot], this.armorDefense, this.getArmorHealthBonus());
        });

        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.width = this.canvas.width;
            this.height = this.canvas.height;
        });

        // Auto-save every 10 seconds
        setInterval(() => this.saveGame(), 10000);

        // Start game loop
        this.lastTime = performance.now();
        this.gameLoop = this.gameLoop.bind(this);
        requestAnimationFrame(this.gameLoop);
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
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

    ensurePlayerSafePosition() {
        this.player.ensureSafePosition(this.tileMap, this.player.size);
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
            this.player.applyItemStats(this.slots[this.selectedSlot], this.armorDefense, this.getArmorHealthBonus());
            // Ensure player is not stuck in a wall after loading
            this.ensurePlayerSafePosition();
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

        // Ensure player is not stuck in a wall after respawn
        this.ensurePlayerSafePosition();

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
        this.player.applyItemStats(this.slots[this.selectedSlot], this.armorDefense, this.getArmorHealthBonus());

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
        this.player.addXP(amount, this);
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
        // 1.0 at spawn (0-500px), increases slowly
        // dist=0 → 1.0, dist=1000 → 1.1, dist=3000 → 1.3, dist=10000 → 2.0
        let mult = 1.0;
        if (dist >= 500) {
            mult = 1.0 + (dist - 500) / 10000;
        }
        // Night modifier - enemies are stronger and faster
        if (this.isNight) {
            mult *= 1.5;
        }
        return mult;
    }

    isInSafeZone(x, y) {
        // Check spawn safe zone
        const dist = Math.sqrt(x * x + y * y);
        if (dist < TILE_SIZE * 5) return true;
        // Check all procedurally generated safe zones
        for (const zone of this.tileMap.safeZones) {
            if (zone.isInside(x, y)) return true;
        }
        return false;
    }

    spawnEnemy() {
        // Don't spawn enemies while player is in a safe zone
        if (this.isInSafeZone(this.player.x, this.player.y)) return;

        // Limit enemies for performance
        if (this.enemies.length >= this.maxEnemies) return;

        const diffMult = this.getDifficultyMultiplier();
        const distFromSpawn = Math.sqrt(this.player.x * this.player.x + this.player.y * this.player.y);

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

        // Base stats - lower near spawn
        const baseSpeed = 0.5 + this.playerLevel * 0.02;
        const baseHealth = 25 + this.playerLevel * 6;
        const baseDamage = 3 + this.playerLevel * 1.0;
        const baseXP = 8 + this.playerLevel * 2;

        // Check biome for special enemy types
        const enemyTileX = Math.floor(x / TILE_SIZE);
        const enemyTileY = Math.floor(y / TILE_SIZE);
        const biome = this.tileMap.getBiome(enemyTileX, enemyTileY);
        const roll = Math.random();
        let enemy;

        // Biome-specific enemies
        if (biome === BIOME_DESERT && distFromSpawn > 200 && roll < 0.4) {
            enemy = new DesertSkeleton(x, y);
            enemy.speed *= diffMult * 0.9;
            enemy.health *= diffMult * 0.9;
            enemy.attackDamage *= diffMult * 0.9;
            enemy.xpReward = Math.floor(enemy.xpReward * diffMult);
        } else if (biome === BIOME_SWAMP && distFromSpawn > 200 && roll < 0.4) {
            enemy = new SwampSlime(x, y);
            enemy.speed *= diffMult * 0.9;
            enemy.health *= diffMult * 0.9;
            enemy.attackDamage *= diffMult * 0.9;
            enemy.xpReward = Math.floor(enemy.xpReward * diffMult);
        } else if (biome === BIOME_MAGIC && distFromSpawn > 400 && roll < 0.35) {
            enemy = new MagicGolem(x, y);
            enemy.speed *= diffMult * 0.8;
            enemy.health *= diffMult * 1.1;
            enemy.attackDamage *= diffMult * 1.0;
            enemy.xpReward = Math.floor(enemy.xpReward * diffMult);
        } else {
            // Special enemy types only appear at certain distances
            const canSpawnFast = distFromSpawn > 300;
            const canSpawnTank = distFromSpawn > 600;
            const canSpawnFlying = distFromSpawn > 1000;

            if (roll < 0.5 || (!canSpawnFast && !canSpawnTank && !canSpawnFlying)) {
                // Normal enemy - always available
                enemy = new Enemy(x, y, {
                    speed: baseSpeed * diffMult,
                    health: baseHealth * diffMult,
                    attackDamage: baseDamage * diffMult,
                    xpReward: Math.floor(baseXP * diffMult),
                    type: 'normal'
                });
            } else if (roll < 0.7 && canSpawnFast) {
                enemy = new FastEnemy(x, y);
                enemy.speed *= diffMult * 0.9;
                enemy.health *= diffMult * 0.8;
                enemy.attackDamage *= diffMult * 0.8;
                enemy.xpReward = Math.floor(enemy.xpReward * diffMult);
            } else if (roll < 0.85 && canSpawnTank) {
                enemy = new TankEnemy(x, y);
                enemy.speed *= diffMult * 0.8;
                enemy.health *= diffMult * 1.2;
                enemy.attackDamage *= diffMult * 0.9;
                enemy.xpReward = Math.floor(enemy.xpReward * diffMult);
            } else if (canSpawnFlying) {
                enemy = new FlyingEnemy(x, y);
                enemy.speed *= diffMult * 0.85;
                enemy.health *= diffMult * 0.7;
                enemy.attackDamage *= diffMult * 0.7;
                enemy.xpReward = Math.floor(enemy.xpReward * diffMult);
            } else {
                // Fallback to normal
                enemy = new Enemy(x, y, {
                    speed: baseSpeed * diffMult,
                    health: baseHealth * diffMult,
                    attackDamage: baseDamage * diffMult,
                    xpReward: Math.floor(baseXP * diffMult),
                    type: 'normal'
                });
            }
        }
        this.enemies.push(enemy);
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

        // Update time slow effect
        if (this.timeSlowTimer > 0) {
            this.timeSlowTimer -= dt;
            if (this.timeSlowTimer <= 0) {
                this.timeSlowMultiplier = 1.0;
            }
        }

        for (const enemy of this.enemies) {
            // Push enemies out of safe zones
            // Check spawn safe zone
            const enemyDistFromSpawn = Math.sqrt(enemy.x * enemy.x + enemy.y * enemy.y);
            if (enemyDistFromSpawn < TILE_SIZE * 5) {
                const angle = Math.atan2(enemy.y, enemy.x);
                const pushDist = TILE_SIZE * 5 - enemyDistFromSpawn + 5;
                enemy.x += Math.cos(angle) * pushDist;
                enemy.y += Math.sin(angle) * pushDist;
            }
            // Check all other safe zones
            for (const zone of this.tileMap.safeZones) {
                const result = zone.pushOut(enemy.x, enemy.y, 5);
                if (result) {
                    enemy.x = result.x;
                    enemy.y = result.y;
                }
            }

            // Apply time slow to enemy update
            const originalSpeed = enemy.speed;
            enemy.speed *= this.timeSlowMultiplier;
            enemy.update(this.player.x, this.player.y, this.tileMap, this.player);
            enemy.speed = originalSpeed;
            if (enemy.tryAttack(this.player.x, this.player.y)) {
                this.player.takeDamage(enemy.attackDamage, this.armorDefense);
                this.damageFlashTimer = this.damageFlashDuration;
                this.audio.playPlayerHit();
                this.particles.emit(this.player.x, this.player.y, '#ff1744', 10, 3, 20, 3);
            }
        }

        // Update boss areas
        for (const area of this.bossAreas) {
            if (!area.activated && area.isPlayerInside(this.player.x, this.player.y)) {
                area.activate(this);
            }
            area.update(this);
        }

        // Update boss
        if (this.boss) {
            this.boss.update(this.player.x, this.player.y);
            if (this.boss.tryAttack(this.player.x, this.player.y)) {
                this.player.takeDamage(this.boss.attackDamage, this.armorDefense);
                this.audio.playPlayerHit();
                this.particles.emit(this.player.x, this.player.y, '#d500f9', 15, 4, 30, 4);
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

        // Update damage flash
        if (this.damageFlashTimer > 0) {
            this.damageFlashTimer -= dt;
        }

        // Update day/night cycle
        this.gameTime = (this.gameTime + dt) % this.dayLength;
        const wasNight = this.isNight;
        this.isNight = this.gameTime >= this.nightStart && this.gameTime < this.nightEnd;
        if (this.isNight && !wasNight) {
            // Night just started - show notification
            this.particles.emit(this.player.x, this.player.y, '#1a237e', 15, 4, 30, 4);
        }

        // Update hunger system
        this.player.updateHunger(dt);

        // Update regen effect
        if (this.player.regenRemaining > 0) {
            this.player.regenTimer += dt;
            this.player.regenRemaining -= dt;
            if (this.player.regenTimer >= this.player.regenInterval) {
                this.player.regenTimer = 0;
                this.player.health = Math.min(this.player.health + this.player.regenAmount, this.player.maxHealth);
                this.particles.emit(this.player.x, this.player.y, '#4caf50', 3, 1, 10, 2);
            }
            if (this.player.regenRemaining <= 0) {
                this.player.regenRemaining = 0;
            }
        }

        // Update skills
        for (const slot of this.skills) {
            slot.skill.update(dt, this.player, this);
        }

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
                this.spawner.spawnChest();
            }
        }

        // Ensure each safe zone has a bed and storage chest
        this.spawner.ensureSafeZoneFurniture();

        // Update lava animation timer
        this.lavaAnimTimer += 0.05;

        // Apply lava damage (seed-based)
        const playerTileX = Math.floor(this.player.x / TILE_SIZE);
        const playerTileY = Math.floor(this.player.y / TILE_SIZE);
        const biome = this.tileMap.getBiome(playerTileX, playerTileY);
        if (biome === BIOME_LAVA && LavaPool.hasAt(playerTileX, playerTileY, this.worldSeed)) {
            const now = performance.now();
            if (!this._lastLavaDamage) this._lastLavaDamage = 0;
            if (now - this._lastLavaDamage > 500) {
                this._lastLavaDamage = now;
                this.player.health -= 15;
                if (this.player.health < 0) this.player.health = 0;
                this.particles.emit(this.player.x, this.player.y, '#ff6d00', 5, 2, 15, 3);
            }
        }

        // Apply thorn flower damage (seed-based)
        if (biome === BIOME_MOSSY && Flower.hasAt(playerTileX, playerTileY, this.worldSeed) && Flower.isThornAt(playerTileX, playerTileY, this.worldSeed)) {
            const key = `${playerTileX},${playerTileY}`;
            if (!this.collectedTiles.has(key)) {
                const now = performance.now();
                if (!this._lastThornDamage) this._lastThornDamage = 0;
                if (now - this._lastThornDamage > 1000) {
                    this._lastThornDamage = now;
                    this.player.health -= 3;
                    if (this.player.health < 0) this.player.health = 0;
                    this.particles.emit(this.player.x, this.player.y, '#e53935', 3, 1, 10, 2);
                }
            }
        }

        // Apply web slow effect (seed-based)
        let webSlow = 1.0;
        if (biome === BIOME_WEB && Web.hasAt(playerTileX, playerTileY, this.worldSeed)) {
            // Check if near a wall (webs only near walls)
            let nearWall = false;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    if (this.tileMap.isWall(playerTileX + dx, playerTileY + dy)) {
                        nearWall = true;
                        break;
                    }
                }
                if (nearWall) break;
            }
            if (nearWall) {
                webSlow = 0.2;
            }
        }
        this.player.speedMultiplier = webSlow;

        // Update achievements
        this.achievements.addLevel(this.playerLevel);
        const distFromSpawn = Math.sqrt(this.player.x * this.player.x + this.player.y * this.player.y);
        this.achievements.updateDistance(distFromSpawn);

        // Update fog of war
        const fogTileX = Math.floor(this.player.x / TILE_SIZE);
        const fogTileY = Math.floor(this.player.y / TILE_SIZE);
        for (let dy = -this.fogRevealRadius; dy <= this.fogRevealRadius; dy++) {
            for (let dx = -this.fogRevealRadius; dx <= this.fogRevealRadius; dx++) {
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= this.fogRevealRadius) {
                    this.exploredTiles.add(`${fogTileX + dx},${fogTileY + dy}`);
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

        // Draw safe zones
        // Draw spawn safe zone
        ctx.save();
        ctx.strokeStyle = 'rgba(76, 175, 80, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(offsetX, offsetY, TILE_SIZE * 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(76, 175, 80, 0.05)';
        ctx.beginPath();
        ctx.arc(offsetX, offsetY, TILE_SIZE * 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Draw all procedurally generated safe zones
        for (const zone of this.tileMap.safeZones) {
            zone.draw(ctx, offsetX, offsetY);
        }

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

        // Draw seed-based world objects (trees, rocks, flowers, webs, lava)
        this.drawWorldObjects(ctx, offsetX, offsetY);

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

        // Draw boss areas
        for (const area of this.bossAreas) {
            area.draw(ctx, offsetX, offsetY);
        }

        // Draw boss
        if (this.boss) {
            this.boss.draw(ctx, offsetX, offsetY);
        }

        this.player.draw(ctx, offsetX, offsetY);

        this.particles.draw(ctx, offsetX, offsetY);

        // Draw UI overlay
        this.ui.draw();
    }

    drawWorldObjects(ctx, offsetX, offsetY) {
        const startX = Math.floor(-offsetX / TILE_SIZE) - 1;
        const startY = Math.floor(-offsetY / TILE_SIZE) - 1;
        const endX = startX + Math.ceil(ctx.canvas.width / TILE_SIZE) + 2;
        const endY = startY + Math.ceil(ctx.canvas.height / TILE_SIZE) + 2;

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const key = `${x},${y}`;
                const isCollected = this.collectedTiles.has(key);
                const biome = this.tileMap.getBiome(x, y);
                const isWall = this.tileMap.isWall(x, y);

                // Skip walls - objects only on empty tiles
                if (isWall) continue;

                // Trees in normal and mossy biomes
                if ((biome === BIOME_NORMAL || biome === BIOME_MOSSY) && Tree.hasAt(x, y, this.worldSeed)) {
                    if (!isCollected) {
                        const isDead = biome === BIOME_NORMAL;
                        Tree.drawAt(ctx, offsetX, offsetY, x, y, isDead);
                    }
                    continue; // Only one object per tile
                }

                // Rocks in normal and web biomes
                if ((biome === BIOME_NORMAL || biome === BIOME_WEB) && Rock.hasAt(x, y, this.worldSeed)) {
                    if (!isCollected) {
                        Rock.drawAt(ctx, offsetX, offsetY, x, y);
                    }
                    continue;
                }

                // Flowers in mossy biome
                if (biome === BIOME_MOSSY && Flower.hasAt(x, y, this.worldSeed)) {
                    if (!isCollected) {
                        const isThorn = Flower.isThornAt(x, y, this.worldSeed);
                        Flower.drawAt(ctx, offsetX, offsetY, x, y, isThorn);
                    }
                    continue;
                }

                // Webs in web biome (near walls)
                if (biome === BIOME_WEB && Web.hasAt(x, y, this.worldSeed)) {
                    let nearWall = false;
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (dx === 0 && dy === 0) continue;
                            if (this.tileMap.isWall(x + dx, y + dy)) {
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
                if (biome === BIOME_LAVA && LavaPool.hasAt(x, y, this.worldSeed)) {
                    LavaPool.drawAt(ctx, offsetX, offsetY, x, y, this.lavaAnimTimer);
                    continue;
                }
            }
        }
    }

    getArmorHealthBonus() {
        let total = 0;
        for (const slot of ['helmet', 'chestplate', 'leggings']) {
            const armor = this.armorSlots[slot];
            if (armor) {
                total += armor.maxHealthBonus || 0;
            }
        }
        return total;
    }

    updateArmorStats() {
        let totalDefense = 0;
        let totalHealthBonus = 0;
        for (const slot of ['helmet', 'chestplate', 'leggings']) {
            const armor = this.armorSlots[slot];
            if (armor) {
                totalDefense += armor.defense || 0;
                totalHealthBonus += armor.maxHealthBonus || 0;
            }
        }
        this.armorDefense = totalDefense;
        // Apply health bonus
        const baseMaxHealth = 100 + (this.playerLevel - 1) * 20;
        this.player.maxHealth = baseMaxHealth + totalHealthBonus;
        this.player.health = Math.min(this.player.health, this.player.maxHealth);
    }

    gameLoop(time) {
        const dt = time - this.lastTime;
        this.lastTime = time;

        this.update(dt);
        this.draw();

        requestAnimationFrame(this.gameLoop);
    }
}
