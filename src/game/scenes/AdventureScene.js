import * as PIXI from 'pixi.js';
import usePartyStore from '../../store/usePartyStore';
import useGameStore from '../../store/useGameStore';
import CombatSystem from '../systems/CombatSystem';
import { toScreen, toGrid, TILE_WIDTH, TILE_HEIGHT } from '../utils/Isometric';
import { Character } from '../entities/Character';
import ParticleSystem from '../systems/ParticleSystem';
import EncounterManager from '../systems/EncounterManager';
import useToastStore from '../../store/useToastStore';
import { getThemeForZone, getThemeTier } from '../data/ZoneThemes';

export class AdventureScene extends PIXI.Container {
    constructor(app) {
        super();
        this.app = app;

        // Layers
        this.isoContainer = new PIXI.Container();
        this.isoContainer.sortableChildren = true;
        this.addChild(this.isoContainer);

        this.groundVisual = null;
        this.currentThemeTier = -1; // Force initial theme load
        this.setupGround();

        this.enemyMap = new Map();
        this.characterMap = new Map();

        // Zone transition flash overlay
        this.transitionOverlay = new PIXI.Graphics();
        this.transitionOverlay.zIndex = 9998;
        this.transitionAlpha = 0;

        // TPK Cooldown
        this.tpkTimer = 0;

        // Screen Shake
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeDecay = 0.88;

        // VFX Container
        this.vfxContainer = new PIXI.Container();
        this.vfxContainer.zIndex = 9999;
        this.isoContainer.addChild(this.vfxContainer);

        // Bind Particle System
        ParticleSystem.bindContainer(this.vfxContainer);

        // Add transition overlay to vfx container
        this.isoContainer.addChild(this.transitionOverlay);

        // Highlight
        this.selectedTileHighlight = new PIXI.Graphics();
        this.selectedTileHighlight.visible = false;
        this.selectedTileHighlight.zIndex = -9997;
        this.isoContainer.addChild(this.selectedTileHighlight);

        // Grid
        this.gridSprite = null;
        this.drawIsometricGrid();

        // Bind Systems and Listeners
        CombatSystem.bindScene(this);

        // Listen for Grid Size changes to re-center
        this.lastWidth = usePartyStore.getState().gridSize.width;
        this.unsubscribeGrid = usePartyStore.subscribe(
            state => {
                if (state.gridSize.width !== this.lastWidth) {
                    this.lastWidth = state.gridSize.width;
                    this.drawIsometricGrid();
                }
            }
        );
    }

    destroy(options) {
        if (this.unsubscribeGrid) this.unsubscribeGrid();
        super.destroy(options);
    }

    resize(w, h) {
        this.isoContainer.x = w / 2;
        this.isoContainer.y = h / 2 + 100; // Lower it a bit for side view

        if (this.groundVisual) {
            this.groundVisual.width = w + 1000;
            this.groundVisual.height = h + 1000;
        }
    }

    toScreen(x, y) {
        return toScreen(x, y);
    }

    toGrid(x, y) {
        return toGrid(x, y);
    }

    setupGround() {
        const zone = useGameStore.getState().zone || 1;
        const theme = getThemeForZone(zone);
        this.currentThemeTier = getThemeTier(zone);

        const texture = this.generateGroundTexture(theme);
        this.groundVisual = new PIXI.TilingSprite(texture, this.app.screen.width + 1000, this.app.screen.height + 1000);
        this.groundVisual.anchor.set(0.5);
        this.groundVisual.zIndex = -10000;
        this.isoContainer.addChild(this.groundVisual);
    }

    generateGroundTexture(theme) {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Zone-themed floor color
        ctx.fillStyle = theme.groundColor;
        ctx.fillRect(0, 0, size, size);

        // Horizontal streaks for speed feel
        ctx.fillStyle = theme.streakColor;
        for (let i = 0; i < 20; i++) {
            const h = Math.random() * 20 + 2;
            const w = Math.random() * size;
            const x = Math.random() * size;
            const y = Math.random() * size;
            ctx.fillRect(x, y, w, h);
        }

        return PIXI.Texture.from(canvas);
    }

