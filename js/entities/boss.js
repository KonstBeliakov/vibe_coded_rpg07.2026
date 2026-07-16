// ========== Boss ==========
class Boss {
    constructor(x, y, level) {
        this.x = x;
        this.y = y;
        this.size = 48;
        this.color = '#8e24aa';
        this.speed = 0.8 + level * 0.02;
        this.maxHealth = 300 + level * 50;
        this.health = this.maxHealth;
        this.attackDamage = 20 + level * 3;
        this.attackRange = 60;
        this.attackCooldown = 1500;
        this.attackTimer = 0;
        this.xpReward = 100 + level * 20;
        this.type = 'boss';
        this.phase = 1; // 1 or 2 (enrage at 50% HP)
        this.chargeTimer = 0;
        this.isCharging = false;
        this.chargeTargetX = 0;
        this.chargeTargetY = 0;
        this.chargeSpeed = 6;
        this.pulseTimer = 0;
    }

    update(playerX, playerY) {
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        this.pulseTimer += 0.05;

        // Check phase change
        if (this.health < this.maxHealth * 0.5 && this.phase === 1) {
            this.phase = 2;
            this.speed *= 1.3;
            this.attackCooldown = 1000;
            this.color = '#d500f9';
        }

        // Charge attack (phase 2)
        if (this.phase === 2 && this.chargeTimer <= 0 && dist > this.attackRange && dist < 300) {
            if (Math.random() < 0.02) {
                this.isCharging = true;
                this.chargeTargetX = playerX;
                this.chargeTargetY = playerY;
                this.chargeTimer = 800;
            }
        }

        if (this.isCharging) {
            this.chargeTimer -= 16;
            const cdx = this.chargeTargetX - this.x;
            const cdy = this.chargeTargetY - this.y;
            const cDist = Math.sqrt(cdx * cdx + cdy * cdy);
            if (cDist > 5) {
                this.x += (cdx / cDist) * this.chargeSpeed;
                this.y += (cdy / cDist) * this.chargeSpeed;
            }
            if (this.chargeTimer <= 0) {
                this.isCharging = false;
            }
        } else {
            // Move toward player
            if (dist > this.attackRange * 0.8) {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
            }
        }

        if (this.attackTimer > 0) this.attackTimer -= 16;
    }

    tryAttack(playerX, playerY) {
        if (this.attackTimer > 0) return false;
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= this.attackRange) {
            this.attackTimer = this.attackCooldown;
            return true;
        }
        return false;
    }

    draw(ctx, offsetX, offsetY) {
        const screenX = this.x + offsetX;
        const screenY = this.y + offsetY;
        const r = this.size / 2;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(screenX + 3, screenY + r + 5, r, r * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pulse effect
        const pulse = Math.sin(this.pulseTimer) * 3;
        ctx.save();
        ctx.translate(screenX, screenY);

        // Crown
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(-r + 5, -r - 5);
        ctx.lineTo(-r + 5, -r - 15);
        ctx.lineTo(-r + 12, -r - 8);
        ctx.lineTo(-r + 19, -r - 18);
        ctx.lineTo(-r + 26, -r - 8);
        ctx.lineTo(-r + 33, -r - 15);
        ctx.lineTo(-r + 33, -r - 5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#ff8f00';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Body (hexagon)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            const px = Math.cos(angle) * (r + pulse);
            const py = Math.sin(angle) * (r + pulse);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#4a148c';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Eyes (angry)
        ctx.fillStyle = '#ff1744';
        ctx.beginPath();
        ctx.arc(-8, -5, 5, 0, Math.PI * 2);
        ctx.arc(8, -5, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-7, -4, 2.5, 0, Math.PI * 2);
        ctx.arc(9, -4, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Angry eyebrows
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-14, -14);
        ctx.lineTo(-5, -10);
        ctx.moveTo(14, -14);
        ctx.lineTo(5, -10);
        ctx.stroke();

        // Mouth
        ctx.fillStyle = '#000';
        ctx.fillRect(-8, 6, 16, 4);
        ctx.fillRect(-6, 10, 12, 2);

        ctx.restore();

        // Health bar
        const barWidth = this.size + 10;
        const barHeight = 6;
        const barX = screenX - barWidth / 2;
        const barY = screenY - r - 25;

        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = '#e53935';
        ctx.fillRect(barX + 1, barY + 1, (barWidth - 2) * (this.health / this.maxHealth), barHeight - 2);

        // Boss label
        ctx.fillStyle = '#ffd700';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('БОСС', screenX, barY - 4);
        ctx.textAlign = 'left';
    }
}
