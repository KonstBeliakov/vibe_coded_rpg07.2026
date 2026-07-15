// ========== Biome System ==========

// Biome types
const BIOME_NORMAL = 0;
const BIOME_MOSSY = 1;
const BIOME_WEB = 2;
const BIOME_LAVA = 3;
const BIOME_ICE = 4;
const BIOME_DESERT = 5;
const BIOME_SWAMP = 6;
const BIOME_MAGIC = 7;
const BIOME_CRYSTAL = 8;

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
    },
    [BIOME_DESERT]: {
        name: 'Пустынный',
        floorColor: '#3a3a1a',
        wallColor: '#5a5a3a',
        description: 'Жаркая пустыня'
    },
    [BIOME_SWAMP]: {
        name: 'Болотный',
        floorColor: '#1a3a2a',
        wallColor: '#3a4a3a',
        description: 'Топкое болото'
    },
    [BIOME_MAGIC]: {
        name: 'Магический',
        floorColor: '#2a1a3a',
        wallColor: '#4a3a5a',
        description: 'Наполнен магией'
    },
    [BIOME_CRYSTAL]: {
        name: 'Кристальный',
        floorColor: '#1a2a3a',
        wallColor: '#3a5a5a',
        description: 'Сверкающий кристаллами'
    }
};

/**
 * Get biome type at given tile coordinates using temperature and weirdness
 * @param {PerlinNoise} perlin - Perlin noise instance
 * @param {number} tileX - Tile X coordinate
 * @param {number} tileY - Tile Y coordinate
 * @returns {number} Biome type constant
 */
function getBiomeAt(perlin, tileX, tileY) {
    // Temperature noise (scale 0.02 for larger regions)
    const temperature = perlin.octaveNoise(tileX * 0.02, tileY * 0.02, 2, 0.5);
    // Weirdness noise (scale 0.025, different offset for independence)
    const weirdness = perlin.octaveNoise(tileX * 0.025 + 100, tileY * 0.025 + 100, 2, 0.5);

    // High weirdness → magical, crystal, web biomes
    if (weirdness > 0.7) {
        // Within high weirdness, temperature determines sub-type
        if (temperature > 0.5) {
            return BIOME_MAGIC;
        } else if (temperature > 0.2) {
            return BIOME_CRYSTAL;
        } else {
            return BIOME_WEB;
        }
    }

    // Medium weirdness → swamp, mossy
    if (weirdness > 0.4) {
        if (temperature > 0.5) {
            return BIOME_SWAMP;
        } else {
            return BIOME_MOSSY;
        }
    }

    // Low weirdness → temperature-based biomes
    if (temperature > 0.7) {
        return BIOME_LAVA;
    } else if (temperature > 0.5) {
        return BIOME_DESERT;
    } else if (temperature > 0.3) {
        return BIOME_NORMAL;
    } else if (temperature > 0.15) {
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
