import { Enemy } from '../entities/Enemy';
import useGameStore from '../../store/useGameStore';
import useResourceStore from '../../store/useResourceStore';
import useMetaStore from '../../store/useMetaStore';
import usePartyStore from '../../store/usePartyStore';
import useLootStore from '../../store/useLootStore';
import AudioManager from '../../audio/AudioManager';
import useToastStore from '../../store/useToastStore';
import useAchievementStore from '../../store/useAchievementStore';
import CombatSystem from './CombatSystem';
import ParticleSystem from './ParticleSystem';
import CrazyGamesSDK from '../../platform/CrazyGames';
import useEventStore from '../../store/useEventStore';

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
        const scaling = Math.pow(1.25, zone - 1);
        const ascMult = useMetaStore.getState().getAscensionDifficultyMult();
        return {
            hp: Math.floor(30 * scaling * ascMult),
            atk: Math.floor(8 * scaling * ascMult),
            def: Math.floor(1 * scaling),
            goldReward: Math.floor(5 + zone * 2),
            xpReward: Math.floor(3 + zone * 1.5),
        };
    }

    getEnemyName(zone) {
        const ZONE_ENEMIES = [
            ['Rat', 'Slime', 'Bat'],           // Zone 1
            ['Goblin', 'Kobold', 'Wolf'],        // Zone 2
            ['Skeleton', 'Zombie', 'Ghost'],     // Zone 3
            ['Orc', 'Bandit', 'Spider'],         // Zone 4
            ['Wraith', 'Shade', 'Phantom'],      // Zone 5
            ['Troll', 'Ogre', 'Basilisk'],       // Zone 6
            ['Demon Imp', 'Hellhound', 'Harpy'], // Zone 7
            ['Fire Elemental', 'Magma Golem', 'Salamander'], // Zone 8
            ['Shadow Dragon', 'Dark Knight', 'Void Walker'],  // Zone 9
        ];
        const PREFIXES = ['', '', '', 'Frenzied ', 'Shadow ', 'Elder ', 'Cursed '];

        const tier = Math.min(zone - 1, ZONE_ENEMIES.length - 1);
        const enemies = ZONE_ENEMIES[tier];
        const baseName = enemies[Math.floor(Math.random() * enemies.length)];

        // Higher zones get prefixed variants
        if (zone > ZONE_ENEMIES.length) {
            const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
            return prefix + baseName;
        }
        return baseName;
    }

    getBossStats(zone) {
        const base = this.getEnemyStats(zone);
        return {
            hp: Math.floor(base.hp * 8),
            atk: Math.floor(base.atk * 3),
            def: Math.floor(base.def * 1.5),
            goldReward: Math.floor(base.goldReward * 5),
            xpReward: Math.floor(base.xpReward * 5),
        };
    }

    getBossName(zone) {
        const ZONE_BOSSES = [
            'Rat King',            // Zone 1
            'Goblin Warchief',     // Zone 2
            'Necromancer',         // Zone 3
            'Spider Queen',        // Zone 4
            'Lich Lord',           // Zone 5
            'Troll Elder',         // Zone 6
            'Demon Prince',        // Zone 7
            'Infernal Dragon',     // Zone 8
            'Ancient Dragon',      // Zone 9
        ];
        const index = Math.min(zone - 1, ZONE_BOSSES.length - 1);
        return zone > ZONE_BOSSES.length ? `Elder ${ZONE_BOSSES[index]}` : ZONE_BOSSES[index];
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
        useAchievementStore.getState().trackGold(goldAmount);

        // Audio & Visuals
        AudioManager.playSFX(enemy.isBoss ? 'boss_death' : 'enemy_death');
        if (enemy.isBoss) {
            CrazyGamesSDK.happytime();
            if (this.scene) this.scene.screenShake(10, 20);
            ParticleSystem.emitBossSpawn(enemy.x, enemy.y - 20);
        }
        CombatSystem.showDeathEffect(enemy);
        ParticleSystem.emitGold(enemy.x, enemy.y - 20);
        useToastStore.getState().addGoldToast(goldAmount);
        useToastStore.getState().addXpToast(xpAmount);

        // XP distribution
        const xpMult = 1 + (metaUpgrades.xpGain || 0) * 0.25;
        usePartyStore.getState().distributeXp(Math.floor(xpAmount * xpMult));

        // Loot roll (elite: guaranteed Rare+, boss: x2, normal: x1)
        const { zone } = useGameStore.getState();
        const lootRolls = enemy.isBoss ? 2 : 1;

        for (let i = 0; i < lootRolls; i++) {
            const item = enemy.isElite
                ? useLootStore.getState().rollEliteLoot(zone)
                : useLootStore.getState().rollLoot(zone);
            if (item) {
                // Visual Feedback for Loot
                useToastStore.getState().addToast({
                    type: 'loot',
                    message: `Found: ${item.name}`,
                    icon: '🎁', // Changed from 📦 for more excitement
                    color: item.rarityColor || '#f1c40f',
                    duration: 4000
                });
                AudioManager.playSFX(item.rarity && item.rarity !== 'Common' ? 'loot_rare' : 'loot_drop');
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
            CrazyGamesSDK.happytime();
            const zoneBonus = gameState.zone * 50;
            useResourceStore.getState().addGold(zoneBonus);
            useAchievementStore.getState().trackGold(zoneBonus);
            useToastStore.getState().addToast({
                type: 'zone',
                message: `Zone ${gameState.zone} Reached!`,
                icon: 'mnt',
                color: '#8e44ad'
            });
            AudioManager.playSFX('zone_advance');
            AudioManager.startBGM('adventure');

            // Gold Interest (skill tree)
            const interestRate = useMetaStore.getState().getSkillTreeEffect('goldInterest');
            if (interestRate > 0) {
                const currentGold = useResourceStore.getState().gold;
                const interest = Math.floor(currentGold * interestRate);
                if (interest > 0) {
                    useResourceStore.getState().addGold(interest);
                    useToastStore.getState().addGoldToast(interest);
                }
            }

            // Random event roll between zones
            const event = useEventStore.getState().rollEvent();
            if (event) {
                useGameStore.getState().openPanel('event');
                useGameStore.getState().togglePause();
            }

            // Check achievements on zone advance
            this.checkAchievements();
        }
    }

    /** Build snapshot and check all achievements. */
    checkAchievements() {
        const meta = useMetaStore.getState();
        const achStore = useAchievementStore.getState();
        const party = usePartyStore.getState();
        const snapshot = {
            totalKillsAllTime: meta.totalKillsAllTime + useGameStore.getState().totalKills,
            highestZone: Math.max(meta.highestZone, useGameStore.getState().zone),
            generation: meta.generation,
            totalGoldEarned: achStore.totalGoldEarned,
            totalItemsFound: achStore.totalItemsFound,
            legendariesFound: achStore.legendariesFound,
            totalSoulsEarned: achStore.totalSoulsEarned,
            partySize: party.members.length,
        };
        achStore.checkAll(snapshot);
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

        // Elite roll: 10% chance (not on boss waves)
        const AFFIXES = ['vampiric', 'shielded', 'berserker'];
        const isElite = Math.random() < 0.10;
        const affix = isElite ? AFFIXES[Math.floor(Math.random() * AFFIXES.length)] : null;

        // Elite stats: 2x HP & ATK
        if (isElite) {
            stats.hp *= 2;
            stats.atk *= 2;
            stats.goldReward *= 3;
            stats.xpReward *= 2;
        }

        // Strip prefixes for sprite key lookup
        const spriteKey = name.replace(/^(Frenzied |Shadow |Elder |Cursed )/, '');
        const affixLabel = affix ? affix.charAt(0).toUpperCase() + affix.slice(1) + ' ' : '';

        const enemy = new Enemy({
            id: `${name.toLowerCase().replace(/\s/g, '_')}_${Math.random().toString(36).substr(2, 9)}`,
            hp: stats.hp,
            atk: stats.atk,
            def: stats.def,
            goldReward: stats.goldReward,
            xpReward: stats.xpReward,
            name: `${affixLabel}${type === 'melee' ? '' : type + ' '}${name}`,
            spriteKey: spriteKey,
            zone: zone,
            type: type,
            isElite: isElite,
            affix: affix,
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
        if (this.scene) {
            this.scene.screenShake(6, 15);
            ParticleSystem.emitBossSpawn(enemy.x, enemy.y - 20);
        }
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
