import { create } from 'zustand';
import CrazyGamesSDK from '../platform/CrazyGames';

const useGameStore = create((set, get) => ({
    gameState: 'MENU', // 'MENU', 'LOBBY', 'RUNNING', 'PAUSED', 'GAMEOVER'
    isRunning: false,
    timeMultiplier: 1.0,
    score: 0,
    distance: 0,

    // Zone/Wave progression
    zone: 1,
    wave: 1,
    wavesPerZone: 10,
    enemiesPerWave: 5,
    enemiesKilledThisWave: 0,
    totalKills: 0,

    activePanel: null,
    selectedGridSlot: null,

    enterMenu: () => set({ gameState: 'MENU', isRunning: false, activePanel: null }),
    startGame: () => set({ gameState: 'LOBBY', isRunning: false }), // Menu -> Lobby
    startAdventure: () => set({ gameState: 'RUNNING', isRunning: true }), // Lobby -> Adventure
    endGame: () => set({ gameState: 'GAMEOVER', isRunning: false }),

    togglePause: () => set((state) => {
        if (state.gameState === 'RUNNING') return { gameState: 'PAUSED', isRunning: false };
        if (state.gameState === 'PAUSED') return { gameState: 'RUNNING', isRunning: true };
        return {};
    }),

    setTimeMultiplier: (multiplier) => set({ timeMultiplier: multiplier }),

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

            set({
                zone: newZone,
                wave: 1,
                enemiesKilledThisWave: 0,
                score: newZone * 100 + 10,
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

    resetGame: () => set({
        distance: 0,
        score: 0,
        zone: 1,
        wave: 1,
        enemiesKilledThisWave: 0,
        totalKills: 0,
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
