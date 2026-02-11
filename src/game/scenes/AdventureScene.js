import * as PIXI from 'pixi.js';
import PhysicsSystem from '../systems/PhysicsSystem';
import Matter from 'matter-js';
import usePartyStore from '../../store/usePartyStore';
import useGameStore from '../../store/useGameStore';
import { Character } from '../entities/Character';
import CombatSystem from '../systems/CombatSystem';
import { toScreen, TILE_WIDTH, TILE_HEIGHT } from '../utils/Isometric';

export class AdventureScene extends PIXI.Container {
    constructor(app) {
        super();
        this.app = app;

        // Layers
        // We need a root container for the isometric world that moves with the camera
        this.isoContainer = new PIXI.Container();
        this.isoContainer.sortableChildren = true; // Enable Y-sorting

        // Sub-containers for organization (optional, but good for layering if we want strict z-indices later)
        // Actually, for Y-sorting to work on everything, they all need to be direct children of isoContainer
        // OR we use zIndex on the containers themselves. 
        // Best approach for Top-Down/Iso rendering where sprites overlap:
        // All sprites (Party, Enemies, VFX, Ground) go into `isoContainer`.
        // We can keep references to them for logic, but they shouldn't be separate PIXI containers unless we want layers.
        // IF we want layers (e.g. Ground always below), we use zIndex.

        // Let's attach the specific containers to isoContainer for now, 
        // but remember that if we want "Character behind Tree", they need to be in the SAME parent.
        // For now: Party and Enemies are same layer. Ground is lower. VFX is higher.

        // REFACTOR:
        // 1. isoContainer is the WORLD.
        // 2. All entities add to isoContainer.

        this.addChild(this.isoContainer);

        this.groundVisual = null;
        this.setupGround(); // Adds to isoContainer

        this.enemyMap = new Map();
        this.characterMap = new Map();

        // VFX Container (on top of entities)
        this.vfxContainer = new PIXI.Container();
        this.vfxContainer.zIndex = 9999;
        this.isoContainer.addChild(this.vfxContainer);

        // Selected tile highlight
        this.selectedTileHighlight = new PIXI.Graphics();
        this.selectedTileHighlight.visible = false;
        this.selectedTileHighlight.zIndex = -9997;
        this.isoContainer.addChild(this.selectedTileHighlight);

        // Draw Grid
        this.gridSprite = null;
        this.drawIsometricGrid();

        // Systems
        CombatSystem.bindScene(this);
    }

    // Helper function for isometric to screen coordinates
    toScreen(isoX, isoY) {
        const screenX = (isoX - isoY) * TILE_WIDTH / 2;
        const screenY = (isoX + isoY) * TILE_HEIGHT / 2;
        return { x: screenX, y: screenY };
    }

    /*
    setupBackgroundLayers() {
       // Deprecated/Merged
    }
    */

    setupGround() {
        this.groundVisual = new PIXI.Graphics();
        this.groundVisual.beginFill(0x1a1a2e);
        this.groundVisual.drawRect(-5000, -5000, 10000, 10000); // Large static floor
        this.groundVisual.endFill();
        this.groundVisual.zIndex = -10000;
        this.isoContainer.addChild(this.groundVisual);
    }

    // Helper: Screen to Iso (Grid)
    toGrid(screenX, screenY) {
        // screenX/Y are local to isoContainer (0,0 at center of grid because how we drew it)
        // Reverse projection
        const a = screenY / (TILE_HEIGHT / 2);
        const b = screenX / (TILE_WIDTH / 2);

        const isoX = (a + b) / 2;
        const isoY = (a - b) / 2;

        // Convert iso back to grid index
        // isoX = x - centerX => x = isoX + centerX
        const { gridSize } = usePartyStore.getState();
        const centerX = (gridSize.width - 1) / 2;
        const centerY = (gridSize.height - 1) / 2;

        const gridX = Math.round(isoX + centerX);
        const gridY = Math.round(isoY + centerY);

        return { x: gridX, y: gridY };
    }

