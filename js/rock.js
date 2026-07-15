// ========== Rock ==========
// Seed-based deterministic generation

class Rock {
    static CHANCE = 0.005; // 0.5% chance per tile

    static hasAt(tx, ty, seed) {
        return seededRandom(seed, tx, ty, 1) < Rock.CHANCE;
    }

    static drawAt(ctx, offsetX, offsetY, tx, ty) {
        const screenX = tx * TILE_SIZE + TILE_SIZE / 2 + offsetX;
        const screenY = ty * TILE_SIZE + TILE_SIZE / 2 + offsetY;

        // Draw rock as a gray irregular shape
        ctx.fillStyle = '#757575';
        ctx.beginPath();
        ctx.arc(screenX, screenY, 7, 0, Math.PI * 2);
        ctx.fill();

        // Draw a lighter highlight
        ctx.fillStyle = '#9e9e9e';
        ctx.beginPath();
        ctx.arc(screenX - 2, screenY - 2, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Border
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(screenX, screenY, 7, 0, Math.PI * 2);
        ctx.stroke();
    }
}
