// ========== Enemy Types ==========
class Enemy {
    constructor(x, y, config) {
        this.x = x;
        this.y = y;
        this.speed = config.speed || 1.2;
        this.size = config.size || 20;
        this.color = config.color || '#e53935';
        this.maxHealth = config.health || 50;
        this.health = this.maxHealth;
        this.attackCooldown = config.attackCooldown || 800;
        this.attackTimer = 0;
        this.attackRange = config.attackRange || 35;
        this.attackDamage = config.attackDamage || 8;
        this.attackAnimDuration = config.attackAnimDuration || 200;
        this.attackAnimTimer = 0;
        this.xpReward = config.xpReward || 10;
        this.type = config.type || 'normal';
    }

    update(playerX, playerY) {
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }

        if (this.attackTimer > 0) this.attackTimer -= 16;
        if (this.attackAnimTimer > 0) this.attackAnimTimer -= 16;
    }

    tryAttack(playerX, playerY) {
        if (this.attackTimer > 0) return false;
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= this.attackRange) {
            this.attackTimer = this.attackCooldown;
            this.attackAnimTimer = this.attackAnimDuration;
            return true;
        }
        return false;
    }

    draw(ctx, offsetX, offsetY) {
        const screenX = this.x + offsetX;
        const screenY = this.y + offsetY;

        if (this.attackAnimTimer > 0) {
            const progress = 1 - this.attackAnimTimer / this.attackAnimDuration;
            const angle = progress * Math.PI * 1.5 - Math.PI * 0.75;
            const dx = this.x - offsetX;
            const dy = this.y - offsetY;
            const baseAngle = Math.atan2(dy, dx);

            ctx.save();
            ctx.translate(screenX, screenY);
            ctx.rotate(baseAngle);
            ctx.strokeStyle = '#ff8a80';
            ctx.lineWidth = 2;
            ctx.beginPath();
            const r = this.size / 2 + 3;
            const startA = -Math.PI * 0.6;
            const endA = startA + angle;
            ctx.arc(0, 0, r, startA, endA);
            ctx.stroke();
            ctx.restore();
        }

        ctx.fillStyle = this.color;
        ctx.fillRect(
            screenX - this.size / 2,
            screenY - this.size / 2,
            this.size,
            this.size
        );

        const barWidth = this.size + 10;
        const barHeight = 4;
        const barX = screenX - barWidth / 2;
        const barY = screenY - this.size / 2 - 10;
        const healthPercent = this.health / this.maxHealth;

        ctx.fillStyle = '#c62828';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    }
}

class FastEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, {
            speed: 2.5,
            size: 16,
            color: '#ff9800',
            health: 30,
            attackCooldown: 600,
            attackRange: 30,
            attackDamage: 5,
            xpReward: 15,
            type: 'fast'
        });
    }
}

class TankEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, {
            speed: 0.7,
            size: 28,
            color: '#7b1fa2',
            health: 150,
            attackCooldown: 1200,
            attackRange: 40,
            attackDamage: 15,
            xpReward: 30,
            type: 'tank'
        });
    }
}

class FlyingEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, {
            speed: 1.8,
            size: 18,
            color: '#00bcd4',
            health: 40,
            attackCooldown: 1000,
            attackRange: 50,
            attackDamage: 7,
            xpReward: 20,
            type: 'flying'
        });
        this.waveOffset = Math.random() * Math.PI * 2;
        this.baseY = y;
    }

    update(playerX, playerY) {
        this.waveOffset += 0.05;
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed + Math.sin(this.waveOffset) * 1.5;
        }

        if (this.attackTimer > 0) this.attackTimer -= 16;
        if (this.attackAnimTimer > 0) this.attackAnimTimer -= 16;
    }
}
