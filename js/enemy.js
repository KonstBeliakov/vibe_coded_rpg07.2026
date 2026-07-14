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

    update(playerX, playerY, tileMap, player) {
        // If player is invisible, enemies don't move toward them
        if (player && player.isInvisible) {
            // Wander randomly
            if (!this.wanderAngle) this.wanderAngle = Math.random() * Math.PI * 2;
            this.wanderAngle += (Math.random() - 0.5) * 0.5;
            const wanderX = this.x + Math.cos(this.wanderAngle) * this.speed;
            const wanderY = this.y + Math.sin(this.wanderAngle) * this.speed;
            // Check if wander position is valid (not in wall)
            const wanderTileX = Math.floor(wanderX / TILE_SIZE);
            const wanderTileY = Math.floor(wanderY / TILE_SIZE);
            if (!tileMap || !tileMap.isWall(wanderTileX, wanderTileY)) {
                this.x = wanderX;
                this.y = wanderY;
            }
            if (this.attackTimer > 0) this.attackTimer -= 16;
            if (this.attackAnimTimer > 0) this.attackAnimTimer -= 16;
            return;
        }

        // Use A* pathfinding to avoid walls
        const playerTileX = Math.floor(playerX / TILE_SIZE);
        const playerTileY = Math.floor(playerY / TILE_SIZE);
        const myTileX = Math.floor(this.x / TILE_SIZE);
        const myTileY = Math.floor(this.y / TILE_SIZE);

        // Check if there's a direct line of sight (no walls between)
        const hasDirectPath = this.hasLineOfSight(playerX, playerY, tileMap);

        if (!hasDirectPath && tileMap) {
            // Use A* pathfinding
            const pathNeedsUpdate = !this.path || this.path.length === 0 ||
                Math.floor(this.path[this.path.length - 1].x / TILE_SIZE) !== playerTileX ||
                Math.floor(this.path[this.path.length - 1].y / TILE_SIZE) !== playerTileY;
            if (pathNeedsUpdate) {
                // Recalculate path every 30 frames or when target moves
                if (!this.pathTimer || this.pathTimer <= 0) {
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

// ========== Desert Skeleton (пустынный биом) ==========
// Shoots bone projectiles at the player
class DesertSkeleton extends Enemy {
    constructor(x, y) {
        super(x, y, {
            speed: 1.0,
            size: 22,
            color: '#d4a574',
            health: 35,
            attackCooldown: 1500,
            attackRange: 120, // Ranged attack
            attackDamage: 6,
            xpReward: 18,
            type: 'desert_skeleton'
        });
        this.shootCooldown = 1500;
        this.shootTimer = 0;
        this.bones = []; // bone projectiles
    }

    update(playerX, playerY, tileMap) {
        // Keep distance from player (don't get too close)
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 80) {
            // Move away from player
            if (dist > 0) {
                this.x -= (dx / dist) * this.speed * 0.5;
                this.y -= (dy / dist) * this.speed * 0.5;
            }
        } else if (dist > 150) {
            // Move towards player
            if (dist > 0) {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
            }
        }

        // Shoot bones
        this.shootTimer -= 16;
        if (this.shootTimer <= 0 && dist < 300) {
            this.shootTimer = this.shootCooldown;
            this.attackAnimTimer = this.attackAnimDuration;
            // Shoot a bone projectile
            if (dist > 0) {
                const speed = 3;
                const vx = (dx / dist) * speed;
                const vy = (dy / dist) * speed;
                this.bones.push({ x: this.x, y: this.y, vx: vx, vy: vy, life: 60 });
            }
        }

        // Update bone projectiles
        for (let i = this.bones.length - 1; i >= 0; i--) {
            const bone = this.bones[i];
            bone.x += bone.vx;
            bone.y += bone.vy;
            bone.life--;
            if (bone.life <= 0) {
                this.bones.splice(i, 1);
            }
        }

        if (this.attackTimer > 0) this.attackTimer -= 16;
        if (this.attackAnimTimer > 0) this.attackAnimTimer -= 16;
    }

    tryAttack(playerX, playerY) {
        // Check if any bone projectile hits the player
        for (const bone of this.bones) {
            const dx = playerX - bone.x;
            const dy = playerY - bone.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 15) {
                return true;
            }
        }
        return false;
    }

    draw(ctx, offsetX, offsetY) {
        const screenX = this.x + offsetX;
        const screenY = this.y + offsetY;
        const r = this.size / 2;

        // Draw bone projectiles
        for (const bone of this.bones) {
            const bx = bone.x + offsetX;
            const by = bone.y + offsetY;
            ctx.fillStyle = '#fff3e0';
            ctx.fillRect(bx - 2, by - 1, 6, 3);
        }

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

        // Body - skull shape
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, r, 0, Math.PI * 2);
        ctx.fill();

        // Jaw
        ctx.fillStyle = '#bcaaa4';
        ctx.fillRect(screenX - r * 0.6, screenY + r * 0.2, r * 1.2, r * 0.4);

        // Eyes (empty sockets)
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(screenX - 5, screenY - 3, 4, 0, Math.PI * 2);
        ctx.arc(screenX + 5, screenY - 3, 4, 0, Math.PI * 2);
        ctx.fill();

        // Mouth
        ctx.fillStyle = '#222';
        ctx.fillRect(screenX - 5, screenY + r * 0.3, 10, 2);

        ctx.strokeStyle = '#8d6e63';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screenX, screenY, r, 0, Math.PI * 2);
        ctx.stroke();

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

// ========== Swamp Slime (болотный биом) ==========
// Leaves a poison trail, splits into smaller slimes on death
class SwampSlime extends Enemy {
    constructor(x, y, size = 24) {
        super(x, y, {
            speed: 0.8,
            size: size,
            color: '#4caf50',
            health: size === 24 ? 40 : 15,
            attackCooldown: 1000,
            attackRange: 30,
            attackDamage: size === 24 ? 5 : 2,
            xpReward: size === 24 ? 22 : 8,
            type: 'swamp_slime'
        });
        this.poisonTrail = [];
        this.trailTimer = 0;
        this.isSmall = size < 24;
    }

    update(playerX, playerY, tileMap) {
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }

        // Leave poison trail
        this.trailTimer -= 16;
        if (this.trailTimer <= 0) {
            this.trailTimer = 500;
            this.poisonTrail.push({ x: this.x, y: this.y, life: 120 }); // 2 seconds
        }

        // Update trail
        for (let i = this.poisonTrail.length - 1; i >= 0; i--) {
            this.poisonTrail[i].life--;
            if (this.poisonTrail[i].life <= 0) {
                this.poisonTrail.splice(i, 1);
            }
        }

        if (this.attackTimer > 0) this.attackTimer -= 16;
        if (this.attackAnimTimer > 0) this.attackAnimTimer -= 16;
    }

    tryAttack(playerX, playerY) {
        // Check if player is on poison trail
        for (const p of this.poisonTrail) {
            const dx = playerX - p.x;
            const dy = playerY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 15) {
                return true;
            }
        }
        // Also check direct contact
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

        // Draw poison trail
        for (const p of this.poisonTrail) {
            const alpha = p.life / 120;
            ctx.fillStyle = `rgba(76, 175, 80, ${alpha * 0.4})`;
            ctx.beginPath();
            ctx.arc(p.x + offsetX, p.y + offsetY, 8, 0, Math.PI * 2);
            ctx.fill();
        }

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(screenX + 2, screenY + 2, r, r * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body - blob shape
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, r, 0, Math.PI * 2);
        ctx.fill();

        // Highlight
        ctx.fillStyle = '#81c784';
        ctx.beginPath();
        ctx.arc(screenX - r * 0.3, screenY - r * 0.3, r * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(screenX - 4, screenY - 2, 3, 0, Math.PI * 2);
        ctx.arc(screenX + 4, screenY - 2, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1b5e20';
        ctx.beginPath();
        ctx.arc(screenX - 3, screenY - 1, 1.5, 0, Math.PI * 2);
        ctx.arc(screenX + 5, screenY - 1, 1.5, 0, Math.PI * 2);
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

// ========== Magic Golem (магический биом) ==========
// Teleports around, shoots magic bolts
class MagicGolem extends Enemy {
    constructor(x, y) {
        super(x, y, {
            speed: 0.5,
            size: 30,
            color: '#7c4dff',
            health: 80,
            attackCooldown: 2000,
            attackRange: 150,
            attackDamage: 10,
            xpReward: 35,
            type: 'magic_golem'
        });
        this.teleportCooldown = 4000;
        this.teleportTimer = 0;
        this.magicBolts = [];
        this.boltCooldown = 1500;
        this.boltTimer = 0;
    }

    update(playerX, playerY, tileMap) {
        const dx = playerX - this.x;
        const dy = playerY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Teleport when far from player
        this.teleportTimer -= 16;
        if (this.teleportTimer <= 0 && dist > 100) {
            this.teleportTimer = this.teleportCooldown;
            // Teleport closer to player
            const angle = Math.atan2(dy, dx);
            const teleportDist = 80 + Math.random() * 40;
            const newX = playerX - Math.cos(angle) * teleportDist;
            const newY = playerY - Math.sin(angle) * teleportDist;
            // Check not in wall
            const tileX = Math.floor(newX / TILE_SIZE);
            const tileY = Math.floor(newY / TILE_SIZE);
            if (!tileMap || !tileMap.isWall(tileX, tileY)) {
                this.x = newX;
                this.y = newY;
            }
        }

        // Shoot magic bolts
        this.boltTimer -= 16;
        if (this.boltTimer <= 0 && dist < 300) {
            this.boltTimer = this.boltCooldown;
            this.attackAnimTimer = this.attackAnimDuration;
            if (dist > 0) {
                const speed = 2.5;
                const vx = (dx / dist) * speed;
                const vy = (dy / dist) * speed;
                this.magicBolts.push({ x: this.x, y: this.y, vx: vx, vy: vy, life: 80 });
            }
        }

        // Update magic bolts
        for (let i = this.magicBolts.length - 1; i >= 0; i--) {
            const bolt = this.magicBolts[i];
            bolt.x += bolt.vx;
            bolt.y += bolt.vy;
            bolt.life--;
            if (bolt.life <= 0) {
                this.magicBolts.splice(i, 1);
            }
        }

        if (this.attackTimer > 0) this.attackTimer -= 16;
        if (this.attackAnimTimer > 0) this.attackAnimTimer -= 16;
    }

    tryAttack(playerX, playerY) {
        // Check if any magic bolt hits the player
        for (const bolt of this.magicBolts) {
            const dx = playerX - bolt.x;
            const dy = playerY - bolt.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 15) {
                return true;
            }
        }
        return false;
    }

    draw(ctx, offsetX, offsetY) {
        const screenX = this.x + offsetX;
        const screenY = this.y + offsetY;
        const r = this.size / 2;

        // Draw magic bolts
        for (const bolt of this.magicBolts) {
            const bx = bolt.x + offsetX;
            const by = bolt.y + offsetY;
            const alpha = bolt.life / 80;
            ctx.fillStyle = `rgba(124, 77, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(bx, by, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = `rgba(179, 136, 255, ${alpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(bx, by, 8, 0, Math.PI * 2);
            ctx.fill();
        }

        // Attack animation
        if (this.attackAnimTimer > 0) {
            const progress = 1 - this.attackAnimTimer / this.attackAnimDuration;
            const alpha = Math.min(1, progress * 2) * (1 - progress);
            ctx.fillStyle = `rgba(124, 77, 255, ${alpha * 0.3})`;
            ctx.beginPath();
            ctx.arc(screenX, screenY, r + 10, 0, Math.PI * 2);
            ctx.fill();
        }

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(screenX + 2, screenY + 2, r, r * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Body - golem shape (square with rounded corners)
        ctx.fillStyle = this.color;
        const halfR = r * 0.8;
        ctx.beginPath();
        ctx.roundRect(screenX - halfR, screenY - halfR, halfR * 2, halfR * 2, 4);
        ctx.fill();

        // Inner glow
        ctx.fillStyle = '#b388ff';
        ctx.beginPath();
        ctx.roundRect(screenX - halfR * 0.5, screenY - halfR * 0.5, halfR, halfR, 3);
        ctx.fill();

        // Eyes (glowing)
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(screenX - 5, screenY - 4, 3, 0, Math.PI * 2);
        ctx.arc(screenX + 5, screenY - 4, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#7c4dff';
        ctx.beginPath();
        ctx.arc(screenX - 4, screenY - 3, 1.5, 0, Math.PI * 2);
        ctx.arc(screenX + 6, screenY - 3, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#651fff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(screenX - halfR, screenY - halfR, halfR * 2, halfR * 2, 4);
        ctx.stroke();

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
