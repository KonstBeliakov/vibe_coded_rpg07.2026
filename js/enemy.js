// ========== Enemy Types ==========
class Enemy {
    constructor(x, y, config) {
        this.x = x;
        this.y = y;
        this.speed = config.speed || 1.2;
        this.size = config.size || 20;
        this.color = config.color || '#e53935';
        this.maxHealth = config.health || 50;
        this.health = this.maxHealth;
        this.attackCooldown = config.attackCooldown || 800;
        this.attackTimer = 0;
        this.attackRange = config.attackRange || 35;
        this.attackDamage = config.attackDamage || 8;
        this.attackAnimDuration = config.attackAnimDuration || 200;
        this.attackAnimTimer = 0;
        this.xpReward = config.xpReward || 10;
        this.type = config.type || 'normal';
    }

    update(playerX, playerY, tileMap) {
        // Use A* pathfinding to avoid walls
        const playerTileX = Math.floor(playerX / TILE_SIZE);
        const playerTileY = Math.floor(playerY / TILE_SIZE);
        const myTileX = Math.floor(this.x / TILE_SIZE);
        const myTileY = Math.floor(this.y / TILE_SIZE);

        // Check if there's a direct line of sight (no walls between)
        const hasDirectPath = this.hasLineOfSight(playerX, playerY, tileMap);

        if (!hasDirectPath && tileMap) {
            // Use A* pathfinding
            if (!this.path || this.path.length === 0 ||
                Math.floor(this.path[this.path.length - 1].x / TILE_SIZE) !== playerTileX ||
                Math.floor(this.path[this.path.length - 1].y / TILE_SIZE) !== playerTileY) {
                // Recalculate path every 30 frames or when target moves
                if (!this.pathTimer || this.pathTimer <= 0 || this.path.length === 0) {
                    this.path = aStar(this.x, this.y, playerX, playerY, tileMap);
                    this.pathTimer = 30;
                }
            }

            if (this.path && this.path.length > 1) {
                // Follow path
                const nextNode = this.path[0];
                const dx = nextNode.x - this.x;
                const dy = nextNode.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < this.speed) {
                    this.path.shift();
                } else if (dist > 0) {
                    this.x += (dx / dist) * this.speed;
                    this.y += (dy / dist) * this.speed;
                }
            } else {
                // Fallback: move directly towards player
                const dx = playerX - this.x;
                const dy = playerY - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    this.x += (dx / dist) * this.speed;
                    this.y += (dy / dist) * this.speed;
                }
            }
        } else {
            // Direct path - move straight towards player
            const dx = playerX - this.x;
            const dy = playerY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
            }
        }

        if (this.pathTimer > 0) this.pathTimer--;
        if (this.attackTimer > 0) this.attackTimer -= 16;
        if (this.attackAnimTimer > 0) this.attackAnimTimer -= 16;
    }

    hasLineOfSight(targetX, targetY, tileMap) {
        if (!tileMap) return true;
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.ceil(dist / (TILE_SIZE / 2));
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const checkX = this.x + dx * t;
            const checkY = this.y + dy * t;
            const tileX = Math.floor(checkX / TILE_SIZE);
            const tileY = Math.floor(checkY / TILE_SIZE);
            if (tileMap.isWall(tileX, tileY)) return false;
        }
        return true;
    }

    tryAttack(playerX, playerY) {
        if (this.attackTimer > 0) return false;
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= this.attackRange) {
            this.attackTimer = this.attackCooldown;
            this.attackAnimTimer = this.attackAnimDuration;
            return true;
        }
        return false;
    }

    draw(ctx, offsetX, offsetY) {
        const screenX = this.x + offsetX;
        const screenY = this.y + offsetY;
        const r = this.size / 2;

        // Attack animation
        if (this.attackAnimTimer > 0) {
            const progress = 1 - this.attackAnimTimer / this.attackAnimDuration;
            const angle = progress * Math.PI * 1.5 - Math.PI * 0.75;
            const dx = this.x - offsetX;
            const dy = this.y - offsetY;
            const baseAngle = Math.atan2(dy, dx);

            ctx.save();
            ctx.translate(screenX, screenY);
            ctx.rotate(baseAngle);
            ctx.strokeStyle = '#ff8a80';
            ctx.lineWidth = 2;
            ctx.beginPath();
            const ar = r + 3;
            const startA = -Math.PI * 0.6;
            const endA = startA + angle;
            ctx.arc(0, 0, ar, startA, endA);
            ctx.stroke();
            ctx.restore();
        }

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(screenX + 2, screenY + 2, r, r * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body - diamond/rhombus shape
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(screenX, screenY - r);
        ctx.lineTo(screenX + r, screenY);
        ctx.lineTo(screenX, screenY + r);
        ctx.lineTo(screenX - r, screenY);
        ctx.closePath();
        ctx.fill();

        // Border
        ctx.strokeStyle = this.darkenColor(this.color, 0.3);
        ctx.lineWidth = 2;
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(screenX - 4, screenY - 3, 3, 0, Math.PI * 2);
        ctx.arc(screenX + 4, screenY - 3, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#c62828';
        ctx.beginPath();
        ctx.arc(screenX - 3, screenY - 2, 1.5, 0, Math.PI * 2);
        ctx.arc(screenX + 5, screenY - 2, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Health bar
        const barWidth = this.size + 10;
        const barHeight = 4;
        const barX = screenX - barWidth / 2;
        const barY = screenY - r - 10;
        const healthPercent = this.health / this.maxHealth;

        ctx.fillStyle = '#c62828';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    }

    darkenColor(hex, amount) {
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);
        r = Math.floor(r * (1 - amount));
        g = Math.floor(g * (1 - amount));
        b = Math.floor(b * (1 - amount));
        return `rgb(${r},${g},${b})`;
    }
}

class FastEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, {
            speed: 2.5,
            size: 16,
            color: '#ff9800',
            health: 30,
            attackCooldown: 600,
            attackRange: 30,
            attackDamage: 5,
            xpReward: 15,
            type: 'fast'
        });
    }

    draw(ctx, offsetX, offsetY) {
        const screenX = this.x + offsetX;
        const screenY = this.y + offsetY;
        const r = this.size / 2;

        // Attack animation
        if (this.attackAnimTimer > 0) {
            const progress = 1 - this.attackAnimTimer / this.attackAnimDuration;
            const angle = progress * Math.PI * 1.5 - Math.PI * 0.75;
            const dx = this.x - offsetX;
            const dy = this.y - offsetY;
            const baseAngle = Math.atan2(dy, dx);

            ctx.save();
            ctx.translate(screenX, screenY);
            ctx.rotate(baseAngle);
            ctx.strokeStyle = '#ffcc80';
            ctx.lineWidth = 2;
            ctx.beginPath();
            const ar = r + 3;
            const startA = -Math.PI * 0.6;
            const endA = startA + angle;
            ctx.arc(0, 0, ar, startA, endA);
            ctx.stroke();
            ctx.restore();
        }

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(screenX + 2, screenY + 2, r, r * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Fast enemy - triangle shape
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(screenX, screenY - r);
        ctx.lineTo(screenX + r, screenY + r * 0.7);
        ctx.lineTo(screenX - r, screenY + r * 0.7);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#e65100';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(screenX - 3, screenY - 1, 2.5, 0, Math.PI * 2);
        ctx.arc(screenX + 3, screenY - 1, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#bf360c';
        ctx.beginPath();
        ctx.arc(screenX - 2, screenY, 1.2, 0, Math.PI * 2);
        ctx.arc(screenX + 4, screenY, 1.2, 0, Math.PI * 2);
        ctx.fill();

        // Health bar
        const barWidth = this.size + 10;
        const barHeight = 4;
        const barX = screenX - barWidth / 2;
        const barY = screenY - r - 10;
        const healthPercent = this.health / this.maxHealth;

        ctx.fillStyle = '#c62828';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    }
}

class TankEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, {
            speed: 0.7,
            size: 28,
            color: '#7b1fa2',
            health: 150,
            attackCooldown: 1200,
            attackRange: 40,
            attackDamage: 15,
            xpReward: 30,
            type: 'tank'
        });
    }

    draw(ctx, offsetX, offsetY) {
        const screenX = this.x + offsetX;
        const screenY = this.y + offsetY;
        const r = this.size / 2;

        // Attack animation
        if (this.attackAnimTimer > 0) {
            const progress = 1 - this.attackAnimTimer / this.attackAnimDuration;
            const angle = progress * Math.PI * 1.5 - Math.PI * 0.75;
            const dx = this.x - offsetX;
            const dy = this.y - offsetY;
            const baseAngle = Math.atan2(dy, dx);

            ctx.save();
            ctx.translate(screenX, screenY);
            ctx.rotate(baseAngle);
            ctx.strokeStyle = '#ce93d8';
            ctx.lineWidth = 3;
            ctx.beginPath();
            const ar = r + 4;
            const startA = -Math.PI * 0.6;
            const endA = startA + angle;
            ctx.arc(0, 0, ar, startA, endA);
            ctx.stroke();
            ctx.restore();
        }

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(screenX + 2, screenY + 2, r, r * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tank enemy - hexagon shape
        ctx.fillStyle = this.color;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
            const px = screenX + Math.cos(a) * r;
            const py = screenY + Math.sin(a) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#4a148c';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(screenX - 5, screenY - 3, 4, 0, Math.PI * 2);
        ctx.arc(screenX + 5, screenY - 3, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#4a148c';
        ctx.beginPath();
        ctx.arc(screenX - 4, screenY - 2, 2, 0, Math.PI * 2);
        ctx.arc(screenX + 6, screenY - 2, 2, 0, Math.PI * 2);
        ctx.fill();

        // Health bar
        const barWidth = this.size + 10;
        const barHeight = 4;
        const barX = screenX - barWidth / 2;
        const barY = screenY - r - 10;
        const healthPercent = this.health / this.maxHealth;

        ctx.fillStyle = '#c62828';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    }
}

class FlyingEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, {
            speed: 1.8,
            size: 18,
            color: '#00bcd4',
            health: 40,
            attackCooldown: 1000,
            attackRange: 50,
            attackDamage: 7,
            xpReward: 20,
            type: 'flying'
        });
        this.waveOffset = Math.random() * Math.PI * 2;
        this.baseY = y;
    }

    update(playerX, playerY) {
        this.waveOffset += 0.05;
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed + Math.sin(this.waveOffset) * 1.5;
        }

        if (this.attackTimer > 0) this.attackTimer -= 16;
        if (this.attackAnimTimer > 0) this.attackAnimTimer -= 16;
    }

    draw(ctx, offsetX, offsetY) {
        const screenX = this.x + offsetX;
        const screenY = this.y + offsetY;
        const r = this.size / 2;

        // Attack animation
        if (this.attackAnimTimer > 0) {
            const progress = 1 - this.attackAnimTimer / this.attackAnimDuration;
            const angle = progress * Math.PI * 1.5 - Math.PI * 0.75;
            const dx = this.x - offsetX;
            const dy = this.y - offsetY;
            const baseAngle = Math.atan2(dy, dx);

            ctx.save();
            ctx.translate(screenX, screenY);
            ctx.rotate(baseAngle);
            ctx.strokeStyle = '#80deea';
            ctx.lineWidth = 2;
            ctx.beginPath();
            const ar = r + 3;
            const startA = -Math.PI * 0.6;
            const endA = startA + angle;
            ctx.arc(0, 0, ar, startA, endA);
            ctx.stroke();
            ctx.restore();
        }

        // Flying enemy - star/diamond with wings
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(screenX + 2, screenY + 2, r, r * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wings
        ctx.fillStyle = '#0097a7';
        ctx.beginPath();
        ctx.moveTo(screenX - r, screenY);
        ctx.lineTo(screenX - r - 8, screenY - 6);
        ctx.lineTo(screenX - r - 8, screenY + 6);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(screenX + r, screenY);
        ctx.lineTo(screenX + r + 8, screenY - 6);
        ctx.lineTo(screenX + r + 8, screenY + 6);
        ctx.closePath();
        ctx.fill();

        // Body - circle
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#006064';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(screenX - 3, screenY - 2, 3, 0, Math.PI * 2);
        ctx.arc(screenX + 3, screenY - 2, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#004d40';
        ctx.beginPath();
        ctx.arc(screenX - 2, screenY - 1, 1.5, 0, Math.PI * 2);
        ctx.arc(screenX + 4, screenY - 1, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Health bar
        const barWidth = this.size + 10;
        const barHeight = 4;
        const barX = screenX - barWidth / 2;
        const barY = screenY - r - 10;
        const healthPercent = this.health / this.maxHealth;

        ctx.fillStyle = '#c62828';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    }
}
