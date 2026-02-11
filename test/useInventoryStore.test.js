import { describe, it, expect, beforeEach } from 'vitest';
import useInventoryStore from '../src/store/useInventoryStore';

describe('useInventoryStore', () => {
    beforeEach(() => {
        useInventoryStore.setState({ items: [] });
    });

    it('adds items with unique instanceIds', () => {
        const store = useInventoryStore.getState();
        store.addItem({ name: 'Potion' });
        store.addItem({ name: 'Potion' });

        const items = useInventoryStore.getState().items;
        expect(items).toHaveLength(2);
        expect(items[0].instanceId).toBeDefined();
        expect(items[0].instanceId).not.toBe(items[1].instanceId);
    });

    it('removes items correctly', () => {
        const store = useInventoryStore.getState();
        store.addItem({ name: 'Sword' });
        const item = useInventoryStore.getState().items[0];

        store.removeItem(item.instanceId);
        expect(useInventoryStore.getState().items).toHaveLength(0);
    });

    it('reset clears all items', () => {
        const store = useInventoryStore.getState();
        store.addItem({ name: 'Sword' });
        store.addItem({ name: 'Shield' });
        store.addItem({ name: 'Potion' });
        expect(useInventoryStore.getState().items).toHaveLength(3);

        store.reset();
        expect(useInventoryStore.getState().items).toHaveLength(0);
    });
});
