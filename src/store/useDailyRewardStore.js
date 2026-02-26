import { create } from 'zustand';
import useResourceStore from './useResourceStore';
import useMetaStore from './useMetaStore';
import useToastStore from './useToastStore';

/**
 * 7-day daily reward cycle. Streak resets if a day is missed.
 * Rewards scale with generation for prestige players.
 */
const DAILY_REWARDS = [
    { day: 1, type: 'gold', amount: 100, label: '100 Gold',  icon: '\uD83E\uDE99' },
    { day: 2, type: 'gold', amount: 200, label: '200 Gold',  icon: '\uD83D\uDCB0' },
    { day: 3, type: 'gold', amount: 300, label: '300 Gold',  icon: '\uD83D\uDCB0' },
    { day: 4, type: 'material', material: 'scrap', amount: 10, label: '10 Scrap', icon: '\u2699\uFE0F' },
    { day: 5, type: 'gold', amount: 500, label: '500 Gold',  icon: '\uD83D\uDCB0' },
    { day: 6, type: 'material', material: 'essence', amount: 5, label: '5 Essence', icon: '\uD83D\uDD2E' },
    { day: 7, type: 'souls', amount: 10, label: '10 Souls',  icon: '\uD83D\uDC7B' },
];

function getDateKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const useDailyRewardStore = create((set, get) => ({
    streak: 0,            // Current streak day (0-6, maps to DAILY_REWARDS index)
    lastClaimDate: null,  // 'YYYY-MM-DD' of last claim
    showPopup: false,     // Whether to show the claim popup

    /** Check if a reward can be claimed today. */
    canClaim: () => {
        const { lastClaimDate } = get();
        const today = getDateKey();
        return lastClaimDate !== today;
    },

    /** Check if streak is broken (missed more than 1 day). */
    checkStreak: () => {
        const { lastClaimDate, streak } = get();
        if (!lastClaimDate) return; // First time, no streak to check

        const last = new Date(lastClaimDate + 'T00:00:00');
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));

        if (diffDays > 1) {
            // Missed a day — reset streak
            set({ streak: 0 });
        }
    },

    /** Claim today's reward. */
    claim: () => {
        const { canClaim, streak } = get();
        if (!canClaim()) return false;

        const reward = DAILY_REWARDS[streak % DAILY_REWARDS.length];
        const gen = useMetaStore.getState().generation || 1;
        const mult = 1 + (gen - 1) * 0.1; // +10% per generation

        // Grant reward
        if (reward.type === 'gold') {
            const goldAmt = Math.floor(reward.amount * mult);
            useResourceStore.getState().addGold(goldAmt);
            useToastStore.getState().addToast({
                type: 'daily',
                message: `Daily Reward: +${goldAmt} Gold!`,
                icon: reward.icon,
                color: '#f1c40f',
                duration: 4000,
            });
        } else if (reward.type === 'material') {
            const matAmt = Math.floor(reward.amount * mult);
            useResourceStore.getState().addMaterial(reward.material, matAmt);
            useToastStore.getState().addToast({
                type: 'daily',
                message: `Daily Reward: +${matAmt} ${reward.material}!`,
                icon: reward.icon,
                color: '#8e44ad',
                duration: 4000,
            });
        } else if (reward.type === 'souls') {
            const soulAmt = Math.floor(reward.amount * mult);
            useMetaStore.getState().addSouls(soulAmt);
            useToastStore.getState().addToast({
                type: 'daily',
                message: `Daily Reward: +${soulAmt} Souls!`,
                icon: reward.icon,
                color: '#9b59b6',
                duration: 4000,
            });
        }

        const nextStreak = (streak + 1) % DAILY_REWARDS.length;
        set({
            streak: nextStreak,
            lastClaimDate: getDateKey(),
            showPopup: false,
        });

        return true;
    },

    /** Called on game load to check and show popup. */
    onGameLoad: () => {
        get().checkStreak();
        if (get().canClaim()) {
            set({ showPopup: true });
        }
    },

    dismissPopup: () => set({ showPopup: false }),

    getRewards: () => DAILY_REWARDS,

    // Save/Load
    getSaveData: () => {
        const { streak, lastClaimDate } = get();
        return { streak, lastClaimDate };
    },
    loadSaveData: (data) => {
        if (!data) return;
        set({
            streak: data.streak || 0,
            lastClaimDate: data.lastClaimDate || null,
        });
    },
}));

export default useDailyRewardStore;
export { DAILY_REWARDS };
