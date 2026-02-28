import { describe, it, expect, beforeEach } from 'vitest';
import useLootStore from '../src/store/useLootStore';
import useInventoryStore from '../src/store/useInventoryStore';

describe('useLootStore', () => {
    beforeEach(() => {
        useInventoryStore.setState({ items: [] });
    });

    describe('loot rolls', () => {
        it('rollLoot returns null or a valid item', () => {
            const result = useLootStore.getState().rollLoot(1);
            // Can be null (70%) or an item (30%)
            if (result !== null) {
                expect(result).toHaveProperty('id');
                expect(result).toHaveProperty('name');
                expect(result).toHaveProperty('type');
                expect(result).toHaveProperty('rarity');
                expect(result).toHaveProperty('rarityColor');
                expect(result).toHaveProperty('stats');
                expect(result).toHaveProperty('zone');
            }
        });

        it('item type is one of mainHand, offHand, armor, trinket', () => {
            const validTypes = ['mainHand', 'offHand', 'armor', 'trinket'];
            // Roll many times to get at least one item
            for (let i = 0; i < 100; i++) {
                const result = useLootStore.getState().rollLoot(1);
                if (result) {
                    expect(validTypes).toContain(result.type);
                    return; // Pass once we confirm one
                }
            }
        });

        it('item rarity is one of Common, Uncommon, Rare, Epic, Legendary', () => {
            const validRarities = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
            for (let i = 0; i < 100; i++) {
                const result = useLootStore.getState().rollLoot(1);
                if (result) {
                    expect(validRarities).toContain(result.rarity);
                    return;
                }
            }
        });

        it('item name follows Prefix + ItemName format', () => {
            for (let i = 0; i < 100; i++) {
                const result = useLootStore.getState().rollLoot(1);
                if (result) {
                    expect(result.name.split(' ').length).toBeGreaterThanOrEqual(2);
                    return;
                }
            }
        });

        it('higher zone produces stronger items', () => {
            // This is statistical — collect items from zone 1 and zone 10
            const zone1Stats = [];
            const zone10Stats = [];

            for (let i = 0; i < 500; i++) {
                const z1 = useLootStore.getState().rollLoot(1);
                const z10 = useLootStore.getState().rollLoot(10);
                if (z1) zone1Stats.push(Object.values(z1.stats)[0]);
                if (z10) zone10Stats.push(Object.values(z10.stats)[0]);
            }

            if (zone1Stats.length > 0 && zone10Stats.length > 0) {
                const avg1 = zone1Stats.reduce((a, b) => a + b, 0) / zone1Stats.length;
                const avg10 = zone10Stats.reduce((a, b) => a + b, 0) / zone10Stats.length;
                expect(avg10).toBeGreaterThan(avg1);
            }
        });
    });

    describe('inventory integration', () => {
        it('dropped item is automatically added to inventory', () => {
            // Roll until we get an item
            let item = null;
            for (let i = 0; i < 100; i++) {
                item = useLootStore.getState().rollLoot(1);
                if (item) break;
            }

            if (item) {
                const inv = useInventoryStore.getState().items;
                expect(inv.length).toBeGreaterThanOrEqual(1);
                expect(inv.some(i => i.id === item.id)).toBe(true);
            }
        });
    });

    describe('drop chance', () => {
        it('approximately 25% of rolls produce items', () => {
            let drops = 0;
            const trials = 1000;

            for (let i = 0; i < trials; i++) {
                // Clear inventory periodically to avoid hitting the cap
                if (i % 40 === 0) useInventoryStore.setState({ items: [] });
                if (useLootStore.getState().rollLoot(1) !== null) drops++;
            }

            const rate = drops / trials;
            // Allow wide margin: 15% to 40% (dropChance is 0.25)
            expect(rate).toBeGreaterThan(0.15);
            expect(rate).toBeLessThan(0.40);
        });
    });
});
