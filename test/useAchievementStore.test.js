import { describe, it, expect, beforeEach, vi } from 'vitest';
import useAchievementStore from '../src/store/useAchievementStore';

// Mock dependencies
vi.mock('../src/platform/CrazyGames', () => ({
    default: { happytime: () => {} }
}));
vi.mock('../src/audio/AudioManager', () => ({
    default: { playSFX: () => {} }
}));
vi.mock('../src/store/useToastStore', () => ({
    default: {
        getState: () => ({ addToast: () => {} }),
    }
}));

describe('useAchievementStore', () => {
    beforeEach(() => {
        useAchievementStore.setState({
            unlocked: {},
            totalGoldEarned: 0,
            totalItemsFound: 0,
            legendariesFound: 0,
            totalSoulsEarned: 0,
        });
    });

    it('has correct initial state', () => {
        const state = useAchievementStore.getState();
        expect(Object.keys(state.unlocked)).toHaveLength(0);
        expect(state.totalGoldEarned).toBe(0);
    });

    it('tracks gold earned', () => {
        useAchievementStore.getState().trackGold(500);
        expect(useAchievementStore.getState().totalGoldEarned).toBe(500);
        useAchievementStore.getState().trackGold(200);
        expect(useAchievementStore.getState().totalGoldEarned).toBe(700);
    });

    it('tracks items found and legendaries', () => {
        useAchievementStore.getState().trackItem('Common');
        expect(useAchievementStore.getState().totalItemsFound).toBe(1);
        expect(useAchievementStore.getState().legendariesFound).toBe(0);

        useAchievementStore.getState().trackItem('Legendary');
        expect(useAchievementStore.getState().totalItemsFound).toBe(2);
        expect(useAchievementStore.getState().legendariesFound).toBe(1);
    });

    it('tracks souls earned', () => {
        useAchievementStore.getState().trackSouls(50);
        expect(useAchievementStore.getState().totalSoulsEarned).toBe(50);
    });

    it('unlocks first_blood achievement', () => {
        const snapshot = {
            totalKillsAllTime: 1,
            totalGoldEarned: 0,
            totalItemsFound: 0,
            legendariesFound: 0,
            generation: 1,
            totalSoulsEarned: 0,
            highestZone: 1,
            partySize: 1,
        };

        const unlocked = useAchievementStore.getState().checkAll(snapshot);
        expect(unlocked.some(a => a.id === 'first_blood')).toBe(true);
        expect(useAchievementStore.getState().unlocked['first_blood']).toBeDefined();
    });

    it('does not re-unlock already unlocked achievements', () => {
        useAchievementStore.setState({ unlocked: { first_blood: Date.now() } });

        const snapshot = { totalKillsAllTime: 1, totalGoldEarned: 0, totalItemsFound: 0, legendariesFound: 0, generation: 1, totalSoulsEarned: 0, highestZone: 1, partySize: 1 };
        const unlocked = useAchievementStore.getState().checkAll(snapshot);
        expect(unlocked.some(a => a.id === 'first_blood')).toBe(false);
    });

    it('unlocks multiple achievements at once', () => {
        const snapshot = {
            totalKillsAllTime: 100,
            totalGoldEarned: 500,
            totalItemsFound: 0,
            legendariesFound: 0,
            generation: 1,
            totalSoulsEarned: 0,
            highestZone: 1,
            partySize: 1,
        };

        const unlocked = useAchievementStore.getState().checkAll(snapshot);
        expect(unlocked.length).toBeGreaterThanOrEqual(3); // first_blood, centurion, pocket_change
    });

    it('getAll returns all achievement definitions', () => {
        const all = useAchievementStore.getState().getAll();
        expect(all.length).toBe(20);
    });

    it('getUnlockedCount returns correct count', () => {
        useAchievementStore.setState({ unlocked: { a: 1, b: 2 } });
        expect(useAchievementStore.getState().getUnlockedCount()).toBe(2);
    });

    describe('save/load', () => {
        it('saves and restores achievement state', () => {
            useAchievementStore.setState({
                unlocked: { first_blood: Date.now() },
                totalGoldEarned: 1000,
                totalItemsFound: 10,
                legendariesFound: 1,
                totalSoulsEarned: 50,
            });

            const data = useAchievementStore.getState().getSaveData();

            useAchievementStore.setState({ unlocked: {}, totalGoldEarned: 0 });
            useAchievementStore.getState().loadSaveData(data);

            expect(useAchievementStore.getState().unlocked['first_blood']).toBeDefined();
            expect(useAchievementStore.getState().totalGoldEarned).toBe(1000);
            expect(useAchievementStore.getState().legendariesFound).toBe(1);
        });
    });
});
