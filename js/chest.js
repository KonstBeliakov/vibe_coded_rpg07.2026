// ========== Chest ==========
class Chest {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 24;
        this.opened = false;
        this.loot = this.generateLoot();
        this.interactRange = 40;
    }

    generateLoot() {
        const items = ['potion_health', 'potion_speed', 'gold'];
        const loot = [];
        const count = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
            loot.push(items[Math.floor(Math.random() * items.length)]);
        }
        return loot;
    }

    open() {
        if (this.opened) return null;
        this.opened = true;
        return this.loot;
    }

    draw(ctx, offsetX, offsetY) {
        const screenX = this.x + offsetX;
        const screenY = this.y + offsetY;
        const s = this.size / 2;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(screenX - s + 2, screenY - s + 2, this.size, this.size * 0.6);

        // Chest body
        ctx.fillStyle = this.opened ? '#5d4037' : '#795548';
        ctx.fillRect(screenX - s, screenY - s, this.size, this.size);

        // Border
        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX - s, screenY - s, this.size, this.size);

        if (!this.opened) {
            // Lock/band
            ctx.fillStyle = '#ffd54f';
            ctx.fillRect(screenX - 3, screenY - s + 4, 6, this.size - 8);

            // Keyhole
            ctx.fillStyle = '#3e2723';
            ctx.beginPath();
            ctx.arc(screenX, screenY + 2, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(screenX - 1, screenY + 2, 2, 5);
        } else {
            // Open lid
            ctx.fillStyle = '#5d4037';
            ctx.fillRect(screenX - s, screenY - s - 6, this.size, 6);
            ctx.strokeStyle = '#3e2723';
            ctx.lineWidth = 1;
            ctx.strokeRect(screenX - s, screenY - s - 6, this.size, 6);
        }
    }
}
