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
        ctx.fillStyle = '#ffd54f';
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(Math.atan2(this.vy, this.vx));
        ctx.fillRect(-this.size, -2, this.size * 2, 4);
        ctx.restore();
    }
}
