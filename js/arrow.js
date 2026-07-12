// ========== Arrow ==========
class Arrow {
    constructor(x, y, targetX, targetY) {
        this.x = x;
        this.y = y;
        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        this.vx = (dx / dist) * 8;
        this.vy = (dy / dist) * 8;
        this.size = 6;
        this.damage = 12;
        this.alive = true;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
    }

    draw(ctx, offsetX, offsetY) {
        const screenX = this.x + offsetX;
        const screenY = this.y + offsetY;
        const angle = Math.atan2(this.vy, this.vx);

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(angle);

        // Arrow shaft
        ctx.strokeStyle = '#8d6e63';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-this.size, 0);
        ctx.lineTo(this.size, 0);
        ctx.stroke();

        // Arrow head
        ctx.fillStyle = '#bdbdbd';
        ctx.beginPath();
        ctx.moveTo(this.size + 3, 0);
        ctx.lineTo(this.size - 2, -4);
        ctx.lineTo(this.size - 2, 4);
        ctx.closePath();
        ctx.fill();

        // Arrow fletching
        ctx.fillStyle = '#d32f2f';
        ctx.beginPath();
        ctx.moveTo(-this.size - 2, 0);
        ctx.lineTo(-this.size + 2, -4);
        ctx.lineTo(-this.size + 2, 4);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}
