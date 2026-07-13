// ========== Skills System ==========

class Skill {
    constructor(name, cooldown, duration, icon, color, activate) {
        this.name = name;
        this.cooldown = cooldown;
        this.duration = duration;
        this.icon = icon;
        this.color = color;
        this.activate = activate;
        this.currentCooldown = 0;
        this.activeTimer = 0;
        this.isActive = false;
    }

    canUse() {
        return this.currentCooldown <= 0 && !this.isActive;
    }

    use(player, game) {
        if (!this.canUse()) return false;
        this.currentCooldown = this.cooldown;
        this.activeTimer = this.duration;
        this.isActive = true;
        this.activate(player, game);
        return true;
    }

    update(dt, player, game) {
        if (this.currentCooldown > 0) {
            this.currentCooldown -= dt;
        }
        if (this.activeTimer > 0) {
            this.activeTimer -= dt;
            if (this.activeTimer <= 0) {
                this.isActive = false;
                this.onDeactivate(player, game);
            }
        }
    }

    onDeactivate(player, game) {
        // Override in subclasses
    }

    getCooldownPercent() {
        if (this.currentCooldown <= 0) return 0;
        return this.currentCooldown / this.cooldown;
    }

    getActivePercent() {
        if (this.activeTimer <= 0) return 0;
        return this.activeTimer / this.duration;
    }
}

// Shield skill - temporary invulnerability
class ShieldSkill extends Skill {
    constructor() {
        super('Щит', 8000, 2000, '🛡️', '#42a5f5', (player, game) => {
            player.invulnerable = true;
            game.particles.emit(player.x, player.y, '#42a5f5', 15, 3, 25, 3);
        });
    }

    onDeactivate(player, game) {
        player.invulnerable = false;
        if (game) game.particles.emit(player.x, player.y, '#42a5f5', 10, 3, 20, 3);
    }
}

// Dash skill - quick movement
class DashSkill extends Skill {
    constructor() {
        super('Рывок', 5000, 300, '💨', '#ff9800', (player, game) => {
            const dx = Math.cos(player.facingAngle) * 80;
            const dy = Math.sin(player.facingAngle) * 80;
            player.x += dx;
            player.y += dy;
            game.particles.emit(player.x, player.y, '#ff9800', 20, 4, 30, 4);
        });
    }
}

// Fireball skill - AoE attack
class FireballSkill extends Skill {
    constructor() {
        super('Огненный шар', 6000, 0, '🔥', '#e53935', (player, game) => {
            const px = player.x;
            const py = player.y;
            const range = 120;
            const damage = 20 + player.attackDamage;

            // Damage all enemies in range
            for (let i = game.enemies.length - 1; i >= 0; i--) {
                const enemy = game.enemies[i];
                const dx = enemy.x - px;
                const dy = enemy.y - py;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= range) {
                    enemy.health -= damage;
                    game.particles.emit(enemy.x, enemy.y, '#ff6d00', 12, 4, 25, 4);
                    if (enemy.health <= 0) {
                        game.addXP(enemy.xpReward);
                        game.audio.playEnemyDeath();
                        game.particles.emit(enemy.x, enemy.y, enemy.color, 15, 4, 30, 4);
                        game.enemies.splice(i, 1);
                    }
                }
            }

            // Damage boss
            if (game.boss) {
                const dx = game.boss.x - px;
                const dy = game.boss.y - py;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist <= range) {
                    game.boss.health -= damage;
                    game.particles.emit(game.boss.x, game.boss.y, '#d500f9', 15, 4, 30, 4);
                    if (game.boss.health <= 0) {
                        game.addXP(game.boss.xpReward);
                        game.audio.playEnemyDeath();
                        game.particles.emit(game.boss.x, game.boss.y, '#ffd700', 30, 5, 50, 6);
                        game.boss = null;
                    }
                }
            }

            // Visual effect
            game.particles.emit(px, py, '#ff6d00', 30, 5, 50, 5);
            game.audio.playShoot();
        });
    }
}

// Skill slots
const SKILL_SLOTS = [
    { key: 'q', skill: new ShieldSkill() },
    { key: 'e', skill: new DashSkill() },
    { key: 'r', skill: new FireballSkill() }
];
