// ========== Rarity System ==========
const RARITY = {
    common: { name: 'Обычный', color: '#9e9e9e', glowColor: 'rgba(158,158,158,0.3)', damageMult: 0.8, rangeMult: 0.8 },
    rare: { name: 'Редкий', color: '#42a5f5', glowColor: 'rgba(66,165,245,0.4)', damageMult: 1.2, rangeMult: 1.2 },
    legendary: { name: 'Легендарный', color: '#ffd700', glowColor: 'rgba(255,215,0,0.5)', damageMult: 1.8, rangeMult: 1.6 }
};

function getRarityForDistance(distanceFromSpawn) {
    const roll = Math.random();
    if (distanceFromSpawn > 3000 && roll < 0.15) return 'legendary';
    if (distanceFromSpawn > 1000 && roll < 0.35) return 'rare';
    return 'common';
}

// ========== Item ==========
class Item {
    constructor(name, attackDamage, attackRange, texturePath, rarity = 'common') {
        this.name = name;
        this.attackDamage = attackDamage;
        this.attackRange = attackRange;
        this.rarity = rarity;
        this.texture = new Image();
        this.texture.src = texturePath;
        this.loaded = false;
        this.texture.onload = () => { this.loaded = true; };
    }

    getRarityColor() {
        return RARITY[this.rarity]?.color || '#9e9e9e';
    }

    getRarityGlow() {
        return RARITY[this.rarity]?.glowColor || 'rgba(158,158,158,0.3)';
    }

    getRarityName() {
        return RARITY[this.rarity]?.name || 'Обычный';
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

        // Determine rarity
        const rarity = getRarityForDistance(distanceFromSpawn);
        const rarityData = RARITY[rarity];

        // Apply rarity multipliers
        const finalDamage = Math.floor(damage * rarityData.damageMult);
        const finalRange = Math.floor(range * rarityData.rangeMult);

        // Generate name based on rarity
        let prefix = rarityData.name + ' ';

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

        const item = new Item(name, finalDamage, finalRange, 'no_texture.png', rarity);
        item.arrowType = arrowType;
        return item;
    }

    /**
     * Draw an inventory slot at the given position
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x - Slot X position
     * @param {number} y - Slot Y position
     * @param {number} size - Slot size (width and height)
     * @param {Item|null} item - Item to draw, or null for empty slot
     * @param {boolean} isSelected - Whether this slot is currently selected
     * @param {number} slotNumber - Slot number (1-8) to display
     * @returns {object|null} Tooltip info { text, x, y } if mouse is hovering, or null
     */
    static drawSlot(ctx, x, y, size, item, isSelected, slotNumber, mouseX, mouseY) {
        // Slot background
        ctx.fillStyle = isSelected ? '#666' : '#444';
        ctx.fillRect(x, y, size, size);

        // Rarity glow for items
        if (item) {
            const glowColor = item.getRarityGlow ? item.getRarityGlow() : 'rgba(158,158,158,0.3)';
            ctx.fillStyle = glowColor;
            ctx.fillRect(x, y, size, size);
        }

        // Slot border with rarity color
        let borderColor = '#888';
        if (item) {
            borderColor = item.getRarityColor ? item.getRarityColor() : '#888';
        }
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = isSelected ? 2 : 1;
        ctx.strokeRect(x, y, size, size);

        // Slot number
        ctx.fillStyle = '#aaa';
        ctx.font = '10px monospace';
        ctx.fillText(slotNumber, x + 3, y + 12);

        // Item rendering
        if (item) {
            if (item.loaded) {
                ctx.drawImage(item.texture, x + 5, y + 5, size - 10, size - 10);
            } else {
                ctx.fillStyle = '#888';
                ctx.font = '10px monospace';
                ctx.fillText(item.name, x + 5, y + size / 2 + 5);
            }

            // Check mouse hover for tooltip
            if (mouseX >= x && mouseX <= x + size && mouseY >= y && mouseY <= y + size) {
                let tooltipText = item.name;
                let details = [];
                details.push(`Редкость: ${item.getRarityName ? item.getRarityName() : 'Обычный'}`);
                if (item.attackDamage > 0) details.push(`Урон: +${item.attackDamage}`);
                if (item.attackRange > 0) details.push(`Радиус: +${item.attackRange}`);
                if (item.arrowType && item.arrowType !== 'normal') {
                    const typeNames = { fire: 'Огненный', ice: 'Ледяной', poison: 'Отравленный' };
                    details.push(`Тип стрел: ${typeNames[item.arrowType]}`);
                }
                if (details.length > 0) {
                    tooltipText += '\n' + details.join('\n');
                }
                return { text: tooltipText, x: mouseX + 15, y: mouseY - 10 };
            }
        }

        return null;
    }
}
