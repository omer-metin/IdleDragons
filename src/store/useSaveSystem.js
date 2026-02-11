import useGameStore from './useGameStore';
import useMetaStore from './useMetaStore';
import usePartyStore from './usePartyStore';
import useResourceStore from './useResourceStore';
import useInventoryStore from './useInventoryStore';

const SAVE_KEY = 'idlesndragons_save';
const SAVE_INTERVAL = 30000; // 30 seconds

class SaveSystem {
    constructor() {
        this.saveIntervalId = null;
        this.lastSaveTime = null;
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
        window.addEventListener('beforeunload', () => this.save());
    }

    stop() {
        if (this.saveIntervalId) {
            clearInterval(this.saveIntervalId);
            this.saveIntervalId = null;
        }
    }

    save() {
        try {
            const data = {
                version: 1,
                timestamp: Date.now(),
                meta: {
                    souls: useMetaStore.getState().souls,
                    generation: useMetaStore.getState().generation,
                    upgrades: useMetaStore.getState().upgrades,
                    highestZone: useMetaStore.getState().highestZone,
                    totalKillsAllTime: useMetaStore.getState().totalKillsAllTime,
                    totalPlaytimeSeconds: useMetaStore.getState().totalPlaytimeSeconds,
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
            };

            localStorage.setItem(SAVE_KEY, JSON.stringify(data));
            this.lastSaveTime = Date.now();
        } catch (e) {
            console.warn('Save failed:', e);
        }
    }

    load() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (!raw) return null;

            const data = JSON.parse(raw);
            if (!data || data.version !== 1) return null;

            // Restore Meta
            if (data.meta) {
                useMetaStore.setState({
                    souls: data.meta.souls || 0,
                    generation: data.meta.generation || 1,
                    upgrades: { ...useMetaStore.getState().upgrades, ...data.meta.upgrades },
                    highestZone: data.meta.highestZone || 1,
                    totalKillsAllTime: data.meta.totalKillsAllTime || 0,
                    totalPlaytimeSeconds: data.meta.totalPlaytimeSeconds || 0,
                });
            }

            // Restore Party
            if (data.party) {
                usePartyStore.setState({
                    members: data.party.members || [],
                    gridSize: data.party.gridSize || { width: 3, height: 3 },
                });
            }

            // Restore Resources
            if (data.resources) {
                useResourceStore.setState({
                    gold: data.resources.gold || 0,
                    xp: data.resources.xp || 0,
                    materials: data.resources.materials || {},
                });
            }

            // Restore Inventory
            if (data.inventory) {
                useInventoryStore.setState({
                    items: data.inventory.items || [],
                });
            }

            // Restore Game State (always start in LOBBY on reload)
            if (data.game) {
                useGameStore.setState({
                    zone: data.game.zone || 1,
                    wave: data.game.wave || 1,
                    totalKills: data.game.totalKills || 0,
                    gameState: 'LOBBY',
                    isRunning: false,
                });
            }

            // Calculate offline earnings
            if (data.timestamp) {
                const elapsed = (Date.now() - data.timestamp) / 1000; // seconds
                if (elapsed > 60) { // At least 1 minute away
                    this.applyOfflineEarnings(elapsed, data);
                }
            }

            return data;

        } catch (e) {
            console.warn('Load failed:', e);
            return null;
        }
    }

    applyOfflineEarnings(elapsedSeconds, data) {
        // Simple offline earnings: gold based on zone
        const zone = data.game?.zone || 1;
        const partySize = data.party?.members?.length || 0;

        if (partySize === 0) return;

        // Offline rate: zone * 2 gold per second * 50% efficiency
        const goldPerSecond = zone * 2 * partySize * 0.5;
        const offlineGold = Math.floor(goldPerSecond * elapsedSeconds);

        if (offlineGold > 0) {
            useResourceStore.getState().addGold(offlineGold);

            // Store offline summary for display
            this.offlineSummary = {
                elapsed: elapsedSeconds,
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
}

export default new SaveSystem();
