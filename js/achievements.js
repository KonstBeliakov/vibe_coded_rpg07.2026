// ========== Achievements System ==========
class AchievementSystem {
    constructor() {
        this.achievements = [
            { id: 'first_kill', name: 'Первый кровь', desc: 'Убей первого врага', icon: '⚔️', check: () => this.kills >= 1 },
            { id: 'killer_10', name: 'Охотник', desc: 'Убей 10 врагов', icon: '🗡️', check: () => this.kills >= 10 },
            { id: 'killer_50', name: 'Массовый убийца', desc: 'Убей 50 врагов', icon: '💀', check: () => this.kills >= 50 },
            { id: 'killer_100', name: 'Безжалостный', desc: 'Убей 100 врагов', icon: '☠️', check: () => this.kills >= 100 },
            { id: 'first_chest', name: 'Сокровище', desc: 'Открой первый сундук', icon: '📦', check: () => this.chestsOpened >= 1 },
            { id: 'chest_10', name: 'Кладоискатель', desc: 'Открой 10 сундуков', icon: '🏆', check: () => this.chestsOpened >= 10 },
            { id: 'level_5', name: 'Ученик', desc: 'Достигни 5 уровня', icon: '⭐', check: () => this.maxLevel >= 5 },
            { id: 'level_10', name: 'Мастер', desc: 'Достигни 10 уровня', icon: '🌟', check: () => this.maxLevel >= 10 },
            { id: 'level_20', name: 'Легенда', desc: 'Достигни 20 уровня', icon: '👑', check: () => this.maxLevel >= 20 },
            { id: 'boss_kill', name: 'Убийца боссов', desc: 'Убей первого босса', icon: '🐉', check: () => this.bossKills >= 1 },
            { id: 'boss_5', name: 'Охотник на боссов', desc: 'Убей 5 боссов', icon: '🔥', check: () => this.bossKills >= 5 },
            { id: 'explorer', name: 'Исследователь', desc: 'Отойди на 2000 пикселей от спавна', icon: '🗺️', check: () => this.maxDistance >= 2000 },
            { id: 'deep_explorer', name: 'Глубокий рейд', desc: 'Отойди на 5000 пикселей от спавна', icon: '🌌', check: () => this.maxDistance >= 5000 },
        ];

        this.kills = 0;
        this.chestsOpened = 0;
        this.maxLevel = 1;
        this.bossKills = 0;
        this.maxDistance = 0;
        this.unlocked = new Set();
        this.notificationQueue = [];
        this.notificationTimer = 0;
        this.load();
    }

    addKill() {
        this.kills++;
        this.checkAll();
    }

    addChestOpen() {
        this.chestsOpened++;
        this.checkAll();
    }

    addLevel(level) {
        if (level > this.maxLevel) {
            this.maxLevel = level;
            this.checkAll();
        }
    }

    addBossKill() {
        this.bossKills++;
        this.checkAll();
    }

    updateDistance(dist) {
        if (dist > this.maxDistance) {
            this.maxDistance = dist;
            this.checkAll();
        }
    }

    checkAll() {
        for (const ach of this.achievements) {
            if (!this.unlocked.has(ach.id) && ach.check()) {
                this.unlock(ach);
            }
        }
    }

    unlock(ach) {
        this.unlocked.add(ach.id);
        this.notificationQueue.push(ach);
        this.save();
    }

    getNotification() {
        if (this.notificationQueue.length > 0) {
            return this.notificationQueue.shift();
        }
        return null;
    }

    save() {
        try {
            const data = {
                kills: this.kills,
                chestsOpened: this.chestsOpened,
                maxLevel: this.maxLevel,
                bossKills: this.bossKills,
                maxDistance: this.maxDistance,
                unlocked: Array.from(this.unlocked)
            };
            localStorage.setItem('rpg3_achievements', JSON.stringify(data));
        } catch (e) {
            // ignore
        }
    }

    load() {
        try {
            const raw = localStorage.getItem('rpg3_achievements');
            if (!raw) return;
            const data = JSON.parse(raw);
            this.kills = data.kills || 0;
            this.chestsOpened = data.chestsOpened || 0;
            this.maxLevel = data.maxLevel || 1;
            this.bossKills = data.bossKills || 0;
            this.maxDistance = data.maxDistance || 0;
            if (data.unlocked) {
                for (const id of data.unlocked) {
                    this.unlocked.add(id);
                }
            }
        } catch (e) {
            // ignore
        }
    }

    reset() {
        this.kills = 0;
        this.chestsOpened = 0;
        this.maxLevel = 1;
        this.bossKills = 0;
        this.maxDistance = 0;
        this.unlocked.clear();
        this.notificationQueue = [];
        localStorage.removeItem('rpg3_achievements');
    }

    drawNotification(ctx) {
        if (this.notificationQueue.length === 0) return;

        // Update timer
        this.notificationTimer += 16; // ~60fps

        // Show for 3 seconds, then fade out for 0.5 seconds
        const showDuration = 3000;
        const fadeDuration = 500;
        const totalDuration = showDuration + fadeDuration;

        if (this.notificationTimer >= totalDuration) {
            this.notificationQueue.shift();
            this.notificationTimer = 0;
            return;
        }

        const ach = this.notificationQueue[0];
        const text = `${ach.icon} ${ach.name}: ${ach.desc}`;
        const padding = 10;
        const y = 80;

        // Calculate alpha for fade out
        let alpha = 1.0;
        if (this.notificationTimer > showDuration) {
            const fadeProgress = (this.notificationTimer - showDuration) / fadeDuration;
            alpha = 1.0 - fadeProgress;
        }

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.font = '14px monospace';
        const textWidth = ctx.measureText(text).width;
        const x = (ctx.canvas.width - textWidth - padding * 2) / 2;

        ctx.fillRect(x - padding, y - padding, textWidth + padding * 2, 30 + padding * 2);
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - padding, y - padding, textWidth + padding * 2, 30 + padding * 2);

        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'center';
        ctx.fillText(text, ctx.canvas.width / 2, y + 20);
        ctx.textAlign = 'left';
        ctx.restore();
    }
}
