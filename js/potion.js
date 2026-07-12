// ========== Potion ==========
class Potion {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type; // 'health', 'speed'
        this.size = 12;
        this.collected = false;
        this.bobTimer = Math.random() * Math.PI * 2;
    }

    update() {
        this.bobTimer += 0.05;
    }

    apply(player) {
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

        // Bottle
        const color = this.type === 'health' ? '#e53935' : '#42a5f5';
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
