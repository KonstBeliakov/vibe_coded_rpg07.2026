// ========== Crafting System ==========

// Resource types
const RESOURCES = {
    wood: { name: 'Дерево', icon: '🪵', color: '#8d6e63' },
    stone: { name: 'Камень', icon: '🪨', color: '#9e9e9e' },
    metal: { name: 'Металл', icon: '🔩', color: '#b0bec5' },
    essence: { name: 'Эссенция', icon: '✨', color: '#ce93d8' }
};

// Crafting recipes
const RECIPES = [
    {
        name: 'Меч',
        result: () => new Item('Меч', 10, 10, 'no_texture.png', 'common'),
        ingredients: { wood: 2, metal: 3 },
        description: 'Стандартный меч'
    },
    {
        name: 'Лук',
        result: () => new Item('Лук', 5, 0, 'no_texture.png', 'common'),
        ingredients: { wood: 4, stone: 1 },
        description: 'Стандартный лук'
    },
    {
        name: 'Посох',
        result: () => {
            const item = new Item('Посох', 8, 0, 'no_texture.png', 'common');
            return item;
        },
        ingredients: { wood: 3, essence: 2 },
        description: 'Магический посох'
    },
    {
        name: 'Зелье здоровья',
        result: () => 'potion_health',
        ingredients: { essence: 1, stone: 1 },
        description: 'Восстанавливает 50 HP'
    },
    {
        name: 'Зелье скорости',
        result: () => 'potion_speed',
        ingredients: { essence: 2, wood: 1 },
        description: 'Увеличивает скорость на 5 сек'
    },
    {
        name: 'Зелье невидимости',
        result: () => 'potion_invisibility',
        ingredients: { essence: 4, metal: 2 },
        description: 'Невидимость на 5 сек (враги не видят)'
    },
    {
        name: 'Зелье регенерации',
        result: () => 'potion_regen',
        ingredients: { essence: 3, stone: 2 },
        description: 'Восстанавливает 2 HP/сек на 10 сек'
    },
    {
        name: 'Зелье силы',
        result: () => 'potion_attack_boost',
        ingredients: { essence: 3, metal: 3 },
        description: '+50% к урону на 8 сек'
    },
    {
        name: 'Зелье замедления времени',
        result: () => 'potion_slow_time',
        ingredients: { essence: 5, metal: 4 },
        description: 'Замедляет врагов на 5 сек'
    },
    {
        name: 'Огненный лук',
        result: () => {
            const item = new Item('Огненный лук', 7, 0, 'no_texture.png');
            item.arrowType = 'fire';
            return item;
        },
        ingredients: { wood: 4, metal: 2, essence: 3 },
        description: 'Стреляет огненными стрелами'
    },
    {
        name: 'Ледяной лук',
        result: () => {
            const item = new Item('Ледяной лук', 7, 0, 'no_texture.png');
            item.arrowType = 'ice';
            return item;
        },
        ingredients: { wood: 4, metal: 2, essence: 3 },
        description: 'Стреляет ледяными стрелами'
    },
    {
        name: 'Отравленный лук',
        result: () => {
            const item = new Item('Отравленный лук', 7, 0, 'no_texture.png');
            item.arrowType = 'poison';
            return item;
        },
        ingredients: { wood: 4, metal: 2, essence: 3 },
        description: 'Стреляет отравленными стрелами'
    },
    {
        name: 'Кольчуга',
        result: () => {
            const item = new Item('Кольчуга', 0, 0, 'no_texture.png');
            item.maxHealthBonus = 50;
            return item;
        },
        ingredients: { metal: 5 },
        description: '+50 к макс. здоровью'
    },
    {
        name: 'Стальной меч',
        result: () => new Item('Стальной меч', 18, 12, 'no_texture.png'),
        ingredients: { wood: 2, metal: 5 },
        description: 'Урон +18, радиус +12'
    },
    {
        name: 'Тяжелый лук',
        result: () => {
            const item = new Item('Тяжелый лук', 10, 0, 'no_texture.png');
            return item;
        },
        ingredients: { wood: 5, metal: 3 },
        description: 'Урон +10'
    },
    {
        name: 'Кирка',
        result: () => {
            const item = new Item('Кирка', 5, 0, 'no_texture.png');
            item.isPickaxe = true;
            return item;
        },
        ingredients: { wood: 2, stone: 3 },
        description: 'Быстрая добыча руды (+2 metal за удар)'
    },
    {
        name: 'Топор',
        result: () => {
            const item = new Item('Топор', 5, 0, 'no_texture.png');
            item.isAxe = true;
            return item;
        },
        ingredients: { wood: 1, stone: 4 },
        description: 'Быстрая рубка деревьев (+2 wood за удар)'
    },
    // ========== Улучшение оружия (заточка) ==========
    {
        name: 'Заточка (+3 урона)',
        result: () => 'upgrade_damage_3',
        ingredients: { metal: 3, essence: 1 },
        description: 'Увеличивает урон оружия на +3'
    },
    {
        name: 'Заточка (+5 урона)',
        result: () => 'upgrade_damage_5',
        ingredients: { metal: 5, essence: 2 },
        description: 'Увеличивает урон оружия на +5'
    },
    {
        name: 'Заточка (+8 урона)',
        result: () => 'upgrade_damage_8',
        ingredients: { metal: 8, essence: 4 },
        description: 'Увеличивает урон оружия на +8'
    },
    {
        name: 'Увеличение радиуса (+5)',
        result: () => 'upgrade_range_5',
        ingredients: { metal: 3, essence: 2 },
        description: 'Увеличивает радиус атаки на +5'
    },
    {
        name: 'Увеличение радиуса (+10)',
        result: () => 'upgrade_range_10',
        ingredients: { metal: 6, essence: 4 },
        description: 'Увеличивает радиус атаки на +10'
    },
    // ========== Броня ==========
    {
        name: 'Шлем (железный)',
        result: () => {
            const item = new Item('Железный шлем', 0, 0, 'no_texture.png', 'common');
            item.armorType = 'helmet';
            item.defense = 5;
            return item;
        },
        ingredients: { metal: 4, stone: 2 },
        description: 'Защита: +5'
    },
    {
        name: 'Нагрудник (железный)',
        result: () => {
            const item = new Item('Железный нагрудник', 0, 0, 'no_texture.png', 'common');
            item.armorType = 'chestplate';
            item.defense = 10;
            item.maxHealthBonus = 20;
            return item;
        },
        ingredients: { metal: 6, stone: 3 },
        description: 'Защита: +10, HP: +20'
    },
    {
        name: 'Поножи (железные)',
        result: () => {
            const item = new Item('Железные поножи', 0, 0, 'no_texture.png', 'common');
            item.armorType = 'leggings';
            item.defense = 7;
            return item;
        },
        ingredients: { metal: 5, stone: 2 },
        description: 'Защита: +7'
    },
    {
        name: 'Шлем (стальной)',
        result: () => {
            const item = new Item('Стальной шлем', 0, 0, 'no_texture.png', 'rare');
            item.armorType = 'helmet';
            item.defense = 10;
            return item;
        },
        ingredients: { metal: 7, essence: 2 },
        description: 'Защита: +10'
    },
    {
        name: 'Нагрудник (стальной)',
        result: () => {
            const item = new Item('Стальной нагрудник', 0, 0, 'no_texture.png', 'rare');
            item.armorType = 'chestplate';
            item.defense = 18;
            item.maxHealthBonus = 40;
            return item;
        },
        ingredients: { metal: 10, essence: 4 },
        description: 'Защита: +18, HP: +40'
    },
    {
        name: 'Поножи (стальные)',
        result: () => {
            const item = new Item('Стальные поножи', 0, 0, 'no_texture.png', 'rare');
            item.armorType = 'leggings';
            item.defense = 12;
            return item;
        },
        ingredients: { metal: 8, essence: 3 },
        description: 'Защита: +12'
    },
    // ========== Добавление эффектов оружию ==========
    {
        name: 'Огненный эффект',
        result: () => 'upgrade_fire',
        ingredients: { essence: 5, metal: 3 },
        description: 'Добавляет огненный эффект оружию'
    },
    {
        name: 'Ледяной эффект',
        result: () => 'upgrade_ice',
        ingredients: { essence: 5, metal: 3 },
        description: 'Добавляет ледяной эффект оружию'
    },
    {
        name: 'Ядовитый эффект',
        result: () => 'upgrade_poison',
        ingredients: { essence: 5, metal: 3 },
        description: 'Добавляет ядовитый эффект оружию'
    }
];