    /** Swap ground texture when zone tier changes. */
    updateZoneTheme() {
        const zone = useGameStore.getState().zone || 1;
        const tier = getThemeTier(zone);

        if (tier !== this.currentThemeTier) {
            const oldTier = this.currentThemeTier;
            this.currentThemeTier = tier;
            const theme = getThemeForZone(zone);

            // Regenerate ground
            if (this.groundVisual) {
                const newTexture = this.generateGroundTexture(theme);
                this.groundVisual.texture = newTexture;
            }

            // Reset ambient particles for new theme
            if (this.ambientParticles) {
                for (const p of this.ambientParticles) {
                    this.vfxContainer.removeChild(p.sprite);
                }
                this.ambientParticles = null; // Will be recreated on next frame
            }

            // Flash transition effect (only when moving forward, not on first load)
            if (oldTier >= 0) {
                this.triggerZoneTransition();
            }
        }
    }

    /** White flash + fade for zone tier transitions. */
    triggerZoneTransition() {
        this.transitionAlpha = 0.6;
    }

    updateTransitionOverlay(delta) {
        if (this.transitionAlpha > 0) {
            this.transitionOverlay.clear();
            this.transitionOverlay.beginFill(0xffffff, this.transitionAlpha);
            this.transitionOverlay.drawRect(-2000, -2000, 4000, 4000);
            this.transitionOverlay.endFill();
            this.transitionAlpha -= 0.015 * delta;
            if (this.transitionAlpha <= 0) {
                this.transitionAlpha = 0;
                this.transitionOverlay.clear();
            }
        }
    }

    drawIsometricGrid() {
        if (this.gridSprite) {
            this.isoContainer.removeChild(this.gridSprite);
            this.gridSprite.destroy();
        }

        const gridGfx = new PIXI.Graphics();
        const { width, height } = usePartyStore.getState().gridSize;

        // Draw Linear Slots - 1D Array (Row 0 only)
        // We only draw for y=0 to prevent stacking 5 ellipses on top of each other
        for (let x = 0; x < width; x++) {
            const pos = this.toScreen(x, 0); // Always row 0

            // Draw Slot Marker (Ellipse)
            gridGfx.lineStyle(2, 0x34495e, 0.5);
            gridGfx.beginFill(0x000000, 0.3);
            gridGfx.drawEllipse(pos.x, pos.y, 40, 15);
            gridGfx.endFill();

            // Debug text for slot index?
            // const text = new PIXI.Text(`${x}`, { fontSize: 12, fill: 'white' });
            // text.x = pos.x; text.y = pos.y;
            // gridGfx.addChild(text);
        }

        this.gridSprite = gridGfx;
        this.gridSprite.zIndex = -9000;
        this.isoContainer.addChild(this.gridSprite);

        // Interaction
        this.gridSprite.eventMode = 'static';
        this.gridSprite.cursor = 'pointer';

        // Hit Area covering the whole slot region manually - make it HUGE to catch all clicks
        this.gridSprite.hitArea = new PIXI.Rectangle(-2000, -500, 4000, 1000);

        this.gridSprite.on('pointertap', (e) => this.onGridClick(e));
    }

    onGridClick(e) {
        // Find closest slot to click
        const local = this.gridSprite.toLocal(e.global);
        const { width, height } = usePartyStore.getState().gridSize;

        // Increase click tolerance
        let closestDist = 100; // was 60, increased for easier mobile/mouse clicking
        let closestSlot = null;

        // Only check Row 0 for linear layout
        for (let x = 0; x < width; x++) {
            const pos = this.toScreen(x, 0);
            const dx = local.x - pos.x;
            const dy = local.y - pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < closestDist) {
                closestDist = dist;
                closestSlot = { x, y: 0 };
            }
        }

