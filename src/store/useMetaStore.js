import { create } from 'zustand';
import useGameStore from './useGameStore';
import useResourceStore from './useResourceStore';
import usePartyStore from './usePartyStore';
import useRecruitmentStore from './useRecruitmentStore';
import useInventoryStore from './useInventoryStore';
import useAchievementStore from './useAchievementStore';
import useAdStore from './useAdStore';
import useEventStore from './useEventStore';
import useAnalyticsStore from './useAnalyticsStore';
import EncounterManager from '../game/systems/EncounterManager';
import CrazyGamesSDK from '../platform/CrazyGames';

// ── Skill Tree (Phase 5) ──
const SKILL_TREE = {
    autoEquip: {
        name: 'Auto-Equip Best',
        description: 'Automatically equip highest-stat gear on each hero.',
        baseCost: 15, maxLevel: 1, tier: 1, prereqs: [],
    },
    luckyLoot: {
        name: 'Lucky Loot',
        description: '+5% loot drop chance per level.',
        baseCost: 10, costMult: 2, maxLevel: 5, tier: 1, prereqs: [],
    },
    goldInterest: {
        name: 'Gold Interest',
        description: 'Earn 2% interest on gold every zone clear, per level.',
        baseCost: 20, costMult: 2.5, maxLevel: 3, tier: 1, prereqs: [],
    },
    partySizePlus: {
        name: 'Party Size +1',
        description: 'Add one extra row to the formation grid.',
        baseCost: 50, maxLevel: 1, tier: 2, prereqs: ['autoEquip', 'luckyLoot'],
    },
    startingSkills: {
        name: 'Starting Skills',
        description: 'Heroes start with skills ready at zone 1.',
        baseCost: 40, maxLevel: 1, tier: 2, prereqs: ['luckyLoot', 'goldInterest'],
    },
};

const UPGRADES = {
    gridSize: {
        name: 'Expand Territory',
        baseCost: 10,
        costMult: 5,
        maxLevel: 2,
        description: 'Increases grid size (+1 row & col).'
    },
    startGold: {
        name: 'Inheritance',
        baseCost: 5,
        costMult: 2,
        maxLevel: 10,
        description: 'Start with +100 gold per level.'
    },
    xpGain: {
        name: 'Ancient Wisdom',
        baseCost: 5,
        costMult: 2,
        maxLevel: 10,
        description: '+25% XP gain per level.'
    },
    goldGain: {
        name: 'Dragon Hoard',
        baseCost: 8,
        costMult: 2.5,
        maxLevel: 10,
        description: '+25% gold gain per level.'
    },
    soulGain: {
        name: 'Soul Siphon',
        baseCost: 15,
        costMult: 3,
        maxLevel: 10,
        description: '+20% souls from TPK per level.'
    },
    startingZone: {
        name: 'Dimensional Rift',
        baseCost: 50,
        costMult: 4,
        maxLevel: 5,
        description: 'Start adventure at a higher zone.'
    }
};

