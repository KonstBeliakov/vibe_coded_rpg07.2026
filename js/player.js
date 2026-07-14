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
        this.walkTimer = 0;
        this.isMoving = false;
        this.facingAngle = 0;
        this.invulnerable = false;
        this.speedMultiplier = 1.0;
        // Hunger system
        this.maxHunger = 100;
        this.hunger = this.maxHunger;
        this.hungerDrainRate = 0.5; // per second at normal activity
        this.hungerDamageThreshold = 20; // below this, start taking damage
        this.hungerDamageRate = 2; // damage per second when starving
        this.healthRegenRate = 2; // HP per second when well-fed (hunger > 50)
        this.healthRegenThreshold = 50;
        // Potion effects
        this.isInvisible = false;
        this.attackDamageMultiplier = 1.0;
        this.regenTimer = 0;
        this.regenInterval = 500;
        this.regenAmount = 1;
        this.regenDuration = 10000;
        this.regenRemaining = 0;
    }

    applyItemStats(item, armorDefense = 0, armorHealthBonus = 0) {
        if (item) {
            this.attackDamage = this.baseAttackDamage + item.attackDamage;
            this.attackRange = this.baseAttackRange + item.attackRange;
        } else {
            this.attackDamage = this.baseAttackDamage;
            this.attackRange = this.baseAttackRange;
        }
        // Apply armor health bonus (doesn't change with weapon switch)
        const baseMaxHealth = 100 + (item && item.maxHealthBonus ? item.maxHealthBonus : 0);
        this.maxHealth = baseMaxHealth + armorHealthBonus;
        this.health = Math.min(this.health, this.maxHealth);
    }

    update(keys) {
        let dx = 0, dy = 0;
        if (keys['w'] || keys['W']) dy = -1;
        if (keys['s'] || keys['S']) dy = 1;
        if (keys['a'] || keys['A']) dx = -1;
        if (keys['d'] || keys['D']) dx = 1;

        this.isMoving = (dx !== 0 || dy !== 0);

        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        if (this.isMoving) {
            this.facingAngle = Math.atan2(dy, dx);
            this.walkTimer += 0.15;
        }

        this.x += dx * this.speed * this.speedMultiplier;
        this.y += dy * this.speed * this.speedMultiplier;

        if (this.attackTimer > 0) this.attackTimer -= 16;
        if (this.attackAnimTimer > 0) this.attackAnimTimer -= 16;
    }

    updateHunger(dt) {
        // Convert dt from ms to seconds
        const seconds = dt / 1000;

        // Drain hunger over time (faster when moving)
        const drainMult = this.isMoving ? 2.0 : 1.0;
        this.hunger -= this.hungerDrainRate * seconds * drainMult;
        if (this.hunger < 0) this.hunger = 0;

        // Starvation damage
        if (this.hunger < this.hungerDamageThreshold) {
            this.health -= this.hungerDamageRate * seconds;
            if (this.health < 0) this.health = 0;
        }

        // Health regen when well-fed
        if (this.hunger > this.healthRegenThreshold && this.health < this.maxHealth) {
            this.health += this.healthRegenRate * seconds;
            if (this.health > this.maxHealth) this.health = this.maxHealth;
        }
    }

    eat(amount) {
        this.hunger = Math.min(this.hunger + amount, this.maxHunger);
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

        // Attack animation - sword slash arc with glow
        if (this.attackAnimTimer > 0) {
            const progress = 1 - this.attackAnimTimer / this.attackAnimDuration;
            const angle = progress * Math.PI * 1.5 - Math.PI * 0.75;

            ctx.save();
            ctx.translate(screenX, screenY);
            ctx.rotate(this.facingAngle);

            // Glow effect
            const alpha = Math.min(1, progress * 2) * (1 - progress);
            ctx.strokeStyle = `rgba(129, 199, 132, ${alpha * 0.3})`;
            ctx.lineWidth = 8;
            ctx.beginPath();
            const r = this.size / 2 + 5;
            const startA = -Math.PI * 0.6;
            const endA = startA + angle;
            ctx.arc(0, 0, r, startA, endA);
            ctx.stroke();

            // Main slash
            ctx.strokeStyle = `rgba(200, 255, 200, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, r, startA, endA);
            ctx.stroke();

            // Tip spark
            const tipX = Math.cos(startA + angle) * r;
            const tipY = Math.sin(startA + angle) * r;
            ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
            ctx.beginPath();
            ctx.arc(tipX, tipY, 3 + alpha * 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        // Walk animation - bobbing
        const bobOffset = this.isMoving ? Math.sin(this.walkTimer) * 2 : 0;
        const scaleX = this.isMoving ? 1 + Math.sin(this.walkTimer * 2) * 0.05 : 1;
        const scaleY = this.isMoving ? 1 - Math.sin(this.walkTimer * 2) * 0.05 : 1;

        const r = this.size / 2;

        ctx.save();
        ctx.translate(screenX, screenY + bobOffset);
        ctx.scale(scaleX, scaleY);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(2, 4, r, r * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Main body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.strokeStyle = '#388e3c';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-5, -3, 4, 0, Math.PI * 2);
        ctx.arc(5, -3, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(-4, -2, 2, 0, Math.PI * 2);
        ctx.arc(6, -2, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