        if (closestSlot) {
            const member = usePartyStore.getState().members.find(m => m.x === closestSlot.x && m.y === closestSlot.y);
            const { gameState, selectGridSlot, openPanel } = useGameStore.getState();

            if (gameState === 'LOBBY') {
                selectGridSlot(closestSlot.x, closestSlot.y);
                openPanel(member ? 'character_details' : 'recruitment');
            } else if (gameState === 'RUNNING' || gameState === 'PAUSED') {
                if (member) {
                    selectGridSlot(closestSlot.x, closestSlot.y);
                    openPanel('character_details');
                }
            }
        }
    }

    /** Trigger screen shake effect. Intensity = pixel displacement, duration = frames. */
    screenShake(intensity, duration) {
        // Stack shakes: take the stronger of current vs new
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
        this.shakeDuration = Math.max(this.shakeDuration, duration);
    }

    update(delta) {
        // Center Camera
        this.isoContainer.x = this.app.screen.width / 2;
        this.isoContainer.y = this.app.screen.height / 2 + 100;

        // Screen Shake
        if (this.shakeDuration > 0) {
            this.shakeDuration -= delta;
            this.isoContainer.x += (Math.random() - 0.5) * this.shakeIntensity;
            this.isoContainer.y += (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeIntensity *= this.shakeDecay;
            if (this.shakeDuration <= 0) {
                this.shakeIntensity = 0;
            }
        }

        if (this.groundVisual) {
            this.groundVisual.width = this.app.screen.width + 1000;
            this.groundVisual.height = this.app.screen.height + 1000;
            // Scroll ground if running
            if (this.groundVisual.tilePosition && useGameStore.getState().isRunning) {
                // Move background left (illusion of moving right) -> Decrease X
                // Faster for side scroll feel
                this.groundVisual.tilePosition.x -= 3.0 * delta;
            }
        }

        // Logic Updates
        this.syncParty();
        this.checkPartyStatus(delta);
        this.updateSelectedTileHighlight();
        this.updateZoneTheme();
        this.updateAmbientParticles(delta);
        this.updateTransitionOverlay(delta);
        ParticleSystem.update(delta);

        // Entity Updates
        for (const char of this.characterMap.values()) char.update(delta);
        // for (const enemy of this.enemyMap.values()) enemy.update(delta); // Handled by EncounterManager

        // Sort Z-Index
        if (useGameStore.getState().isRunning) {
            this.isoContainer.sortChildren();
        }
    }

    syncParty() {
        const { members } = usePartyStore.getState();
        const memberIds = new Set(members.map(m => m.id));

        // Remove old characters
        for (const [id, char] of this.characterMap) {
            if (!memberIds.has(id)) {
                this.isoContainer.removeChild(char.container || char);
                this.characterMap.delete(id);
            }
        }

        // Add/Update new characters
        for (const member of members) {
            let char = this.characterMap.get(member.id);
            if (!char) {
                char = new Character(member);
                this.characterMap.set(member.id, char);
                this.isoContainer.addChild(char);
            }

            // Update data reference for stats sync (Fixes Item Effects)
            char.data = member;

            // Position Check
            if (char.data.x !== member.x || char.data.y !== member.y) {
                char.data.x = member.x;
                char.data.y = member.y;
            }

            // Convert to Screen (Linear)
            const pos = this.toScreen(member.x, member.y);
            char.x = pos.x;
            char.y = pos.y;
        }
    }

    checkPartyStatus(delta) {
        const { gameState, restartZone } = useGameStore.getState();
        if (gameState !== 'RUNNING') return;

        const { members, reviveAll } = usePartyStore.getState();
        if (members.length === 0) return;

        // Check if all characters are sleeping (incapacitated)
        const allSleeping = Array.from(this.characterMap.values()).every(char => char.isSleeping);

        if (allSleeping) {
            this.tpkTimer += delta;
            // Wait 1 second (60 frames) before resetting
            if (this.tpkTimer >= 60) {
                this.tpkTimer = 0;

                // Restart Zone Logic (First wave of current zone)
                restartZone();
                reviveAll();

                // Explicitly wake up characters and heal them
                for (const char of this.characterMap.values()) {
                    char.wakeUp();
                }

                // Reset enemies
                EncounterManager.reset();

                // Feedback
                const { addToast } = useToastStore.getState();
                addToast({
                    type: 'death',
                    message: 'PARTY WIPED! Restarting Zone...',
                    icon: '💀',
                    color: '#e74c3c',
                    duration: 4000
                });
            }
        } else {
            this.tpkTimer = 0;
        }
    }

    updateSelectedTileHighlight() {
        const { selectedGridSlot, gameState } = useGameStore.getState();

        if (!selectedGridSlot || gameState !== 'LOBBY') {
            this.selectedTileHighlight.visible = false;
            return;
        }

        const pos = this.toScreen(selectedGridSlot.x, selectedGridSlot.y);

        this.selectedTileHighlight.visible = true;
        this.selectedTileHighlight.clear();
        const pulse = 0.4 + Math.sin(Date.now() / 300) * 0.2;
        this.selectedTileHighlight.lineStyle(3, 0xf1c40f, pulse + 0.3);
        this.selectedTileHighlight.drawEllipse(pos.x, pos.y, 45, 18);
    }

    updateAmbientParticles(delta) {
        const zone = useGameStore.getState().zone || 1;
        const theme = getThemeForZone(zone);

        if (!this.ambientParticles) {
            // Lazy init with zone-themed particles
            this.ambientParticles = [];
            const count = theme.particleCount || 15;
            const [minR, maxR] = theme.particleSize || [1, 2.5];

            for (let i = 0; i < count; i++) {
                const p = new PIXI.Graphics();
                const r = Math.random() * (maxR - minR) + minR;
                p.beginFill(theme.particleColor || 0xffffff, Math.random() * 0.3);
                if (theme.particleShape === 'rect') {
                    p.drawRect(-r, -r, r * 2, r * 2);
                } else {
                    p.drawCircle(0, 0, r);
                }
                p.endFill();
                this.vfxContainer.addChild(p);
                const speed = theme.particleSpeed || 0.3;
                this.ambientParticles.push({
                    sprite: p,
                    x: (Math.random() - 0.5) * 2000,
                    y: (Math.random() - 0.5) * 2000,
                    vx: (Math.random() - 0.5) * speed,
                    vy: (Math.random() - 0.5) * speed + (theme.particleGravity || 0),
                    baseGravity: theme.particleGravity || 0,
                    alphaBase: theme.particleAlphaBase || 0.2,
                });
            }
        }

        for (const p of this.ambientParticles) {
            p.x += p.vx * delta;
            p.y += (p.vy + p.baseGravity) * delta;
            p.sprite.x = p.x;
            p.sprite.y = p.y;
            p.sprite.alpha = p.alphaBase + Math.sin(Date.now() / 1000 + p.x) * 0.1;

            // Wrap around when off-screen
            if (p.x < -1200) p.x = 1200;
            if (p.x > 1200) p.x = -1200;
            if (p.y < -1200) p.y = 1200;
            if (p.y > 1200) p.y = -1200;
        }
    }

    addEnemy(enemy) {
        this.enemyMap.set(enemy.id, enemy);
        this.isoContainer.addChild(enemy.container || enemy); // Check if enemy is container
    }

    removeEnemy(id) {
        const actualId = (typeof id === 'object') ? id.id : id;
        const enemy = this.enemyMap.get(actualId);
        if (enemy) {
            this.isoContainer.removeChild(enemy.container || enemy);
            this.enemyMap.delete(actualId);
        }
    }
}
