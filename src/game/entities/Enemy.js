import * as PIXI from 'pixi.js';
import CombatSystem from '../systems/CombatSystem';

export class Enemy extends PIXI.Container {
    constructor(data) {
        super();
        this.id = data.id;
        this.data = data;

        this.hp = data.hp;
        this.maxHp = data.hp;
        this.atk = data.atk || 5;
        this.def = data.def || 0;
        this.isBoss = data.isBoss || false;

        this.attackCooldown = 0;
        this.attackSpeed = this.isBoss ? 120 : 90; // Boss attacks slower but harder

        this.goldReward = data.goldReward || 5;
        this.xpReward = data.xpReward || 3;

        this.setupVisuals();
    }

    setupVisuals() {
        const scale = this.isBoss ? 2.0 : 1.0;
        const bodyColor = this.isBoss ? 0xd4a017 : 0x8e44ad;
        const lineColor = this.isBoss ? 0xf1c40f : 0x9b59b6;
        const eyeColor = this.isBoss ? 0xff0000 : 0xe74c3c;
        const w = Math.floor(32 * scale);
        const h = Math.floor(40 * scale);

        // Enemy Body
        this.bodyGfx = new PIXI.Graphics();
        this.bodyGfx.beginFill(bodyColor, this.isBoss ? 0.7 : 0.4);
        this.bodyGfx.lineStyle(this.isBoss ? 3 : 2, lineColor, 1);
        this.bodyGfx.drawRect(-w / 2, -h, w, h);

        // Glowing Eyes
        const eyeSize = this.isBoss ? 4 : 2;
        const eyeY = -h + Math.floor(10 * scale);
        this.bodyGfx.beginFill(eyeColor);
        this.bodyGfx.drawCircle(Math.floor(-6 * scale), eyeY, eyeSize);
        this.bodyGfx.drawCircle(Math.floor(6 * scale), eyeY, eyeSize);
        this.bodyGfx.endFill();

        this.addChild(this.bodyGfx);

        // Boss Name Tag + Crown
        if (this.isBoss && this.data.name) {
            const nameStyle = new PIXI.TextStyle({
                fontFamily: 'Inter, sans-serif',
                fontSize: 14,
                fontWeight: 'bold',
                fill: '#f1c40f',
                dropShadow: true,
                dropShadowColor: '#000000',
                dropShadowBlur: 4,
                dropShadowDistance: 2,
            });
            this.nameTag = new PIXI.Text(`👑 ${this.data.name}`, nameStyle);
            this.nameTag.anchor.set(0.5, 1);
            this.nameTag.y = -h - 16;
            this.addChild(this.nameTag);
        }

        // HP Bar Background
        const barW = Math.floor(40 * scale);
        this.hpBarBg = new PIXI.Graphics();
        this.hpBarBg.beginFill(0x2c3e50);
        this.hpBarBg.drawRoundedRect(-barW / 2, -h - 12, barW, 6, 2);
        this.hpBarBg.endFill();
        this.addChild(this.hpBarBg);

        // HP Bar Fill
        this.hpBarFill = new PIXI.Graphics();
        this.addChild(this.hpBarFill);
        this.updateHpBar();
    }

    updateHpBar() {
        this.hpBarFill.clear();
        const ratio = Math.max(0, this.hp / this.maxHp);
        const scale = this.isBoss ? 2.0 : 1.0;
        const barW = Math.floor(40 * scale);
        const h = Math.floor(40 * scale);
        const color = this.isBoss ? (ratio > 0.5 ? 0xf1c40f : ratio > 0.25 ? 0xe67e22 : 0xc0392b) : (ratio > 0.5 ? 0xe74c3c : ratio > 0.25 ? 0xe67e22 : 0xc0392b);
        this.hpBarFill.beginFill(color);
        this.hpBarFill.drawRoundedRect(-(barW / 2) + 1, -h - 11, Math.max(0, (barW - 2) * ratio), 4, 1);
        this.hpBarFill.endFill();
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.updateHpBar();

        // Modern Hit Flash
        this.tint = 0xffffff;
        this.scale.set(1.1);
        setTimeout(() => {
            this.tint = 0xffffff;
            this.scale.set(1);
        }, 50);
    }

    update(delta) {
        // Depth Sorting
        this.zIndex = this.y;

        // Find nearest Hero
        const target = CombatSystem.getNearestHero(this);

        if (target) {
            const dist = CombatSystem.getDistance(this, target);

            if (dist > 30) { // Move towards heroes
                const angle = Math.atan2(target.y - this.y, target.x - this.x);
                const speed = this.isBoss ? 0.5 : 0.8;

                this.x += Math.cos(angle) * speed * delta;
                this.y += Math.sin(angle) * speed * delta;
            }

            // Attack if close enough
            if (dist <= 50) {
                if (this.attackCooldown <= 0) {
                    this.attackCooldown = this.attackSpeed;
                    CombatSystem.dealDamageToHero(this, target, this.atk);
                }
            }
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
        }

        // Hover effect
        this.bodyGfx.y = Math.sin(Date.now() / 200) * 2;
    }
}
