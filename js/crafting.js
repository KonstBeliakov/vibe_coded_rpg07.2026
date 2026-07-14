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
        result: () => new Item('Меч', 10, 10, 'no_texture.png'),
        ingredients: { wood: 2, metal: 3 },
        description: 'Стандартный меч'
    },
    {
        name: 'Лук',
        result: () => new Item('Лук', 5, 0, 'no_texture.png'),
        ingredients: { wood: 4, stone: 1 },
        description: 'Стандартный лук'
    },
    {
        name: 'Посох',
        result: () => {
            const item = new Item('Посох', 8, 0, 'no_texture.png');
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
    }
];

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
