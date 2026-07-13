// ========== Bed ==========
class Bed {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 30;
        this.interactRange = 40;
        this.activated = false;
    }

    activate() {
        this.activated = true;
    }

    draw(ctx, offsetX, offsetY) {
        const sx = this.x + offsetX;
        const sy = this.y + offsetY;

        // Bed body
        ctx.fillStyle = this.activated ? '#66bb6a' : '#8d6e63';
        ctx.fillRect(sx - this.size / 2, sy - this.size / 2, this.size, this.size * 0.6);

        // Pillow
        ctx.fillStyle = this.activated ? '#a5d6a7' : '#a1887f';
        ctx.fillRect(sx - this.size / 2 + 2, sy - this.size / 2 + 2, this.size * 0.3, this.size * 0.4);

        // Blanket line
        ctx.strokeStyle = this.activated ? '#4caf50' : '#6d4c41';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx - this.size / 2, sy + this.size * 0.1);
        ctx.lineTo(sx + this.size / 2, sy + this.size * 0.1);
        ctx.stroke();

        // Label
        ctx.fillStyle = this.activated ? '#a5d6a7' : '#aaa';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this.activated ? '★ Спаун' : 'Кровать', sx, sy + this.size / 2 + 12);
        ctx.textAlign = 'left';
    }
}
