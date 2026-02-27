import useGameStore from './useGameStore';
import useMetaStore from './useMetaStore';
import usePartyStore from './usePartyStore';
import useResourceStore from './useResourceStore';
import useInventoryStore from './useInventoryStore';
import useTutorialStore from './useTutorialStore';
import useAdStore from './useAdStore';
import useAchievementStore from './useAchievementStore';
import useDailyRewardStore from './useDailyRewardStore';
import useEventStore from './useEventStore';

const SAVE_KEY = 'idlesndragons_save';
const SAVE_INTERVAL = 30000; // 30 seconds
const CURRENT_VERSION = 3;
const MAX_OFFLINE_SECONDS = 86400; // 24 hours
const MAX_OFFLINE_GOLD = 100000;

function sanitizeNumber(val, fallback = 0, min = 0) {
    const n = Number(val);
    if (isNaN(n) || !isFinite(n)) return fallback;
    return Math.max(min, n);
}

class SaveSystem {
    constructor() {
        this.saveIntervalId = null;
        this.lastSaveTime = null;
        this._hardResetting = false;
        this._boundSave = () => this.save();
    }

    start() {
        // Load on start
        this.load();

        // Record save time
        this.lastSaveTime = Date.now();

        // Auto-save every 30 seconds
        this.saveIntervalId = setInterval(() => {
            this.save();
        }, SAVE_INTERVAL);

        // Save on page unload
        window.addEventListener('beforeunload', this._boundSave);
    }

    stop() {
        if (this.saveIntervalId) {
            clearInterval(this.saveIntervalId);
            this.saveIntervalId = null;
        }
        window.removeEventListener('beforeunload', this._boundSave);
    }

    save() {
        if (this._hardResetting) return;
        try {
            const data = {
                version: CURRENT_VERSION,
                timestamp: Date.now(),
                meta: {
                    souls: useMetaStore.getState().souls,
                    generation: useMetaStore.getState().generation,
                    upgrades: useMetaStore.getState().upgrades,
                    highestZone: useMetaStore.getState().highestZone,
                    totalKillsAllTime: useMetaStore.getState().totalKillsAllTime,
                    totalPlaytimeSeconds: useMetaStore.getState().totalPlaytimeSeconds,
                    ascensionTier: useMetaStore.getState().ascensionTier,
                    ascensionUnlocked: useMetaStore.getState().ascensionUnlocked,
                    skillTree: useMetaStore.getState().skillTree,
                },
                party: {
                    members: usePartyStore.getState().members,
                    gridSize: usePartyStore.getState().gridSize,
                },
                resources: {
                    gold: useResourceStore.getState().gold,
                    xp: useResourceStore.getState().xp,
                    materials: useResourceStore.getState().materials,
                },
                inventory: {
                    items: useInventoryStore.getState().items,
                },
                game: {
                    zone: useGameStore.getState().zone,
                    wave: useGameStore.getState().wave,
                    totalKills: useGameStore.getState().totalKills,
                    gameState: useGameStore.getState().gameState,
                },
                tutorial: useTutorialStore.getState().getSaveData(),
                ads: useAdStore.getState().getSaveData(),
                achievements: useAchievementStore.getState().getSaveData(),
                dailyRewards: useDailyRewardStore.getState().getSaveData(),
                events: useEventStore.getState().getSaveData(),
            };

            localStorage.setItem(SAVE_KEY, JSON.stringify(data));
            this.lastSaveTime = Date.now();
        } catch (e) {
            console.warn('Save failed:', e);
        }
    }

    migrate(data) {
        if (!data || !data.version) return null;

        // v1 -> v2: add new ad types (speed boost, soul double)
        if (data.version < 2) {
            data.ads = data.ads || {};
            data.ads.lastAdWatchTime = {
                gold: 0, reroll: 0, revive: 0, souls: 0, speed: 0, soulDouble: 0,
                ...(data.ads.lastAdWatchTime || {})
            };
            data.ads.speedBoostActive = false;
            data.ads.speedBoostEndTime = null;
            data.ads.soulDoubleActive = false;
            data.version = 2;
        }

        // v2 -> v3: ascension, skill tree, events
        if (data.version < 3) {
            data.meta = data.meta || {};
            data.meta.ascensionTier = data.meta.ascensionTier || 0;
            data.meta.ascensionUnlocked = data.meta.ascensionUnlocked || false;
            data.meta.skillTree = data.meta.skillTree || {};
            data.events = data.events || { eventsCompleted: 0, lastEventType: null, activeBuffs: { atkMult: 1, defMult: 1 } };
            data.version = 3;
        }

        return data;
    }

    load() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return null;

            let data = JSON.parse(raw);
            if (!data || !data.version || data.version < 1) return null;

            // Run migrations
            data = this.migrate(data);
            if (!data) return null;

