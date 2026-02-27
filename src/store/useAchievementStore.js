import { create } from 'zustand';
import useToastStore from './useToastStore';
import AudioManager from '../audio/AudioManager';
import CrazyGamesSDK from '../platform/CrazyGames';

/**
 * Achievement definitions. 20 achievements across 4 categories.
 * Each has a check function that receives the game state snapshot.
 */
const ACHIEVEMENTS = [
    // --- Combat ---
    { id: 'first_blood', name: 'First Blood', desc: 'Kill your first enemy.', category: 'Combat', icon: '\u2694\uFE0F', soulReward: 2, check: (s) => s.totalKillsAllTime >= 1 },
    { id: 'centurion', name: 'Centurion', desc: 'Kill 100 enemies total.', category: 'Combat', icon: '\uD83D\uDDE1\uFE0F', soulReward: 5, check: (s) => s.totalKillsAllTime >= 100 },
    { id: 'slayer', name: 'Slayer', desc: 'Kill 500 enemies total.', category: 'Combat', icon: '\uD83D\uDC80', soulReward: 15, check: (s) => s.totalKillsAllTime >= 500 },
    { id: 'genocide', name: 'Exterminator', desc: 'Kill 2000 enemies total.', category: 'Combat', icon: '\uD83D\uDD25', soulReward: 30, check: (s) => s.totalKillsAllTime >= 2000 },
    { id: 'boss_slayer', name: 'Boss Slayer', desc: 'Defeat a boss.', category: 'Combat', icon: '\uD83D\uDC32', soulReward: 5, check: (s) => s.highestZone >= 2 },

    // --- Economy ---
    { id: 'pocket_change', name: 'Pocket Change', desc: 'Earn 500 gold total.', category: 'Economy', icon: '\uD83E\uDE99', soulReward: 3, check: (s) => s.totalGoldEarned >= 500 },
    { id: 'wealthy', name: 'Wealthy', desc: 'Earn 5000 gold total.', category: 'Economy', icon: '\uD83D\uDCB0', soulReward: 10, check: (s) => s.totalGoldEarned >= 5000 },
    { id: 'item_collector', name: 'Collector', desc: 'Find 20 items.', category: 'Economy', icon: '\uD83C\uDF81', soulReward: 5, check: (s) => s.totalItemsFound >= 20 },
    { id: 'hoarder', name: 'Hoarder', desc: 'Find 100 items.', category: 'Economy', icon: '\uD83D\uDCE6', soulReward: 15, check: (s) => s.totalItemsFound >= 100 },
    { id: 'legendary_find', name: 'Legendary Find', desc: 'Find a Legendary item.', category: 'Economy', icon: '\u2B50', soulReward: 20, check: (s) => s.legendariesFound >= 1 },

    // --- Prestige ---
    { id: 'first_tpk', name: 'Total Party Kill', desc: 'Prestige for the first time.', category: 'Prestige', icon: '\uD83D\uDD04', soulReward: 5, check: (s) => s.generation >= 2 },
    { id: 'reborn', name: 'Reborn', desc: 'Reach Generation 5.', category: 'Prestige', icon: '\u2728', soulReward: 15, check: (s) => s.generation >= 5 },
    { id: 'eternal', name: 'Eternal', desc: 'Reach Generation 10.', category: 'Prestige', icon: '\uD83C\uDF1F', soulReward: 30, check: (s) => s.generation >= 10 },
    { id: 'soul_collector', name: 'Soul Collector', desc: 'Accumulate 100 souls.', category: 'Prestige', icon: '\uD83D\uDC7B', soulReward: 10, check: (s) => s.totalSoulsEarned >= 100 },
    { id: 'ascendant', name: 'Ascendant', desc: 'Accumulate 500 souls.', category: 'Prestige', icon: '\uD83D\uDE07', soulReward: 25, check: (s) => s.totalSoulsEarned >= 500 },

    // --- Exploration ---
    { id: 'zone_3', name: 'Explorer', desc: 'Reach Zone 3.', category: 'Exploration', icon: '\uD83D\uDDFA\uFE0F', soulReward: 3, check: (s) => s.highestZone >= 3 },
    { id: 'zone_5', name: 'Adventurer', desc: 'Reach Zone 5.', category: 'Exploration', icon: '\u26F0\uFE0F', soulReward: 8, check: (s) => s.highestZone >= 5 },
    { id: 'zone_10', name: 'Veteran', desc: 'Reach Zone 10.', category: 'Exploration', icon: '\uD83C\uDFF0', soulReward: 20, check: (s) => s.highestZone >= 10 },
    { id: 'zone_15', name: 'Champion', desc: 'Reach Zone 15.', category: 'Exploration', icon: '\uD83D\uDC51', soulReward: 35, check: (s) => s.highestZone >= 15 },
    { id: 'full_party', name: 'Full House', desc: 'Have 5 heroes in your party.', category: 'Exploration', icon: '\uD83D\uDC65', soulReward: 5, check: (s) => s.partySize >= 5 },
];

