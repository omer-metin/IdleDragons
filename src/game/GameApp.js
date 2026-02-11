import * as PIXI from 'pixi.js';
import PhysicsSystem from './systems/PhysicsSystem';
import { AdventureScene } from './scenes/AdventureScene';
import useGameStore from '../store/useGameStore';

import EncounterManager from './systems/EncounterManager';

class GameApp {
    constructor() {
        this.app = null;
        this.scene = null;
        window.GameApp = this; // DEBUG
    }

    async init(container) {
        if (this.app) return;

        this.app = new PIXI.Application({
            background: '#1099bb',
            resizeTo: container,
            width: container.clientWidth,
            height: container.clientHeight,
            autoDensity: true,
            resolution: window.devicePixelRatio || 1,
        });

        container.appendChild(this.app.view);

        this.scene = new AdventureScene(this.app);
        this.app.stage.addChild(this.scene);

        // Bind Scene to EncounterManager
        EncounterManager.bindScene(this.scene);

        // Initial Resize
        this.scene.resize(this.app.screen.width, this.app.screen.height);

        // Start Loop
        window.PIXI = PIXI;
        window.GameApp = this;
        this.app.ticker.add((delta) => {
            try {
                this.update(delta);
            } catch (err) {
                console.error("CRITICAL ENGINE ERROR:", err);
                window.__engine_error = err;
            }
        });

        this.app.renderer.on('resize', (w, h) => {
            if (this.scene) this.scene.resize(w, h);
        });
    }

    update(delta) {
        const isRunning = useGameStore.getState().isRunning;
        const timeMultiplier = useGameStore.getState().timeMultiplier;

        if (!isRunning) return;

        // Update Physics
        PhysicsSystem.update(delta * timeMultiplier);

        // Update EncounterManager
        EncounterManager.update(delta * timeMultiplier);

        // Update Scene
        if (this.scene) {
            this.scene.update(delta * timeMultiplier);
        }

        // Increment Distance
        useGameStore.getState().incrementDistance(0.1 * delta * timeMultiplier);

        // FORCE RENDER
        if (this.app && this.app.renderer) {
            this.app.renderer.render(this.app.stage);
        }
    }

    destroy() {
        if (this.app) {
            this.app.destroy(true, { children: true });
            this.app = null;
        }
    }
}

export default new GameApp();