            // Restore Meta
            try {
                if (data.meta) {
                    useMetaStore.setState({
                        souls: sanitizeNumber(data.meta.souls, 0),
                        generation: sanitizeNumber(data.meta.generation, 1, 1),
                        upgrades: { ...useMetaStore.getState().upgrades, ...data.meta.upgrades },
                        highestZone: sanitizeNumber(data.meta.highestZone, 1, 1),
                        totalKillsAllTime: sanitizeNumber(data.meta.totalKillsAllTime, 0),
                        totalPlaytimeSeconds: sanitizeNumber(data.meta.totalPlaytimeSeconds, 0),
                        ascensionTier: sanitizeNumber(data.meta.ascensionTier, 0),
                        ascensionUnlocked: !!data.meta.ascensionUnlocked,
                        skillTree: data.meta.skillTree || {},
                    });
                }
            } catch (e) { console.warn('Failed to restore meta:', e); }

            // Restore Party
            try {
                if (data.party) {
                    const gridUpgrade = data.meta?.upgrades?.gridSize || 0;
                    const computedSize = 3 + gridUpgrade;
                    const savedGrid = data.party.gridSize || { width: computedSize, height: computedSize };

                    usePartyStore.setState({
                        members: data.party.members || [],
                        gridSize: savedGrid,
                    });
                }
            } catch (e) { console.warn('Failed to restore party:', e); }

            // Restore Resources
            try {
                if (data.resources) {
                    useResourceStore.setState({
                        gold: sanitizeNumber(data.resources.gold, 0),
                        xp: sanitizeNumber(data.resources.xp, 0),
                        materials: data.resources.materials || {},
                    });
                }
            } catch (e) { console.warn('Failed to restore resources:', e); }

            // Restore Inventory
            try {
                if (data.inventory) {
                    useInventoryStore.setState({
                        items: data.inventory.items || [],
                    });
                }
            } catch (e) { console.warn('Failed to restore inventory:', e); }

            // Restore Game State (always start in MENU on reload)
            try {
                if (data.game) {
                    useGameStore.setState({
                        zone: sanitizeNumber(data.game.zone, 1, 1),
                        wave: sanitizeNumber(data.game.wave, 1, 1),
                        totalKills: sanitizeNumber(data.game.totalKills, 0),
                        gameState: 'MENU',
                        isRunning: false,
                    });
                }
            } catch (e) { console.warn('Failed to restore game state:', e); }

            // Calculate offline earnings
            if (data.timestamp) {
                const elapsed = (Date.now() - data.timestamp) / 1000;
                if (elapsed > 60) {
                    this.applyOfflineEarnings(elapsed, data);
                }
            }

            // Restore Tutorial state
            try {
                if (data.tutorial) useTutorialStore.getState().loadSaveData(data.tutorial);
            } catch (e) { console.warn('Failed to restore tutorial:', e); }

            // Restore Ad/Boost state
            try {
                if (data.ads) useAdStore.getState().loadSaveData(data.ads);
            } catch (e) { console.warn('Failed to restore ads:', e); }

            // Restore Achievements
            try {
                if (data.achievements) useAchievementStore.getState().loadSaveData(data.achievements);
            } catch (e) { console.warn('Failed to restore achievements:', e); }

            // Restore Daily Rewards
            try {
                if (data.dailyRewards) useDailyRewardStore.getState().loadSaveData(data.dailyRewards);
            } catch (e) { console.warn('Failed to restore daily rewards:', e); }

            // Restore Events
            try {
                if (data.events) useEventStore.getState().loadSaveData(data.events);
            } catch (e) { console.warn('Failed to restore events:', e); }

            // Check daily reward availability
            try {
                useDailyRewardStore.getState().onGameLoad();
            } catch (e) { console.warn('Failed to check daily rewards:', e); }

            return data;

        } catch (e) {
            console.warn('Load failed:', e);
            return null;
        }
    }

    applyOfflineEarnings(elapsedSeconds, data) {
        const cappedElapsed = Math.min(elapsedSeconds, MAX_OFFLINE_SECONDS);
        const zone = sanitizeNumber(data.game?.zone, 1, 1);
        const partySize = sanitizeNumber(data.party?.members?.length, 0);

        if (partySize === 0) return;

        const goldPerSecond = zone * 2 * partySize * 0.5;
        const offlineGold = Math.min(Math.floor(goldPerSecond * cappedElapsed), MAX_OFFLINE_GOLD);

        if (offlineGold > 0) {
            useResourceStore.getState().addGold(offlineGold);

            this.offlineSummary = {
                elapsed: cappedElapsed,
                goldEarned: offlineGold,
            };
        }
    }

    getOfflineSummary() {
        const summary = this.offlineSummary;
        this.offlineSummary = null;
        return summary;
    }

    clearSave() {
        localStorage.removeItem(SAVE_KEY);
    }

    hardReset() {
        useGameStore.getState().showConfirm({
            title: 'Hard Reset?',
            message: 'Are you sure you want to completely restart? All progress including meta-progression will be lost.',
            isDanger: true,
            confirmText: 'NUKE IT',
            onConfirm: () => {
                this._hardResetting = true;
                this.stop();
                this.clearSave();
                window.location.reload();
            }
        });
    }
}

export default new SaveSystem();