const useAchievementStore = create((set, get) => ({
    unlocked: {}, // { [id]: timestamp }

    // Tracking counters (persisted)
    totalGoldEarned: 0,
    totalItemsFound: 0,
    legendariesFound: 0,
    totalSoulsEarned: 0,

    // Increment trackers
    trackGold: (amount) => set((state) => ({ totalGoldEarned: state.totalGoldEarned + amount })),
    trackItem: (rarity) => set((state) => ({
        totalItemsFound: state.totalItemsFound + 1,
        legendariesFound: state.legendariesFound + (rarity === 'Legendary' ? 1 : 0),
    })),
    trackSouls: (amount) => set((state) => ({ totalSoulsEarned: state.totalSoulsEarned + amount })),

    /**
     * Check all achievements against current state.
     * Call this periodically (every few seconds, on TPK, on zone advance, etc.).
     */
    checkAll: (gameSnapshot) => {
        const { unlocked } = get();
        const newlyUnlocked = [];

        for (const ach of ACHIEVEMENTS) {
            if (unlocked[ach.id]) continue; // Already earned
            if (ach.check(gameSnapshot)) {
                newlyUnlocked.push(ach);
            }
        }

        if (newlyUnlocked.length > 0) {
            set((state) => {
                const updated = { ...state.unlocked };
                for (const ach of newlyUnlocked) {
                    updated[ach.id] = Date.now();
                }
                return { unlocked: updated };
            });

            CrazyGamesSDK.happytime();

            // Toast + audio for each
            for (const ach of newlyUnlocked) {
                useToastStore.getState().addToast({
                    type: 'achievement',
                    message: `Achievement: ${ach.name}`,
                    icon: ach.icon,
                    color: '#f1c40f',
                    duration: 5000,
                });
                AudioManager.playSFX('wave_clear'); // Reuse existing jingle
            }
        }

        return newlyUnlocked;
    },

    getAll: () => ACHIEVEMENTS,
    getUnlockedCount: () => Object.keys(get().unlocked).length,
    getTotalCount: () => ACHIEVEMENTS.length,

    // Save/Load
    getSaveData: () => {
        const { unlocked, totalGoldEarned, totalItemsFound, legendariesFound, totalSoulsEarned } = get();
        return { unlocked, totalGoldEarned, totalItemsFound, legendariesFound, totalSoulsEarned };
    },
    loadSaveData: (data) => {
        if (!data) return;
        set({
            unlocked: data.unlocked || {},
            totalGoldEarned: data.totalGoldEarned || 0,
            totalItemsFound: data.totalItemsFound || 0,
            legendariesFound: data.legendariesFound || 0,
            totalSoulsEarned: data.totalSoulsEarned || 0,
        });
    },
}));

export default useAchievementStore;
export { ACHIEVEMENTS };
