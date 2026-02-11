import { describe, it, expect, beforeEach } from 'vitest';
import usePartyStore from '../src/store/usePartyStore';

describe('usePartyStore', () => {
    beforeEach(() => {
        usePartyStore.setState({ members: [], gridSize: { width: 3, height: 3 } });
    });

    it('adds a member to a specific grid location', () => {
        const result = usePartyStore.getState().addMember({ name: 'Hero', stats: { hp: 100 } }, 1, 1);
        expect(result).toBe(true);
        expect(usePartyStore.getState().members).toHaveLength(1);
        const member = usePartyStore.getState().members[0];
        expect(member.x).toBe(1);
        expect(member.y).toBe(1);
    });

    it('fails to add member out of bounds', () => {
        const result = usePartyStore.getState().addMember({ name: 'Hero', stats: { hp: 100 } }, 5, 5);
        expect(result).toBe(false);
        expect(usePartyStore.getState().members).toHaveLength(0);
    });

    it('fails to add member to occupied slot', () => {
        usePartyStore.getState().addMember({ name: 'Hero 1', stats: { hp: 100 } }, 0, 0);
        const result = usePartyStore.getState().addMember({ name: 'Hero 2', stats: { hp: 100 } }, 0, 0);
        expect(result).toBe(false);
        expect(usePartyStore.getState().members).toHaveLength(1);
    });

    it('finds first available slot if no position provided', () => {
        usePartyStore.getState().addMember({ name: 'Hero 1', stats: { hp: 100 } }, 0, 0);
        usePartyStore.getState().addMember({ name: 'Hero 2', stats: { hp: 100 } });
        // Should find next slot. Logic might be 0,1 or 1,0 depending on implementation.
        // Let's assume row-major order: 0,0 -> 1,0 -> 2,0 -> 0,1...

        expect(usePartyStore.getState().members).toHaveLength(2);
        const hero2 = usePartyStore.getState().members.find(m => m.name === 'Hero 2');
        expect(hero2.x).toBeDefined();
        expect(hero2.y).toBeDefined();
        expect(hero2.x === 0 && hero2.y === 0).toBe(false);
    });

    it('moves a member to an empty slot', () => {
        usePartyStore.getState().addMember({ name: 'Hero', stats: { hp: 100 } }, 0, 0);
        const heroId = usePartyStore.getState().members[0].id;

        const success = usePartyStore.getState().moveMember(heroId, 2, 2);
        expect(success).toBe(true);

        const hero = usePartyStore.getState().members[0];
        expect(hero.x).toBe(2);
        expect(hero.y).toBe(2);
    });

    it('swaps members if target slot is occupied', () => {
        usePartyStore.getState().addMember({ name: 'Hero A', stats: { hp: 100 } }, 0, 0);
        usePartyStore.getState().addMember({ name: 'Hero B', stats: { hp: 100 } }, 1, 1);

        const idA = usePartyStore.getState().members.find(m => m.name === 'Hero A').id;
        const idB = usePartyStore.getState().members.find(m => m.name === 'Hero B').id;

        usePartyStore.getState().moveMember(idA, 1, 1);

        const heroA = usePartyStore.getState().members.find(m => m.id === idA);
        const heroB = usePartyStore.getState().members.find(m => m.id === idB);

        expect(heroA.x).toBe(1);
        expect(heroA.y).toBe(1);
        expect(heroB.x).toBe(0);
        expect(heroB.y).toBe(0);
    });

    it('equips items and calculates stats', () => {
        usePartyStore.getState().addMember({ name: 'Hero', stats: { hp: 100, atk: 10 } }, 0, 0);
        const heroId = usePartyStore.getState().members[0].id;

        const sword = { name: 'Sword', stats: { atk: 5 } };
        usePartyStore.getState().equipItem(heroId, 'mainHand', sword);

        const updatedHero = usePartyStore.getState().members[0];
        expect(updatedHero.equipment.mainHand).toEqual(sword);
        expect(updatedHero.equipment.combinedStats.atk).toBe(5);
    });
});
