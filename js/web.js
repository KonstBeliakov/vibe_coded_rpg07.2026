// ========== Web (spider web) ==========

class Web {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = TILE_SIZE;
        this.slowFactor = 0.2; // Reduce speed to 20%
    }

    draw(ctx, offsetX, offsetY) {
        const screenX = this.x + offsetX;
        const screenY = this.y + offsetY;

        // Draw web as a semi-transparent white spider web pattern
        ctx.save();
        ctx.strokeStyle = 'rgba(200, 200, 220, 0.3)';
        ctx.lineWidth = 1;

        // Draw radial lines
        const cx = screenX + this.size / 2;
        const cy = screenY + this.size / 2;
        const radius = this.size / 2 - 2;

        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
            ctx.stroke();
        }

        // Draw concentric circles
        for (let r = radius / 3; r <= radius; r += radius / 3) {
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }
}
