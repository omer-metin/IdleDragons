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
        this.isElite = data.isElite || false;
        this.affix = data.affix || null;

        // Affix state
        this.shieldTimer = this.affix === 'shielded' ? 300 : 0; // 5s at 60fps
        this.berserkMult = 1;

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
            this.atk = Math.floor(this.atk * 0.6);
            this.range = 220;
        } else {
            this.range = 40;
        }

        this.goldReward = data.goldReward || 5;
        this.xpReward = data.xpReward || 3;

        // Visual State
        this.blinkTimer = Math.random() * 200;
        this.isBlinking = false;
        this.hoverOffset = Math.random() * 100;

        // Animation state
        this.currentFrame = 'idle';
        this.attackAnimTimer = 0;

        // Hit Area
        const size = this.isBoss ? 80 : 50;
        this.hitArea = new PIXI.Rectangle(-size / 2, -size, size, size);

        this.setupVisuals();
    }

    receiveHeal(amount) {
        if (this.destroyed || this.hp <= 0) return;
        this.hp = Math.min(this.maxHp, this.hp + amount);
        this.updateHpBar();
    }

    getZoneColor() {
        if (this.zone <= 3) return { body: 0x4a235a, light: 0x8e44ad };
        if (this.zone <= 6) return { body: 0x145a32, light: 0x27ae60 };
        if (this.zone <= 9) return { body: 0x641e16, light: 0xc0392b };
        if (this.zone <= 12) return { body: 0x1a3a5e, light: 0x3498db };
        if (this.zone <= 15) return { body: 0x154360, light: 0x2980b9 };
        return { body: 0x4a1a0a, light: 0xe67e22 };
    }

    setupVisuals() {
        this.removeChildren();

        const colors = this.getZoneColor();
        const scale = this.isBoss ? 2.0 : 1.0;
        const baseScale = this.isBoss ? 2.0 : 1.0;

        // Main Body Container (for bobbing)
        this.bodyContainer = new PIXI.Container();
        this.addChild(this.bodyContainer);

        // Sprite key lookup with fallback mapping for multi-word enemy names
        const SPRITE_FALLBACKS = {
            'Demon Imp': 'Imp', 'Hellhound': 'Wolf', 'Harpy': 'Bat',
            'Fire Elemental': 'Golem', 'Magma Golem': 'Golem', 'Salamander': 'Dragon',
            'Shadow Dragon': 'Dragon', 'Dark Knight': 'Orc', 'Void Walker': 'Wraith',
            'Shade': 'Wraith', 'Phantom': 'Ghost', 'Bandit': 'Orc',
            'Ogre': 'Troll', 'Basilisk': 'Dragon',
        };
        const rawKey = this.data.spriteKey || 'Goblin';
        this.spriteKey = EnemySprites[rawKey] ? rawKey : (SPRITE_FALLBACKS[rawKey] || 'Goblin');

        this._buildSprite('idle');

        // Shadow
        const shadow = new PIXI.Graphics();
        shadow.beginFill(0x000000, 0.4);
        shadow.drawEllipse(0, 0, 15 * baseScale, 8 * baseScale);
        shadow.endFill();
        this.addChildAt(shadow, 0);

        // Hit area adjusted for sprite size
        this.hitArea = new PIXI.Rectangle(-30 * baseScale, -80 * baseScale, 60 * baseScale, 80 * baseScale);

        // Type indicators
        if (this.type === 'healer') {
            const cross = new PIXI.Graphics();
            cross.beginFill(0x2ecc71);
            const s = this.isBoss ? 5 : 3;
            cross.drawRect(-5, -s * 12 - 20, 10, 30);
            cross.drawRect(-15, -s * 12 - 10, 30, 10);
            cross.endFill();
            cross.scale.set(0.5);
            this.bodyContainer.addChild(cross);
        }

        // Eyes container (empty for sprite-based rendering, used by update loop)
        this.eyesContainer = new PIXI.Container();
        this.bodyContainer.addChild(this.eyesContainer);

        // Calculate body height for positioning
        const h = this.bodyGfx ? this.bodyGfx.height : (40 * baseScale);

        // Boss Extras
        if (this.isBoss) {
            // Crown
            const crown = new PIXI.Graphics();
            crown.beginFill(0xf1c40f);
            crown.drawPolygon([-10, -50, -5, -60, 0, -50, 5, -60, 10, -50]);
            crown.endFill();
            crown.scale.set(baseScale);
            crown.y = -20 * baseScale;
            this.bodyContainer.addChild(crown);

            // Aura
            this.aura = new PIXI.Graphics();
            this.aura.lineStyle(2, 0xe74c3c, 0.4);
            const radius = (this.bodyGfx?.width / 2 || 20 * baseScale) * 1.5;
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
        this.bodyContainer.addChild(this.hpBarBg);

        this.hpBarFill = new PIXI.Graphics();
        this.hpBarFill.y = this.hpBarBg.y;
        this.bodyContainer.addChild(this.hpBarFill);
        this.updateHpBar();

        // Elite glow effect
        if (this.isElite) {
            this.eliteGlow = new PIXI.Graphics();
            const glowColor = this.affix === 'vampiric' ? 0xff3333 : this.affix === 'shielded' ? 0x3399ff : 0xff9900;
            this.eliteGlow.lineStyle(2, glowColor, 0.6);
            const r = (this.bodyGfx?.width / 2 || 20) * 1.8;
            this.eliteGlow.drawCircle(0, -h / 2, r);
            this.bodyContainer.addChildAt(this.eliteGlow, 0);

            // Elite name tag
            if (!this.isBoss) {
                const nameStyle = new PIXI.TextStyle({
                    fontFamily: 'MedievalSharp, serif',
                    fontSize: 12,
                    fontWeight: 'bold',
                    fill: glowColor,
                    dropShadow: true,
                    dropShadowColor: '#000000',
                    dropShadowBlur: 3,
                    dropShadowDistance: 1,
                });
                const tag = new PIXI.Text(this.data.name || 'Elite', nameStyle);
                tag.anchor.set(0.5, 1);
                tag.y = -h - 8;
                this.bodyContainer.addChild(tag);
            }
        }
    }

    /** Build/swap the pixel art sprite for the given animation frame. */
    _buildSprite(frame) {
        if (this.bodyGfx) {
            this.bodyContainer.removeChild(this.bodyGfx);
            this.bodyGfx = null;
        }

        const spriteData = EnemySprites[this.spriteKey];
        const palette = EnemyPalettes[this.spriteKey];

        if (spriteData && palette) {
            const texture = PixelArtGenerator.getTexture(`enemy_${this.spriteKey}`, spriteData, palette, frame);
            const sprite = new PIXI.Sprite(texture);
            const spriteScale = this.isBoss ? 5 : 3;
            sprite.scale.set(spriteScale);
            sprite.anchor.set(0.5, 0.55);
            this.bodyGfx = sprite;
            this.bodyContainer.addChildAt(sprite, 0);
        } else {
            // Fallback geometric
            const colors = this.getZoneColor();
            const baseScale = this.isBoss ? 2.0 : 1.0;
            this.bodyGfx = new PIXI.Graphics();
            this.bodyGfx.beginFill(colors.body, 0.9);
            this.bodyGfx.lineStyle(2, colors.light, 0.5);
            this.bodyGfx.drawCircle(0, -20, 20 * baseScale);
            this.bodyGfx.endFill();
            this.bodyContainer.addChildAt(this.bodyGfx, 0);
        }

        this.currentFrame = frame;
    }

    /** Switch animation frame if different from current. */
    setFrame(frame) {
        if (this.currentFrame !== frame) {
            this._buildSprite(frame);
        }
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

        // Attack animation timer
        if (this.attackAnimTimer > 0) {
            this.attackAnimTimer -= delta;
            if (this.attackAnimTimer <= 0) {
                this.setFrame('idle');
            }
        }

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
                this.eyesContainer.visible = true;
                this.isBlinking = false;
                this.blinkTimer = 100 + Math.random() * 300;
            } else {
                this.eyesContainer.visible = false;
                this.isBlinking = true;
                this.blinkTimer = 5 + Math.random() * 5;
            }
        }

        // Elite affix updates
        if (this.isElite) {
            if (this.affix === 'shielded' && this.shieldTimer > 0) {
                this.shieldTimer -= delta;
            }
            if (this.affix === 'berserker') {
                this.berserkMult = 1 + (1 - this.hp / this.maxHp);
            }
            if (this.eliteGlow) {
                this.eliteGlow.alpha = 0.4 + Math.sin(time * 0.005) * 0.3;
            }
        }

        // Stun check (from Warrior Shield Bash)
        if (this.stunTimer > 0) {
            this.stunTimer -= delta;
            if (this.bodyContainer) this.bodyContainer.alpha = 0.5 + Math.sin(Date.now() * 0.02) * 0.3;
            return;
        } else if (this.bodyContainer && this.bodyContainer.alpha < 1) {
            this.bodyContainer.alpha = 1;
        }

        // Logic (Movement / Attack)
        if (this.type === 'healer') {
            this.healCooldown -= delta;
            const ally = CombatSystem.getLowestHpEnemy(this);
            if (ally && (ally.hp / ally.maxHp) < 0.7 && this.healCooldown <= 0) {
                const dist = CombatSystem.getDistance(this, ally);
                if (dist <= 100) {
                    this.healCooldown = this.healInterval;
                    const amount = Math.floor(this.atk * 1.5);
                    CombatSystem.healEnemy(this, ally, amount);
                    CombatSystem.showHealText(ally, amount);
                    this.setFrame('attack');
                    this.attackAnimTimer = 15;
                } else {
                    const angle = Math.atan2(ally.y - this.y, ally.x - this.x);
                    const speed = (this.isBoss ? 0.5 : 0.8) * 1.2;
                    this.x += Math.cos(angle) * speed * delta;
                    this.y += Math.sin(angle) * speed * delta;
                }
            }
        }

        const target = CombatSystem.getNearestHero(this);
        if (!target) {
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

            if (dist > 5) {
                const angle = Math.atan2(target.y - this.y, target.x - this.x);
                const speed = this.isBoss ? 0.5 : 0.8;
                this.x += Math.cos(angle) * speed * delta;
                this.y += Math.sin(angle) * speed * delta;
            }

            if (dist <= attackRange) {
                if (this.attackCooldown <= 0) {
                    this.attackCooldown = this.attackSpeed;

                    // Attack Animation
                    this.setFrame('attack');
                    this.attackAnimTimer = 12;

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

                    CombatSystem.dealDamageToHero(this, target, this.atk);
                }
            }
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
        }
    }
}
