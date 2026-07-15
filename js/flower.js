// ========== Flower ==========
// Seed-based deterministic generation

class Flower {
    static CHANCE = 0.4; // 40% chance per tile in mossy biome
    static THORN_RATIO = 0.3; // 30% of flowers are thorn flowers

    static hasAt(tx, ty, seed) {
        return seededRandom(seed, tx, ty, 3) < Flower.CHANCE;
    }

    static isThornAt(tx, ty, seed) {
        return seededRandom(seed, tx, ty, 4) < Flower.THORN_RATIO;
    }

    static drawAt(ctx, offsetX, offsetY, tx, ty, isThorn) {
        const screenX = tx * TILE_SIZE + TILE_SIZE / 2 + offsetX;
        const screenY = ty * TILE_SIZE + TILE_SIZE / 2 + offsetY;

        if (isThorn) {
            // Draw thorn flower as a red circle with spikes
            ctx.fillStyle = '#e53935';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 7, 0, Math.PI * 2);
            ctx.fill();

            // Draw spikes around the flower
            ctx.strokeStyle = '#b71c1c';
            ctx.lineWidth = 2;
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const innerR = 5;
                const outerR = 11;
                ctx.beginPath();
                ctx.moveTo(
                    screenX + Math.cos(angle) * innerR,
                    screenY + Math.sin(angle) * innerR
                );
                ctx.lineTo(
                    screenX + Math.cos(angle) * outerR,
                    screenY + Math.sin(angle) * outerR
                );
                ctx.stroke();
            }

            // Draw a small dark center
            ctx.fillStyle = '#b71c1c';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 2.8, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Draw flower as a small blue circle
            ctx.fillStyle = '#42a5f5';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 6, 0, Math.PI * 2);
            ctx.fill();

            // Draw a small center
            ctx.fillStyle = '#90caf9';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
