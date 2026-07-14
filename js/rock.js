// ========== Rock ==========

class Rock {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 14;
        this.collected = false;
        this.interactRange = 30;
        this.stoneAmount = 1;
    }

    interact(player) {
        if (this.collected) return false;
        this.collected = true;
        return true; // Signal that it was collected
    }

    draw(ctx, offsetX, offsetY) {
        if (this.collected) return;
        const screenX = this.x + offsetX;
        const screenY = this.y + offsetY;

        // Draw rock as a gray irregular shape
        ctx.fillStyle = '#757575';
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw a lighter highlight
        ctx.fillStyle = '#9e9e9e';
        ctx.beginPath();
        ctx.arc(screenX - 2, screenY - 2, this.size / 4, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size / 2, 0, Math.PI * 2);
        ctx.stroke();
    }
}
