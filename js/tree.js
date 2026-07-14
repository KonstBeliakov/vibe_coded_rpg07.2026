// ========== Tree ==========

class Tree {
    constructor(x, y, isDead = false) {
        this.x = x;
        this.y = y;
        this.size = 20;
        this.isDead = isDead;
        this.collected = false;
        this.interactRange = 30;
        this.woodAmount = 2 + Math.floor(Math.random() * 2); // 2-3 wood
    }

    chop(player) {
        if (this.collected) return false;
        this.collected = true;
        return true; // Signal that it was chopped
    }

    draw(ctx, offsetX, offsetY) {
        if (this.collected) return;
        const screenX = this.x + offsetX;
        const screenY = this.y + offsetY;

        if (this.isDead) {
            // Dead tree (dry) - brown trunk, no leaves
            ctx.fillStyle = '#6d4c41';
            ctx.fillRect(screenX - 3, screenY - this.size / 2, 6, this.size);

            // Branches
            ctx.strokeStyle = '#5d4037';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(screenX - 3, screenY - this.size / 4);
            ctx.lineTo(screenX - 10, screenY - this.size / 2 + 5);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(screenX + 3, screenY - this.size / 4);
            ctx.lineTo(screenX + 10, screenY - this.size / 2 + 5);
            ctx.stroke();
        } else {
            // Living tree - brown trunk with green crown
            ctx.fillStyle = '#5d4037';
            ctx.fillRect(screenX - 3, screenY - this.size / 4, 6, this.size / 2);

            // Crown (leaves)
            ctx.fillStyle = '#388e3c';
            ctx.beginPath();
            ctx.arc(screenX, screenY - this.size / 2 - 4, this.size / 2, 0, Math.PI * 2);
            ctx.fill();

            // Lighter leaves highlight
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(screenX - 3, screenY - this.size / 2 - 6, this.size / 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
