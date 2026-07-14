// ========== Lava Pool ==========

class LavaPool {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size || TILE_SIZE; // Size in pixels
        this.damage = 15; // Damage per tick
        this.damageCooldown = 500; // ms between damage ticks
        this.lastDamageTime = 0;
        this.animTimer = Math.random() * Math.PI * 2;
    }

    isPlayerOnLava(player) {
        const half = player.size / 2;
        // Check if player's bounding box overlaps with lava pool
        const left = this.x;
        const right = this.x + this.size;
        const top = this.y;
        const bottom = this.y + this.size;

        const pLeft = player.x - half;
        const pRight = player.x + half;
        const pTop = player.y - half;
        const pBottom = player.y + half;

        return pLeft < right && pRight > left && pTop < bottom && pBottom > top;
    }

    applyDamage(player, currentTime) {
        if (currentTime - this.lastDamageTime < this.damageCooldown) return false;
        if (!this.isPlayerOnLava(player)) return false;

        this.lastDamageTime = currentTime;
        player.health -= this.damage;
        if (player.health < 0) player.health = 0;
        return true;
    }

    draw(ctx, offsetX, offsetY) {
        const screenX = this.x + offsetX;
        const screenY = this.y + offsetY;

        this.animTimer += 0.05;

        // Draw lava pool with animated glow
        const pulse = Math.sin(this.animTimer) * 0.15 + 0.85;

        // Main lava body
        ctx.fillStyle = `rgba(255, 80, 0, ${0.7 * pulse})`;
        ctx.fillRect(screenX, screenY, this.size, this.size);

        // Inner glow
        ctx.fillStyle = `rgba(255, 150, 0, ${0.4 * pulse})`;
        ctx.fillRect(screenX + 3, screenY + 3, this.size - 6, this.size - 6);

        // Center bright spot
        ctx.fillStyle = `rgba(255, 200, 50, ${0.3 * pulse})`;
        ctx.fillRect(screenX + 6, screenY + 6, this.size - 12, this.size - 12);

        // Border
        ctx.strokeStyle = `rgba(255, 60, 0, ${0.5 * pulse})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX, screenY, this.size, this.size);
    }
}
