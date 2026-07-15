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
        document.getElementById('craftingResources').textContent = this.game.crafting.getResourceString();
        const container = document.getElementById('craftingRecipes');
        container.innerHTML = '';

        for (let i = 0; i < RECIPES.length; i++) {
            const recipe = RECIPES[i];
            const canCraft = this.game.crafting.canCraft(recipe);
            const el = document.createElement('div');
            el.style.cssText = `padding:4px 8px; background:${canCraft ? '#444' : '#333'}; border:1px solid ${canCraft ? '#ff8f00' : '#555'}; border-radius:3px; cursor:${canCraft ? 'pointer' : 'not-allowed'}; font-size:11px; display:flex; flex-direction:column; align-items:center; min-width:90px; opacity:${canCraft ? 1 : 0.5};`;
            el.innerHTML = `<span>${recipe.name}</span><span style="color:#aaa; font-size:9px;">${recipe.description}</span>`;
            if (canCraft) {
                el.addEventListener('click', () => this.craft(i));
            }
            container.appendChild(el);
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
        } else {
            for (let i = 0; i < this.game.slots.length; i++) {
                if (!this.game.slots[i]) {
                    this.game.slots[i] = result;
                    this.game.player.applyItemStats(this.game.slots[this.game.selectedSlot], this.game.armorDefense, this.game.getArmorHealthBonus());
                    break;
                }
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
