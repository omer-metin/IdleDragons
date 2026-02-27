import * as PIXI from 'pixi.js';
import usePartyStore from '../../store/usePartyStore';
import useGameStore from '../../store/useGameStore';
import useTutorialStore from '../../store/useTutorialStore';
import CombatSystem from '../systems/CombatSystem';
import { toScreen, toGrid, TILE_WIDTH, TILE_HEIGHT } from '../utils/Isometric';
import { Character } from '../entities/Character';
import ParticleSystem from '../systems/ParticleSystem';
import EncounterManager from '../systems/EncounterManager';
import useToastStore from '../../store/useToastStore';
import AudioManager from '../../audio/AudioManager';
import { getThemeForZone, getThemeTier } from '../data/ZoneThemes';
import ParallaxBackground from '../systems/ParallaxBackground';

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

        // Parallax background
        this.isoContainer.addChild(ParallaxBackground.container);
        const zone = useGameStore.getState().zone || 1;
        const theme = getThemeForZone(zone);
        ParallaxBackground.buildForTheme(theme, app.screen.width, app.screen.height);

        // Environmental props container
        this.propsContainer = new PIXI.Container();
        this.propsContainer.zIndex = -9500;
        this.isoContainer.addChild(this.propsContainer);
        this.currentPropsTheme = null;
        this.buildEnvironmentalProps(theme);

        // Publish initial zone theme for UI color-grading
        useGameStore.setState({ currentZoneTheme: theme });

        this.enemyMap = new Map();
        this.characterMap = new Map();

        // Zone transition overlay (fade-to-black + zone name splash)
        this.transitionOverlay = new PIXI.Graphics();
        this.transitionOverlay.zIndex = 9998;
        this.transitionAlpha = 0;
        this.transitionPhase = 'none'; // 'none' | 'fade_in' | 'hold' | 'fade_out'
        this.transitionTimer = 0;
        this.transitionZoneName = '';

        // Zone name splash text
        this.zoneSplashText = new PIXI.Text('', {
            fontFamily: 'MedievalSharp, serif',
            fontSize: 28,
            fontWeight: 'bold',
            fill: '#ffffff',
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 8,
            dropShadowDistance: 3,
            align: 'center',
        });
        this.zoneSplashText.anchor.set(0.5);
        this.zoneSplashText.zIndex = 9999;
        this.zoneSplashText.visible = false;
        this.isoContainer.addChild(this.zoneSplashText);

        // TPK Cooldown
        this.tpkTimer = 0;
        this._prevGameState = 'MENU';

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

        ParallaxBackground.resize(w, h);
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

            // Rebuild parallax layers
            ParallaxBackground.buildForTheme(theme, this.app.screen.width, this.app.screen.height);

            // Rebuild environmental props
            this.buildEnvironmentalProps(theme);

            // Reset ambient particles for new theme
            if (this.ambientParticles) {
                for (const p of this.ambientParticles) {
                    this.vfxContainer.removeChild(p.sprite);
                }
                this.ambientParticles = null; // Will be recreated on next frame
            }

            // Cinematic transition (only when moving forward, not on first load)
            if (oldTier >= 0) {
                this.triggerZoneTransition(theme.name, theme.splashColor || '#ffffff');
            }

            // Publish theme change for UI color-grading
            useGameStore.setState({ currentZoneTheme: theme });
        }
    }

    // ── Environmental Props ─────────────────────────────────────────

    buildEnvironmentalProps(theme) {
        // Clear old props
        this.propsContainer.removeChildren();
        this.currentPropsTheme = theme.name;

        if (!theme.props) return;

        for (const propDef of theme.props) {
            for (let i = 0; i < propDef.count; i++) {
                const prop = this._drawProp(propDef.type, theme);
                if (prop) {
                    prop.x = (Math.random() - 0.5) * 1600;
                    prop.y = propDef.yRange[0] + Math.random() * (propDef.yRange[1] - propDef.yRange[0]);
                    prop.alpha = 0.4 + Math.random() * 0.3;
                    this.propsContainer.addChild(prop);
                }
            }
        }
    }

    _drawProp(type, theme) {
        const g = new PIXI.Graphics();

        switch (type) {
            case 'stalactite': {
                g.beginFill(0x3a3020, 0.6);
                const w = 10 + Math.random() * 15;
                const h = 40 + Math.random() * 60;
                g.moveTo(-w / 2, 0);
                g.lineTo(w / 2, 0);
                g.lineTo(0, h);
                g.closePath();
                g.endFill();
                // Dripping water
                g.beginFill(0x4488aa, 0.4);
                g.drawCircle(0, h + 3, 2);
                g.endFill();
                break;
            }
            case 'torch': {
                // Wall bracket
                g.beginFill(0x5a4a2a, 0.7);
                g.drawRect(-3, 0, 6, 25);
                g.endFill();
                // Flame
                g.beginFill(0xff9933, 0.8);
                g.drawCircle(0, -5, 6);
                g.endFill();
                g.beginFill(0xffcc00, 0.6);
                g.drawCircle(0, -8, 3);
                g.endFill();
                break;
            }
            case 'rock': {
                const r = 8 + Math.random() * 12;
                g.beginFill(0x4a3a25, 0.5);
                g.drawEllipse(0, 0, r, r * 0.6);
                g.endFill();
                break;
            }
            case 'dead_tree': {
                g.lineStyle(4, 0x2a1a0a, 0.6);
                const h = 60 + Math.random() * 40;
                g.moveTo(0, 0);
                g.lineTo(0, -h);
                // Branches
                g.moveTo(0, -h * 0.6);
                g.lineTo(-20, -h * 0.8);
                g.moveTo(0, -h * 0.7);
                g.lineTo(15, -h * 0.9);
                break;
            }
            case 'mushroom': {
                const capR = 8 + Math.random() * 6;
                g.beginFill(0x886644, 0.5);
                g.drawRect(-2, 0, 4, capR);
                g.endFill();
                g.beginFill(0x55cc55, 0.4);
                g.drawEllipse(0, 0, capR, capR * 0.5);
                g.endFill();
                break;
            }
            case 'gravestone': {
                g.beginFill(0x555555, 0.5);
                g.drawRoundedRect(-8, -20, 16, 20, 3);
                g.endFill();
                g.beginFill(0x555555, 0.5);
                g.drawRect(-10, 0, 20, 4);
                g.endFill();
                break;
            }
            case 'lava_pool': {
                const r = 15 + Math.random() * 20;
                g.beginFill(0xff4400, 0.3);
                g.drawEllipse(0, 0, r, r * 0.4);
                g.endFill();
                g.beginFill(0xff8800, 0.4);
                g.drawEllipse(0, 0, r * 0.6, r * 0.25);
                g.endFill();
                break;
            }
            case 'volcanic_rock': {
                g.beginFill(0x2a1510, 0.5);
                const pts = 5 + Math.floor(Math.random() * 3);
                const r = 10 + Math.random() * 15;
                for (let j = 0; j < pts; j++) {
                    const angle = (j / pts) * Math.PI * 2;
                    const jr = r * (0.7 + Math.random() * 0.3);
                    j === 0 ? g.moveTo(Math.cos(angle) * jr, Math.sin(angle) * jr)
                            : g.lineTo(Math.cos(angle) * jr, Math.sin(angle) * jr);
                }
                g.closePath();
                g.endFill();
                break;
            }
            case 'ash_cloud': {
                g.beginFill(0x444444, 0.15);
                g.drawEllipse(0, 0, 30 + Math.random() * 20, 10 + Math.random() * 8);
                g.endFill();
                break;
            }
            case 'ice_pillar': {
                const pw = 8 + Math.random() * 8;
                const ph = 50 + Math.random() * 60;
                g.beginFill(0x88bbdd, 0.3);
                g.drawRect(-pw / 2, -ph, pw, ph);
                g.endFill();
                g.beginFill(0xccddff, 0.2);
                g.drawRect(-1, -ph + 5, 2, ph - 10);
                g.endFill();
                break;
            }
            case 'snow_drift': {
                g.beginFill(0xccddee, 0.25);
                g.drawEllipse(0, 0, 25 + Math.random() * 20, 8 + Math.random() * 5);
                g.endFill();
                break;
            }
            case 'frozen_chain': {
                g.lineStyle(2, 0x88aacc, 0.3);
                for (let j = 0; j < 5; j++) {
                    g.drawEllipse(0, j * 10, 4, 5);
                }
                break;
            }
            case 'floating_ruin': {
                g.beginFill(0x333355, 0.4);
                g.drawRect(-20, 0, 40, 15);
                g.endFill();
                g.beginFill(0x333355, 0.3);
                g.drawRect(-4, -20, 8, 20);
                g.endFill();
                break;
            }
            case 'arcane_sigil': {
                g.lineStyle(1, 0x8866ff, 0.3);
                const r = 10 + Math.random() * 12;
                g.drawCircle(0, 0, r);
                // Inner star
                for (let j = 0; j < 5; j++) {
                    const a1 = (j / 5) * Math.PI * 2 - Math.PI / 2;
                    const a2 = ((j + 2) / 5) * Math.PI * 2 - Math.PI / 2;
                    g.moveTo(Math.cos(a1) * r * 0.6, Math.sin(a1) * r * 0.6);
                    g.lineTo(Math.cos(a2) * r * 0.6, Math.sin(a2) * r * 0.6);
                }
                break;
            }
            case 'energy_stream': {
                g.lineStyle(2, 0x8866ff, 0.2);
                g.moveTo(-30, 0);
                for (let j = 0; j < 8; j++) {
                    g.lineTo(-30 + j * 10, Math.sin(j * 1.2) * 8);
                }
                break;
            }
            case 'gold_pile': {
                g.beginFill(0xccaa30, 0.3);
                g.drawEllipse(0, 0, 15 + Math.random() * 10, 6 + Math.random() * 4);
                g.endFill();
                g.beginFill(0xffdd55, 0.4);
                for (let j = 0; j < 3; j++) {
                    g.drawCircle((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 4, 2);
                }
                g.endFill();
                break;
            }
            case 'dragon_bone': {
                g.beginFill(0xbbaa88, 0.25);
                // Rib-like arc
                for (let j = 0; j < 3; j++) {
                    g.drawEllipse(0, j * 8, 18, 3);
                }
                g.endFill();
                break;
            }
            case 'obsidian_column': {
                const pw = 6 + Math.random() * 6;
                const ph = 40 + Math.random() * 50;
                g.beginFill(0x1a0a25, 0.5);
                g.drawRect(-pw / 2, -ph, pw, ph);
                g.endFill();
                g.beginFill(0x330055, 0.3);
                g.drawRect(-1, -ph + 3, 2, ph - 6);
                g.endFill();
                break;
            }
            case 'reality_tear': {
                g.lineStyle(2, 0xcc88ff, 0.25);
                g.moveTo(0, -20);
                g.lineTo(5, 0);
                g.lineTo(-3, 20);
                g.lineStyle(1, 0xeeccff, 0.15);
                g.moveTo(2, -15);
                g.lineTo(-2, 15);
                break;
            }
            case 'cosmic_crystal': {
                g.beginFill(0x8866cc, 0.3);
                g.moveTo(0, -15);
                g.lineTo(8, -5);
                g.lineTo(5, 10);
                g.lineTo(-5, 10);
                g.lineTo(-8, -5);
                g.closePath();
                g.endFill();
                g.beginFill(0xaa88ee, 0.2);
                g.drawRect(-1, -12, 2, 18);
                g.endFill();
                break;
            }
            case 'ethereal_platform': {
                g.beginFill(0x8877cc, 0.2);
                g.drawEllipse(0, 0, 25 + Math.random() * 15, 5);
                g.endFill();
                break;
            }
            default:
                return null;
        }

        return g;
    }

    // ── Zone Transition (Fade-to-black + splash text) ───────────────

    /** Trigger cinematic zone transition with fade-to-black and zone name display. */
    triggerZoneTransition(zoneName, splashColor) {
        this.transitionPhase = 'fade_in';
        this.transitionTimer = 0;
        this.transitionZoneName = zoneName || '';
        this.zoneSplashText.style.fill = splashColor || '#ffffff';
        this.zoneSplashText.text = `Entering: ${this.transitionZoneName}`;
    }

    updateTransitionOverlay(delta) {
        const FADE_IN_DURATION = 30;   // ~0.5s
        const HOLD_DURATION = 60;       // ~1s
        const FADE_OUT_DURATION = 40;   // ~0.67s

        if (this.transitionPhase === 'none') return;

        this.transitionTimer += delta;

        if (this.transitionPhase === 'fade_in') {
            this.transitionAlpha = Math.min(1, this.transitionTimer / FADE_IN_DURATION);
            if (this.transitionTimer >= FADE_IN_DURATION) {
                this.transitionPhase = 'hold';
                this.transitionTimer = 0;
                // Show splash text at peak darkness
                this.zoneSplashText.visible = true;
                this.zoneSplashText.alpha = 0;
            }
        } else if (this.transitionPhase === 'hold') {
            this.transitionAlpha = 1;
            // Fade text in during hold
            this.zoneSplashText.alpha = Math.min(1, this.transitionTimer / 20);
            if (this.transitionTimer >= HOLD_DURATION) {
                this.transitionPhase = 'fade_out';
                this.transitionTimer = 0;
            }
        } else if (this.transitionPhase === 'fade_out') {
            this.transitionAlpha = Math.max(0, 1 - this.transitionTimer / FADE_OUT_DURATION);
            this.zoneSplashText.alpha = Math.max(0, 1 - this.transitionTimer / (FADE_OUT_DURATION * 0.6));
            if (this.transitionTimer >= FADE_OUT_DURATION) {
                this.transitionPhase = 'none';
                this.transitionAlpha = 0;
                this.transitionTimer = 0;
                this.zoneSplashText.visible = false;
            }
        }

        // Draw overlay
        this.transitionOverlay.clear();
        if (this.transitionAlpha > 0) {
            this.transitionOverlay.beginFill(0x000000, this.transitionAlpha * 0.85);
            this.transitionOverlay.drawRect(-2000, -2000, 4000, 4000);
            this.transitionOverlay.endFill();
        }

        // Position splash text at center of screen (relative to isoContainer)
        this.zoneSplashText.x = 0;
        this.zoneSplashText.y = -100;
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
                const panelName = member ? 'character_details' : 'recruitment';
                openPanel(panelName);
                if (panelName === 'recruitment') {
                    useTutorialStore.getState().onRecruitmentOpened();
                }
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

        const isRunning = useGameStore.getState().isRunning;

        if (this.groundVisual) {
            this.groundVisual.width = this.app.screen.width + 1000;
            this.groundVisual.height = this.app.screen.height + 1000;
            // Scroll ground if running
            if (this.groundVisual.tilePosition && isRunning) {
                this.groundVisual.tilePosition.x -= 3.0 * delta;
            }
        }

        // Update parallax layers
        ParallaxBackground.update(delta, isRunning);

        // Scroll environmental props
        if (isRunning) {
            for (const prop of this.propsContainer.children) {
                prop.x -= 1.0 * delta;
                // Wrap around
                if (prop.x < -900) prop.x += 1800;
            }
        }

        // Detect state transitions (e.g. party wipe retry: PAUSED → RUNNING)
        const currentGameState = useGameStore.getState().gameState;
        if (this._prevGameState === 'PAUSED' && currentGameState === 'RUNNING') {
            // Wake up any sleeping characters and reset enemies after a retry
            for (const char of this.characterMap.values()) {
                if (char.isSleeping) char.wakeUp();
            }
            EncounterManager.reset();
        }
        this._prevGameState = currentGameState;

        // Hide grid slots during adventure, show in lobby
        if (this.gridSprite) {
            this.gridSprite.visible = currentGameState === 'LOBBY';
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

        // Sort Z-Index
        if (isRunning) {
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
        const { gameState, openPanel } = useGameStore.getState();
        if (gameState !== 'RUNNING') return;

        const { members } = usePartyStore.getState();
        if (members.length === 0) return;

        // Check if all characters are sleeping (incapacitated)
        const allSleeping = Array.from(this.characterMap.values()).every(char => char.isSleeping);

        if (allSleeping) {
            this.tpkTimer += delta;
            // Wait 1 second (60 frames) before showing party wipe choice
            if (this.tpkTimer >= 60) {
                this.tpkTimer = 0;

                // Pause the game and show the party wipe panel
                useGameStore.setState({ gameState: 'PAUSED', isRunning: false });
                openPanel('party_wipe');
                AudioManager.playSFX('tpk');
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
