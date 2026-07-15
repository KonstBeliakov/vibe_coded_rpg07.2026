// ========== Merchant UI Manager ==========
class MerchantUIManager {
    constructor(game) {
        this.game = game;
        this.isOpen = false;
    }

    open() {
        this.isOpen = true;
        document.getElementById('merchantUI').style.display = 'block';
        this.render();
    }

    close() {
        this.isOpen = false;
        document.getElementById('merchantUI').style.display = 'none';
    }

    render() {
        if (!this.game.merchant) return;
        const container = document.getElementById('merchantStock');
        container.innerHTML = '';
        document.getElementById('merchantGold').textContent = this.game.playerGold;

        for (let i = 0; i < this.game.merchant.stock.length; i++) {
            const item = this.game.merchant.stock[i];
            const el = document.createElement('div');
            el.style.cssText = 'padding:4px 8px; background:#444; border:1px solid #7b1fa2; border-radius:3px; cursor:pointer; font-size:11px; display:flex; flex-direction:column; align-items:center; min-width:80px;';
            el.innerHTML = `<span>${item.icon} ${item.name}</span><span style="color:#ffd54f; font-size:10px;">${item.cost} монет</span>`;
            el.title = 'Нажми чтобы купить';
            el.addEventListener('click', () => this.buy(i));
            container.appendChild(el);
        }

        if (this.game.merchant.stock.length === 0) {
            const empty = document.createElement('div');
            empty.style.cssText = 'color:#666; font-size:12px; padding:8px;';
            empty.textContent = 'Товар закончился';
            container.appendChild(empty);
        }

        document.getElementById('merchantSelectedSlot').textContent = this.game.selectedSlot + 1;
    }

    buy(index) {
        if (!this.game.merchant) return;
        const result = this.game.merchant.buyItem(index, this.game.slots, this.game.playerGold);
        if (!result) {
            this.game.audio.playPlayerHit();
            return;
        }

        this.game.playerGold -= result.cost;

        if (result.type === 'potion') {
            const type = result.potionType;
            this.game.potions.push(new Potion(this.game.player.x + (Math.random() - 0.5) * 30, this.game.player.y + (Math.random() - 0.5) * 30, type));
        }

        this.game.player.applyItemStats(this.game.slots[this.game.selectedSlot], this.game.armorDefense, this.game.getArmorHealthBonus());
        this.render();
        this.game.audio.playLevelUp();
    }

    sell() {
        if (!this.game.merchant) return;
        const item = this.game.slots[this.game.selectedSlot];
        if (!item) return;

        const value = this.game.merchant.sellItem(item);
        if (value > 0) {
            this.game.playerGold += value;
            this.game.slots[this.game.selectedSlot] = null;
            this.game.player.applyItemStats(this.game.slots[this.game.selectedSlot], this.game.armorDefense, this.game.getArmorHealthBonus());
            this.render();
            this.game.audio.playLevelUp();
        }
    }
}

// ========== Merchant ==========
class Merchant {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 28;
        this.interactRange = 45;
        this.stock = this.generateStock();
    }

    generateStock() {
        const items = [];
        // Always sell basic items
        items.push({ name: 'Зелье здоровья', type: 'potion_health', cost: 20, icon: '❤️' });
        items.push({ name: 'Зелье скорости', type: 'potion_speed', cost: 15, icon: '💨' });

        // Random weapons
        const weaponRoll = Math.random();
        if (weaponRoll < 0.4) {
            items.push({ name: 'Старый меч', type: 'weapon_sword', damage: 12, range: 12, cost: 30, icon: '⚔️' });
        } else if (weaponRoll < 0.7) {
            items.push({ name: 'Короткий лук', type: 'weapon_bow', damage: 6, range: 0, cost: 25, icon: '🏹' });
        } else {
            items.push({ name: 'Деревянный посох', type: 'weapon_staff', damage: 9, range: 0, cost: 35, icon: '🪄' });
        }

        // Rare items
        if (Math.random() < 0.3) {
            items.push({ name: 'Редкий меч', type: 'weapon_sword', damage: 18, range: 15, cost: 80, icon: '⚔️' });
        }
        if (Math.random() < 0.2) {
            items.push({ name: 'Магический посох', type: 'weapon_staff', damage: 14, range: 0, cost: 100, icon: '🪄' });
        }

        return items;
    }

    buyItem(index, slots, playerGold) {
        if (index < 0 || index >= this.stock.length) return null;
        const item = this.stock[index];
        if (playerGold < item.cost) return null;

        // Find empty slot
        let emptySlot = -1;
        for (let i = 0; i < slots.length; i++) {
            if (!slots[i]) {
                emptySlot = i;
                break;
            }
        }
        if (emptySlot === -1) return null; // Inventory full

        if (item.type === 'potion_health' || item.type === 'potion_speed') {
            // Potions are handled differently - just return the type
            return { type: 'potion', potionType: item.type === 'potion_health' ? 'health' : 'speed', slot: emptySlot, cost: item.cost };
        } else {
            const damage = item.damage || 10;
            const range = item.range || 10;
            const newItem = new Item(item.name, damage, range, 'no_texture.png');
            slots[emptySlot] = newItem;
            return { type: 'item', item: newItem, slot: emptySlot, cost: item.cost };
        }
    }

    sellItem(item) {
        if (!item) return 0;
        // Don't allow selling starter items
        if (item.name === 'Меч' || item.name === 'Лук') return 0;

        return Math.max(5, Math.floor((item.attackDamage + item.attackRange) * 1.5));
    }

    draw(ctx, offsetX, offsetY) {
        const sx = this.x + offsetX;
        const sy = this.y + offsetY;
        const s = this.size / 2;

        // Body
        ctx.fillStyle = '#7b1fa2';
        ctx.fillRect(sx - s, sy - s, this.size, this.size);

        // Border
        ctx.strokeStyle = '#4a148c';
        ctx.lineWidth = 2;
        ctx.strokeRect(sx - s, sy - s, this.size, this.size);

        // Hat
        ctx.fillStyle = '#4a148c';
        ctx.beginPath();
        ctx.moveTo(sx - s - 4, sy - s);
        ctx.lineTo(sx, sy - s - 10);
        ctx.lineTo(sx + s + 4, sy - s);
        ctx.closePath();
        ctx.fill();

        // Face
        ctx.fillStyle = '#ffcc80';
        ctx.fillRect(sx - 5, sy - 3, 10, 8);

        // Eyes
        ctx.fillStyle = '#333';
        ctx.fillRect(sx - 4, sy - 1, 3, 3);
        ctx.fillRect(sx + 1, sy - 1, 3, 3);

        // Label
        ctx.fillStyle = '#ce93d8';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Торговец', sx, sy + s + 12);
        ctx.textAlign = 'left';
    }
}
