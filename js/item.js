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
}
