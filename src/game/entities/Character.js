import * as PIXI from 'pixi.js';
import CombatSystem from '../systems/CombatSystem';
import useGameStore from '../../store/useGameStore';
import usePartyStore from '../../store/usePartyStore';

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
        this.attackSpeed = 60; // Frames per attack (~1 sec)

        // Death & sleep
        this.isDead = false;
        this.isSleeping = false;
        this.sleepHealTimer = 0;
        this.sleepHealInterval = 60; // Heal tick every ~1 second while sleeping

        // Cleric healing
        this.isHealer = data.canHeal || data.class === 'Cleric';
        this.healCooldown = 0;
        this.healInterval = 120; // Heal every ~2 seconds
        this.healAmount = Math.max(5, Math.floor((data.stats?.atk || 8) * 0.5));

        // Sleep zzZ animation
        this.sleepZTimer = 0;

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

        // Shadow (Common)
        const shadow = new PIXI.Graphics();
        shadow.beginFill(0x000000, 0.3);
        shadow.drawEllipse(0, 0, 20, 10);
        shadow.endFill();
        this.addChild(shadow);

        // Visual Container for body bouncing
        this.body = new PIXI.Container();
        this.addChild(this.body);

        const g = new PIXI.Graphics();
        this.body.addChild(g);

        // Class-specific visuals
        switch (this.data.class) {
            case 'Warrior':
                // Trapezoid Body
                g.beginFill(0x9b2c2c); // Deep crimson
                g.lineStyle(2, 0x000000, 0.5);
                g.moveTo(-20, -60);
                g.lineTo(20, -60);
                g.lineTo(14, -10);
                g.lineTo(-14, -10);
                g.closePath();
                g.endFill();

                // Helmet
                g.beginFill(0x718093);
                g.drawPolygon([-15, -60, 0, -75, 15, -60]);
                g.endFill();

                // Shield Icon
                g.lineStyle(2, 0xf1c40f);
                g.beginFill(0x2c3e50);
                g.drawRect(-26, -45, 10, 25);
                g.endFill();

                // Aura
                this.aura = new PIXI.Graphics();
                this.aura.beginFill(0xe74c3c, 0.2);
                this.aura.drawCircle(0, -35, 35);
                this.aura.endFill();
                this.body.addChildAt(this.aura, 0);
                break;

            case 'Mage':
                // Robe Body
                g.beginFill(0x2c3e50); // Dark Blue
                g.moveTo(0, -80);
                g.lineTo(16, -10);
                g.lineTo(-16, -10);
                g.closePath();
                g.endFill();

                // Hat
                g.beginFill(0x8e44ad);
                g.moveTo(-20, -80);
                g.lineTo(20, -80);
                g.lineTo(0, -105);
                g.closePath();
                g.endFill();

                // Staff
                g.lineStyle(2, 0x95a5a6);
                g.moveTo(18, -10);
                g.lineTo(18, -90);
                g.lineStyle(0);
                g.beginFill(0x9b59b6);
                g.drawCircle(18, -90, 5);
                g.endFill();

                // Sparkles (handled in update)
                break;

            case 'Archer':
                // Tunic Body
                g.beginFill(0x27ae60);
                g.drawRoundedRect(-18, -70, 36, 60, 8);
                g.endFill();

                // Hood
                g.beginFill(0x1e8449);
                g.drawPolygon([-18, -70, 0, -85, 18, -70]);
                g.endFill();

                // Bow
                g.lineStyle(3, 0xd35400);
                g.moveTo(15, -65);
                g.bezierCurveTo(35, -55, 35, -25, 15, -15);
                g.lineStyle(1, 0xffffff, 0.5);
                g.moveTo(15, -65);
                g.lineTo(15, -15);
                break;

            case 'Cleric':
                // Robe
                g.beginFill(0xf39c12);
                g.drawEllipse(0, -40, 20, 35);
                g.endFill();

                // Halo
                g.lineStyle(2, 0xf1c40f);
                g.drawEllipse(0, -85, 12, 4);

                // Cross
                g.lineStyle(0);
                g.beginFill(0xffffff);
                g.drawRect(-4, -50, 8, 25);
                g.drawRect(-10, -45, 20, 8);
                g.endFill();

                // Light Glow
                this.aura = new PIXI.Graphics();
                this.aura.beginFill(0xf1c40f, 0.15);
                this.aura.drawCircle(0, -40, 40);
                this.aura.endFill();
                this.body.addChildAt(this.aura, 0);
                break;
        }

        // Inner Glow / Pulse (subtle for all)
        this.innerGlow = new PIXI.Graphics();
        this.innerGlow.beginFill(color, 0.0); // controlled in update
        this.innerGlow.drawCircle(0, -40, 30);
        this.innerGlow.endFill();
        this.addChild(this.innerGlow); // Add to root, behind body? No needs to be on top or additive.

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
        this.nameTag.y = -95; // Higher up
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
        this.body.addChild(this.deathOverlay); // Attach to body so it moves with it

        // Sleep zzZ text
        this.sleepText = new PIXI.Text('💤', { fontSize: 24 });
        this.sleepText.anchor.set(0.5);
        this.sleepText.y = -80;
        this.sleepText.visible = false;
        this.addChild(this.sleepText);
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
            default: return 0xCCCCC;
        }
    }

    takeDamage(amount) {
        if (this.isDead) return;

        const defense = this.def;
        const finalDmg = Math.max(1, Math.floor(amount - defense * 0.5));

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
    }

    wakeUp() {
        this.isDead = false;
        this.isSleeping = false;
        this.deathOverlay.visible = false;
        this.sleepText.visible = false;
        this.body.alpha = 0.8;
        this.innerGlow.visible = true;
    }

    onCharacterClick(e) {
        e.stopPropagation();

        const { gameState, selectGridSlot, openPanel } = useGameStore.getState();

        // Ensure we ignore clicks if game is in a weird state, but LOBBY/RUNNING/PAUSED are all fine for inspection
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

        // Idle Animation (Glow)
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
            // Halo float
            if (this.data.class === 'Cleric') {
                // Done in specialized glow/aura
            }
        }

        if (!isRunning) return;

        // Handle sleeping (slowly heal back to full)
        if (this.isSleeping) {
            // Animate zzZ floating
            this.sleepZTimer += delta;
            this.sleepText.y = -36 + Math.sin(this.sleepZTimer * 0.03) * 5;
            this.sleepText.alpha = 0.5 + Math.sin(this.sleepZTimer * 0.05) * 0.3;

            // Heal while sleeping (5% maxHP per second)
            this.sleepHealTimer += delta;
            if (this.sleepHealTimer >= this.sleepHealInterval) {
                this.sleepHealTimer = 0;
                const maxHp = this.data.stats?.hp || 100;
                const currentHp = this.data.currentHp ?? 0;
                const healAmount = Math.max(1, Math.floor(maxHp * 0.05));
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

        // NO passive HP regen — only Cleric heals

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
                }
            }
        }

        // Bobbing is handled above in Idle Animation block
        // Remove old bobbing to avoid conflict
        // const bounce = Math.abs(Math.sin(time * 0.005));
        // this.body.y = -bounce * 4 - 24;

        if (this.attackCooldown > 0) {
            this.attackCooldown -= delta;
        } else {
            const target = CombatSystem.getNearestEnemy(this);

            if (target) {
                const dist = CombatSystem.getDistance(this, target);

                if (dist <= this.range) {
                    this.attackCooldown = this.attackSpeed;
                    CombatSystem.dealDamage(this, target, this.atk);

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
