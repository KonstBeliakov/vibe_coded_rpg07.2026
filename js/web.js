// ========== Web (spider web) ==========
// Seed-based deterministic generation

class Web {
    static CHANCE = 0.4; // 40% chance near walls in web biome

    static hasAt(tx, ty, seed) {
        return seededRandom(seed, tx, ty, 5) < Web.CHANCE;
    }

    static drawAt(ctx, offsetX, offsetY, tx, ty) {
        const screenX = tx * TILE_SIZE + offsetX;
        const screenY = ty * TILE_SIZE + offsetY;

        // Draw web as a semi-transparent white spider web pattern
        ctx.save();
        ctx.strokeStyle = 'rgba(200, 200, 220, 0.3)';
        ctx.lineWidth = 1;

        // Draw radial lines
        const cx = screenX + TILE_SIZE / 2;
        const cy = screenY + TILE_SIZE / 2;
        const radius = TILE_SIZE / 2 - 2;

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
