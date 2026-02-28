import { create } from 'zustand';
import CrazyGamesSDK from '../platform/CrazyGames';
import AudioManager from '../audio/AudioManager';
import useToastStore from './useToastStore';
import useGameStore from './useGameStore';
import useAnalyticsStore from './useAnalyticsStore';

const AD_COOLDOWN = 180000; // 3 minutes in ms
const GOLD_BOOST_DURATION = 300000; // 5 minutes in ms
const SPEED_BOOST_DURATION = 120000; // 2 minutes in ms

const useAdStore = create((set, get) => ({
    goldBoostActive: false,
    goldBoostEndTime: null,
    speedBoostActive: false,
    speedBoostEndTime: null,
    soulDoubleActive: false,

    // Cooldown tracking per ad type
    lastAdWatchTime: {
        gold: 0,
        reroll: 0,
        revive: 0,
        souls: 0,
        speed: 0,
        soulDouble: 0
    },

    isAdPlaying: false,

    // Actions
    watchAd: (type, onReward) => {
        const state = get();
        const now = Date.now();
        const lastWatch = state.lastAdWatchTime[type] || 0;

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
                useAnalyticsStore.getState().trackAdWatch(type);
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

    activateSpeedBoost: () => {
        const now = Date.now();
        // Save current user-selected speed before overriding to 5x
        const gameStore = useGameStore.getState();
        const prevSpeed = gameStore.timeMultiplier < 5 ? gameStore.timeMultiplier : gameStore.previousTimeMultiplier;
        set({
            speedBoostActive: true,
            speedBoostEndTime: now + SPEED_BOOST_DURATION
        });

        useGameStore.setState({ previousTimeMultiplier: prevSpeed, timeMultiplier: 5 });

        useToastStore.getState().addToast({
            type: 'buff',
            message: '5x Speed Boost Active!',
            icon: '⚡',
            color: '#e67e22'
        });
    },

    activateSoulDouble: () => {
        set({ soulDoubleActive: true });
        useToastStore.getState().addToast({
            type: 'buff',
            message: 'Next TPK: 2x Souls!',
            icon: '👻',
            color: '#8e44ad'
        });
    },

    // Call this periodically or on load to update state
    checkBoosts: () => {
        const { goldBoostActive, goldBoostEndTime, speedBoostActive, speedBoostEndTime } = get();
        const now = Date.now();

        if (goldBoostActive && goldBoostEndTime && now > goldBoostEndTime) {
            set({ goldBoostActive: false, goldBoostEndTime: null });
            useToastStore.getState().addToast({
                type: 'info',
                message: 'Gold Boost Expired',
                icon: '📉',
                color: '#95a5a6'
            });
        }

        if (speedBoostActive && speedBoostEndTime && now > speedBoostEndTime) {
            set({ speedBoostActive: false, speedBoostEndTime: null });

            const prevSpeed = useGameStore.getState().previousTimeMultiplier || 1;
            useGameStore.getState().setTimeMultiplier(prevSpeed);

            useToastStore.getState().addToast({
                type: 'info',
                message: 'Speed Boost Expired',
                icon: '🐌',
                color: '#95a5a6'
            });
        }
    },

    // Save/Load helpers
    getSaveData: () => {
        const { goldBoostActive, goldBoostEndTime, speedBoostActive, speedBoostEndTime, soulDoubleActive, lastAdWatchTime } = get();
        return { goldBoostActive, goldBoostEndTime, speedBoostActive, speedBoostEndTime, soulDoubleActive, lastAdWatchTime };
    },

    loadSaveData: (data) => {
        if (!data) return;
        set({
            goldBoostActive: data.goldBoostActive || false,
            goldBoostEndTime: data.goldBoostEndTime || null,
            speedBoostActive: data.speedBoostActive || false,
            speedBoostEndTime: data.speedBoostEndTime || null,
            soulDoubleActive: data.soulDoubleActive || false,
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

    getSpeedBoostTimeRemaining: () => {
        const { speedBoostEndTime } = get();
        if (!speedBoostEndTime) return 0;
        return Math.max(0, speedBoostEndTime - Date.now());
    },

    getCooldownRemaining: (type) => {
        const last = get().lastAdWatchTime[type] || 0;
        const now = Date.now();
        return Math.max(0, AD_COOLDOWN - (now - last));
    }
}));

export default useAdStore;
