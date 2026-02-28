import { describe, it, expect, beforeEach, vi } from 'vitest';
import useDailyRewardStore from '../src/store/useDailyRewardStore';

// Mock dependencies
vi.mock('../src/store/useResourceStore', () => ({
    default: {
        getState: () => ({
            addGold: vi.fn(),
            addMaterial: vi.fn(),
        }),
    }
}));

vi.mock('../src/store/useMetaStore', () => ({
    default: {
        getState: () => ({
            generation: 1,
            addSouls: vi.fn(),
        }),
    }
}));

vi.mock('../src/store/useToastStore', () => ({
    default: {
        getState: () => ({ addToast: vi.fn() }),
    }
}));

describe('useDailyRewardStore', () => {
    beforeEach(() => {
        useDailyRewardStore.setState({
            streak: 0,
            lastClaimDate: null,
            showPopup: false,
        });
    });

    it('has correct initial state', () => {
        const state = useDailyRewardStore.getState();
        expect(state.streak).toBe(0);
        expect(state.lastClaimDate).toBeNull();
        expect(state.showPopup).toBe(false);
    });

    it('canClaim returns true when never claimed', () => {
        expect(useDailyRewardStore.getState().canClaim()).toBe(true);
    });

    it('canClaim returns false after claiming today', () => {
        useDailyRewardStore.getState().claim();
        expect(useDailyRewardStore.getState().canClaim()).toBe(false);
    });

    it('claim advances streak', () => {
        useDailyRewardStore.getState().claim();
        expect(useDailyRewardStore.getState().streak).toBe(1);
    });

    it('streak wraps after 7 days', () => {
        useDailyRewardStore.setState({ streak: 6, lastClaimDate: null });
        useDailyRewardStore.getState().claim();
        expect(useDailyRewardStore.getState().streak).toBe(0); // wraps back
    });

    it('checkStreak resets streak if day missed', () => {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        const dateKey = `${twoDaysAgo.getFullYear()}-${String(twoDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(twoDaysAgo.getDate()).padStart(2, '0')}`;

        useDailyRewardStore.setState({ streak: 3, lastClaimDate: dateKey });
        useDailyRewardStore.getState().checkStreak();
        expect(useDailyRewardStore.getState().streak).toBe(0);
    });

    it('dismissPopup hides popup', () => {
        useDailyRewardStore.setState({ showPopup: true });
        useDailyRewardStore.getState().dismissPopup();
        expect(useDailyRewardStore.getState().showPopup).toBe(false);
    });

    it('getRewards returns 7 reward definitions', () => {
        expect(useDailyRewardStore.getState().getRewards()).toHaveLength(7);
    });

    it('onGameLoad shows popup when claimable', () => {
        useDailyRewardStore.getState().onGameLoad();
        expect(useDailyRewardStore.getState().showPopup).toBe(true);
    });

    describe('save/load', () => {
        it('saves and restores state', () => {
            useDailyRewardStore.setState({ streak: 4, lastClaimDate: '2026-02-28' });
            const data = useDailyRewardStore.getState().getSaveData();

            useDailyRewardStore.setState({ streak: 0, lastClaimDate: null });
            useDailyRewardStore.getState().loadSaveData(data);

            expect(useDailyRewardStore.getState().streak).toBe(4);
            expect(useDailyRewardStore.getState().lastClaimDate).toBe('2026-02-28');
        });
    });
});
