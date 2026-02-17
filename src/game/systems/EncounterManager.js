import { Enemy } from '../entities/Enemy';
import useGameStore from '../../store/useGameStore';
import useResourceStore from '../../store/useResourceStore';
import useMetaStore from '../../store/useMetaStore';
import usePartyStore from '../../store/usePartyStore';
import useLootStore from '../../store/useLootStore';
import AudioManager from '../../audio/AudioManager';
import useToastStore from '../../store/useToastStore';
import CombatSystem from './CombatSystem';
import ParticleSystem from './ParticleSystem';

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
        // Also init Audio BGM if game running? 
        // Can't assume user interracted yet.
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
            // Spawn the boss if no living enemies exist and none have been killed yet
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

        // Update Enemies — collect removals first to avoid iterator invalidation
        const toRemove = [];
        for (const enemy of this.enemies.values()) {
            if (enemy && !enemy.destroyed && enemy.transform) {
                enemy.update(delta);
            }

            if (enemy.hp <= 0) {
                this.onEnemyKilled(enemy);
                toRemove.push(enemy.id);
                continue;
            }

            // Remove if way off screen
            const bounds = 2000;
            if (enemy.x < -bounds || enemy.x > bounds || enemy.y < -bounds || enemy.y > bounds) {
                toRemove.push(enemy.id);
            }
        }

        // Batch remove after iteration completes
        for (const id of toRemove) {
            this.removeEnemy(id);
        }
    }

    onEnemyKilled(enemy) {
        // Rewards
        const metaUpgrades = useMetaStore.getState().upgrades;
        const goldMult = 1 + (metaUpgrades.goldGain || 0) * 0.25;
        const goldAmount = Math.floor(enemy.goldReward * goldMult);
        const xpAmount = enemy.xpReward;

        useResourceStore.getState().addGold(goldAmount);
        useResourceStore.getState().addXp(xpAmount);
        useGameStore.getState().addKill();

        // Audio & Visuals
        AudioManager.playSFX(enemy.isBoss ? 'boss_death' : 'enemy_death');
        CombatSystem.showDeathEffect(enemy);
        ParticleSystem.emitGold(enemy.x, enemy.y - 20);
        useToastStore.getState().addGoldToast(goldAmount);
        useToastStore.getState().addXpToast(xpAmount);

        // XP distribution
        const xpMult = 1 + (metaUpgrades.xpGain || 0) * 0.25;
        usePartyStore.getState().distributeXp(Math.floor(xpAmount * xpMult));

        // Loot roll
        const { zone } = useGameStore.getState();
        const lootRolls = enemy.isBoss ? 3 : 1;

        for (let i = 0; i < lootRolls; i++) {
            const item = useLootStore.getState().rollLoot(zone);
            if (item) {
                // Visual Feedback for Loot
                useToastStore.getState().addToast({
                    type: 'loot',
                    message: `Found: ${item.name}`,
                    icon: '🎁', // Changed from 📦 for more excitement
                    color: item.rarityColor || '#f1c40f',
                    duration: 4000
                });
                AudioManager.playSFX('ui_hover'); // Or a specific loot sound if available
            }
        }
    }

    onWaveCleared() {
        // Brief transition before next wave
        this.isTransitioning = true;
        this.waveTransitionTimer = 120; // ~2 second pause
        this.spawnTimer = 0;

        // Audio & Feedback
        AudioManager.playSFX('wave_clear');
        const { wave } = useGameStore.getState();
        useToastStore.getState().addToast({
            type: 'wave',
            message: `Wave ${wave} Complete`,
            icon: '⚔️',
            color: '#3498db'
        });

        // Clear remaining dead enemies from scene
        // Logic: convert map keys to array to avoid iterator issues
        const toRemove = [];
        for (const [id] of this.enemies) toRemove.push(id);
        toRemove.forEach(id => this.removeEnemy(id));
        this.enemies.clear();

        // Advance wave
        useGameStore.getState().advanceWave();

        // Zone bonus: extra gold on zone advance
        const gameState = useGameStore.getState();

        // If we wrapped to wave 1, it means we entered a new zone
        if (gameState.wave === 1) {
            const zoneBonus = gameState.zone * 50;
            useResourceStore.getState().addGold(zoneBonus);
            useToastStore.getState().addToast({
                type: 'zone',
                message: `Zone ${gameState.zone} Reached!`,
                icon: 'mnt',
                color: '#8e44ad'
            });
            AudioManager.startBGM('adventure');
        }
    }

    spawnEnemy() {
        if (!this.scene) return;

        const { zone } = useGameStore.getState();
        const stats = this.getEnemyStats(zone);
        const name = this.getEnemyName(zone);

        let type = 'melee';
        const rand = Math.random();

        if (zone >= 5) {
            // Zone 5+: Melee 60%, Ranged 30%, Healer 10%
            if (rand < 0.1) type = 'healer';
            else if (rand < 0.4) type = 'ranged';
        } else if (zone >= 3) {
            // Zone 3+: Melee 70%, Ranged 30%
            if (rand < 0.3) type = 'ranged';
        }

        const enemy = new Enemy({
            id: `${name.toLowerCase()}_${Math.random().toString(36).substr(2, 9)}`,
            hp: stats.hp,
            atk: stats.atk,
            def: stats.def,
            goldReward: stats.goldReward,
            xpReward: stats.xpReward,
            name: `${type === 'melee' ? '' : type + ' '}${name}`, // e.g. "ranged Goblin"
            spriteKey: name, // The base name (Goblin, Orc...)
            zone: zone,
            type: type
        });

        // Spawn at random edge (User requested random directions)
        const edge = Math.floor(Math.random() * 4);
        const buffer = 50;
        const width = this.scene.app.screen.width;
        const height = this.scene.app.screen.height;

        let screenX = 0;
        let screenY = 0;

        switch (edge) {
            case 0: screenX = Math.random() * width; screenY = -buffer; break; // Top
            case 1: screenX = width + buffer; screenY = Math.random() * height; break; // Right
            case 2: screenX = Math.random() * width; screenY = height + buffer; break; // Bottom
            case 3: screenX = -buffer; screenY = Math.random() * height; break; // Left (Behind)
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
            zone: zone
        });

        const width = this.scene.app.screen.width;
        const height = this.scene.app.screen.height;

        // Boss spawns right, maybe slightly elevated
        enemy.x = (width + 100) - this.scene.isoContainer.x;
        enemy.y = (height / 2) - this.scene.isoContainer.y; // Centered vertically relative to party

        this.enemies.set(enemy.id, enemy);
        this.scene.addEnemy(enemy);

        AudioManager.playSFX('boss_wave_start');
        AudioManager.startBGM('boss');
        useToastStore.getState().addToast({
            type: 'boss',
            message: `⚠ ${name} appeared!`,
            icon: '👹',
            color: '#e74c3c',
            duration: 5000
        });
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

    reset() {
        // Safe remove
        const toRemove = [];
        for (const [id] of this.enemies) toRemove.push(id);
        toRemove.forEach(id => {
            if (this.scene) this.scene.removeEnemy(id);
        });
        this.enemies.clear();
        this.spawnTimer = 0;
        this.isTransitioning = false;
        this.waveTransitionTimer = 0;
    }
}

export default new EncounterManager();
