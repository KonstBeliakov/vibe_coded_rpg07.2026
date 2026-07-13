// ========== Boss Area ==========

class BossArea {
    constructor(x, y, level) {
        this.x = x;
        this.y = y;
        this.radius = TILE_SIZE * 4;
        this.activated = false;
        this.cleared = false;
        this.level = level;
        this.boss = null;
        this.chestSpawned = false;
        this.chest = null;
    }

    isPlayerInside(playerX, playerY) {
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        return Math.sqrt(dx * dx + dy * dy) < this.radius;
    }

    activate(game) {
        if (this.activated || this.cleared) return;
        this.activated = true;

        // Spawn boss at the center of the area
        this.boss = new Boss(this.x, this.y, this.level);
        game.boss = this.boss;
        game.audio.playLevelUp();
        game.particles.emit(this.x, this.y, '#d500f9', 30, 5, 50, 6);
    }

    update(game) {
        if (!this.activated || this.cleared) return;

        // Check if boss is dead
        if (!this.boss || this.boss.health <= 0) {
            this.cleared = true;
            this.boss = null;
            game.boss = null;

            // Spawn chest
            if (!this.chestSpawned) {
                this.chestSpawned = true;
                this.chest = new Chest(this.x, this.y + TILE_SIZE);
                // Add good loot to the chest
                const dist = Math.sqrt(this.x * this.x + this.y * this.y);
                const weapon = Item.generateWeapon(dist + 500); // Better loot
                this.chest.addItem(weapon);
                this.chest.addItem(weapon); // Two items
                game.chests.push(this.chest);
                game.particles.emit(this.x, this.y, '#ffd700', 20, 5, 40, 5);
                game.audio.playLevelUp();
            }
        }
    }

    draw(ctx, offsetX, offsetY) {
        const screenX = this.x + offsetX;
        const screenY = this.y + offsetY;

        if (this.cleared) return;

        // Draw area boundary
        ctx.save();
        ctx.strokeStyle = this.activated ? 'rgba(213, 0, 249, 0.6)' : 'rgba(213, 0, 249, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Fill
        ctx.fillStyle = this.activated ? 'rgba(213, 0, 249, 0.05)' : 'rgba(213, 0, 249, 0.02)';
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Skull icon in center
        if (!this.activated) {
            ctx.fillStyle = 'rgba(213, 0, 249, 0.5)';
            ctx.font = '24px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('💀', screenX, screenY + 8);
            ctx.textAlign = 'left';
        }
    }
}
