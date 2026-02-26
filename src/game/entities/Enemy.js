import * as PIXI from 'pixi.js';
import CombatSystem from '../systems/CombatSystem';
import PixelArtGenerator from '../utils/PixelArtGenerator';
import { EnemySprites, EnemyPalettes } from '../assets/PixelArtAssets';

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
        this.type = data.type || 'melee'; // melee, ranged, healer
        this.healCooldown = 0;
        this.healInterval = 180; // 3 sec
        this.stunTimer = 0; // Set by Warrior Shield Bash

        // Stats adjustments based on type
        if (this.type === 'ranged') {
            this.hp = Math.floor(this.hp * 0.7);
            this.atk = Math.floor(this.atk * 1.2);
            this.range = 250;
        } else if (this.type === 'healer') {
            this.hp = Math.floor(this.hp * 0.8);
            this.atk = Math.floor(this.atk * 0.6); // Weak attack
            this.range = 220; // Stay back
        } else {
            // Melee
            this.range = 40;
        }
        // No stopRange — enemies always walk toward heroes, attacking when in range

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

    receiveHeal(amount) {
        if (this.destroyed || this.hp <= 0) return;
        this.hp = Math.min(this.maxHp, this.hp + amount);
        this.updateHpBar();
        // Heal VFX? handled by CombatSystem usually
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
        const baseScale = this.isBoss ? 2.0 : 1.0; // This was for geometric shapes, now used for HP bar positioning

        // Main Body Container (for bobbing)
        this.bodyContainer = new PIXI.Container();
        this.addChild(this.bodyContainer);

        // Body Shape based on Type
        // Try Pixel Art first
        // Sprite key lookup with fallback mapping for multi-word enemy names
        const SPRITE_FALLBACKS = {
            'Demon Imp': 'Imp', 'Hellhound': 'Wolf', 'Harpy': 'Bat',
            'Fire Elemental': 'Golem', 'Magma Golem': 'Golem', 'Salamander': 'Dragon',
            'Shadow Dragon': 'Dragon', 'Dark Knight': 'Orc', 'Void Walker': 'Wraith',
            'Shade': 'Wraith', 'Phantom': 'Ghost', 'Bandit': 'Orc',
            'Ogre': 'Troll', 'Basilisk': 'Dragon',
        };
        const rawKey = this.data.spriteKey || 'Goblin';
        const spriteKey = EnemySprites[rawKey] ? rawKey : (SPRITE_FALLBACKS[rawKey] || 'Goblin');
        const spriteData = EnemySprites[spriteKey];
        const palette = EnemyPalettes[spriteKey];

        if (spriteData && palette) {
            const texture = PixelArtGenerator.getTexture(spriteKey, spriteData, palette);
            const sprite = new PIXI.Sprite(texture);

            // Scale
            const scale = this.isBoss ? 5 : 3;
            sprite.scale.set(scale);
            sprite.anchor.set(0.5, 1);
            this.bodyContainer.addChild(sprite);
            this.bodyGfx = sprite; // Assign sprite to bodyGfx for tinting/shaking

            // Add Shadow
            const shadow = new PIXI.Graphics();
            shadow.beginFill(0x000000, 0.4);
            shadow.drawEllipse(0, 0, 15 * baseScale, 8 * baseScale); // Use baseScale for shadow size
            shadow.endFill();
            this.addChildAt(shadow, 0);

            // Add hit area
            this.hitArea = new PIXI.Rectangle(-30, -80, 60, 80); // Adjusted for sprite size

            // Type indicators (since we reuse same sprite for ranged/healer for now)
            if (this.type === 'healer') {
                const cross = new PIXI.Graphics();
                cross.beginFill(0x2ecc71);
                cross.drawRect(-5, -scale * 12 - 20, 10, 30);
                cross.drawRect(-15, -scale * 12 - 10, 30, 10);
                cross.endFill();
                cross.scale.set(0.5);
                this.bodyContainer.addChild(cross);
            }

            // Setup Eyes Container (if needed for blinking, but sprites have eyes baked in usually)
            // If we want blinking eyes on top of sprites?
            // The sprites defined in Assets have 'E' for eyes. We could overlay blinking if we want.
            // For now, let's skip complex eye blinking on sprites to keep it simple and clean.
            this.eyesContainer = new PIXI.Container(); // Still create for update loop, but keep empty
            this.bodyContainer.addChild(this.eyesContainer);

        } else {
            // Fallback Geometric
            this.bodyGfx = new PIXI.Graphics();
            this.bodyGfx.beginFill(colors.body, 0.9);
            this.bodyGfx.lineStyle(2, colors.light, 0.5);
            // ... existing geometric code ...
            // Since I am replacing the block, I'll just put a simple fallback
            this.bodyGfx.drawCircle(0, -20, 20 * baseScale); // Use baseScale for fallback
            this.bodyGfx.endFill();
            this.bodyContainer.addChild(this.bodyGfx);

            // Old geometric shadow (if no sprite)
            const shadow = new PIXI.Graphics();
            shadow.beginFill(0x000000, 0.4);
            shadow.drawEllipse(0, 0, 15 * baseScale, 8 * baseScale);
            shadow.endFill();
            this.addChildAt(shadow, 0);

            // Eyes (for geometric fallback)
            this.eyesContainer = new PIXI.Container();
            this.bodyContainer.addChild(this.eyesContainer);

            const eyeColor = this.isBoss ? 0xff0000 : (this.type === 'healer' ? 0x2ecc71 : 0xe74c3c);
            const eyeY = -20 * baseScale * 0.55; // Adjusted for fallback circle
            const eyeX = 20 * baseScale * 0.4;
            const eyeSize = 3 * baseScale;

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
                midEye.drawCircle(0, eyeY - 6 * baseScale, eyeSize * 1.2);
                midEye.endFill();
                this.eyesContainer.addChild(midEye);
            }
        }

        // Calculate body height for positioning (used by boss aura, name tag, HP bar)
        const h = this.bodyGfx ? this.bodyGfx.height : (40 * baseScale);

        // Boss Extras
        if (this.isBoss) {
            // Crown
            const crown = new PIXI.Graphics();
            crown.beginFill(0xf1c40f);
            crown.drawPolygon([-10, -50, -5, -60, 0, -50, 5, -60, 10, -50]);
            crown.endFill();
            crown.scale.set(baseScale); // Use baseScale for crown
            crown.y = -20 * baseScale; // Adjust position relative to body
            this.bodyContainer.addChild(crown);

            // Aura
            this.aura = new PIXI.Graphics();
            this.aura.lineStyle(2, 0xe74c3c, 0.4);
            const radius = (this.bodyGfx.width / 2 || 20 * baseScale) * 1.5; // Use bodyGfx width or fallback
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

        // Stun check (from Warrior Shield Bash)
        if (this.stunTimer > 0) {
            this.stunTimer -= delta;
            if (this.bodyContainer) this.bodyContainer.alpha = 0.5 + Math.sin(Date.now() * 0.02) * 0.3;
            return; // Skip all logic while stunned
        } else if (this.bodyContainer && this.bodyContainer.alpha < 1) {
            this.bodyContainer.alpha = 1;
        }

        // Logic (Movement / Attack)
        if (this.type === 'healer') {
            this.healCooldown -= delta;
            // Check for heal targets
            const ally = CombatSystem.getLowestHpEnemy(this);
            if (ally && (ally.hp / ally.maxHp) < 0.7 && this.healCooldown <= 0) {
                // Try to Heal
                const dist = CombatSystem.getDistance(this, ally);
                if (dist <= 100) {
                    this.healCooldown = this.healInterval;
                    // Heal logic
                    const amount = Math.floor(this.atk * 1.5);
                    CombatSystem.healEnemy(this, ally, amount);
                    CombatSystem.showHealText(ally, amount);
                    // Fall through to attack/movement below
                } else {
                    // Move to ally
                    const angle = Math.atan2(ally.y - this.y, ally.x - this.x);
                    const speed = (this.isBoss ? 0.5 : 0.8) * 1.2; // Move fast to heal
                    this.x += Math.cos(angle) * speed * delta;
                    this.y += Math.sin(angle) * speed * delta;
                    // Fall through to attack check below
                }
            }
        }

        const target = CombatSystem.getNearestHero(this);
        if (!target) {
            // No hero target (all dead/sleeping) — drift toward center to avoid permanent freeze
            const distToCenter = Math.sqrt(this.x * this.x + this.y * this.y);
            if (distToCenter > 50) {
                const angle = Math.atan2(-this.y, -this.x);
                const speed = this.isBoss ? 0.3 : 0.5;
                this.x += Math.cos(angle) * speed * delta;
                this.y += Math.sin(angle) * speed * delta;
            }
        } else {
            const dist = CombatSystem.getDistance(this, target);
            const attackRange = this.range || 50;

            // Always move toward the hero — no stop distance
            if (dist > 5) {
                const angle = Math.atan2(target.y - this.y, target.x - this.x);
                const speed = this.isBoss ? 0.5 : 0.8;
                this.x += Math.cos(angle) * speed * delta;
                this.y += Math.sin(angle) * speed * delta;
            }

            // Attack when in range (while still walking)
            if (dist <= attackRange) {
                if (this.attackCooldown <= 0) {
                    this.attackCooldown = this.attackSpeed;

                    // Attack Animation
                    const angle = Math.atan2(target.y - this.y, target.x - this.x);
                    const lungeDist = this.type === 'melee' ? 10 : 5;

                    this.bodyContainer.x += Math.cos(angle) * lungeDist;
                    this.bodyContainer.y += Math.sin(angle) * lungeDist;
                    setTimeout(() => {
                        if (this.bodyContainer) {
                            this.bodyContainer.x -= Math.cos(angle) * lungeDist;
                            this.bodyContainer.y -= Math.sin(angle) * lungeDist;
                        }
                    }, 150);

                    if (this.type === 'ranged' || this.type === 'healer') {
                        CombatSystem.dealDamageToHero(this, target, this.atk);
                    } else {
                        CombatSystem.dealDamageToHero(this, target, this.atk);
                    }
                }
            }
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
        }
    }
}
