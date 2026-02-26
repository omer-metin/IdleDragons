import * as PIXI from 'pixi.js';
import PhysicsSystem from './systems/PhysicsSystem';
import { AdventureScene } from './scenes/AdventureScene';
import useGameStore from '../store/useGameStore';

import EncounterManager from './systems/EncounterManager';
import CrazyGamesSDK from '../platform/CrazyGames';

class GameApp {
    constructor() {
        this.app = null;
        this.scene = null;
    }

    async init(container) {
        if (this.app) return;

        this.app = new PIXI.Application({
            background: '#111118', // Correct Dark Theme Background
            resizeTo: container,
            width: container.clientWidth,
            height: container.clientHeight,
            autoDensity: true,
            resolution: window.devicePixelRatio || 1,
        });

        container.appendChild(this.app.view);

        this.scene = new AdventureScene(this.app);
        this.app.stage.addChild(this.scene);

        // Enable Stage Interactivity
        this.app.stage.eventMode = 'static';
        this.app.stage.hitArea = this.app.screen;

        // Bind Scene to EncounterManager
        EncounterManager.bindScene(this.scene);

        // Initial Resize
        if (this.scene && this.scene.resize) {
            this.scene.resize(this.app.screen.width, this.app.screen.height);
        }

        // Start Loop
        this.app.ticker.add((delta) => {
            try {
                this.update(delta);
            } catch (err) {
                console.error("CRITICAL ENGINE ERROR:", err);
                window.__engine_error = err;
            }
        });

        this.app.renderer.on('resize', (w, h) => {
            if (this.scene && this.scene.resize) this.scene.resize(w, h);
        });

        // CrazyGames SDK Init
        CrazyGamesSDK.init();

        // Listen for Game State changes for SDK events
        this.unsubscribeStore = useGameStore.subscribe((state, prevState) => {
            if (state.gameState !== prevState.gameState) {
                if (state.gameState === 'RUNNING') {
                    CrazyGamesSDK.gameplayStart();
                } else {
                    CrazyGamesSDK.gameplayStop();
                }
            }
        });
    }

    update(delta) {
        const isRunning = useGameStore.getState().isRunning;
        const timeMultiplier = useGameStore.getState().timeMultiplier;

        // Visuals/Scene Update should run ALWAYS (for Lobby, Camera, etc)
        if (this.scene) {
            this.scene.update(delta * (isRunning ? timeMultiplier : 1));
        }

        if (!isRunning) return;

        // Update Physics
        PhysicsSystem.update(delta * timeMultiplier);

        // Update EncounterManager
        EncounterManager.update(delta * timeMultiplier);

        // Increment Distance
        useGameStore.getState().incrementDistance(0.1 * delta * timeMultiplier);

    }

    destroy() {
        if (this.unsubscribeStore) this.unsubscribeStore();
        if (this.app) {
            this.app.destroy(true, { children: true });
            this.app = null;
        }
    }
}

export default new GameApp();
