// ========== Safe Zone ==========

class SafeZone {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius || TILE_SIZE * 5;
        this.bed = null;
        this.chest = null;
        this.merchant = null;
    }

    isInside(entityX, entityY) {
        const dx = entityX - this.x;
        const dy = entityY - this.y;
        return Math.sqrt(dx * dx + dy * dy) < this.radius;
    }

    pushOut(entityX, entityY, margin) {
        const dx = entityX - this.x;
        const dy = entityY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.radius) {
            const angle = Math.atan2(dy, dx);
            const pushDist = this.radius - dist + (margin || 5);
            return {
                x: entityX + Math.cos(angle) * pushDist,
                y: entityY + Math.sin(angle) * pushDist
            };
        }
        return null;
    }

    draw(ctx, offsetX, offsetY) {
        const screenX = this.x + offsetX;
        const screenY = this.y + offsetY;

        ctx.save();
        ctx.strokeStyle = 'rgba(76, 175, 80, 0.3)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(76, 175, 80, 0.05)';
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
