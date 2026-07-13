// ========== Item ==========
class Item {
    constructor(name, attackDamage, attackRange, texturePath) {
        this.name = name;
        this.attackDamage = attackDamage;
        this.attackRange = attackRange;
        this.texture = new Image();
        this.texture.src = texturePath;
        this.loaded = false;
        this.texture.onload = () => { this.loaded = true; };
    }

    static generateWeapon(distanceFromSpawn) {
        // Quality scales with distance: 1.0 at spawn, ~2.0 at 5000px
        const quality = 1.0 + distanceFromSpawn / 5000;

        const roll = Math.random();
        let isBow = false;
        let isStaff = false;

        if (roll < 0.3) {
            isStaff = true; // 30% chance for staff
        } else if (roll < 0.6) {
            isBow = true; // 30% chance for bow
        }
        // 40% chance for sword (default)

        const baseDamage = isBow ? 5 : isStaff ? 8 : 10;
        const baseRange = isBow ? 0 : isStaff ? 0 : 10;

        const damageMult = 0.8 + Math.random() * 0.4;
        const rangeMult = 0.8 + Math.random() * 0.4;

        const damage = Math.floor((baseDamage + Math.random() * 10) * quality * damageMult);
        const range = Math.floor((baseRange + Math.random() * 15) * quality * rangeMult);

        // Generate name based on quality
        let prefix = '';
        if (quality > 1.8) prefix = 'Легендарный ';
        else if (quality > 1.4) prefix = 'Редкий ';
        else if (quality > 1.1) prefix = 'Хороший ';

        let name;
        let arrowType = 'normal';
        if (isStaff) {
            name = `${prefix}Посох`;
        } else if (isBow) {
            // Bows can have special arrow types
            const arrowRoll = Math.random();
            if (arrowRoll < 0.2) {
                arrowType = 'fire';
                name = `${prefix}Огненный лук`;
            } else if (arrowRoll < 0.4) {
                arrowType = 'ice';
                name = `${prefix}Ледяной лук`;
            } else if (arrowRoll < 0.55) {
                arrowType = 'poison';
                name = `${prefix}Отравленный лук`;
            } else {
                name = `${prefix}Лук`;
            }
        } else {
            name = `${prefix}Меч`;
        }

        const item = new Item(name, damage, range, 'no_texture.png');
        item.arrowType = arrowType;
        return item;
    }
}
