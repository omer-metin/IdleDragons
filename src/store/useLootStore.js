import { create } from 'zustand';
import useInventoryStore from './useInventoryStore';
import useAchievementStore from './useAchievementStore';

const RARITY_WEIGHTS = [
    { rarity: 'Common', weight: 55, color: '#95a5a6', statMult: 1.0 },
    { rarity: 'Uncommon', weight: 25, color: '#27ae60', statMult: 1.5 },
    { rarity: 'Rare', weight: 12, color: '#2980b9', statMult: 2.5 },
    { rarity: 'Epic', weight: 3, color: '#8e44ad', statMult: 4.0 },
    { rarity: 'Legendary', weight: 1, color: '#ff6600', statMult: 6.0 },
];

const ITEM_TYPES = [
    { type: 'mainHand', name: 'Sword', stat: 'atk', base: 5 },
    { type: 'mainHand', name: 'Staff', stat: 'atk', base: 6 },
    { type: 'mainHand', name: 'Bow', stat: 'atk', base: 5 },
    { type: 'offHand', name: 'Shield', stat: 'def', base: 4 },
    { type: 'armor', name: 'Armor', stat: 'def', base: 5 },
    { type: 'trinket', name: 'Amulet', stat: 'hp', base: 20 },
    { type: 'trinket', name: 'Ring', stat: 'atk', base: 3 },
];

const PREFIXES = {
    Common: ['Rusty', 'Old', 'Simple'],
    Uncommon: ['Sturdy', 'Fine', 'Polished'],
    Rare: ['Enchanted', 'Gleaming', 'Arcane'],
    Epic: ['Legendary', 'Mythic', 'Divine'],
    Legendary: ['Ancient', 'Primordial', 'Godforged'],
};

const SUFFIXES = ['of Might', 'of Warding', 'of Vitality', 'of the Bear', 'of the Eagle', 'of the Serpent'];

function rollRarity() {
    const totalWeight = RARITY_WEIGHTS.reduce((sum, r) => sum + r.weight, 0);
    let roll = Math.random() * totalWeight;
    for (const r of RARITY_WEIGHTS) {
        roll -= r.weight;
        if (roll <= 0) return r;
    }
    return RARITY_WEIGHTS[0];
}

const useLootStore = create((set, get) => ({
    dropChance: 0.5, // 50% chance for better feedback loops

    rollLoot: (zone) => {
        if (Math.random() > get().dropChance) return null;

        // Check inventory cap before generating
        if (useInventoryStore.getState().isFull()) return null;

        const rarity = rollRarity();
        const itemType = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
        const prefixes = PREFIXES[rarity.rarity];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];

        // Add suffix for Rare+ items
        const hasSuffix = rarity.statMult >= 2.5 && Math.random() > 0.4;
        const suffix = hasSuffix ? SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)] : '';

        const statValue = Math.floor(itemType.base * rarity.statMult * (1 + zone * 0.25));

        const item = {
            id: `loot_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: `${prefix} ${itemType.name}${suffix ? ' ' + suffix : ''}`,
            type: itemType.type,
            rarity: rarity.rarity,
            rarityColor: rarity.color,
            stats: {
                [itemType.stat]: statValue,
            },
            zone: zone,
        };

        // Add to inventory (may fail if full)
        const added = useInventoryStore.getState().addItem(item);
        if (!added) return null;

        // Track for achievements
        useAchievementStore.getState().trackItem(rarity.rarity);

        return item;
    },
}));

export default useLootStore;
export { RARITY_WEIGHTS };
