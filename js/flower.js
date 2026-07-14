// ========== Flower ==========

class Flower {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 12;
        this.collected = false;
        this.interactRange = 30;
        this.healAmount = 5;
    }

    interact(player) {
        if (this.collected) return false;
        this.collected = true;
        player.health = Math.min(player.health + this.healAmount, player.maxHealth);
        // Also restore some hunger
        if (player.eat) {
            player.eat(15);
        }
        return true;
    }

    draw(ctx, offsetX, offsetY) {
        if (this.collected) return;
        const screenX = this.x + offsetX;
        const screenY = this.y + offsetY;

        // Draw flower as a small blue circle
        ctx.fillStyle = '#42a5f5';
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw a small center
        ctx.fillStyle = '#90caf9';
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size / 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ========== Thorn Flower (red, damages player but gives essence) ==========

class ThornFlower {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 14;
        this.collected = false;
        this.interactRange = 30;
        this.damageAmount = 3;
        this.essenceReward = 1;
        this.damageCooldown = 1000; // ms between damage ticks
        this.lastDamageTime = 0;
    }

    interact(player) {
        if (this.collected) return false;
        this.collected = true;
        return true; // Signal that it was collected
    }

    applyDamage(player, currentTime) {
        if (this.collected) return false;
        if (currentTime - this.lastDamageTime < this.damageCooldown) return false;

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.interactRange + player.size / 2) {
            this.lastDamageTime = currentTime;
            player.health -= this.damageAmount;
            if (player.health < 0) player.health = 0;
            return true; // Damage was applied
        }
        return false;
    }

    draw(ctx, offsetX, offsetY) {
        if (this.collected) return;
        const screenX = this.x + offsetX;
        const screenY = this.y + offsetY;

        // Draw thorn flower as a red circle with spikes
        ctx.fillStyle = '#e53935';
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw spikes around the flower
        ctx.strokeStyle = '#b71c1c';
        ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const innerR = this.size / 2 - 2;
            const outerR = this.size / 2 + 4;
            ctx.beginPath();
            ctx.moveTo(
                screenX + Math.cos(angle) * innerR,
                screenY + Math.sin(angle) * innerR
            );
            ctx.lineTo(
                screenX + Math.cos(angle) * outerR,
                screenY + Math.sin(angle) * outerR
            );
            ctx.stroke();
        }

        // Draw a small dark center
        ctx.fillStyle = '#b71c1c';
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size / 5, 0, Math.PI * 2);
        ctx.fill();
    }
}
