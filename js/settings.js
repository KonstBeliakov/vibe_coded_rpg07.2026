// ========== Settings ==========
class Settings {
    constructor() {
        this.keys = {
            up: 'w',
            down: 's',
            left: 'a',
            right: 'd',
            attack: ' ',
            interact: 'e'
        };
        this.load();
    }

    load() {
        try {
            const raw = localStorage.getItem('rpg3_settings');
            if (raw) {
                const saved = JSON.parse(raw);
                Object.assign(this.keys, saved);
            }
        } catch (e) {
            // ignore
        }
    }

    save() {
        try {
            localStorage.setItem('rpg3_settings', JSON.stringify(this.keys));
        } catch (e) {
            // ignore
        }
    }

    getActionFromKey(key) {
        for (const [action, boundKey] of Object.entries(this.keys)) {
            if (boundKey === key) return action;
        }
        return null;
    }

    getKey(action) {
        return this.keys[action] || '';
    }

    bindKey(action, key) {
        // Check if key is already bound to another action
        for (const [a, k] of Object.entries(this.keys)) {
            if (k === key && a !== action) {
                this.keys[a] = '';
            }
        }
        this.keys[action] = key;
        this.save();
    }
}
