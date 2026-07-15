// ========== Tree ==========
// Seed-based deterministic generation

class Tree {
    static CHANCE = 0.005; // 0.5% chance per tile

    static hasAt(tx, ty, seed) {
        return seededRandom(seed, tx, ty, 2) < Tree.CHANCE;
    }

    static isDeadAt(tx, ty, seed) {
        // Dead trees in normal biome, living in mossy
        // We determine this by biome, not by random
        return false; // Will be overridden by caller based on biome
    }

    static drawAt(ctx, offsetX, offsetY, tx, ty, isDead) {
        const screenX = tx * TILE_SIZE + TILE_SIZE / 2 + offsetX;
        const screenY = ty * TILE_SIZE + TILE_SIZE / 2 + offsetY;

        if (isDead) {
            // Dead tree (dry) - brown trunk, no leaves
            ctx.fillStyle = '#6d4c41';
            ctx.fillRect(screenX - 3, screenY - 10, 6, 20);

            // Branches
            ctx.strokeStyle = '#5d4037';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(screenX - 3, screenY - 5);
            ctx.lineTo(screenX - 10, screenY - 10 + 5);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(screenX + 3, screenY - 5);
            ctx.lineTo(screenX + 10, screenY - 10 + 5);
            ctx.stroke();
        } else {
            // Living tree - brown trunk with green crown
            ctx.fillStyle = '#5d4037';
            ctx.fillRect(screenX - 3, screenY - 5, 6, 10);

            // Crown (leaves)
            ctx.fillStyle = '#388e3c';
            ctx.beginPath();
            ctx.arc(screenX, screenY - 14, 10, 0, Math.PI * 2);
            ctx.fill();

            // Lighter leaves highlight
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.arc(screenX - 3, screenY - 16, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
