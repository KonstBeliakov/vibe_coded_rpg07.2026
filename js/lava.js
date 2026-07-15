// ========== Lava Pool ==========
// Seed-based deterministic generation

class LavaPool {
    static CHANCE = 0.2; // 20% chance per tile in lava biome

    static hasAt(tx, ty, seed) {
        return seededRandom(seed, tx, ty, 6) < LavaPool.CHANCE;
    }

    static isPlayerOnLava(player, tx, ty) {
        const half = player.size / 2;
        const left = tx * TILE_SIZE;
        const right = left + TILE_SIZE;
        const top = ty * TILE_SIZE;
        const bottom = top + TILE_SIZE;

        const pLeft = player.x - half;
        const pRight = player.x + half;
        const pTop = player.y - half;
        const pBottom = player.y + half;

        return pLeft < right && pRight > left && pTop < bottom && pBottom > top;
    }

    static drawAt(ctx, offsetX, offsetY, tx, ty, animTimer) {
        const screenX = tx * TILE_SIZE + offsetX;
        const screenY = ty * TILE_SIZE + offsetY;

        const pulse = Math.sin(animTimer) * 0.15 + 0.85;

        // Main lava body
        ctx.fillStyle = `rgba(255, 80, 0, ${0.7 * pulse})`;
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        // Inner glow
        ctx.fillStyle = `rgba(255, 150, 0, ${0.4 * pulse})`;
        ctx.fillRect(screenX + 3, screenY + 3, TILE_SIZE - 6, TILE_SIZE - 6);

        // Center bright spot
        ctx.fillStyle = `rgba(255, 200, 50, ${0.3 * pulse})`;
        ctx.fillRect(screenX + 6, screenY + 6, TILE_SIZE - 12, TILE_SIZE - 12);

        // Border
        ctx.strokeStyle = `rgba(255, 60, 0, ${0.5 * pulse})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
    }
}
