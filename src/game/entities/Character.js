import * as PIXI from 'pixi.js';
import CombatSystem from '../systems/CombatSystem';
import PixelArtGenerator from '../utils/PixelArtGenerator';
import { HeroSprites, HeroPalettes } from '../assets/PixelArtAssets';
import useGameStore from '../../store/useGameStore';
import usePartyStore from '../../store/usePartyStore';
import { SKILL_DEFS } from '../systems/SkillSystem';

export class Character extends PIXI.Container {
    constructor(data) {
        super();
        this.id = data.id;
        this.data = data;

        // Base Stats + Equipment
        const equipStats = data.equipment?.combinedStats || { atk: 0, def: 0, hp: 0 };

        this.range = 100;
        if (data.class === 'Archer' || data.class === 'Mage') this.range = 300;

        this.baseAtk = data.stats?.atk || 10;
        this.baseDef = data.stats?.def || 0;
        this.atk = this.baseAtk + equipStats.atk;
        this.def = this.baseDef + equipStats.def;

        this.attackCooldown = 0;
        // Convert seconds to frames (assuming 60fps)
        this.attackSpeed = (data.attackSpeed || 1.0) * 60;

        // Death & sleep
        this.isDead = false;
        this.isSleeping = false;
        this.sleepHealTimer = 0;
        this.sleepHealInterval = 60; // Heal tick every ~1 second while sleeping

        // Cleric healing
        this.isHealer = data.canHeal || data.class === 'Cleric';
        this.healCooldown = 0;
        this.healInterval = 180; // Heal every ~3 seconds
        this.healAmount = Math.max(3, Math.floor((data.stats?.atk || 8) * 0.3));

        // Skill system
        this.skillDef = SKILL_DEFS[data.class] || null;
        this.skillCooldown = this.skillDef ? this.skillDef.cooldown * 0.5 : 0; // Start at half CD
        this.skillMaxCooldown = this.skillDef ? this.skillDef.cooldown : 0;

        // Divine Shield timer (set by Paladin skill)
        this.divineShieldTimer = 0;

        // Sleep zzZ animation
        this.sleepZTimer = 0;

        // Animation state
        this.currentFrame = 'idle';
        this.attackAnimTimer = 0;

        // Interaction
        this.eventMode = 'static';
        this.cursor = 'pointer';
        // Very generous hit area for much easier clicking
        this.hitArea = new PIXI.Rectangle(-50, -120, 100, 140);

        this.on('pointertap', this.onCharacterClick, this);
        this.on('pointerover', () => { this.filters = [new PIXI.filters.ColorMatrixFilter()]; this.filters[0].brightness(1.2, false); });
        this.on('pointerout', () => { this.filters = null; });

        this.setupVisuals();

        // Check if loaded from save with 0 HP — must start dead/sleeping
        const initialHp = data.currentHp ?? data.stats?.hp ?? 100;
        if (initialHp <= 0) {
            this.die();
        }
    }

    setupVisuals() {
        // Clear previous visuals if any
        this.removeChildren();

        const color = this.getClassColor(this.data.class);

        // Visual Container for body bouncing
        this.body = new PIXI.Container();
        this.addChild(this.body);

        // Shadow
        const shadow = new PIXI.Graphics();
        shadow.beginFill(0x000000, 0.3);
        shadow.drawEllipse(0, 0, 20, 10);
        shadow.endFill();
        this.addChildAt(shadow, 0);

        // Pixel Art Visuals
        this._buildSprite('idle');

        // Inner Glow / Pulse (subtle for all)
        this.innerGlow = new PIXI.Graphics();
        this.innerGlow.beginFill(color, 0.0);
        this.innerGlow.drawCircle(0, -40, 30);
        this.innerGlow.endFill();
        this.addChild(this.innerGlow);

        // Name Tag
        const style = new PIXI.TextStyle({
            fontFamily: 'Inter, sans-serif',
            fontSize: 12,
            fontWeight: 'bold',
            fill: '#ffffff',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 4,
            dropShadowDistance: 2,
        });

        this.nameTag = new PIXI.Text(this.data.name.toUpperCase(), style);
        this.nameTag.anchor.set(0.5, 1);
        this.nameTag.y = -95;
        this.addChild(this.nameTag);

        // Underline
        const underline = new PIXI.Graphics();
        underline.beginFill(color);
        underline.drawRect(-this.nameTag.width / 2, 0, this.nameTag.width, 2);
        underline.endFill();
        this.nameTag.addChild(underline);

        // HP Bar Background
        this.hpBarBg = new PIXI.Graphics();
        this.hpBarBg.beginFill(0x000000, 0.8);
        this.hpBarBg.lineStyle(1, 0xffffff, 0.2);
        this.hpBarBg.drawRoundedRect(-24, -112, 48, 6, 3);
        this.hpBarBg.endFill();
        this.addChild(this.hpBarBg);

        // HP Bar Fill
        this.hpBarFill = new PIXI.Graphics();
        this.addChild(this.hpBarFill);
        this.updateHpBar();

        // Death/sleep overlay
        this.deathOverlay = new PIXI.Graphics();
        this.deathOverlay.beginFill(0x000000, 0.6);
        this.deathOverlay.drawRoundedRect(-25, -80, 50, 80, 10);
        this.deathOverlay.endFill();
        this.deathOverlay.visible = false;
        this.body.addChild(this.deathOverlay);

        // Sleep zzZ text
        this.sleepText = new PIXI.Text('💤', { fontSize: 24 });
        this.sleepText.anchor.set(0.5);
        this.sleepText.y = -80;
        this.sleepText.visible = false;
        this.addChild(this.sleepText);
    }

