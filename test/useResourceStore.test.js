import { describe, it, expect, beforeEach } from 'vitest';
import useResourceStore from '../src/store/useResourceStore';

describe('useResourceStore', () => {
    beforeEach(() => {
        useResourceStore.setState({ gold: 0, xp: 0, materials: {} });
    });

    it('adds and removes gold', () => {
        const store = useResourceStore.getState();
        store.addGold(100);
        expect(useResourceStore.getState().gold).toBe(100);

        store.removeGold(40);
        expect(useResourceStore.getState().gold).toBe(60);
    });

    it('does not allow negative gold', () => {
        const store = useResourceStore.getState();
        store.removeGold(100);
        expect(useResourceStore.getState().gold).toBe(0);
    });
});
