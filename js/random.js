// ========== Seeded Random Number Generator ==========
// Deterministic random based on world seed and coordinates

function seededRandom(seed, x, y, offset = 0) {
    let hash = seed + x * 374761393 + y * 668265263 + offset * 1274126177;
    hash = (hash ^ (hash >> 13)) * 1274126177;
    hash = hash ^ (hash >> 16);
    return (hash & 0x7fffffff) / 0x7fffffff;
}
