import { Enemy } from '../entities/Enemy';
import useGameStore from '../../store/useGameStore';
import useResourceStore from '../../store/useResourceStore';
import useMetaStore from '../../store/useMetaStore';
import usePartyStore from '../../store/usePartyStore';
import useLootStore from '../../store/useLootStore';

class EncounterManager {
    constructor() {
        this.enemies = new Map();
        this.spawnTimer = 0;
        this.spawnInterval = 180; // frames (~3 seconds)
        this.scene = null;
        this.waveTransitionTimer = 0;
        this.isTransitioning = false;
    }

    bindScene(scene) {
        this.scene = scene;
    }

    getEnemyStats(zone) {
        const scaling = Math.pow(1.15, zone - 1);
        return {
            hp: Math.floor(20 * scaling),
            atk: Math.floor(5 * scaling),
            def: Math.floor(1 * scaling),
            goldReward: Math.floor(5 + zone * 2),
            xpReward: Math.floor(3 + zone * 1.5),
        };
    }

    getEnemyName(zone) {
        const names = ['Goblin', 'Skeleton', 'Orc', 'Wraith', 'Troll', 'Demon', 'Dragon Whelp'];
        const index = Math.min(Math.floor((zone - 1) / 3), names.length - 1);
        return names[index];
    }

    getBossStats(zone) {
        const base = this.getEnemyStats(zone);
        return {
            hp: Math.floor(base.hp * 5),
            atk: Math.floor(base.atk * 2),
            def: Math.floor(base.def * 1.5),
            goldReward: Math.floor(base.goldReward * 5),
            xpReward: Math.floor(base.xpReward * 5),
        };
    }

    getBossName(zone) {
        const bossNames = ['Goblin King', 'Skeleton Lord', 'Orc Warchief', 'Wraith Sovereign', 'Troll Elder', 'Demon Prince', 'Dragon Matriarch'];
        const index = Math.min(Math.floor((zone - 1) / 3), bossNames.length - 1);
        return bossNames[index];
    }

    update(delta) {
        const gameState = useGameStore.getState();

        // Wave transition cooldown
        if (this.isTransitioning) {
            this.waveTransitionTimer -= delta;
            if (this.waveTransitionTimer <= 0) {
                this.isTransitioning = false;
            }
            return;
        }

        // Check wave clear
        if (gameState.isWaveCleared()) {
            this.onWaveCleared();
            return;
        }

        const isBossWave = gameState.isBossWave();
        const aliveEnemies = Array.from(this.enemies.values()).filter(e => e.hp > 0).length;

        // Boss wave: only 1 enemy (the boss)
        if (isBossWave) {
            if (aliveEnemies === 0 && gameState.enemiesKilledThisWave === 0) {
                this.spawnTimer += delta;
                if (this.spawnTimer >= this.spawnInterval) {
                    this.spawnBoss();
                    this.spawnTimer = 0;
                }
            }
        } else {
            // Normal wave spawning
            const remainingToSpawn = gameState.enemiesPerWave - gameState.enemiesKilledThisWave - aliveEnemies;

            if (remainingToSpawn > 0) {
                this.spawnTimer += delta;
                if (this.spawnTimer >= this.spawnInterval) {
                    this.spawnEnemy();
                    this.spawnTimer = 0;
                }
            }
        }

        // Update Enemies
        for (const enemy of this.enemies.values()) {
            enemy.update(delta);

            // Remove if dead
            if (enemy.hp <= 0) {
                this.onEnemyKilled(enemy);
                this.removeEnemy(enemy.id);
                continue;
            }

            // Remove if way off screen
            const bounds = 2000;
            if (enemy.x < -bounds || enemy.x > bounds || enemy.y < -bounds || enemy.y > bounds) {
                this.removeEnemy(enemy.id);
            }
        }
    }

