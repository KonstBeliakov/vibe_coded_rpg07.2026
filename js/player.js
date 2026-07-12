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

        // Attack animation - sword slash arc
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

        // Body - circle with details
        const r = this.size / 2;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(screenX + 2, screenY + 2, r, r * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Main body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, r, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.strokeStyle = '#388e3c';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(screenX - 5, screenY - 3, 4, 0, Math.PI * 2);
        ctx.arc(screenX + 5, screenY - 3, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(screenX - 4, screenY - 2, 2, 0, Math.PI * 2);
        ctx.arc(screenX + 6, screenY - 2, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}
