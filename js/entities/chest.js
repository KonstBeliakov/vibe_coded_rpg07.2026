// ========== Chest UI Manager ==========
class ChestUIManager {
    constructor(game) {
        this.game = game;
        this.isOpen = false;
        this.activeChest = null;
    }

    open(chest) {
        this.isOpen = true;
        this.activeChest = chest;
        document.getElementById('chestUI').style.display = 'block';
        this.render();
    }

    close() {
        this.isOpen = false;
        this.activeChest = null;
        document.getElementById('chestUI').style.display = 'none';
    }

    render() {
        if (!this.activeChest) return;
        const container = document.getElementById('chestItems');
        container.innerHTML = '';

        for (let i = 0; i < this.activeChest.storedItems.length; i++) {
            const item = this.activeChest.storedItems[i];
            const el = document.createElement('div');
            el.style.cssText = 'padding:4px 8px; background:#444; border:1px solid #666; border-radius:3px; cursor:pointer; font-size:11px;';
            el.textContent = item.name;
            el.title = 'Нажми чтобы забрать';
            el.addEventListener('click', () => this.withdraw(i));
            container.appendChild(el);
        }

        if (this.activeChest.storedItems.length === 0) {
            const empty = document.createElement('div');
            empty.style.cssText = 'color:#666; font-size:12px; padding:8px;';
            empty.textContent = 'Сундук пуст';
            container.appendChild(empty);
        }

        document.getElementById('chestSelectedSlot').textContent = this.game.selectedSlot + 1;
    }

    deposit() {
        if (!this.activeChest) return;
        const item = this.game.slots[this.game.selectedSlot];
        if (!item) return;
        // Don't allow depositing starter items
        if (this.game.selectedSlot === 0 && item.name === 'Меч') return;
        if (this.game.selectedSlot === 1 && item.name === 'Лук') return;

        this.activeChest.addItem(item);
        this.game.slots[this.game.selectedSlot] = null;
        this.game.player.applyItemStats(this.game.slots[this.game.selectedSlot], this.game.armorDefense, this.game.getArmorHealthBonus());
        this.render();
        this.game.audio.playHit();
    }

    withdraw(index) {
        if (!this.activeChest) return;
        const item = this.activeChest.removeItem(index);
        if (!item) return;

        for (let i = 0; i < this.game.slots.length; i++) {
            if (!this.game.slots[i]) {
                this.game.slots[i] = item;
                this.game.player.applyItemStats(this.game.slots[this.game.selectedSlot], this.game.armorDefense, this.game.getArmorHealthBonus());
                this.render();
                this.game.audio.playLevelUp();
                return;
            }
        }
    }
}

// ========== Chest ==========
class Chest {
    constructor(x, y, isStorage = false) {
        this.x = x;
        this.y = y;
        this.size = 24;
        this.opened = false;
        this.isStorage = isStorage; // Storage chests don't despawn
        this.loot = this.generateLoot();
        this.storedItems = []; // For storage chests
        this.interactRange = 40;
    }

    generateLoot() {
        const loot = [];
        const count = 1 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
            const roll = Math.random();
            if (roll < 0.4) {
                loot.push('potion_health');
            } else if (roll < 0.7) {
                loot.push('potion_speed');
            } else {
                loot.push('weapon');
            }
        }
        return loot;
    }

    open() {
        if (this.opened && !this.isStorage) return null;
        this.opened = true;
        return this.loot;
    }

    addItem(item) {
        this.storedItems.push(item);
    }

    removeItem(index) {
        if (index >= 0 && index < this.storedItems.length) {
            return this.storedItems.splice(index, 1)[0];
        }
        return null;
    }

    draw(ctx, offsetX, offsetY) {
        const screenX = this.x + offsetX;
        const screenY = this.y + offsetY;
        const s = this.size / 2;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(screenX - s + 2, screenY - s + 2, this.size, this.size * 0.6);

        // Chest body
        ctx.fillStyle = this.opened ? '#5d4037' : '#795548';
        ctx.fillRect(screenX - s, screenY - s, this.size, this.size);

        // Border
        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX - s, screenY - s, this.size, this.size);

        if (!this.opened) {
            // Lock/band
            ctx.fillStyle = '#ffd54f';
            ctx.fillRect(screenX - 3, screenY - s + 4, 6, this.size - 8);

            // Keyhole
            ctx.fillStyle = '#3e2723';
            ctx.beginPath();
            ctx.arc(screenX, screenY + 2, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(screenX - 1, screenY + 2, 2, 5);
        } else {
            // Open lid
            ctx.fillStyle = '#5d4037';
            ctx.fillRect(screenX - s, screenY - s - 6, this.size, 6);
            ctx.strokeStyle = '#3e2723';
            ctx.lineWidth = 1;
            ctx.strokeRect(screenX - s, screenY - s - 6, this.size, 6);

            // Show stored items count
            if (this.isStorage && this.storedItems.length > 0) {
                ctx.fillStyle = '#fff';
                ctx.font = '8px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(this.storedItems.length, screenX, screenY + 4);
                ctx.textAlign = 'left';
            }
        }
    }
}
