// ========== Potion ==========
class Potion {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'health', 'speed', 'invisibility', 'regen', 'attack_boost', 'slow_time'
        this.size = 12;
        this.collected = false;
        this.bobTimer = Math.random() * Math.PI * 2;
    }

    update() {
        this.bobTimer += 0.05;
    }

    apply(player, game) {
        if (this.collected) return;
        this.collected = true;
        switch (this.type) {
            case 'health':
                player.health = Math.min(player.health + 30, player.maxHealth);
                break;
            case 'speed':
                player.speed += 0.5;
                setTimeout(() => { player.speed -= 0.5; }, 5000);
                break;
            case 'invisibility':
                // Make player invisible for 5 seconds (enemies won't target them)
                player.isInvisible = true;
                setTimeout(() => { player.isInvisible = false; }, 5000);
                if (game) game.particles.emit(player.x, player.y, '#e0e0e0', 10, 3, 25, 4);
                break;
            case 'regen':
                // Regenerate 2 HP per second for 10 seconds
                player.regenTimer = 0;
                player.regenInterval = 500; // every 0.5s
                player.regenAmount = 1; // 1 HP per tick = 2 HP/s
                player.regenDuration = 10000; // 10 seconds
                player.regenRemaining = 10000;
                if (game) game.particles.emit(player.x, player.y, '#4caf50', 10, 3, 25, 4);
                break;
            case 'attack_boost':
                // +50% attack damage for 8 seconds
                player.attackDamageMultiplier = 1.5;
                setTimeout(() => { player.attackDamageMultiplier = 1.0; }, 8000);
                if (game) game.particles.emit(player.x, player.y, '#ff6d00', 10, 3, 25, 4);
                break;
            case 'slow_time':
                // Slow down enemies for 5 seconds (reduce their speed globally)
                if (game) {
                    game.timeSlowMultiplier = 0.5;
                    game.timeSlowTimer = 5000;
                    game.particles.emit(player.x, player.y, '#00bcd4', 15, 4, 30, 5);
                }
                break;
        }
    }

    draw(ctx, offsetX, offsetY) {
        if (this.collected) return;
        const screenX = this.x + offsetX;
        const screenY = this.y + offsetY + Math.sin(this.bobTimer) * 2;
        const r = this.size / 2;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(screenX + 1, screenY + r + 2, r, r * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bottle color based on type
        const colorMap = {
            'health': '#e53935',
            'speed': '#42a5f5',
            'invisibility': '#e0e0e0',
            'regen': '#4caf50',
            'attack_boost': '#ff6d00',
            'slow_time': '#00bcd4'
        };
        const color = colorMap[this.type] || '#e53935';
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(screenX - r, screenY - r, this.size, this.size, 3);
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(screenX - r + 2, screenY - r + 2, 4, this.size - 4);

        // Neck
        ctx.fillStyle = color;
        ctx.fillRect(screenX - 3, screenY - r - 4, 6, 5);

        // Cork
        ctx.fillStyle = '#8d6e63';
        ctx.fillRect(screenX - 4, screenY - r - 6, 8, 3);
    }
}
