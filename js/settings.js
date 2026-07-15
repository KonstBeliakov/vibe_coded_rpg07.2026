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

// ========== Settings UI Manager ==========
class SettingsUIManager {
    constructor(game) {
        this.game = game;
        this.isOpen = false;
        this.rebindingAction = null;
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsScreen = document.getElementById('settingsScreen');
        this.settingsContent = document.getElementById('settingsContent');
        this.settingsCloseBtn = document.getElementById('settingsCloseBtn');

        this.settingsBtn.addEventListener('click', () => this.open());
        this.settingsCloseBtn.addEventListener('click', () => this.close());
    }

    open() {
        this.isOpen = true;
        this.settingsScreen.style.display = 'flex';
        this.render();
    }

    close() {
        this.isOpen = false;
        this.settingsScreen.style.display = 'none';
        this.rebindingAction = null;
    }

    render() {
        const actions = [
            { action: 'up', label: 'Вверх' },
            { action: 'down', label: 'Вниз' },
            { action: 'left', label: 'Влево' },
            { action: 'right', label: 'Вправо' },
            { action: 'attack', label: 'Атака' },
            { action: 'interact', label: 'Взаимодействие (E)' }
        ];

        this.settingsContent.innerHTML = '';
        for (const { action, label } of actions) {
            const row = document.createElement('div');
            row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:6px 10px; background:rgba(255,255,255,0.05); border-radius:4px;';

            const labelEl = document.createElement('span');
            labelEl.textContent = label;
            labelEl.style.cssText = 'color:#ccc; font-size:14px;';

            const keyEl = document.createElement('button');
            const keyName = this.game.settings.getKey(action);
            keyEl.textContent = keyName === ' ' ? 'Пробел' : keyName.toUpperCase();
            keyEl.style.cssText = 'padding:4px 12px; background:#444; color:#fff; border:1px solid #666; border-radius:3px; cursor:pointer; font-family:monospace; font-size:13px; min-width:80px; text-align:center;';

            keyEl.addEventListener('click', () => {
                this.rebindingAction = action;
                keyEl.textContent = '...';
                keyEl.style.background = '#666';
                setTimeout(() => {
                    if (this.rebindingAction === action) {
                        keyEl.textContent = keyName === ' ' ? 'Пробел' : keyName.toUpperCase();
                        keyEl.style.background = '#444';
                    }
                }, 3000);
            });

            row.appendChild(labelEl);
            row.appendChild(keyEl);
            this.settingsContent.appendChild(row);
        }
    }
}