    onEnemyKilled(enemy) {
        // Grant rewards
        const metaUpgrades = useMetaStore.getState().upgrades;
        const goldMult = 1 + (metaUpgrades.goldGain || 0) * 0.25;

        useResourceStore.getState().addGold(Math.floor(enemy.goldReward * goldMult));
        useResourceStore.getState().addXp(enemy.xpReward);
        useGameStore.getState().addKill();

        // XP distribution to party members
        const xpMult = 1 + (metaUpgrades.xpGain || 0) * 0.25;
        usePartyStore.getState().distributeXp(Math.floor(enemy.xpReward * xpMult));

        // Loot roll — bosses drop 3 items
        const { zone } = useGameStore.getState();
        const lootRolls = enemy.isBoss ? 3 : 1;
        for (let i = 0; i < lootRolls; i++) {
            useLootStore.getState().rollLoot(zone);
        }
    }

    onWaveCleared() {
        // Brief transition before next wave
        this.isTransitioning = true;
        this.waveTransitionTimer = 120; // ~2 second pause
        this.spawnTimer = 0;

        // Clear remaining dead enemies from scene
        for (const [id, enemy] of this.enemies) {
            this.removeEnemy(id);
        }
        this.enemies.clear();

        // Advance wave
        useGameStore.getState().advanceWave();

        // Zone bonus: extra gold on zone advance
        const gameState = useGameStore.getState();
        if (gameState.wave === 1) {
            // Just advanced to a new zone
            const zoneBonus = gameState.zone * 50;
            useResourceStore.getState().addGold(zoneBonus);
        }
    }

    spawnEnemy() {
        if (!this.scene) return;

        const { zone } = useGameStore.getState();
        const stats = this.getEnemyStats(zone);
        const name = this.getEnemyName(zone);

        const enemy = new Enemy({
            id: `${name.toLowerCase()}_${Math.random().toString(36).substr(2, 9)}`,
            hp: stats.hp,
            atk: stats.atk,
            def: stats.def,
            goldReward: stats.goldReward,
            xpReward: stats.xpReward,
            name: name,
        });

        // Spawn at random edge
        const edge = Math.floor(Math.random() * 4);
        const buffer = 50;
        const width = this.scene.app.screen.width;
        const height = this.scene.app.screen.height;

        let screenX = 0;
        let screenY = 0;

        switch (edge) {
            case 0:
                screenX = Math.random() * width;
                screenY = -buffer;
                break;
            case 1:
                screenX = width + buffer;
                screenY = Math.random() * height;
                break;
            case 2:
                screenX = Math.random() * width;
                screenY = height + buffer;
                break;
            case 3:
                screenX = -buffer;
                screenY = Math.random() * height;
                break;
        }

        enemy.x = screenX - this.scene.isoContainer.x;
        enemy.y = screenY - this.scene.isoContainer.y;

        this.enemies.set(enemy.id, enemy);
        this.scene.addEnemy(enemy);
    }

    spawnBoss() {
        if (!this.scene) return;

        const { zone } = useGameStore.getState();
        const stats = this.getBossStats(zone);
        const name = this.getBossName(zone);

        const enemy = new Enemy({
            id: `boss_${name.toLowerCase().replace(/\s/g, '_')}_${Math.random().toString(36).substr(2, 9)}`,
            hp: stats.hp,
            atk: stats.atk,
            def: stats.def,
            goldReward: stats.goldReward,
            xpReward: stats.xpReward,
            name: name,
            isBoss: true,
        });

        // Spawn boss from the top
        const width = this.scene.app.screen.width;
        enemy.x = (width / 2) - this.scene.isoContainer.x;
        enemy.y = -100 - this.scene.isoContainer.y;

        this.enemies.set(enemy.id, enemy);
        this.scene.addEnemy(enemy);
    }

    removeEnemy(id) {
        const enemy = this.enemies.get(id);
        if (enemy) {
            this.enemies.delete(id);
            if (this.scene) {
                this.scene.removeEnemy(id);
            }
        }
    }

    // Reset for TPK
    reset() {
        for (const [id] of this.enemies) {
            if (this.scene) this.scene.removeEnemy(id);
        }
        this.enemies.clear();
        this.spawnTimer = 0;
        this.isTransitioning = false;
        this.waveTransitionTimer = 0;
    }
}

export default new EncounterManager();