    drawIsometricGrid() {
        if (this.gridSprite) {
            this.isoContainer.removeChild(this.gridSprite);
        }

        const gridSize = usePartyStore.getState().gridSize || { width: 3, height: 3 };
        const gridGfx = new PIXI.Graphics();
        gridGfx.lineStyle(2, 0xbdc3c7, 0.8);
        gridGfx.beginFill(0x000000, 0.001); // Almost transparent fill for hit detection

        const centerX = (gridSize.width - 1) / 2;
        const centerY = (gridSize.height - 1) / 2;

        for (let x = 0; x < gridSize.width; x++) {
            for (let y = 0; y < gridSize.height; y++) {
                const pos = this.toScreen(x - centerX, y - centerY);

                gridGfx.moveTo(pos.x, pos.y - TILE_HEIGHT / 2);
                gridGfx.lineTo(pos.x + TILE_WIDTH / 2, pos.y);
                gridGfx.lineTo(pos.x, pos.y + TILE_HEIGHT / 2);
                gridGfx.lineTo(pos.x - TILE_WIDTH / 2, pos.y);
                gridGfx.lineTo(pos.x, pos.y - TILE_HEIGHT / 2);
            }
        }
        gridGfx.endFill();

        this.gridSprite = gridGfx;
        this.gridSprite.zIndex = -9998;
        this.isoContainer.addChild(this.gridSprite);

        // Add Interaction
        this.gridSprite.eventMode = 'static';
        this.gridSprite.cursor = 'pointer';

        this.gridSprite.on('pointertap', (e) => {
            const local = this.gridSprite.toLocal(e.global);
            const gridPos = this.toGrid(local.x, local.y);

            // Validate bounds
            if (gridPos.x >= 0 && gridPos.x < gridSize.width &&
                gridPos.y >= 0 && gridPos.y < gridSize.height) {

                console.log('Clicked Grid:', gridPos);

                // Check if occupied
                const member = usePartyStore.getState().members.find(m => m.x === gridPos.x && m.y === gridPos.y);

                const { gameState, selectGridSlot, openPanel } = useGameStore.getState();

                if (gameState === 'LOBBY') {
                    if (!member) {
                        selectGridSlot(gridPos.x, gridPos.y);
                        openPanel('recruitment');
                    } else {
                        selectGridSlot(gridPos.x, gridPos.y);
                        openPanel('character_details');
                    }
                } else if (gameState === 'RUNNING' || gameState === 'PAUSED') {
                    if (member) {
                        selectGridSlot(gridPos.x, gridPos.y);
                        openPanel('character_details');
                    }
                }
            }
        });
    }

    update(delta) {
        const isRunning = useGameStore.getState().isRunning;

        // Always update (even in LOBBY)
        this.isoContainer.x = this.app.screen.width / 2;
        this.isoContainer.y = this.app.screen.height / 2;
        this.syncParty();
        this.updateSelectedTileHighlight();

        if (!isRunning) return;

        // Sort entities by Y depth
        this.isoContainer.sortChildren();

        // WORLD TREADMILL EFFECT
        if (this.groundVisual && this.groundVisual.tilePosition) {
            this.groundVisual.tilePosition.x -= 1 * delta;
            this.groundVisual.tilePosition.y -= 1 * delta;
        }

        // Update Characters
        for (const char of this.characterMap.values()) {
            char.update(delta);
        }
    }

    updateSelectedTileHighlight() {
        const { selectedGridSlot, gameState } = useGameStore.getState();
        const { gridSize } = usePartyStore.getState();

        if (!selectedGridSlot || gameState !== 'LOBBY') {
            this.selectedTileHighlight.visible = false;
            return;
        }

        const centerX = (gridSize.width - 1) / 2;
        const centerY = (gridSize.height - 1) / 2;
        const pos = this.toScreen(selectedGridSlot.x - centerX, selectedGridSlot.y - centerY);

        this.selectedTileHighlight.clear();
        const pulse = 0.4 + Math.sin(Date.now() / 300) * 0.2;
        this.selectedTileHighlight.lineStyle(3, 0xf1c40f, pulse + 0.3);
        this.selectedTileHighlight.beginFill(0xf1c40f, pulse * 0.3);
        this.selectedTileHighlight.moveTo(pos.x, pos.y - TILE_HEIGHT / 2);
        this.selectedTileHighlight.lineTo(pos.x + TILE_WIDTH / 2, pos.y);
        this.selectedTileHighlight.lineTo(pos.x, pos.y + TILE_HEIGHT / 2);
        this.selectedTileHighlight.lineTo(pos.x - TILE_WIDTH / 2, pos.y);
        this.selectedTileHighlight.lineTo(pos.x, pos.y - TILE_HEIGHT / 2);
        this.selectedTileHighlight.endFill();
        this.selectedTileHighlight.visible = true;
    }

    syncParty() {
        const { members, gridSize } = usePartyStore.getState();
        const memberIds = new Set(members.map(m => m.id));
        const centerX = (gridSize.width - 1) / 2;
        const centerY = (gridSize.height - 1) / 2;

        // Remove missing
        for (const [id, char] of this.characterMap) {
            if (!memberIds.has(id)) {
                this.isoContainer.removeChild(char);
                this.characterMap.delete(id);
            }
        }

        // Add/Update
        members.forEach((member) => {
            let char = this.characterMap.get(member.id);
            if (!char) {
                char = new Character(member);
                this.isoContainer.addChild(char);
                this.characterMap.set(member.id, char);
            }

            // Update Position based on Grid Slot
            // We force position every frame or only on change? Every frame is fine for now.
            // member.x/y are grid indices.
            const screenPos = this.toScreen(member.x - centerX, member.y - centerY);
            char.x = screenPos.x;
            char.y = screenPos.y;

            // Update data (stats etc)
            char.data = member;
        });
    }

    addEnemy(enemy) {
        if (this.enemyMap.has(enemy.id)) return;

        this.enemyMap.set(enemy.id, enemy);
        this.isoContainer.addChild(enemy);
        console.log('Added enemy:', enemy.id);
    }

    removeEnemy(id) {
        const enemy = this.enemyMap.get(id);
        if (enemy) {
            this.isoContainer.removeChild(enemy);
            this.enemyMap.delete(id);
            // destroy?
            // enemy.destroy(); // managed by pool or GC? Let's just remove for now.
        }
    }

    resize(width, height) {
        if (this.isoContainer) {
            this.isoContainer.x = width / 2;
            this.isoContainer.y = height / 4;
        }
    }
}
