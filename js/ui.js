// ========== UI Manager ==========
class UIManager {
    constructor(game) {
        this.game = game;
    }

    draw() {
        this.drawHPBar();
        this.drawInventory();
        this.drawArmorSlots();
        this.drawSkillSlots();
        this.drawMinimap();
        this.drawFogOfWar();
        this.drawNightOverlay();
        this.drawDamageFlash();
        this.drawUIText();
        this.drawAchievementNotifications();
    }

    drawHPBar() {
        const ctx = this.game.ctx;
        const hpBarWidth = 200;
        const hpBarHeight = 20;
        const hpX = 15;
        const hpY = 50;
        const hpPercent = this.game.player.health / this.game.player.maxHealth;

        ctx.fillStyle = '#333';
        ctx.fillRect(hpX, hpY, hpBarWidth, hpBarHeight);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.strokeRect(hpX, hpY, hpBarWidth, hpBarHeight);

        const hpColor = hpPercent > 0.5 ? '#4caf50' : hpPercent > 0.25 ? '#ff9800' : '#e53935';
        ctx.fillStyle = hpColor;
        ctx.fillRect(hpX + 1, hpY + 1, (hpBarWidth - 2) * hpPercent, hpBarHeight - 2);

        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.ceil(this.game.player.health)} / ${this.game.player.maxHealth}`, hpX + hpBarWidth / 2, hpY + 15);
        ctx.textAlign = 'left';
    }

    drawInventory() {
        const ctx = this.game.ctx;
        const slotSize = 50;
        const slotMargin = 5;
        const totalWidth = this.game.slots.length * (slotSize + slotMargin) - slotMargin;
        const startX = (this.game.width - totalWidth) / 2;
        const startY = this.game.height - slotSize - 15;

        let tooltipData = null;
        const mouseCanvasX = this.game.mouseX - this.game.canvas.getBoundingClientRect().left;
        const mouseCanvasY = this.game.mouseY - this.game.canvas.getBoundingClientRect().top;

        for (let i = 0; i < this.game.slots.length; i++) {
            const sx = startX + i * (slotSize + slotMargin);
            const sy = startY;
            const result = Item.drawSlot(ctx, sx, sy, slotSize, this.game.slots[i], i === this.game.selectedSlot, i + 1, mouseCanvasX, mouseCanvasY);
            if (result) {
                tooltipData = result;
            }
        }

        // Draw tooltip
        if (tooltipData) {
            this.drawTooltip(ctx, tooltipData);
        }
    }

    drawTooltip(ctx, tooltipData) {
        const lines = tooltipData.text.split('\n');
        const lineHeight = 16;
        const padding = 6;
        let maxWidth = 0;
        ctx.font = '12px monospace';
        for (const line of lines) {
            const w = ctx.measureText(line).width;
            if (w > maxWidth) maxWidth = w;
        }
        const tooltipW = maxWidth + padding * 2;
        const tooltipH = lines.length * lineHeight + padding * 2;

        let ttX = tooltipData.x;
        let ttY = tooltipData.y;
        if (ttX + tooltipW > this.game.width) ttX = this.game.width - tooltipW - 5;
        if (ttY + tooltipH > this.game.height) ttY = this.game.height - tooltipH - 5;
        if (ttX < 0) ttX = 5;
        if (ttY < 0) ttY = 5;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(ttX, ttY, tooltipW, tooltipH);
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.strokeRect(ttX, ttY, tooltipW, tooltipH);

        ctx.fillStyle = '#fff';
        ctx.font = '12px monospace';
        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], ttX + padding, ttY + padding + (i + 1) * lineHeight - 4);
        }
    }

    drawArmorSlots() {
        const ctx = this.game.ctx;
        const slotSize = 50;
        const slotMargin = 5;
        const totalWidth = this.game.slots.length * (slotSize + slotMargin) - slotMargin;
        const startX = (this.game.width - totalWidth) / 2;
        const startY = this.game.height - slotSize - 15;

        const armorSlotSize = 40;
        const armorX = startX - armorSlotSize - 10;
        const armorY = startY;
        const armorLabels = { helmet: 'Шлем', chestplate: 'Нагрудник', leggings: 'Поножи' };
        const armorColors = { helmet: '#42a5f5', chestplate: '#66bb6a', leggings: '#ffa726' };

        ctx.font = '9px monospace';
        let armorIdx = 0;
        for (const [slotType, label] of Object.entries(armorLabels)) {
            const sy = armorY + armorIdx * (armorSlotSize + 5);
            const armor = this.game.armorSlots[slotType];

            ctx.fillStyle = armor ? '#555' : '#333';
            ctx.fillRect(armorX, sy, armorSlotSize, armorSlotSize);

            ctx.strokeStyle = armor ? armorColors[slotType] : '#555';
            ctx.lineWidth = 1;
            ctx.strokeRect(armorX, sy, armorSlotSize, armorSlotSize);

            ctx.fillStyle = '#888';
            ctx.fillText(label, armorX + armorSlotSize + 4, sy + 12);

            if (armor) {
                ctx.fillStyle = '#ccc';
                ctx.font = '8px monospace';
                ctx.fillText(armor.name.substring(0, 8), armorX + 2, sy + armorSlotSize / 2 + 4);
                ctx.font = '9px monospace';
                ctx.fillStyle = '#ffd54f';
                ctx.fillText(`+${armor.defense || 0}`, armorX + armorSlotSize + 4, sy + 24);
            }
            armorIdx++;
        }
    }

    drawSkillSlots() {
        const ctx = this.game.ctx;
        const slotSize = 50;
        const slotMargin = 5;
        const totalWidth = this.game.slots.length * (slotSize + slotMargin) - slotMargin;
        const startX = (this.game.width - totalWidth) / 2;
        const startY = this.game.height - slotSize - 15;

        const skillSlotSize = 40;
        const skillMargin = 5;
        const skillTotalWidth = this.game.skills.length * (skillSlotSize + skillMargin) - skillMargin;
        const skillStartX = (this.game.width - skillTotalWidth) / 2;
        const skillStartY = startY - skillSlotSize - 15;

        for (let i = 0; i < this.game.skills.length; i++) {
            const sx = skillStartX + i * (skillSlotSize + skillMargin);
            const sy = skillStartY;
            const skill = this.game.skills[i].skill;

            ctx.fillStyle = skill.isActive ? '#2e7d32' : '#333';
            ctx.fillRect(sx, sy, skillSlotSize, skillSlotSize);
            ctx.strokeStyle = skill.canUse() ? '#4caf50' : '#555';
            ctx.lineWidth = 1;
            ctx.strokeRect(sx, sy, skillSlotSize, skillSlotSize);

            ctx.fillStyle = skill.color;
            ctx.font = '18px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(skill.icon, sx + skillSlotSize / 2, sy + skillSlotSize / 2 + 6);
            ctx.textAlign = 'left';

            ctx.fillStyle = '#aaa';
            ctx.font = '9px monospace';
            ctx.fillText(this.game.skills[i].key.toUpperCase(), sx + 3, sy + 11);

            if (skill.currentCooldown > 0) {
                const cdPercent = skill.getCooldownPercent();
                ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                ctx.fillRect(sx, sy, skillSlotSize, skillSlotSize * cdPercent);
                ctx.fillStyle = '#fff';
                ctx.font = '10px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(Math.ceil(skill.currentCooldown / 1000) + 's', sx + skillSlotSize / 2, sy + skillSlotSize / 2 + 4);
                ctx.textAlign = 'left';
            }

            if (skill.isActive && skill.duration > 0) {
                const activePercent = skill.getActivePercent();
                ctx.fillStyle = skill.color;
                ctx.fillRect(sx, sy + skillSlotSize - 4, skillSlotSize * activePercent, 4);
            }
        }
    }

    drawMinimap() {
        const ctx = this.game.ctx;
        const mapSize = 150;
        const mapX = this.game.width - mapSize - 15;
        const mapY = this.game.height - mapSize - 15;
        const tileSize = 4;
        const viewRadius = Math.floor(mapSize / tileSize / 2);

        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(mapX, mapY, mapSize, mapSize);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.strokeRect(mapX, mapY, mapSize, mapSize);

        ctx.fillStyle = '#aaa';
        ctx.font = '9px monospace';
        ctx.fillText('Карта', mapX + 4, mapY + 12);

        const centerTileX = Math.floor(this.game.player.x / TILE_SIZE);
        const centerTileY = Math.floor(this.game.player.y / TILE_SIZE);

        for (let dy = -viewRadius; dy <= viewRadius; dy++) {
            for (let dx = -viewRadius; dx <= viewRadius; dx++) {
                const tx = centerTileX + dx;
                const ty = centerTileY + dy;
                const sx = mapX + (dx + viewRadius) * tileSize + 2;
                const sy = mapY + (dy + viewRadius) * tileSize + 16;

                if (this.game.tileMap.isWall(tx, ty)) {
                    ctx.fillStyle = '#555';
                    ctx.fillRect(sx, sy, tileSize, tileSize);
                } else {
                    ctx.fillStyle = '#222';
                    ctx.fillRect(sx, sy, tileSize, tileSize);
                }
            }
        }

        // Draw beds on minimap
        ctx.fillStyle = '#8d6e63';
        for (const bed of this.game.beds) {
            const dx = Math.floor(bed.x / TILE_SIZE) - centerTileX;
            const dy = Math.floor(bed.y / TILE_SIZE) - centerTileY;
            if (Math.abs(dx) <= viewRadius && Math.abs(dy) <= viewRadius) {
                const sx = mapX + (dx + viewRadius) * tileSize + 2;
                const sy = mapY + (dy + viewRadius) * tileSize + 16;
                ctx.fillRect(sx, sy, tileSize, tileSize);
            }
        }

        // Draw chests on minimap
        ctx.fillStyle = '#ffd54f';
        for (const chest of this.game.chests) {
            if (chest.opened) continue;
            const dx = Math.floor(chest.x / TILE_SIZE) - centerTileX;
            const dy = Math.floor(chest.y / TILE_SIZE) - centerTileY;
            if (Math.abs(dx) <= viewRadius && Math.abs(dy) <= viewRadius) {
                const sx = mapX + (dx + viewRadius) * tileSize + 2;
                const sy = mapY + (dy + viewRadius) * tileSize + 16;
                ctx.fillRect(sx, sy, tileSize, tileSize);
            }
        }

        // Draw potions on minimap
        ctx.fillStyle = '#42a5f5';
        for (const potion of this.game.potions) {
            if (potion.collected) continue;
            const dx = Math.floor(potion.x / TILE_SIZE) - centerTileX;
            const dy = Math.floor(potion.y / TILE_SIZE) - centerTileY;
            if (Math.abs(dx) <= viewRadius && Math.abs(dy) <= viewRadius) {
                const sx = mapX + (dx + viewRadius) * tileSize + 2;
                const sy = mapY + (dy + viewRadius) * tileSize + 16;
                ctx.fillRect(sx, sy, tileSize, tileSize);
            }
        }

        // Draw boss on minimap
        if (this.game.boss) {
            ctx.fillStyle = '#d500f9';
            const dx = Math.floor(this.game.boss.x / TILE_SIZE) - centerTileX;
            const dy = Math.floor(this.game.boss.y / TILE_SIZE) - centerTileY;
            if (Math.abs(dx) <= viewRadius && Math.abs(dy) <= viewRadius) {
                const sx = mapX + (dx + viewRadius) * tileSize + 2;
                const sy = mapY + (dy + viewRadius) * tileSize + 16;
                ctx.fillRect(sx - 1, sy - 1, tileSize + 2, tileSize + 2);
            }
        }

        // Draw enemies on minimap
        ctx.fillStyle = '#e53935';
        for (const enemy of this.game.enemies) {
            const dx = Math.floor(enemy.x / TILE_SIZE) - centerTileX;
            const dy = Math.floor(enemy.y / TILE_SIZE) - centerTileY;
            if (Math.abs(dx) <= viewRadius && Math.abs(dy) <= viewRadius) {
                const sx = mapX + (dx + viewRadius) * tileSize + 2;
                const sy = mapY + (dy + viewRadius) * tileSize + 16;
                ctx.fillRect(sx, sy, tileSize, tileSize);
            }
        }

        // Draw player on minimap
        ctx.fillStyle = '#4caf50';
        const psx = mapX + viewRadius * tileSize + 2;
        const psy = mapY + viewRadius * tileSize + 16;
        ctx.fillRect(psx - 1, psy - 1, tileSize + 2, tileSize + 2);
    }

    drawFogOfWar() {
        const ctx = this.game.ctx;
        const offsetX = this.game.width / 2 - this.game.player.x;
        const offsetY = this.game.height / 2 - this.game.player.y;
        const viewTileW = Math.ceil(this.game.width / TILE_SIZE) + 2;
        const viewTileH = Math.ceil(this.game.height / TILE_SIZE) + 2;
        const playerTX = Math.floor(this.game.player.x / TILE_SIZE);
        const playerTY = Math.floor(this.game.player.y / TILE_SIZE);

        for (let dy = -Math.ceil(viewTileH / 2); dy <= Math.ceil(viewTileH / 2); dy++) {
            for (let dx = -Math.ceil(viewTileW / 2); dx <= Math.ceil(viewTileW / 2); dx++) {
                const tx = playerTX + dx;
                const ty = playerTY + dy;
                const key = `${tx},${ty}`;
                if (!this.game.exploredTiles.has(key)) {
                    const sx = tx * TILE_SIZE + offsetX;
                    const sy = ty * TILE_SIZE + offsetY;
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
                    ctx.fillRect(sx, sy, TILE_SIZE, TILE_SIZE);
                }
            }
        }
    }

    drawNightOverlay() {
        if (!this.game.isNight) return;
        const ctx = this.game.ctx;
        const nightAlpha = 0.3;
        ctx.fillStyle = `rgba(10, 5, 30, ${nightAlpha})`;
        ctx.fillRect(0, 0, this.game.width, this.game.height);
    }

    drawDamageFlash() {
        if (this.game.damageFlashTimer <= 0) return;
        const ctx = this.game.ctx;
        const flashAlpha = (this.game.damageFlashTimer / this.game.damageFlashDuration) * 0.4;
        ctx.fillStyle = `rgba(255, 0, 0, ${flashAlpha})`;
        ctx.fillRect(0, 0, this.game.width, this.game.height);
    }

    drawUIText() {
        const hungerPercent = Math.floor((this.game.player.hunger / this.game.player.maxHunger) * 100);
        const hungerIcon = hungerPercent > 50 ? '🍖' : hungerPercent > 20 ? '🍞' : '⚠️';
        const timeIcon = this.game.isNight ? '🌙' : '☀️';
        this.game.ui.innerHTML = `${timeIcon} ${this.game.isNight ? 'НОЧЬ' : 'ДЕНЬ'}<br>X: ${Math.round(this.game.player.x)}, Y: ${Math.round(this.game.player.y)}<br>Lv.${this.game.playerLevel} XP: ${this.game.playerXP}/${this.game.xpToNextLevel}<br>💰 ${this.game.playerGold} монет<br>${hungerIcon} Сытость: ${hungerPercent}%<br>${this.game.crafting.getResourceString()}`;
    }

    drawAchievementNotifications() {
        this.game.achievements.drawNotification(this.game.ctx);
    }
}
