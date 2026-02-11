import { describe, it, expect, beforeEach } from 'vitest';
import useMetaStore from '../src/store/useMetaStore';
import useGameStore from '../src/store/useGameStore';
import usePartyStore from '../src/store/usePartyStore';
import useResourceStore from '../src/store/useResourceStore';

describe('useMetaStore', () => {
    beforeEach(() => {
        useMetaStore.setState({
            souls: 0, generation: 1,
            upgrades: { gridSize: 0, startGold: 0, xpGain: 0, goldGain: 0, soulGain: 0, startingZone: 0 },
            highestZone: 1, totalKillsAllTime: 0, totalPlaytimeSeconds: 0,
        });
        useGameStore.setState({ zone: 5, wave: 1, totalKills: 10, distance: 0 });
        usePartyStore.setState({ members: [{ id: '1' }], gridSize: { width: 3, height: 3 } });
        useResourceStore.setState({ gold: 500 });
    });

    it('triggers TPK correctly', () => {
        // New formula: zone^2 * 2 = 5^2 * 2 = 50
        const expectedSouls = Math.floor(5 * 5 * 2);
        useMetaStore.getState().triggerTPK();

        expect(useMetaStore.getState().souls).toBe(expectedSouls);
        expect(useMetaStore.getState().generation).toBe(2);

        // Check stats updated
        expect(useMetaStore.getState().highestZone).toBe(5);
        expect(useMetaStore.getState().totalKillsAllTime).toBe(10);

        // Check other stores reset
        expect(useGameStore.getState().zone).toBe(1);
        expect(usePartyStore.getState().members).toHaveLength(0);
        expect(useResourceStore.getState().gold).toBe(0);
    });

    it('buys upgrades', () => {
        useMetaStore.setState({ souls: 100 });

        const success = useMetaStore.getState().buyUpgrade('gridSize');

        expect(success).toBe(true);
        expect(useMetaStore.getState().souls).toBe(90);
        expect(useMetaStore.getState().upgrades.gridSize).toBe(1);

        // Check effect on Party Store
        expect(usePartyStore.getState().gridSize.width).toBe(4);
    });

    it('applies start gold after TPK', () => {
        useMetaStore.setState({ upgrades: { gridSize: 0, startGold: 1, xpGain: 0, goldGain: 0, soulGain: 0, startingZone: 0 } });
        useGameStore.setState({ zone: 1, wave: 1, totalKills: 0 });

        useMetaStore.getState().triggerTPK();

        expect(useResourceStore.getState().gold).toBe(100);
    });

    it('applies soul gain multiplier', () => {
        useMetaStore.setState({
            souls: 0,
            upgrades: { gridSize: 0, startGold: 0, xpGain: 0, goldGain: 0, soulGain: 2, startingZone: 0 }
        });
        useGameStore.setState({ zone: 5, wave: 1, totalKills: 0 });

        useMetaStore.getState().triggerTPK();

        // zone^2 * 2 * (1 + 2*0.2) = 50 * 1.4 = 70
        expect(useMetaStore.getState().souls).toBe(70);
    });

    it('applies starting zone upgrade', () => {
        useMetaStore.setState({
            upgrades: { gridSize: 0, startGold: 0, xpGain: 0, goldGain: 0, soulGain: 0, startingZone: 3 }
        });
        useGameStore.setState({ zone: 1, wave: 1, totalKills: 0 });

        useMetaStore.getState().triggerTPK();

        expect(useGameStore.getState().zone).toBe(4); // 1 + 3
    });
});