    /** Build/swap the pixel art sprite for the given animation frame. */
    _buildSprite(frame) {
        if (this.bodySprite) {
            this.body.removeChild(this.bodySprite);
            this.bodySprite = null;
        }

        const spriteData = HeroSprites[this.data.class];
        const palette = HeroPalettes[this.data.class];

        if (spriteData && palette) {
            const texture = PixelArtGenerator.getTexture(this.data.class, spriteData, palette, frame);
            this.bodySprite = new PIXI.Sprite(texture);
            this.bodySprite.scale.set(3);
            this.bodySprite.anchor.set(0.5, 0.55);
            this.body.addChildAt(this.bodySprite, 0);
        } else {
            // Fallback (Red box)
            const g = new PIXI.Graphics();
            g.beginFill(0xFF0000);
            g.drawRect(-20, -60, 40, 60);
            g.endFill();
            this.bodySprite = g;
            this.body.addChildAt(g, 0);
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
        const maxHp = this.data.stats?.hp || 100;
        const currentHp = this.data.currentHp ?? maxHp;
        const ratio = Math.max(0, currentHp / maxHp);

        // Gradient Colors for HP
        let color = 0x27ae60; // Green
        if (ratio < 0.25) color = 0xc0392b; // Red
        else if (ratio < 0.5) color = 0xe67e22; // Orange

        this.hpBarFill.beginFill(color);
        this.hpBarFill.drawRoundedRect(-23, -111, Math.max(0, 46 * ratio), 4, 2);
        this.hpBarFill.endFill();
    }

    getClassColor(className) {
        switch (className) {
            case 'Warrior': return 0xFF0000;
            case 'Mage': return 0x0000FF;
            case 'Archer': return 0x00FF00;
            case 'Cleric': return 0xFFFF00;
            case 'Rogue': return 0x9b59b6;
            case 'Paladin': return 0xecf0f1;
            default: return 0xCCCCCC;
        }
    }

    takeDamage(amount) {
        if (this.isDead) return;

        const defense = this.def;
        let finalDmg = Math.max(1, Math.floor(amount - defense * 0.5));

        // Divine Shield: 50% damage reduction
        if (this.divineShieldTimer > 0) {
            finalDmg = Math.max(1, Math.floor(finalDmg * 0.5));
        }

        const currentHp = Math.max(0, (this.data.currentHp ?? this.data.stats.hp) - finalDmg);
        usePartyStore.getState().updateMember(this.id, { currentHp });
        this.data.currentHp = currentHp;
        this.updateHpBar();

        // Hit flash
        if (this.body) {
            const origAlpha = this.body.alpha;
            this.body.alpha = 0.3;
            setTimeout(() => { this.body.alpha = origAlpha; }, 100);
        }

        if (currentHp <= 0) {
            this.die();
        }

        return finalDmg;
    }

    receiveHeal(amount) {
        if (this.isDead) return;
        const maxHp = this.data.stats?.hp || 100;
        const currentHp = this.data.currentHp ?? maxHp;
        if (currentHp >= maxHp) return;

        const newHp = Math.min(maxHp, currentHp + amount);
        usePartyStore.getState().updateMember(this.id, { currentHp: newHp });
        this.data.currentHp = newHp;
        this.updateHpBar();
    }

    die() {
        this.isDead = true;
        this.isSleeping = true;
        this.sleepHealTimer = 0;
        this.deathOverlay.visible = true;
        this.sleepText.visible = true;
        this.body.alpha = 0.3;
        this.innerGlow.visible = false;
        this.setFrame('death');
    }

    wakeUp() {
        this.isDead = false;
        this.isSleeping = false;
        this.deathOverlay.visible = false;
        this.sleepText.visible = false;
        this.body.alpha = 0.8;
        this.innerGlow.visible = true;
        this.setFrame('idle');
    }

    onCharacterClick(e) {
        e.stopPropagation();

        const { gameState, selectGridSlot, openPanel } = useGameStore.getState();

        if (['LOBBY', 'RUNNING', 'PAUSED'].includes(gameState)) {
            selectGridSlot(this.data.x, this.data.y);
            openPanel('character_details');
        }
    }

    update(delta) {
        // Depth Sorting
        this.zIndex = this.y;

        const isRunning = useGameStore.getState().isRunning;
        const time = Date.now();

        // Attack animation timer — show attack frame briefly then revert
        if (this.attackAnimTimer > 0) {
            this.attackAnimTimer -= delta;
            if (this.attackAnimTimer <= 0 && !this.isDead) {
                this.setFrame('idle');
            }
        }

        // Idle Animation (Class specific)
        if (!this.isDead && this.body) {
            const idleSpeed = this.data.class === 'Mage' ? 0.003 : 0.005;
            const bounce = Math.sin(time * idleSpeed);

            this.body.y = bounce * 3;

            // Aura pulse
            if (this.aura) {
                this.aura.alpha = 0.2 + Math.sin(time * 0.002) * 0.1;
                this.aura.scale.set(1.0 + Math.sin(time * 0.002) * 0.05);
            }
        }

        if (!isRunning) return;

        // Handle sleeping (slowly heal back to full)
        if (this.isSleeping) {
            // Animate zzZ floating
            this.sleepZTimer += delta;
            this.sleepText.y = -36 + Math.sin(this.sleepZTimer * 0.03) * 5;
            this.sleepText.alpha = 0.5 + Math.sin(this.sleepZTimer * 0.05) * 0.3;

            // Heal while sleeping (2% maxHP per second)
            this.sleepHealTimer += delta;
            if (this.sleepHealTimer >= this.sleepHealInterval) {
                this.sleepHealTimer = 0;
                const maxHp = this.data.stats?.hp || 100;
                const currentHp = this.data.currentHp ?? 0;
                const healAmount = Math.max(1, Math.floor(maxHp * 0.02));
                const newHp = Math.min(maxHp, currentHp + healAmount);
                usePartyStore.getState().updateMember(this.id, { currentHp: newHp });
                this.data.currentHp = newHp;
                this.updateHpBar();

                // Wake up at full HP
                if (newHp >= maxHp) {
                    this.wakeUp();
                }
            }
            return; // Don't attack/heal while sleeping
        }

        // Refresh stats from store data
        const equipStats = this.data.equipment?.combinedStats || { atk: 0, def: 0, hp: 0 };
        this.atk = (this.data.stats?.atk || 10) + equipStats.atk;
        this.def = (this.data.stats?.def || 0) + equipStats.def;

        // Cleric healing ability
        if (this.isHealer) {
            this.healCooldown -= delta;
            if (this.healCooldown <= 0) {
                this.healCooldown = this.healInterval;
                const target = CombatSystem.getLowestHpHero(this);
                if (target) {
                    const healAmt = this.healAmount + (equipStats.atk || 0);
                    target.receiveHeal(healAmt);
                    CombatSystem.showHealText(target, healAmt);
                    this.setFrame('attack');
                    this.attackAnimTimer = 15;
                }
            }
        }

        // Divine Shield countdown
        if (this.divineShieldTimer > 0) {
            this.divineShieldTimer -= delta;
        }

        // Skill auto-cast
        if (this.skillDef) {
            this.skillCooldown -= delta;
            if (this.skillCooldown <= 0) {
                const scene = CombatSystem.scene;
                if (scene) {
                    const fired = this.skillDef.execute(this, scene);
                    if (fired) {
                        this.skillCooldown = this.skillMaxCooldown;
                        this.setFrame('attack');
                        this.attackAnimTimer = 20;
                    } else {
                        this.skillCooldown = 60;
                    }
                }
            }
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
        } else {
            const target = CombatSystem.getNearestEnemy(this);

            if (target) {
                const dist = CombatSystem.getDistance(this, target);

                if (dist <= this.range) {
                    this.attackCooldown = this.attackSpeed;
                    CombatSystem.dealDamage(this, target, this.atk);

                    // Attack animation
                    this.setFrame('attack');
                    this.attackAnimTimer = 12;

                    const angle = Math.atan2(target.y - this.y, target.x - this.x);
                    this.body.x = Math.cos(angle) * 10;
                    this.body.y += Math.sin(angle) * 10;

                    setTimeout(() => {
                        this.body.x = 0;
                    }, 100);
                }
            }
        }
    }
}
