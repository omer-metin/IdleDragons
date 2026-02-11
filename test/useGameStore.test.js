import { describe, it, expect, beforeEach } from 'vitest';
import useGameStore from '../src/store/useGameStore';

describe('useGameStore', () => {
    beforeEach(() => {
        useGameStore.getState().resetGame();
    });

    // --- State Transitions ---
    describe('state transitions', () => {
        it('startGame sets RUNNING and isRunning true', () => {
            useGameStore.getState().startGame();
            expect(useGameStore.getState().gameState).toBe('RUNNING');
            expect(useGameStore.getState().isRunning).toBe(true);
        });

        it('endGame sets GAMEOVER and isRunning false', () => {
            useGameStore.getState().startGame();
            useGameStore.getState().endGame();
            expect(useGameStore.getState().gameState).toBe('GAMEOVER');
            expect(useGameStore.getState().isRunning).toBe(false);
        });

        it('togglePause from RUNNING sets PAUSED', () => {
            useGameStore.getState().startGame();
            useGameStore.getState().togglePause();
            expect(useGameStore.getState().gameState).toBe('PAUSED');
            expect(useGameStore.getState().isRunning).toBe(false);
        });

        it('togglePause from PAUSED sets RUNNING', () => {
            useGameStore.getState().startGame();
            useGameStore.getState().togglePause();
            useGameStore.getState().togglePause();
            expect(useGameStore.getState().gameState).toBe('RUNNING');
            expect(useGameStore.getState().isRunning).toBe(true);
        });

        it('togglePause from LOBBY does nothing', () => {
            useGameStore.getState().togglePause();
            expect(useGameStore.getState().gameState).toBe('LOBBY');
        });

        it('togglePause from GAMEOVER does nothing', () => {
            useGameStore.getState().endGame();
            useGameStore.getState().togglePause();
            expect(useGameStore.getState().gameState).toBe('GAMEOVER');
        });
    });

    // --- Distance & Score ---
    describe('distance and score', () => {
        it('incrementDistance only works when RUNNING', () => {
            useGameStore.getState().startGame();
            useGameStore.getState().incrementDistance(10);
            expect(useGameStore.getState().distance).toBe(10);
        });

        it('incrementDistance does nothing when not RUNNING', () => {
            useGameStore.getState().incrementDistance(10);
            expect(useGameStore.getState().distance).toBe(0);
        });

        it('score is zone*100 + wave*10', () => {
            useGameStore.getState().startGame();
            useGameStore.getState().incrementDistance(1);
            expect(useGameStore.getState().score).toBe(1 * 100 + 1 * 10); // zone=1, wave=1
        });
    });

    // --- Kill Tracking ---
    describe('kill tracking', () => {
        it('addKill increments totalKills and enemiesKilledThisWave', () => {
            useGameStore.getState().addKill();
            useGameStore.getState().addKill();
            expect(useGameStore.getState().totalKills).toBe(2);
            expect(useGameStore.getState().enemiesKilledThisWave).toBe(2);
        });

        it('5 kills fills wave (enemiesPerWave defaults to 5)', () => {
            for (let i = 0; i < 5; i++) useGameStore.getState().addKill();
            expect(useGameStore.getState().enemiesKilledThisWave).toBe(5);
            expect(useGameStore.getState().isWaveCleared()).toBe(true);
        });
    });

    // --- Wave/Zone Progression ---
    describe('wave and zone progression', () => {
        it('isWaveCleared false when kills < enemiesPerWave', () => {
            useGameStore.getState().addKill();
            expect(useGameStore.getState().isWaveCleared()).toBe(false);
        });

        it('advanceWave increments wave and resets kills', () => {
            useGameStore.getState().addKill();
            useGameStore.getState().advanceWave();
            expect(useGameStore.getState().wave).toBe(2);
            expect(useGameStore.getState().enemiesKilledThisWave).toBe(0);
        });

        it('advanceWave on wave 10 advances zone', () => {
            useGameStore.setState({ wave: 10 });
            useGameStore.getState().advanceWave();
            expect(useGameStore.getState().zone).toBe(2);
            expect(useGameStore.getState().wave).toBe(1);
            expect(useGameStore.getState().enemiesKilledThisWave).toBe(0);
        });

        it('zone advance updates score correctly', () => {
            useGameStore.setState({ wave: 10 });
            useGameStore.getState().advanceWave();
            expect(useGameStore.getState().score).toBe(2 * 100 + 10); // zone=2, wave=1
        });
    });

    // --- Reset ---
    describe('reset', () => {
        it('resetGame resets all state to defaults', () => {
            useGameStore.getState().startGame();
            useGameStore.getState().addKill();
            useGameStore.setState({ zone: 5, wave: 7 });
            useGameStore.getState().resetGame();

            const state = useGameStore.getState();
            expect(state.zone).toBe(1);
            expect(state.wave).toBe(1);
            expect(state.totalKills).toBe(0);
            expect(state.distance).toBe(0);
            expect(state.score).toBe(0);
            expect(state.gameState).toBe('LOBBY');
            expect(state.isRunning).toBe(false);
            expect(state.activePanel).toBeNull();
        });
    });

    // --- Panel Management ---
    describe('panel management', () => {
        it('openPanel sets activePanel', () => {
            useGameStore.getState().openPanel('recruitment');
            expect(useGameStore.getState().activePanel).toBe('recruitment');
        });

        it('closePanel clears activePanel and selectedGridSlot', () => {
            useGameStore.getState().openPanel('recruitment');
            useGameStore.getState().selectGridSlot(1, 2);
            useGameStore.getState().closePanel();
            expect(useGameStore.getState().activePanel).toBeNull();
            expect(useGameStore.getState().selectedGridSlot).toBeNull();
        });

        it('selectGridSlot sets coordinates', () => {
            useGameStore.getState().selectGridSlot(1, 2);
            expect(useGameStore.getState().selectedGridSlot).toEqual({ x: 1, y: 2 });
        });
    });

    // --- Edge Cases ---
    describe('edge cases', () => {
        it('setTimeMultiplier stores value', () => {
            useGameStore.getState().setTimeMultiplier(5);
            expect(useGameStore.getState().timeMultiplier).toBe(5);
        });

        it('calling startGame twice does not corrupt state', () => {
            useGameStore.getState().startGame();
            useGameStore.getState().startGame();
            expect(useGameStore.getState().gameState).toBe('RUNNING');
            expect(useGameStore.getState().isRunning).toBe(true);
        });

        it('resetGame during RUNNING transitions to LOBBY', () => {
            useGameStore.getState().startGame();
            useGameStore.getState().resetGame();
            expect(useGameStore.getState().gameState).toBe('LOBBY');
            expect(useGameStore.getState().isRunning).toBe(false);
        });
    });

    // --- Boss Wave ---
    describe('boss wave', () => {
        it('isBossWave returns true on last wave', () => {
            useGameStore.setState({ wave: 10, wavesPerZone: 10 });
            expect(useGameStore.getState().isBossWave()).toBe(true);
        });

        it('isBossWave returns false on other waves', () => {
            useGameStore.setState({ wave: 5, wavesPerZone: 10 });
            expect(useGameStore.getState().isBossWave()).toBe(false);
        });

        it('isBossWave returns true on wave 1 if wavesPerZone is 1', () => {
            useGameStore.setState({ wave: 1, wavesPerZone: 1 });
            expect(useGameStore.getState().isBossWave()).toBe(true);
        });
    });
});
