// ========== Effect System ==========
// Modular system for status effects (burn, slow, poison)

class StatusEffect {
    constructor(name, duration, tickInterval, tickDamage, color, onApply, onTick, onEnd) {
        this.name = name;
        this.duration = duration;
        this.tickInterval = tickInterval;
        this.tickDamage = tickDamage;
        this.color = color;
        this.onApply = onApply || (() => {});
        this.onTick = onTick || (() => {});
        this.onEnd = onEnd || (() => {});
    }

    apply(target, game) {
        this.onApply(target, game);
    }

    tick(target, game) {
        this.onTick(target, game);
    }

    end(target, game) {
        this.onEnd(target, game);
    }
}

// Effect instances applied to entities
class ActiveEffect {
    constructor(effect, target, game) {
        this.effect = effect;
        this.target = target;
        this.game = game;
        this.remainingDuration = effect.duration;
        this.tickTimer = 0;
        this.effect.apply(target, game);
    }

    update(dt) {
        this.remainingDuration -= dt;
        this.tickTimer += dt;

        if (this.tickTimer >= this.effect.tickInterval) {
            this.tickTimer = 0;
            this.effect.onTick(this.target, this.game);
        }

        return this.remainingDuration > 0;
    }

    end() {
        this.effect.end(this.target, this.game);
    }
}

// Effect Manager
class EffectManager {
    constructor() {
        this.activeEffects = [];
    }

    addEffect(effect, target, game) {
        // Remove existing effect of same type
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            if (this.activeEffects[i].effect.name === effect.name && this.activeEffects[i].target === target) {
                this.activeEffects[i].end();
                this.activeEffects.splice(i, 1);
            }
        }
        this.activeEffects.push(new ActiveEffect(effect, target, game));
    }

    update(dt) {
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const active = this.activeEffects[i];
            const alive = active.update(dt);
            if (!alive) {
                active.end();
                this.activeEffects.splice(i, 1);
            }
        }
    }

    clear() {
        for (const active of this.activeEffects) {
            active.end();
        }
        this.activeEffects = [];
    }
}

// Define effects
const EFFECTS = {
    burn: new StatusEffect(
        'burn',
        3000, // 3 seconds
        1000, // tick every 1 second
        3,    // 3 damage per tick
        '#ff6d00',
        (target, game) => {
            // Apply: visual feedback
            if (game) game.particles.emit(target.x, target.y, '#ff6d00', 5, 2, 15, 2);
        },
        (target, game) => {
            // Tick: damage + particles
            target.health -= 3;
            if (game) game.particles.emit(target.x, target.y, '#ff6d00', 8, 3, 20, 3);
        },
        (target, game) => {
            // End: nothing special
        }
    ),
    slow: new StatusEffect(
        'slow',
        2000, // 2 seconds
        2000, // tick every 2 seconds (no damage)
        0,
        '#00bcd4',
        (target, game) => {
            // Apply: reduce speed
            target.speed *= 0.6;
            if (game) game.particles.emit(target.x, target.y, '#00bcd4', 5, 2, 15, 2);
        },
        (target, game) => {
            // Tick: visual only
            if (game) game.particles.emit(target.x, target.y, '#00bcd4', 5, 2, 15, 2);
        },
        (target, game) => {
            // End: restore speed
            target.speed /= 0.6;
        }
    ),
    poison: new StatusEffect(
        'poison',
        2500, // 2.5 seconds
        500,  // tick every 0.5 seconds
        2,    // 2 damage per tick
        '#76ff03',
        (target, game) => {
            if (game) game.particles.emit(target.x, target.y, '#76ff03', 5, 2, 15, 2);
        },
        (target, game) => {
            target.health -= 2;
            if (game) game.particles.emit(target.x, target.y, '#76ff03', 6, 2, 15, 2);
        },
        (target, game) => {
            // End: nothing special
        }
    )
};
