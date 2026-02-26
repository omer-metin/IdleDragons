import { describe, it, expect, beforeEach } from 'vitest';
import useRecruitmentStore from '../src/store/useRecruitmentStore';
import useResourceStore from '../src/store/useResourceStore';
import usePartyStore from '../src/store/usePartyStore';
import useGameStore from '../src/store/useGameStore';
import useMetaStore from '../src/store/useMetaStore';

describe('useRecruitmentStore', () => {
    beforeEach(() => {
        useRecruitmentStore.getState().reset();
        useResourceStore.getState().reset();
        usePartyStore.setState({ members: [], gridSize: { width: 3, height: 3 } });
        useMetaStore.setState({ souls: 100 });
        useGameStore.setState({ gameState: 'LOBBY', zone: 1 });
        useResourceStore.setState({ gold: 1000 }); // Enough gold for recruiting
    });

    it('generates one candidate per class', () => {
        useRecruitmentStore.getState().generateCandidates();
        const candidates = useRecruitmentStore.getState().candidates;
        expect(candidates).toHaveLength(6); // One per class (Warrior, Mage, Archer, Cleric, Rogue, Paladin)

        const classes = candidates.map(c => c.class);
        expect(classes).toContain('Warrior');
        expect(classes).toContain('Mage');
        expect(classes).toContain('Archer');
        expect(classes).toContain('Cleric');
        expect(classes).toContain('Rogue');
        expect(classes).toContain('Paladin');
    });

    it('rerolls candidates deducting souls', () => {
        useRecruitmentStore.getState().generateCandidates();
        const initialSouls = useMetaStore.getState().souls;

        const success = useRecruitmentStore.getState().reroll();

        expect(success).toBe(true);
        expect(useMetaStore.getState().souls).toBe(initialSouls - 5); // 5 Soul cost
    });

    it('recruits a candidate if affordable and in lobby', () => {
        useRecruitmentStore.getState().generateCandidates();
        const candidateIndex = 0;
        const initialSouls = useMetaStore.getState().souls; // 100

        const success = useRecruitmentStore.getState().recruit(candidateIndex, 1, 1);

        expect(success).toBe(true);
        expect(usePartyStore.getState().members).toHaveLength(1);
        expect(useMetaStore.getState().souls).toBe(initialSouls - 10); // 10 Soul cost
        expect(useRecruitmentStore.getState().candidates).toHaveLength(5); // 6 - 1 recruited
    });

    it('fails to recruit if game is running', () => {
        useGameStore.setState({ gameState: 'RUNNING' });
        useRecruitmentStore.getState().generateCandidates();

        const success = useRecruitmentStore.getState().recruit(0, 1, 1);

        expect(success).toBe(false);
        expect(usePartyStore.getState().members).toHaveLength(0);
    });

    it('candidates include range and attackSpeed stats', () => {
        useRecruitmentStore.getState().generateCandidates();
        const candidates = useRecruitmentStore.getState().candidates;

        candidates.forEach(c => {
            expect(c.range).toBeDefined();
            expect(c.attackSpeed).toBeDefined();
            expect(typeof c.range).toBe('number');
            expect(typeof c.attackSpeed).toBe('number');
        });

        // Ranged classes should have range 300
        const archer = candidates.find(c => c.class === 'Archer');
        const mage = candidates.find(c => c.class === 'Mage');
        expect(archer.range).toBe(300);
        expect(mage.range).toBe(300);

        // Melee classes should have range 100
        const warrior = candidates.find(c => c.class === 'Warrior');
        const cleric = candidates.find(c => c.class === 'Cleric');
        expect(warrior.range).toBe(100);
        expect(cleric.range).toBe(100);
    });
});
