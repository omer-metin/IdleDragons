import { create } from 'zustand';

const MAX_TPK_HISTORY = 50;
const MAX_RUN_HISTORY = 50;

const useAnalyticsStore = create((set, get) => ({
    // Session tracking
    sessionCount: 0,
    totalSessionSeconds: 0,

    // TPK / run tracking
    tpkZoneHistory: [],       // Last 50 TPK zones
    runDurations: [],          // Last 50 run durations in seconds
    zoneAdvanceCount: 0,

    // Ad tracking
    adWatchCount: 0,
    adTypeBreakdown: { gold: 0, reroll: 0, revive: 0, souls: 0, speed: 0, soulDouble: 0 },

    // Item tracking
    itemsEquipped: 0,

    // Tutorial tracking
    tutorialCompleted: false,
    tutorialSkipped: false,
    tutorialDropoffStep: 0,

    // Current run timer (not persisted — reset each adventure)
    _currentRunStart: null,

    // ── Actions ──

    incrementSession: () => set((s) => ({ sessionCount: s.sessionCount + 1 })),

    addSessionTime: (seconds) => set((s) => ({
        totalSessionSeconds: s.totalSessionSeconds + seconds,
    })),

    trackTPK: (zone) => set((s) => {
        const history = [...s.tpkZoneHistory, zone];
        if (history.length > MAX_TPK_HISTORY) history.shift();

        // End current run
        let durations = s.runDurations;
        if (s._currentRunStart) {
            const runSec = Math.floor((Date.now() - s._currentRunStart) / 1000);
            durations = [...durations, runSec];
            if (durations.length > MAX_RUN_HISTORY) durations.shift();
        }

        return {
            tpkZoneHistory: history,
            runDurations: durations,
            _currentRunStart: null,
        };
    }),

    trackZoneAdvance: () => set((s) => ({
        zoneAdvanceCount: s.zoneAdvanceCount + 1,
    })),

    trackAdWatch: (type) => set((s) => ({
        adWatchCount: s.adWatchCount + 1,
        adTypeBreakdown: {
            ...s.adTypeBreakdown,
            [type]: (s.adTypeBreakdown[type] || 0) + 1,
        },
    })),

    trackEquip: () => set((s) => ({ itemsEquipped: s.itemsEquipped + 1 })),

    trackTutorialComplete: () => set({ tutorialCompleted: true }),
    trackTutorialSkip: () => set({ tutorialSkipped: true }),
    trackTutorialStep: (step) => set({ tutorialDropoffStep: step }),

    startRun: () => set({ _currentRunStart: Date.now() }),

    // ── Computed ──

    getMedianTPKZone: () => {
        const { tpkZoneHistory } = get();
        if (tpkZoneHistory.length === 0) return null;
        const sorted = [...tpkZoneHistory].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];
    },

    getAverageRunDuration: () => {
        const { runDurations } = get();
        if (runDurations.length === 0) return 0;
        return Math.floor(runDurations.reduce((a, b) => a + b, 0) / runDurations.length);
    },

    getBalanceIndicator: () => {
        const median = get().getMedianTPKZone();
        if (median === null) return null;
        if (median < 5) return { label: 'Too Hard', color: '#e74c3c', icon: '🔥' };
        if (median > 15) return { label: 'Too Easy', color: '#2ecc71', icon: '😴' };
        return { label: 'Balanced', color: '#f39c12', icon: '⚖️' };
    },

    // ── Save / Load ──

    getSaveData: () => {
        const s = get();
        return {
            sessionCount: s.sessionCount,
            totalSessionSeconds: s.totalSessionSeconds,
            tpkZoneHistory: s.tpkZoneHistory,
            runDurations: s.runDurations,
            zoneAdvanceCount: s.zoneAdvanceCount,
            adWatchCount: s.adWatchCount,
            adTypeBreakdown: s.adTypeBreakdown,
            itemsEquipped: s.itemsEquipped,
            tutorialCompleted: s.tutorialCompleted,
            tutorialSkipped: s.tutorialSkipped,
            tutorialDropoffStep: s.tutorialDropoffStep,
        };
    },

    loadSaveData: (data) => {
        if (!data) return;
        set({
            sessionCount: data.sessionCount || 0,
            totalSessionSeconds: data.totalSessionSeconds || 0,
            tpkZoneHistory: data.tpkZoneHistory || [],
            runDurations: data.runDurations || [],
            zoneAdvanceCount: data.zoneAdvanceCount || 0,
            adWatchCount: data.adWatchCount || 0,
            adTypeBreakdown: { gold: 0, reroll: 0, revive: 0, souls: 0, speed: 0, soulDouble: 0, ...(data.adTypeBreakdown || {}) },
            itemsEquipped: data.itemsEquipped || 0,
            tutorialCompleted: data.tutorialCompleted || false,
            tutorialSkipped: data.tutorialSkipped || false,
            tutorialDropoffStep: data.tutorialDropoffStep || 0,
        });
    },
}));

export default useAnalyticsStore;
