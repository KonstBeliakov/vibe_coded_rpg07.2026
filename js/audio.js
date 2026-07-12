// ========== Audio System ==========
class AudioSystem {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        if (this.ctx) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            this.enabled = false;
        }
    }

    playTone(frequency, duration, type, volume) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type || 'square';
        osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
        gain.gain.setValueAtTime(volume || 0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    playHit() {
        this.playTone(200, 0.1, 'square', 0.08);
    }

    playShoot() {
        this.playTone(400, 0.05, 'square', 0.05);
        setTimeout(() => this.playTone(600, 0.05, 'square', 0.03), 50);
    }

    playEnemyDeath() {
        this.playTone(300, 0.15, 'sawtooth', 0.06);
        setTimeout(() => this.playTone(150, 0.2, 'sawtooth', 0.04), 100);
    }

    playLevelUp() {
        this.playTone(500, 0.1, 'sine', 0.08);
        setTimeout(() => this.playTone(700, 0.1, 'sine', 0.08), 100);
        setTimeout(() => this.playTone(900, 0.15, 'sine', 0.08), 200);
    }

    playPlayerHit() {
        this.playTone(100, 0.15, 'sawtooth', 0.1);
    }
}
