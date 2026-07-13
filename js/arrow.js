// ========== Arrow ==========
class Arrow {
    constructor(x, y, targetX, targetY, arrowType = 'normal') {
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
        this.arrowType = arrowType;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
    }

    getShaftColor() {
        switch (this.arrowType) {
            case 'fire': return '#ff6d00';
            case 'ice': return '#00bcd4';
            case 'poison': return '#76ff03';
            default: return '#8d6e63';
        }
    }

    getHeadColor() {
        switch (this.arrowType) {
            case 'fire': return '#ff1744';
            case 'ice': return '#18ffff';
            case 'poison': return '#69f0ae';
            default: return '#bdbdbd';
        }
    }

    getFletchingColor() {
        switch (this.arrowType) {
            case 'fire': return '#ff9100';
            case 'ice': return '#00e5ff';
            case 'poison': return '#b2ff59';
            default: return '#d32f2f';
        }
    }

    getGlowColor() {
        switch (this.arrowType) {
            case 'fire': return 'rgba(255, 109, 0, 0.3)';
            case 'ice': return 'rgba(0, 188, 212, 0.3)';
            case 'poison': return 'rgba(118, 255, 3, 0.3)';
            default: return 'transparent';
        }
    }

    onHit(enemy, game) {
        switch (this.arrowType) {
            case 'fire':
                game.effects.addEffect(EFFECTS.burn, enemy, game);
                break;
            case 'ice':
                game.effects.addEffect(EFFECTS.slow, enemy, game);
                break;
            case 'poison':
                game.effects.addEffect(EFFECTS.poison, enemy, game);
                break;
        }
    }

    draw(ctx, offsetX, offsetY) {
        const screenX = this.x + offsetX;
        const screenY = this.y + offsetY;
        const angle = Math.atan2(this.vy, this.vx);

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(angle);

        // Glow for special arrows
        if (this.arrowType !== 'normal') {
            ctx.fillStyle = this.getGlowColor();
            ctx.beginPath();
            ctx.arc(0, 0, this.size + 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Arrow shaft
        ctx.strokeStyle = this.getShaftColor();
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-this.size, 0);
        ctx.lineTo(this.size, 0);
        ctx.stroke();

        // Arrow head
        ctx.fillStyle = this.getHeadColor();
        ctx.beginPath();
        ctx.moveTo(this.size + 3, 0);
        ctx.lineTo(this.size - 2, -4);
        ctx.lineTo(this.size - 2, 4);
        ctx.closePath();
        ctx.fill();

        // Arrow fletching
        ctx.fillStyle = this.getFletchingColor();
        ctx.beginPath();
        ctx.moveTo(-this.size - 2, 0);
        ctx.lineTo(-this.size + 2, -4);
        ctx.lineTo(-this.size + 2, 4);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }
}

// ========== Staff Projectile ==========
class StaffProjectile {
    constructor(x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.size = 5;
        this.damage = 8;
        this.alive = true;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
    }

    draw(ctx, offsetX, offsetY) {
        const screenX = this.x + offsetX;
        const screenY = this.y + offsetY;

        ctx.save();
        // Glow
        ctx.fillStyle = 'rgba(156, 39, 176, 0.3)';
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size + 3, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = '#9c27b0';
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Inner
        ctx.fillStyle = '#ce93d8';
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
