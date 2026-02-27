import { create } from 'zustand';
import useResourceStore from './useResourceStore';
import usePartyStore from './usePartyStore';
import useGameStore from './useGameStore';
import useMetaStore from './useMetaStore';
import useToastStore from './useToastStore';

const NAMES = [
    // Classic fantasy
    'Aldric', 'Baldric', 'Cerdic', 'Darian', 'Elric', 'Fenris', 'Geralt', 'Hadrian',
    'Isolde', 'Jareth', 'Kaelen', 'Lyanna', 'Morwen', 'Nyx', 'Orin', 'Perrin',
    'Quinn', 'Rowan', 'Seraphel', 'Theron', 'Ulric', 'Vex', 'Wren', 'Xander',
    // Exotic / Archaic
    'Zephyr', 'Ashara', 'Bramwell', 'Corwin', 'Dagny', 'Eira', 'Falk', 'Gwendolyn',
    'Hale', 'Ingrid', 'Jorik', 'Kira', 'Leoric', 'Mira', 'Norric', 'Olwen',
    'Phaedra', 'Ragnor', 'Sigrid', 'Torin', 'Ursa', 'Varen', 'Wynne', 'Yara',
];

const NAME_PREFIXES = ['Thal', 'Mor', 'Kal', 'Dra', 'Fen', 'Gal', 'Zar', 'Bel', 'Ash', 'Eld', 'Kor', 'Val'];
const NAME_SUFFIXES = ['adrin', 'wyn', 'ith', 'ander', 'eon', 'ric', 'dor', 'iel', 'ara', 'ven', 'ros', 'mir'];

function generateUniqueName(usedNames) {
    // Try from static pool first
    const available = NAMES.filter(n => !usedNames.has(n));
    if (available.length > 0) {
        return available[Math.floor(Math.random() * available.length)];
    }
    // Fallback: syllable generation
    for (let i = 0; i < 50; i++) {
        const name = NAME_PREFIXES[Math.floor(Math.random() * NAME_PREFIXES.length)]
            + NAME_SUFFIXES[Math.floor(Math.random() * NAME_SUFFIXES.length)];
        const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
        if (!usedNames.has(capitalized)) return capitalized;
    }
    return 'Hero ' + Math.floor(Math.random() * 999);
}

const CLASS_DEFINITIONS = {
    Warrior: {
        role: 'Tank',
        description: 'High HP, moderate ATK. Absorbs damage for the team.',
        baseHp: 100,
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
        baseAtk: 18,
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
        baseAtk: 6,
        baseDef: 2,
        range: 100,
        attackSpeed: 1.0,
        canHeal: true,
        color: '#f1c40f',
    },
    Rogue: {
        role: 'Duelist',
        description: 'High Speed and Damage. Very fragile. +5% loot drop chance.',
        baseHp: 75,
        baseAtk: 20,
        baseDef: 1,
        range: 100,
        attackSpeed: 0.6,
        canHeal: false,
        color: '#9b59b6',
    },
    Paladin: {
        role: 'Tank / Healer',
        description: 'High reduction and minor healing capabilities.',
        baseHp: 160,
        baseAtk: 8,
        baseDef: 8,
        range: 100,
        attackSpeed: 1.2,
        canHeal: true,
        color: '#ecf0f1',
    },
};

const CLASSES = Object.keys(CLASS_DEFINITIONS);

const generateCandidate = (cls, usedNames) => {
    if (!cls) cls = CLASSES[Math.floor(Math.random() * CLASSES.length)];
    const def = CLASS_DEFINITIONS[cls];

    return {
        name: generateUniqueName(usedNames),
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

    // Generate one candidate per class
    generateCandidates: () => {
        // Collect names already in use (party members)
        const partyNames = new Set(usePartyStore.getState().members.map(m => m.name));
        const usedNames = new Set(partyNames);
        const newCandidates = CLASSES.map(cls => {
            const candidate = generateCandidate(cls, usedNames);
            usedNames.add(candidate.name);
            return candidate;
        });
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

    freeReroll: () => {
        get().generateCandidates();
    },

    getGoldCost: () => {
        const partySize = usePartyStore.getState().members.length;
        // First 3 recruits are free (getting started), then gold cost scales
        if (partySize < 3) return 0;
        const { zone } = useGameStore.getState();
        return 50 + zone * 25;
    },

    recruit: (candidateIndex, x, y) => {
        // Enforce Lobby State
        const { gameState } = useGameStore.getState();
        if (gameState !== 'LOBBY') return false;

        const { candidates } = get();
        const candidate = candidates[candidateIndex];

        if (!candidate) return false;

        const { souls, removeSouls } = useMetaStore.getState();
        const { gold, removeGold } = useResourceStore.getState();
        const soulCost = 10;
        const goldCost = get().getGoldCost();

        if (souls < soulCost) {
            useToastStore.getState().addToast({ type: 'warning', message: 'Not enough Souls!', icon: '💎', color: '#e74c3c', duration: 2000 });
            return false;
        }
        if (gold < goldCost) {
            useToastStore.getState().addToast({ type: 'warning', message: `Need ${goldCost} Gold to recruit!`, icon: '💰', color: '#e74c3c', duration: 2000 });
            return false;
        }

        const success = usePartyStore.getState().addMember(candidate, x, y);
        if (success) {
            removeSouls(soulCost);
            removeGold(goldCost);
            set({ candidates: candidates.filter((_, i) => i !== candidateIndex) });
            return true;
        }
        return false;
    },

    reset: () => set({ candidates: [] }),
}));

export default useRecruitmentStore;
export { CLASS_DEFINITIONS, CLASSES };