const useMetaStore = create((set, get) => ({
    souls: 0,
    generation: 1,
    upgrades: {
        gridSize: 0,
        startGold: 0,
        xpGain: 0,
        goldGain: 0,
        soulGain: 0,
        startingZone: 0,
    },

    // Ascension (Phase 5)
    ascensionTier: 0,
    ascensionUnlocked: false,

    // Skill Tree (Phase 5)
    skillTree: {},

    // Statistics
    highestZone: 1,
    totalKillsAllTime: 0,
    totalPlaytimeSeconds: 0,

    addSouls: (amount) => set((state) => ({ souls: state.souls + amount })),
    removeSouls: (amount) => set((state) => ({ souls: Math.max(0, state.souls - amount) })),

    updateStats: (zone, kills) => set((state) => ({
        highestZone: Math.max(state.highestZone, zone),
        totalKillsAllTime: state.totalKillsAllTime + kills,
    })),

    addPlaytime: (seconds) => set((state) => ({
        totalPlaytimeSeconds: state.totalPlaytimeSeconds + seconds,
    })),

    // Grant starter souls if Gen 1 and poor
    checkStarterSouls: () => {
        set((state) => {
            if (state.generation === 1 && state.souls < 100) {
                return { souls: 100 };
            }
            return {};
        });
    },

    getUpgradeCost: (id) => {
        const { upgrades } = get();
        const level = upgrades[id] || 0;
        const upgrade = UPGRADES[id];
        if (!upgrade) return Infinity;
        if (level >= upgrade.maxLevel) return Infinity;
        return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMult, level));
    },

    buyUpgrade: (id) => {
        const { souls, getUpgradeCost } = get();
        const cost = getUpgradeCost(id);

        if (souls >= cost) {
            set((state) => {
                const newLevel = (state.upgrades[id] || 0) + 1;

                // Apply immediate effects
                if (id === 'gridSize') {
                    const size = 3 + newLevel;
                    usePartyStore.setState({ gridSize: { width: size, height: size } });
                }

                return {
                    souls: state.souls - cost,
                    upgrades: { ...state.upgrades, [id]: newLevel }
                };
            });
            return true;
        }
        return false;
    },

    // ── Ascension ──
    getAscensionDifficultyMult: () => Math.pow(1.5, get().ascensionTier),
    getAscensionSoulMult: () => 1 + get().ascensionTier * 0.5,

    ascend: () => {
        const { zone } = useGameStore.getState();
        if (zone < 20 || !get().ascensionUnlocked) return;
        set((s) => ({ ascensionTier: s.ascensionTier + 1 }));
        get().triggerTPK();
    },

    // ── Skill Tree ──
    getSkillTreeNodeCost: (id) => {
        const node = SKILL_TREE[id];
        if (!node) return Infinity;
        const level = get().skillTree[id] || 0;
        if (level >= node.maxLevel) return Infinity;
        return Math.floor(node.baseCost * Math.pow(node.costMult || 1, level));
    },

    buySkillTreeNode: (id) => {
        const node = SKILL_TREE[id];
        if (!node) return false;
        const { souls, skillTree } = get();
        const level = skillTree[id] || 0;
        if (level >= node.maxLevel) return false;
        // Check prereqs
        for (const prereq of node.prereqs) {
            if ((skillTree[prereq] || 0) < 1) return false;
        }
        const cost = get().getSkillTreeNodeCost(id);
        if (souls < cost) return false;
        set((s) => ({
            souls: s.souls - cost,
            skillTree: { ...s.skillTree, [id]: (s.skillTree[id] || 0) + 1 },
        }));
        // Party Size +1: apply immediately
        if (id === 'partySizePlus') {
            const currentGrid = usePartyStore.getState().gridSize;
            usePartyStore.setState({ gridSize: { width: currentGrid.width, height: currentGrid.height + 1 } });
        }
        return true;
    },

    hasSkillTreeNode: (id) => (get().skillTree[id] || 0) >= 1,

    getSkillTreeEffect: (id) => {
        const node = SKILL_TREE[id];
        if (!node) return 0;
        const level = get().skillTree[id] || 0;
        if (id === 'luckyLoot') return level * 0.05;
        if (id === 'goldInterest') return level * 0.02;
        return level;
    },

    triggerTPK: () => {
        // Calculate souls based on zone reached (zone^2 * 2)
        const { zone, totalKills } = useGameStore.getState();
        const { upgrades } = get();
        const soulMult = 1 + (upgrades.soulGain || 0) * 0.2;
        const baseSouls = Math.floor(zone * zone * 2);
        let pendingSouls = Math.floor(baseSouls * soulMult);

        // Double souls if ad boost active
        const adStore = useAdStore.getState();
        if (adStore.soulDoubleActive) {
            pendingSouls *= 2;
            useAdStore.setState({ soulDoubleActive: false });
        }

        // Ascension soul bonus
        const ascSoulMult = get().getAscensionSoulMult();
        pendingSouls = Math.floor(pendingSouls * ascSoulMult);

        // Track TPK in analytics
        useAnalyticsStore.getState().trackTPK(zone);

        // Update stats before reset
        get().updateStats(zone, totalKills);

        // Unlock ascension if reached Zone 20+
        if (Math.max(get().highestZone, zone) >= 20 && !get().ascensionUnlocked) {
            set({ ascensionUnlocked: true });
        }

        // Submit highest zone to leaderboard
        const newHighest = Math.max(get().highestZone, zone);
        CrazyGamesSDK.submitScore(newHighest);

        set((state) => ({
            souls: state.souls + pendingSouls,
            generation: state.generation + 1
        }));

        // Track souls for achievements
        useAchievementStore.getState().trackSouls(pendingSouls);

        // Reset Game
        useGameStore.getState().resetGame();
        usePartyStore.getState().reset();
        useResourceStore.getState().reset();
        useRecruitmentStore.getState().reset();

        // Clear enemies from scene
        EncounterManager.reset();

        // Clear inventory
        useInventoryStore.getState().reset();

        // Clear event buffs
        useEventStore.getState().reset();

        // Generate fresh recruitment candidates
        useRecruitmentStore.getState().generateCandidates();

        // Apply Meta Bonuses
        const { upgrades: currentUpgrades } = get();

        // Start Gold
        const startGold = currentUpgrades.startGold * 100;
        useResourceStore.setState({ gold: startGold });

        // Grid Size (+ skill tree bonus)
        const size = 3 + currentUpgrades.gridSize;
        const extraRows = get().skillTree.partySizePlus || 0;
        usePartyStore.setState({ gridSize: { width: size, height: size + extraRows } });

        // Starting Zone
        if (currentUpgrades.startingZone > 0) {
            useGameStore.setState({ zone: 1 + currentUpgrades.startingZone });
        }

        return pendingSouls;
    },

    // Calculate pending souls for display
    getPendingSouls: () => {
        const { zone } = useGameStore.getState();
        const { upgrades } = get();
        const soulMult = 1 + (upgrades.soulGain || 0) * 0.2;
        const ascMult = get().getAscensionSoulMult();
        let souls = Math.floor(zone * zone * 2 * soulMult * ascMult);
        if (useAdStore.getState().soulDoubleActive) {
            souls *= 2;
        }
        return souls;
    },
}));

export default useMetaStore;
export { UPGRADES, SKILL_TREE };
