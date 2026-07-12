// ========== Player ==========
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 3;
        this.size = 24;
        this.color = '#4caf50';
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.baseAttackDamage = 15;
        this.baseAttackRange = 50;
        this.attackDamage = this.baseAttackDamage;
        this.attackRange = this.baseAttackRange;
        this.attackCooldown = 400;
        this.attackTimer = 0;
        this.attackAnimDuration = 200;
        this.attackAnimTimer = 0;
    }

    applyItemStats(item) {
        if (item) {
            this.attackDamage = this.baseAttackDamage + item.attackDamage;
            this.attackRange = this.baseAttackRange + item.attackRange;
        } else {
            this.attackDamage = this.baseAttackDamage;
            this.attackRange = this.baseAttackRange;
        }
    }

    update(keys) {
        let dx = 0, dy = 0;
        if (keys['w'] || keys['W']) dy = -1;
        if (keys['s'] || keys['S']) dy = 1;
        if (keys['a'] || keys['A']) dx = -1;
        if (keys['d'] || keys['D']) dx = 1;

        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        this.x += dx * this.speed;
        this.y += dy * this.speed;

        if (this.attackTimer > 0) this.attackTimer -= 16;
        if (this.attackAnimTimer > 0) this.attackAnimTimer -= 16;
    }

    attack() {
        if (this.attackTimer > 0) return false;
        this.attackTimer = this.attackCooldown;
        this.attackAnimTimer = this.attackAnimDuration;
        return true;
    }

    draw(ctx, offsetX, offsetY) {
        const screenX = this.x + offsetX;
        const screenY = this.y + offsetY;

        if (this.attackAnimTimer > 0) {
            const progress = 1 - this.attackAnimTimer / this.attackAnimDuration;
            const angle = progress * Math.PI * 1.5 - Math.PI * 0.75;

            ctx.save();
            ctx.translate(screenX, screenY);
            ctx.strokeStyle = '#81c784';
            ctx.lineWidth = 3;
            ctx.beginPath();
            const r = this.size / 2 + 5;
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
    }
}
