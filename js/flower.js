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