// ========== Crafting UI Manager ==========
class CraftingUIManager {
    constructor(game) {
        this.game = game;
        this.isOpen = false;
    }

    open() {
        this.isOpen = true;
        document.getElementById('craftingUI').style.display = 'block';
        this.render();
    }

    close() {
        this.isOpen = false;
        document.getElementById('craftingUI').style.display = 'none';
    }

    render() {
        // Render resources bar
        const resourcesContainer = document.getElementById('craftingResources');
        resourcesContainer.innerHTML = '';
        for (const [type, data] of Object.entries(RESOURCES)) {
            const amount = this.game.crafting.inventory[type] || 0;
            const resEl = document.createElement('span');
            resEl.style.cssText = 'background:rgba(255,255,255,0.08); padding:3px 8px; border-radius:3px; display:flex; align-items:center; gap:4px;';
            resEl.innerHTML = `<span>${data.icon}</span><span style="color:${data.color}; font-weight:bold;">${amount}</span><span style="color:#aaa;">${data.name}</span>`;
            resourcesContainer.appendChild(resEl);
        }

        // Render recipes grouped by category
        const container = document.getElementById('craftingRecipes');
        container.innerHTML = '';

        // Group recipes
        const categories = {
            '⚔️ Оружие': [],
            '🛡️ Броня': [],
            '🧪 Зелья': [],
            '🔧 Инструменты': [],
            '⬆️ Улучшения': []
        };

        for (let i = 0; i < RECIPES.length; i++) {
            const recipe = RECIPES[i];
            const name = recipe.name;
            if (name.includes('Шлем') || name.includes('Нагрудник') || name.includes('Поножи') || name.includes('Кольчуга')) {
                categories['🛡️ Броня'].push(i);
            } else if (name.includes('Зелье')) {
                categories['🧪 Зелья'].push(i);
            } else if (name.includes('Кирка') || name.includes('Топор')) {
                categories['🔧 Инструменты'].push(i);
            } else if (name.includes('Заточка') || name.includes('Увеличение') || name.includes('эффект') || name.includes('Огненный') || name.includes('Ледяной') || name.includes('Отравленный')) {
                categories['⬆️ Улучшения'].push(i);
            } else {
                categories['⚔️ Оружие'].push(i);
            }
        }

        for (const [catName, recipeIndices] of Object.entries(categories)) {
            if (recipeIndices.length === 0) continue;

            const catHeader = document.createElement('div');
            catHeader.style.cssText = 'color:#ffd54f; font-size:12px; font-weight:bold; margin-top:6px; margin-bottom:2px; padding:2px 4px; border-bottom:1px solid #444;';
            catHeader.textContent = catName;
            container.appendChild(catHeader);

            for (const idx of recipeIndices) {
                const recipe = RECIPES[idx];
                const canCraft = this.game.crafting.canCraft(recipe);

                const el = document.createElement('div');
                el.style.cssText = `padding:6px 10px; background:${canCraft ? 'rgba(255,143,0,0.1)' : 'rgba(255,255,255,0.03)'}; border:1px solid ${canCraft ? '#ff8f00' : '#444'}; border-radius:4px; cursor:${canCraft ? 'pointer' : 'not-allowed'}; font-size:11px; display:flex; align-items:center; justify-content:space-between; opacity:${canCraft ? 1 : 0.4}; transition:background 0.15s;`;
                if (canCraft) {
                    el.addEventListener('mouseenter', () => { el.style.background = 'rgba(255,143,0,0.25)'; });
                    el.addEventListener('mouseleave', () => { el.style.background = 'rgba(255,143,0,0.1)'; });
                }

                // Left side: name + description
                const leftDiv = document.createElement('div');
                leftDiv.style.cssText = 'display:flex; flex-direction:column; gap:2px;';
                const nameSpan = document.createElement('span');
                nameSpan.style.cssText = 'color:#fff; font-weight:bold;';
                nameSpan.textContent = recipe.name;
                leftDiv.appendChild(nameSpan);

                const descSpan = document.createElement('span');
                descSpan.style.cssText = 'color:#aaa; font-size:10px;';
                descSpan.textContent = recipe.description;
                leftDiv.appendChild(descSpan);

                el.appendChild(leftDiv);

                // Right side: ingredients
                const ingDiv = document.createElement('div');
                ingDiv.style.cssText = 'display:flex; gap:4px; align-items:center;';
                for (const [resType, amount] of Object.entries(recipe.ingredients)) {
                    const resData = RESOURCES[resType];
                    const has = (this.game.crafting.inventory[resType] || 0) >= amount;
                    const ingEl = document.createElement('span');
                    ingEl.style.cssText = `padding:2px 5px; border-radius:3px; background:${has ? 'rgba(76,175,80,0.2)' : 'rgba(229,57,53,0.2)'}; font-size:10px; display:flex; align-items:center; gap:2px;`;
                    ingEl.innerHTML = `${resData.icon || ''} <span style="color:${has ? '#81c784' : '#ef9a9a'};">${amount}</span>`;
                    ingDiv.appendChild(ingEl);
                }

                // Craft button
                if (canCraft) {
                    const craftBtn = document.createElement('span');
                    craftBtn.style.cssText = 'margin-left:8px; padding:2px 8px; background:#ff8f00; color:#000; border-radius:3px; font-size:10px; font-weight:bold; cursor:pointer;';
                    craftBtn.textContent = 'Крафт';
                    craftBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.craft(idx);
                    });
                    ingDiv.appendChild(craftBtn);
                }

                el.appendChild(ingDiv);

                if (canCraft) {
                    el.addEventListener('click', () => this.craft(idx));
                }

                container.appendChild(el);
            }
        }
    }

    craft(recipeIndex) {
        const result = this.game.crafting.craft(recipeIndex);
        if (!result) {
            this.game.audio.playPlayerHit();
            return;
        }

        if (result === 'potion_health') {
            this.game.potions.push(new Potion(this.game.player.x + (Math.random() - 0.5) * 30, this.game.player.y + (Math.random() - 0.5) * 30, 'health'));
        } else if (result === 'potion_speed') {
            this.game.potions.push(new Potion(this.game.player.x + (Math.random() - 0.5) * 30, this.game.player.y + (Math.random() - 0.5) * 30, 'speed'));
        } else if (result === 'potion_invisibility') {
            this.game.potions.push(new Potion(this.game.player.x + (Math.random() - 0.5) * 30, this.game.player.y + (Math.random() - 0.5) * 30, 'invisibility'));
        } else if (result === 'potion_regen') {
            this.game.potions.push(new Potion(this.game.player.x + (Math.random() - 0.5) * 30, this.game.player.y + (Math.random() - 0.5) * 30, 'regen'));
        } else if (result === 'potion_attack_boost') {
            this.game.potions.push(new Potion(this.game.player.x + (Math.random() - 0.5) * 30, this.game.player.y + (Math.random() - 0.5) * 30, 'attack_boost'));
        } else if (result === 'potion_slow_time') {
            this.game.potions.push(new Potion(this.game.player.x + (Math.random() - 0.5) * 30, this.game.player.y + (Math.random() - 0.5) * 30, 'slow_time'));
        } else if (result.startsWith('upgrade_')) {
            const selectedItem = this.game.slots[this.game.selectedSlot];
            if (!selectedItem) {
                this.game.audio.playPlayerHit();
                return;
            }

            if (result === 'upgrade_damage_3') {
                selectedItem.attackDamage += 3;
                selectedItem.name = selectedItem.name.replace(/ \+(\d+)$/, '') + ' +3';
            } else if (result === 'upgrade_damage_5') {
                selectedItem.attackDamage += 5;
                selectedItem.name = selectedItem.name.replace(/ \+(\d+)$/, '') + ' +5';
            } else if (result === 'upgrade_damage_8') {
                selectedItem.attackDamage += 8;
                selectedItem.name = selectedItem.name.replace(/ \+(\d+)$/, '') + ' +8';
            } else if (result === 'upgrade_range_5') {
                selectedItem.attackRange += 5;
                selectedItem.name += ' (дальн.)';
            } else if (result === 'upgrade_range_10') {
                selectedItem.attackRange += 10;
                selectedItem.name += ' (дальн.+)';
            } else if (result === 'upgrade_fire') {
                selectedItem.arrowType = 'fire';
                selectedItem.name = 'Огненный ' + selectedItem.name;
            } else if (result === 'upgrade_ice') {
                selectedItem.arrowType = 'ice';
                selectedItem.name = 'Ледяной ' + selectedItem.name;
            } else if (result === 'upgrade_poison') {
                selectedItem.arrowType = 'poison';
                selectedItem.name = 'Отравленный ' + selectedItem.name;
            }

            this.game.player.applyItemStats(this.game.slots[this.game.selectedSlot], this.game.armorDefense, this.game.getArmorHealthBonus());
        } else if (result.armorType) {
            this.game.armorSlots[result.armorType] = result;
            this.game.updateArmorStats();
            this.game.player.applyItemStats(this.game.slots[this.game.selectedSlot], this.game.armorDefense, this.game.getArmorHealthBonus());
        } else if (result instanceof Item) {
            let added = false;
            for (let i = 0; i < this.game.slots.length; i++) {
                if (!this.game.slots[i]) {
                    this.game.slots[i] = result;
                    this.game.player.applyItemStats(this.game.slots[this.game.selectedSlot], this.game.armorDefense, this.game.getArmorHealthBonus());
                    added = true;
                    break;
                }
            }
            if (!added) {
                // Все слоты заняты — показываем уведомление
                this.game.audio.playPlayerHit();
                return;
            }
        }

        this.render();
        this.game.audio.playLevelUp();
        this.game.particles.emit(this.game.player.x, this.game.player.y, '#ffd54f', 10, 3, 25, 4);
    }
}

class CraftingSystem {
    constructor() {
        this.inventory = {
            wood: 0,
            stone: 0,
            metal: 0,
            essence: 0
        };
    }

    addResource(type, amount) {
        if (this.inventory[type] !== undefined) {
            this.inventory[type] += amount;
        }
    }

    canCraft(recipe) {
        for (const [res, amount] of Object.entries(recipe.ingredients)) {
            if ((this.inventory[res] || 0) < amount) return false;
        }
        return true;
    }

    craft(recipeIndex) {
        const recipe = RECIPES[recipeIndex];
        if (!recipe) return null;

        if (!this.canCraft(recipe)) return null;

        // Consume resources
        for (const [res, amount] of Object.entries(recipe.ingredients)) {
            this.inventory[res] -= amount;
        }

        return recipe.result();
    }

    getResourceString() {
        let parts = [];
        for (const [type, data] of Object.entries(RESOURCES)) {
            parts.push(`${data.icon} ${data.name}: ${this.inventory[type] || 0}`);
        }
        return parts.join(' | ');
    }
}
