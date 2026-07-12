// ========== Particle System ==========
class Particle {
    constructor(x, y, color, vx, vy, life, size) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.size = size || 4;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.05; // gravity
        this.life--;
    }

    draw(ctx, offsetX, offsetY) {
        const alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(
            this.x + offsetX - this.size / 2,
            this.y + offsetY - this.size / 2,
            this.size,
            this.size
        );
        ctx.globalAlpha = 1;
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, color, count, spread, life, size) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * spread;
            this.particles.push(new Particle(
                x, y, color,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                life || 30,
                size || 4
            ));
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx, offsetX, offsetY) {
        for (const p of this.particles) {
            p.draw(ctx, offsetX, offsetY);
        }
    }
}
