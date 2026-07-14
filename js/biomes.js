// ========== Biome System ==========

// Biome types
const BIOME_NORMAL = 0;
const BIOME_MOSSY = 1;
const BIOME_WEB = 2;
const BIOME_LAVA = 3;
const BIOME_ICE = 4;

// Biome configuration
const BIOME_CONFIG = {
    [BIOME_NORMAL]: {
        name: 'Обычный',
        floorColor: '#2a2a2a',
        wallColor: '#555',
        description: 'Обычное подземелье'
    },
    [BIOME_MOSSY]: {
        name: 'Мшистый',
        floorColor: '#1a3a1a',
        wallColor: '#3a4a3a',
        description: 'Покрытый мхом'
    },
    [BIOME_WEB]: {
        name: 'Паутинный',
        floorColor: '#2a2a3a',
        wallColor: '#4a4a5a',
        description: 'Затянутый паутиной'
    },
    [BIOME_LAVA]: {
        name: 'Лавовый',
        floorColor: '#3a1a1a',
        wallColor: '#5a3a3a',
        description: 'Жаркий, с лавой'
    },
    [BIOME_ICE]: {
        name: 'Ледяной',
        floorColor: '#1a2a3a',
        wallColor: '#3a4a5a',
        description: 'Холодный, со льдом'
    }
};

/**
 * Get biome type at given tile coordinates
 * @param {PerlinNoise} perlin - Perlin noise instance
 * @param {number} tileX - Tile X coordinate
 * @param {number} tileY - Tile Y coordinate
 * @returns {number} Biome type constant
 */
function getBiomeAt(perlin, tileX, tileY) {
    const biomeNoise = perlin.octaveNoise(tileX * 0.03, tileY * 0.03, 2, 0.5);
    if (biomeNoise > 0.3 && biomeNoise < 0.45) {
        return BIOME_MOSSY;
    } else if (biomeNoise >= 0.45 && biomeNoise < 0.55) {
        return BIOME_WEB;
    } else if (biomeNoise >= 0.55 && biomeNoise < 0.65) {
        return BIOME_LAVA;
    } else if (biomeNoise >= 0.65) {
        return BIOME_ICE;
    }
    return BIOME_NORMAL;
}

/**
 * Get floor color for a biome
 * @param {number} biome - Biome type constant
 * @returns {string} CSS color string
 */
function getBiomeFloorColor(biome) {
    const config = BIOME_CONFIG[biome];
    return config ? config.floorColor : BIOME_CONFIG[BIOME_NORMAL].floorColor;
}

/**
 * Get wall color for a biome
 * @param {number} biome - Biome type constant
 * @returns {string} CSS color string
 */
function getBiomeWallColor(biome) {
    const config = BIOME_CONFIG[biome];
    return config ? config.wallColor : BIOME_CONFIG[BIOME_NORMAL].wallColor;
}

/**
 * Get biome name
 * @param {number} biome - Biome type constant
 * @returns {string} Biome name
 */
function getBiomeName(biome) {
    const config = BIOME_CONFIG[biome];
    return config ? config.name : 'Неизвестный';
}
