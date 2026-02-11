import { create } from 'zustand';
import useResourceStore from './useResourceStore';
import usePartyStore from './usePartyStore';
import useGameStore from './useGameStore';
import useMetaStore from './useMetaStore';

const NAMES = ['Aldric', 'Baldric', 'Cerdic', 'Dood', 'Elric', 'Fredrict', 'Geralt', 'Hodor'];

const CLASS_DEFINITIONS = {
    Warrior: {
        role: 'Tank',
        description: 'High HP, moderate ATK. Absorbs damage for the team.',
        baseHp: 120,
        baseAtk: 10,
        baseDef: 3,
        range: 100,
        attackSpeed: 1.0,
        canHeal: false,
        color: '#e74c3c',
    },
    Mage: {
        role: 'DPS',
        description: 'High ATK, low HP. Devastating ranged damage.',
        baseHp: 60,
        baseAtk: 22,
        baseDef: 0,
        range: 300,
        attackSpeed: 1.0,
        canHeal: false,
        color: '#3498db',
    },
    Archer: {
        role: 'Ranged DPS',
        description: 'Moderate stats, long range attacks.',
        baseHp: 80,
        baseAtk: 16,
        baseDef: 1,
        range: 300,
        attackSpeed: 0.8,
        canHeal: false,
        color: '#27ae60',
    },
    Cleric: {
        role: 'Healer',
        description: 'Heals the lowest HP ally. Essential for survival.',
        baseHp: 90,
        baseAtk: 8,
        baseDef: 2,
        range: 100,
        attackSpeed: 1.0,
        canHeal: true,
        color: '#f1c40f',
    },
};

const CLASSES = Object.keys(CLASS_DEFINITIONS);

const generateCandidate = (cls) => {
    if (!cls) cls = CLASSES[Math.floor(Math.random() * CLASSES.length)];
    const def = CLASS_DEFINITIONS[cls];

    return {
        name: NAMES[Math.floor(Math.random() * NAMES.length)],
        class: cls,
        role: def.role,
        description: def.description,
        canHeal: def.canHeal,
        range: def.range,
        attackSpeed: def.attackSpeed,
        stats: {
            hp: def.baseHp + Math.floor(Math.random() * 20),
            atk: def.baseAtk + Math.floor(Math.random() * 5),
            def: def.baseDef,
        },
        cost: 10, // Souls
    };
};

const useRecruitmentStore = create((set, get) => ({
    candidates: [],
    rerollCost: 50,

    // Generate one candidate per class (4 total)
    generateCandidates: () => {
        const newCandidates = CLASSES.map(cls => generateCandidate(cls));
        set({ candidates: newCandidates });
    },

    reroll: () => {
        const soulCost = 5;
        const { souls, removeSouls } = useMetaStore.getState();

        if (souls >= soulCost) {
            removeSouls(soulCost);
            get().generateCandidates();
            return true;
        }
        return false;
    },

    recruit: (candidateIndex, x, y) => {
        // Enforce Lobby State
        const { gameState } = useGameStore.getState();
        if (gameState !== 'LOBBY') return false;

        const { candidates } = get();
        const candidate = candidates[candidateIndex];

        if (!candidate) return false;

        const { souls, removeSouls } = useMetaStore.getState();
        const soulCost = 10;

        if (souls >= soulCost) {
            const success = usePartyStore.getState().addMember(candidate, x, y);
            if (success) {
                removeSouls(soulCost);
                set({ candidates: candidates.filter((_, i) => i !== candidateIndex) });
                return true;
            }
        }
        return false;
    },

    reset: () => set({ candidates: [] }),
}));

export default useRecruitmentStore;
export { CLASS_DEFINITIONS, CLASSES };
