/**
 * Crafting recipes. Each recipe costs materials (from salvaging) and produces an item.
 * Material types: Scrap (Common/Uncommon), Essence (Rare/Epic), Crystal (Legendary).
 */

export const MATERIAL_NAMES = {
    scrap: { name: 'Scrap Metal', icon: '\u2699\uFE0F', color: '#95a5a6' },
    essence: { name: 'Arcane Essence', icon: '\uD83D\uDD2E', color: '#8e44ad' },
    crystal: { name: 'Void Crystal', icon: '\uD83D\uDC8E', color: '#ff6600' },
};

/**
 * Salvage yields by rarity.
 */
export const SALVAGE_YIELDS = {
    Common:    { scrap: 1 },
    Uncommon:  { scrap: 3 },
    Rare:      { scrap: 2, essence: 1 },
    Epic:      { scrap: 3, essence: 3 },
    Legendary: { scrap: 5, essence: 5, crystal: 1 },
};

/**
 * Crafting recipes. Each produces one item.
 */
export const RECIPES = [
    {
        id: 'craft_uncommon_weapon',
        name: 'Forged Blade',
        desc: 'Craft an Uncommon weapon.',
        cost: { scrap: 8 },
        result: { type: 'mainHand', rarity: 'Uncommon', statMult: 1.5, base: 5, stat: 'atk' },
    },
    {
        id: 'craft_uncommon_armor',
        name: 'Reinforced Armor',
        desc: 'Craft an Uncommon armor piece.',
        cost: { scrap: 10 },
        result: { type: 'armor', rarity: 'Uncommon', statMult: 1.5, base: 5, stat: 'def' },
    },
    {
        id: 'craft_rare_weapon',
        name: 'Enchanted Blade',
        desc: 'Craft a Rare weapon.',
        cost: { scrap: 12, essence: 3 },
        result: { type: 'mainHand', rarity: 'Rare', statMult: 2.5, base: 5, stat: 'atk' },
    },
    {
        id: 'craft_rare_armor',
        name: 'Warded Plate',
        desc: 'Craft a Rare armor piece.',
        cost: { scrap: 15, essence: 3 },
        result: { type: 'armor', rarity: 'Rare', statMult: 2.5, base: 5, stat: 'def' },
    },
    {
        id: 'craft_rare_trinket',
        name: 'Mystic Amulet',
        desc: 'Craft a Rare trinket.',
        cost: { scrap: 8, essence: 4 },
        result: { type: 'trinket', rarity: 'Rare', statMult: 2.5, base: 20, stat: 'hp' },
    },
    {
        id: 'craft_epic_weapon',
        name: 'Mythic Blade',
        desc: 'Craft an Epic weapon.',
        cost: { scrap: 20, essence: 8, crystal: 1 },
        result: { type: 'mainHand', rarity: 'Epic', statMult: 4.0, base: 5, stat: 'atk' },
    },
    {
        id: 'craft_epic_armor',
        name: 'Divine Plate',
        desc: 'Craft an Epic armor piece.',
        cost: { scrap: 25, essence: 8, crystal: 1 },
        result: { type: 'armor', rarity: 'Epic', statMult: 4.0, base: 5, stat: 'def' },
    },
    {
        id: 'craft_legendary_weapon',
        name: 'Godforged Blade',
        desc: 'Craft a Legendary weapon.',
        cost: { scrap: 40, essence: 15, crystal: 5 },
        result: { type: 'mainHand', rarity: 'Legendary', statMult: 6.0, base: 5, stat: 'atk' },
    },
];

/** Rarity colors for reference. */
export const RARITY_COLORS = {
    Common: '#95a5a6',
    Uncommon: '#27ae60',
    Rare: '#2980b9',
    Epic: '#8e44ad',
    Legendary: '#ff6600',
};
