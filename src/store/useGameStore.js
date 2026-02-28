import { create } from 'zustand';
import CrazyGamesSDK from '../platform/CrazyGames';
import useAnalyticsStore from './useAnalyticsStore';

const useGameStore = create((set, get) => ({
    gameState: 'MENU', // 'MENU', 'LOBBY', 'RUNNING', 'PAUSED', 'GAMEOVER'
    isRunning: false,
    timeMultiplier: 1.0,
    previousTimeMultiplier: 1,
    score: 0,
    distance: 0,

    // Zone/Wave progression
    zone: 1,
    wave: 1,
    wavesPerZone: 10,
    enemiesPerWave: 3,
    enemiesKilledThisWave: 0,
    totalKills: 0,
    retriesUsedThisZone: 0,

    activePanel: null,
    selectedGridSlot: null,

    // Zone theme for UI color-grading (set by AdventureScene on tier change)
    currentZoneTheme: null,

    enterMenu: () => set({ gameState: 'MENU', isRunning: false, activePanel: null }),
    startGame: () => set({ gameState: 'LOBBY', isRunning: false }), // Menu -> Lobby
    startAdventure: () => {
        useAnalyticsStore.getState().startRun();
        return set({ gameState: 'RUNNING', isRunning: true });
    }, // Lobby -> Adventure
    endGame: () => set({ gameState: 'GAMEOVER', isRunning: false }),

    togglePause: () => set((state) => {
        if (state.gameState === 'RUNNING') return { gameState: 'PAUSED', isRunning: false };
        if (state.gameState === 'PAUSED') return { gameState: 'RUNNING', isRunning: true };
        return {};
    }),

    setTimeMultiplier: (multiplier) => {
        const clamped = Math.min(multiplier, 5);
        // When user picks a non-boost speed (1-3x), remember it for boost expiry revert
        if (clamped < 5) {
            set({ timeMultiplier: clamped, previousTimeMultiplier: clamped });
        } else {
            set({ timeMultiplier: clamped });
        }
    },

    incrementDistance: (amount) => set((state) => {
        if (state.gameState !== 'RUNNING') return {};
        return {
            distance: state.distance + amount,
            score: state.zone * 100 + state.wave * 10
        };
    }),

    addKill: () => set((state) => {
        const newKilled = state.enemiesKilledThisWave + 1;
        return {
            totalKills: state.totalKills + 1,
            enemiesKilledThisWave: newKilled,
        };
    }),

    // Check if wave is cleared
    isWaveCleared: () => {
        const { enemiesKilledThisWave, enemiesPerWave, wave, wavesPerZone } = get();
        const isBossWave = wave === wavesPerZone;
        const requiredKills = isBossWave ? 1 : enemiesPerWave;
        return enemiesKilledThisWave >= requiredKills;
    },

    // Boss wave = last wave of each zone
    isBossWave: () => {
        const { wave, wavesPerZone } = get();
        return wave === wavesPerZone;
    },

    advanceWave: () => {
        const state = get();
        const nextWave = state.wave + 1;

        if (nextWave > state.wavesPerZone) {
            // Advance zone
            const newZone = state.zone + 1;

            // Trigger Interstitial Ad every 3 zones
            if (newZone % 3 === 0) {
                CrazyGamesSDK.showInterstitialAd();
            }

            // Scale enemies per wave with zone (3 base + zone/3, capped at 8)
            const newEnemiesPerWave = Math.min(8, 3 + Math.floor(newZone / 3));

            useAnalyticsStore.getState().trackZoneAdvance();

            set({
                zone: newZone,
                wave: 1,
                enemiesKilledThisWave: 0,
                enemiesPerWave: newEnemiesPerWave,
                score: newZone * 100 + 10,
                retriesUsedThisZone: 0,
            });
        } else {
            set({
                wave: nextWave,
                enemiesKilledThisWave: 0,
            });
        }
    },

    restartZone: () => set((state) => ({
        wave: 1,
        enemiesKilledThisWave: 0,
        bossDefeated: false,
        gameState: 'RUNNING',
        isRunning: true,
    })),

    // Party wipe: retry current wave (keep zone progress)
    getRetryCost: () => {
        const { retriesUsedThisZone, zone } = get();
        return retriesUsedThisZone === 0 ? 0 : zone * 50;
    },

    retryWave: () => set((state) => ({
        enemiesKilledThisWave: 0,
        gameState: 'RUNNING',
        isRunning: true,
        activePanel: null,
        retriesUsedThisZone: state.retriesUsedThisZone + 1,
    })),

    resetGame: () => set({
        distance: 0,
        score: 0,
        zone: 1,
        wave: 1,
        enemiesPerWave: 3,
        enemiesKilledThisWave: 0,
        totalKills: 0,
        retriesUsedThisZone: 0,
        gameState: 'LOBBY',
        isRunning: false,
        activePanel: null
    }),

    openPanel: (panelName) => set({ activePanel: panelName }),
    closePanel: () => set({ activePanel: null, selectedGridSlot: null }),
    selectGridSlot: (x, y) => set({ selectedGridSlot: { x, y } }),

    // Confirmation Dialog
    confirmation: {
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        onCancel: null,
        isDanger: false,
        confirmText: 'Confirm',
        cancelText: 'Cancel'
    },

    showConfirm: ({ title, message, onConfirm, onCancel = null, isDanger = false, confirmText = 'Confirm', cancelText = 'Cancel' }) => set({
        confirmation: {
            isOpen: true,
            title,
            message,
            onConfirm,
            onCancel,
            isDanger,
            confirmText,
            cancelText
        }
    }),

    closeConfirm: () => set((state) => ({
        confirmation: { ...state.confirmation, isOpen: false }
    })),
}));

export default useGameStore;
