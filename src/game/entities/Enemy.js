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

        // Zone determination (fallback to 1)
        this.zone = data.zone || 1;

        this.attackCooldown = 0;
        this.attackSpeed = this.isBoss ? 120 : 90; // Boss attacks slower but harder

        this.goldReward = data.goldReward || 5;
        this.xpReward = data.xpReward || 3;

        // Visual State
        this.blinkTimer = Math.random() * 200;
        this.isBlinking = false;
        this.hoverOffset = Math.random() * 100;

        // Hit Area
        const size = this.isBoss ? 80 : 50;
        this.hitArea = new PIXI.Rectangle(-size / 2, -size, size, size);

        this.setupVisuals();
    }

    getZoneColor() {
        // Zone 1-3: Shadow Purple
        if (this.zone <= 3) return { body: 0x4a235a, light: 0x8e44ad };
        // Zone 4-6: Murky Green
        if (this.zone <= 6) return { body: 0x145a32, light: 0x27ae60 };
        // Zone 7-9: Dark Crimson
        if (this.zone <= 9) return { body: 0x641e16, light: 0xc0392b };
        // Zone 10+: Void Blue
        return { body: 0x154360, light: 0x2980b9 };
    }

    setupVisuals() {
        this.removeChildren();

        const colors = this.getZoneColor();
        const scale = this.isBoss ? 2.0 : 1.0;

        // Shadow (Common)
        const shadow = new PIXI.Graphics();
        shadow.beginFill(0x000000, 0.4);
        shadow.drawEllipse(0, 0, 15 * scale, 8 * scale);
        shadow.endFill();
        this.addChild(shadow);

        // Main Body Container (for bobbing)
        this.bodyContainer = new PIXI.Container();
        this.addChild(this.bodyContainer);

        // Body Shape (Pentagon/Hexagon)
        this.bodyGfx = new PIXI.Graphics();
        this.bodyGfx.beginFill(colors.body, 0.9);
        this.bodyGfx.lineStyle(2, colors.light, 0.5);

        const w = 18 * scale;
        const h = 40 * scale;

        // Irregular Polygon
        const path = [
            -w, -h * 0.6,   // Top Left
            0, -h,        // Top Tip
            w, -h * 0.6,    // Top Right
            w * 0.8, -h * 0.1, // Bot Right
            0, 0,         // Bot Tip
            -w * 0.8, -h * 0.1 // Bot Left
        ];
        this.bodyGfx.drawPolygon(path);
        this.bodyGfx.endFill();
        this.bodyContainer.addChild(this.bodyGfx);

        // Tendrils (Visual only)
        // Draw some lines extending down
        /*
        const tendrils = new PIXI.Graphics();
        tendrils.lineStyle(2, colors.body, 0.8);
        tendrils.moveTo(-5*scale, 0); tendrils.lineTo(-8*scale, 10*scale);
        tendrils.moveTo(5*scale, 0); tendrils.lineTo(8*scale, 10*scale);
        this.bodyContainer.addChildAt(tendrils, 0);
        */

        // Eyes
        this.eyesContainer = new PIXI.Container();
        this.bodyContainer.addChild(this.eyesContainer);

        const eyeColor = this.isBoss ? 0xff0000 : 0xe74c3c;
        const eyeY = -h * 0.55;
        const eyeX = w * 0.4;
        const eyeSize = 3 * scale;

        const leftEye = new PIXI.Graphics();
        leftEye.beginFill(eyeColor);
        leftEye.drawCircle(-eyeX, eyeY, eyeSize);
        leftEye.endFill();

        const rightEye = new PIXI.Graphics();
        rightEye.beginFill(eyeColor);
        rightEye.drawCircle(eyeX, eyeY, eyeSize);
        rightEye.endFill();

        this.eyesContainer.addChild(leftEye);
        this.eyesContainer.addChild(rightEye);

        if (this.isBoss || this.zone >= 10) {
            // Third Eye
            const midEye = new PIXI.Graphics();
            midEye.beginFill(eyeColor);
            midEye.drawCircle(0, eyeY - 6 * scale, eyeSize * 1.2);
            midEye.endFill();
            this.eyesContainer.addChild(midEye);
        }

        // Boss Extras
        if (this.isBoss) {
            // Crown
            const crown = new PIXI.Graphics();
            crown.beginFill(0xf1c40f);
            crown.drawPolygon([
                -w, -h + 5,
                -w / 2, -h - 10,
                0, -h + 2,
                w / 2, -h - 10,
                w, -h + 5
            ]);
            crown.endFill();
            this.bodyContainer.addChild(crown);

            // Aura
            this.aura = new PIXI.Graphics();
            this.aura.lineStyle(2, 0xe74c3c, 0.4);
            const radius = w * 2.5;
            // Dashed circle manual
            for (let i = 0; i < 8; i++) {
                const start = (i / 8) * Math.PI * 2;
                const end = start + (Math.PI / 10);
                this.aura.arc(0, -h / 2, radius, start, end);
            }
            this.bodyContainer.addChildAt(this.aura, 0);

            // Name Tag
            if (this.data.name) {
                const nameStyle = new PIXI.TextStyle({
                    fontFamily: 'MedievalSharp, serif',
                    fontSize: 16,
                    fontWeight: 'bold',
                    fill: '#f1c40f',
                    dropShadow: true,
                    dropShadowColor: '#000000',
                    dropShadowBlur: 4,
                    dropShadowDistance: 2,
                });
                this.nameTag = new PIXI.Text(`👑 ${this.data.name}`, nameStyle);
                this.nameTag.anchor.set(0.5, 1);
                this.nameTag.y = -h - 20;
                this.bodyContainer.addChild(this.nameTag);
            }
        }

        // HP Bar
        const barW = 32 * scale;
        this.hpBarBg = new PIXI.Graphics();
        this.hpBarBg.beginFill(0x000000, 0.8);
        this.hpBarBg.lineStyle(1, 0xffffff, 0.3);
        this.hpBarBg.drawRoundedRect(-barW / 2, -10, barW, 6, 2);
        this.hpBarBg.endFill();
        this.hpBarBg.y = -h - (this.isBoss ? 25 : 10);
        this.bodyContainer.addChild(this.hpBarBg); // Move with body

        this.hpBarFill = new PIXI.Graphics();
        this.hpBarFill.y = this.hpBarBg.y;
        this.bodyContainer.addChild(this.hpBarFill);
        this.updateHpBar();
    }

    updateHpBar() {
        this.hpBarFill.clear();
        const ratio = Math.max(0, this.hp / this.maxHp);
        const scale = this.isBoss ? 2.0 : 1.0;
        const barW = 32 * scale;

        const color = this.isBoss ?
            (ratio > 0.5 ? 0xf1c40f : ratio > 0.25 ? 0xe67e22 : 0xc0392b) :
            (ratio > 0.5 ? 0xe74c3c : ratio > 0.25 ? 0xe67e22 : 0xc0392b);

        this.hpBarFill.beginFill(color);
        this.hpBarFill.drawRoundedRect(-barW / 2 + 1, -9, Math.max(0, (barW - 2) * ratio), 4, 1);
        this.hpBarFill.endFill();
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.updateHpBar();

        // Hit Flash
        this.bodyGfx.tint = 0xffffff;

        // Shake
        this.bodyContainer.x = (Math.random() - 0.5) * 5;

        setTimeout(() => {
            if (this.bodyGfx) this.bodyGfx.tint = 0xffffff;
            if (this.bodyContainer) this.bodyContainer.x = 0;
        }, 80);
    }

    update(delta) {
        if (this.destroyed || !this.transform) return;

        // Depth Sorting
        this.zIndex = this.y;
        const time = Date.now();

        // Animations
        if (this.bodyContainer) {
            // Hover
            const hoverSpeed = this.isBoss ? 0.002 : 0.004;
            this.bodyContainer.y = Math.sin((time + this.hoverOffset) * hoverSpeed) * (this.isBoss ? 4 : 2);

            // Aura rotate
            if (this.aura) {
                this.aura.rotation += 0.01 * delta;
            }
        }

        // Eye Blink
        this.blinkTimer -= delta;
        if (this.blinkTimer <= 0) {
            if (this.isBlinking) {
                // Open eyes
                this.eyesContainer.visible = true;
                this.isBlinking = false;
                this.blinkTimer = 100 + Math.random() * 300; // Time until next blink
            } else {
                // Close eyes (blink)
                this.eyesContainer.visible = false;
                this.isBlinking = true;
                this.blinkTimer = 5 + Math.random() * 5; // Blink duration (frames)
            }
        }

        // Logic (Movement / Attack)
        const target = CombatSystem.getNearestHero(this);
        if (target) {
            const dist = CombatSystem.getDistance(this, target);
            // Move range: 30
            if (dist > 30) {
                const angle = Math.atan2(target.y - this.y, target.x - this.x);
                const speed = this.isBoss ? 0.5 : 0.8;
                this.x += Math.cos(angle) * speed * delta;
                this.y += Math.sin(angle) * speed * delta;
            }

            // Attack range: 50
            if (dist <= 50) {
                if (this.attackCooldown <= 0) {
                    this.attackCooldown = this.attackSpeed;

                    // Lunge animation
                    const angle = Math.atan2(target.y - this.y, target.x - this.x);
                    const lungeDist = 10;
                    this.bodyContainer.x += Math.cos(angle) * lungeDist;
                    this.bodyContainer.y += Math.sin(angle) * lungeDist;
                    setTimeout(() => {
                        if (this.bodyContainer) {
                            this.bodyContainer.x -= Math.cos(angle) * lungeDist;
                            this.bodyContainer.y -= Math.sin(angle) * lungeDist;
                        }
                    }, 150);

                    CombatSystem.dealDamageToHero(this, target, this.atk);
                }
            }
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
        }
    }
}
