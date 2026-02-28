import { describe, it, expect, beforeEach, vi } from 'vitest';
import useAdStore from '../src/store/useAdStore';
import useGameStore from '../src/store/useGameStore';

// Mock CrazyGames SDK
vi.mock('../src/platform/CrazyGames', () => ({
    default: {
        showRewardedAd: (onSuccess) => onSuccess(),
        happytime: () => {},
    }
}));

// Mock AudioManager
vi.mock('../src/audio/AudioManager', () => ({
    default: {
        playSFX: () => {},
        updateVolumes: () => {},
    }
}));

describe('useAdStore', () => {
    beforeEach(() => {
        useAdStore.setState({
            goldBoostActive: false,
            goldBoostEndTime: null,
            speedBoostActive: false,
            speedBoostEndTime: null,
            soulDoubleActive: false,
            lastAdWatchTime: { gold: 0, reroll: 0, revive: 0, souls: 0, speed: 0, soulDouble: 0 },
            isAdPlaying: false,
        });
        useGameStore.setState({ timeMultiplier: 1, previousTimeMultiplier: 1 });
    });

    describe('speed boost', () => {
        it('activates speed boost and sets multiplier to 5', () => {
            useAdStore.getState().activateSpeedBoost();
            expect(useAdStore.getState().speedBoostActive).toBe(true);
            expect(useAdStore.getState().speedBoostEndTime).toBeGreaterThan(Date.now() - 1000);
            expect(useGameStore.getState().timeMultiplier).toBe(5);
        });

        it('saves previous speed before activating 5x', () => {
            useGameStore.getState().setTimeMultiplier(3);
            useAdStore.getState().activateSpeedBoost();
            expect(useGameStore.getState().previousTimeMultiplier).toBe(3);
            expect(useGameStore.getState().timeMultiplier).toBe(5);
        });

        it('reverts to previous speed when boost expires', () => {
            useGameStore.getState().setTimeMultiplier(3);
            useAdStore.getState().activateSpeedBoost();

            // Simulate boost expiry
            useAdStore.setState({ speedBoostEndTime: Date.now() - 1000 });
            useAdStore.getState().checkBoosts();

            expect(useAdStore.getState().speedBoostActive).toBe(false);
            expect(useGameStore.getState().timeMultiplier).toBe(3);
        });

        it('reverts to 1x if no previous speed was set', () => {
            useAdStore.getState().activateSpeedBoost();

            useAdStore.setState({ speedBoostEndTime: Date.now() - 1000 });
            useAdStore.getState().checkBoosts();

            expect(useGameStore.getState().timeMultiplier).toBe(1);
        });
    });

    describe('gold boost', () => {
        it('activates gold boost', () => {
            useAdStore.getState().activateGoldBoost();
            expect(useAdStore.getState().goldBoostActive).toBe(true);
            expect(useAdStore.getState().goldBoostEndTime).toBeGreaterThan(Date.now() - 1000);
        });

        it('deactivates gold boost on expiry', () => {
            useAdStore.getState().activateGoldBoost();
            useAdStore.setState({ goldBoostEndTime: Date.now() - 1000 });
            useAdStore.getState().checkBoosts();
            expect(useAdStore.getState().goldBoostActive).toBe(false);
        });
    });

    describe('soul double', () => {
        it('activates soul double', () => {
            useAdStore.getState().activateSoulDouble();
            expect(useAdStore.getState().soulDoubleActive).toBe(true);
        });
    });

    describe('cooldowns', () => {
        it('tracks ad cooldown per type', () => {
            useAdStore.setState({
                lastAdWatchTime: { ...useAdStore.getState().lastAdWatchTime, speed: Date.now() }
            });
            expect(useAdStore.getState().getCooldownRemaining('speed')).toBeGreaterThan(0);
        });

        it('returns 0 cooldown for unwatched type', () => {
            expect(useAdStore.getState().getCooldownRemaining('speed')).toBe(0);
        });
    });

    describe('save/load', () => {
        it('saves and restores boost state', () => {
            useAdStore.getState().activateGoldBoost();
            useAdStore.getState().activateSpeedBoost();

            const saveData = useAdStore.getState().getSaveData();
            expect(saveData.goldBoostActive).toBe(true);
            expect(saveData.speedBoostActive).toBe(true);

            // Reset and reload
            useAdStore.setState({
                goldBoostActive: false,
                goldBoostEndTime: null,
                speedBoostActive: false,
                speedBoostEndTime: null,
            });

            useAdStore.getState().loadSaveData(saveData);
            expect(useAdStore.getState().goldBoostActive).toBe(true);
            expect(useAdStore.getState().speedBoostActive).toBe(true);
        });
    });

    describe('time remaining', () => {
        it('returns remaining time for active speed boost', () => {
            useAdStore.getState().activateSpeedBoost();
            const remaining = useAdStore.getState().getSpeedBoostTimeRemaining();
            expect(remaining).toBeGreaterThan(0);
            expect(remaining).toBeLessThanOrEqual(120000);
        });

        it('returns 0 when no speed boost active', () => {
            expect(useAdStore.getState().getSpeedBoostTimeRemaining()).toBe(0);
        });
    });
});
