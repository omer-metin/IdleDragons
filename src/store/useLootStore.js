import { create } from 'zustand';
import useInventoryStore from './useInventoryStore';

const RARITY_WEIGHTS = [
    { rarity: 'Common', weight: 60, color: '#95a5a6', statMult: 1.0 },
    { rarity: 'Uncommon', weight: 25, color: '#27ae60', statMult: 1.5 },
    { rarity: 'Rare', weight: 12, color: '#2980b9', statMult: 2.5 },
    { rarity: 'Epic', weight: 3, color: '#8e44ad', statMult: 4.0 },
];

const ITEM_TYPES = [
    { type: 'mainHand', name: 'Sword', stat: 'atk', base: 3 },
    { type: 'offHand', name: 'Shield', stat: 'def', base: 2 },
    { type: 'armor', name: 'Armor', stat: 'def', base: 3 },
    { type: 'trinket', name: 'Amulet', stat: 'hp', base: 10 },
];

const PREFIXES = {
    Common: ['Rusty', 'Old', 'Simple'],
    Uncommon: ['Sturdy', 'Fine', 'Polished'],
    Rare: ['Enchanted', 'Gleaming', 'Arcane'],
    Epic: ['Legendary', 'Mythic', 'Divine'],
};

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
    dropChance: 0.3, // 30% chance per enemy kill

    rollLoot: (zone) => {
        if (Math.random() > get().dropChance) return null;

        const rarity = rollRarity();
        const itemType = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
        const prefixes = PREFIXES[rarity.rarity];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];

        const statValue = Math.floor(itemType.base * rarity.statMult * (1 + zone * 0.15));

        const item = {
            id: `loot_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: `${prefix} ${itemType.name}`,
            type: itemType.type,
            rarity: rarity.rarity,
            rarityColor: rarity.color,
            stats: {
                [itemType.stat]: statValue,
            },
            zone: zone,
        };

        // Add to inventory
        useInventoryStore.getState().addItem(item);

        return item;
    },
}));

export default useLootStore;
