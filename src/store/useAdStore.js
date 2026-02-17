import { create } from 'zustand';
import CrazyGamesSDK from '../platform/CrazyGames';
import AudioManager from '../audio/AudioManager';
import useToastStore from './useToastStore';

const AD_COOLDOWN = 180000; // 3 minutes in ms
const GOLD_BOOST_DURATION = 300000; // 5 minutes in ms

const useAdStore = create((set, get) => ({
    goldBoostActive: false,
    goldBoostEndTime: null,

    // Cooldown tracking per ad type
    lastAdWatchTime: {
        gold: 0,
        reroll: 0,
        revive: 0,
        souls: 0
    },

    isAdPlaying: false,

    // Actions
    watchAd: (type, onReward) => {
        const state = get();
        const now = Date.now();
        const lastWatch = state.lastAdWatchTime[type] || 0;

        // Check Cooldown (except for Revive? usually revive has limit but maybe no cooldown if you die fast? Let's generic cooldown)
        // Revive might be special (limited per run). Reroll might be spammy so cooldown is good.
        if (now - lastWatch < AD_COOLDOWN) {
            const remaining = Math.ceil((AD_COOLDOWN - (now - lastWatch)) / 1000);
            useToastStore.getState().addToast({
                type: 'error',
                message: `Ad cooldown: ${remaining}s`,
                icon: '⏳',
                color: '#e74c3c'
            });
            return;
        }

        set({ isAdPlaying: true });

        CrazyGamesSDK.showRewardedAd(
            () => {
                // Success
                set((prev) => ({
                    isAdPlaying: false,
                    lastAdWatchTime: { ...prev.lastAdWatchTime, [type]: Date.now() }
                }));
                if (onReward) onReward();
            },
            (error) => {
                // Error
                set({ isAdPlaying: false });
                useToastStore.getState().addToast({
                    type: 'error',
                    message: 'Ad failed to load',
                    icon: '❌',
                    color: '#e74c3c'
                });
            }
        );
    },

    activateGoldBoost: () => {
        const now = Date.now();
        set({
            goldBoostActive: true,
            goldBoostEndTime: now + GOLD_BOOST_DURATION
        });

        useToastStore.getState().addToast({
            type: 'buff',
            message: '2x Gold Boost Active!',
            icon: '💰',
            color: '#f1c40f'
        });
    },

    // Call this periodically or on load to update state
    checkBoosts: () => {
        const { goldBoostActive, goldBoostEndTime } = get();
        if (goldBoostActive && goldBoostEndTime && Date.now() > goldBoostEndTime) {
            set({ goldBoostActive: false, goldBoostEndTime: null });
            useToastStore.getState().addToast({
                type: 'info',
                message: 'Gold Boost Expired',
                icon: '📉',
                color: '#95a5a6'
            });
        }
    },

    // Save/Load helpers
    getSaveData: () => {
        const { goldBoostActive, goldBoostEndTime, lastAdWatchTime } = get();
        return { goldBoostActive, goldBoostEndTime, lastAdWatchTime };
    },

    loadSaveData: (data) => {
        if (!data) return;
        set({
            goldBoostActive: data.goldBoostActive || false,
            goldBoostEndTime: data.goldBoostEndTime || null,
            lastAdWatchTime: { ...get().lastAdWatchTime, ...(data.lastAdWatchTime || {}) }
        });
        // Immediately check expiry on load
        get().checkBoosts();
    },

    // For timer display
    getBoostTimeRemaining: () => {
        const { goldBoostEndTime } = get();
        if (!goldBoostEndTime) return 0;
        return Math.max(0, goldBoostEndTime - Date.now());
    },

    getCooldownRemaining: (type) => {
        const last = get().lastAdWatchTime[type] || 0;
        const now = Date.now();
        return Math.max(0, AD_COOLDOWN - (now - last));
    }
}));

export default useAdStore;
