import { create } from 'zustand';
import usePartyStore from './usePartyStore';
import useResourceStore from './useResourceStore';
import useGameStore from './useGameStore';
import useToastStore from './useToastStore';
import { SALVAGE_YIELDS, RECIPES, RARITY_COLORS } from '../game/data/CraftingRecipes';

const MAX_ITEMS = 50;

const RARITY_SELL_MULT = {
    Common: 1,
    Uncommon: 3,
    Rare: 8,
    Epic: 20,
    Legendary: 50,
};

const RARITY_ORDER = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];

function getSellValue(item) {
    const statTotal = Object.values(item.stats || {}).reduce((sum, v) => sum + v, 0);
    const rarityMult = RARITY_SELL_MULT[item.rarity] || 1;
    return Math.max(1, Math.floor(statTotal * rarityMult));
}

const useInventoryStore = create((set, get) => ({
    items: [],

    isFull: () => get().items.length >= MAX_ITEMS,
    getMaxItems: () => MAX_ITEMS,

    addItem: (item) => {
        if (get().items.length >= MAX_ITEMS) {
            useToastStore.getState().addToast({
                type: 'warning',
                message: 'Inventory full! Sell items to make room.',
                icon: '📦',
                color: '#e67e22',
                duration: 3000,
            });
            return false;
        }
        set((state) => ({
            items: [...state.items, { ...item, instanceId: item.instanceId || Math.random().toString(36).substr(2, 9) }]
        }));
        return true;
    },

    removeItem: (instanceId) => set((state) => ({
        items: state.items.filter(i => i.instanceId !== instanceId)
    })),

    sellItem: (instanceId) => {
        const item = get().items.find(i => i.instanceId === instanceId);
        if (!item) return 0;

        const goldValue = getSellValue(item);
        useResourceStore.getState().addGold(goldValue);
        set((state) => ({
            items: state.items.filter(i => i.instanceId !== instanceId)
        }));
        useToastStore.getState().addGoldToast(goldValue);
        return goldValue;
    },

    sellAllBelow: (rarity) => {
        const cutoffIndex = RARITY_ORDER.indexOf(rarity);
        if (cutoffIndex < 0) return 0;

        const items = get().items;
        const toSell = items.filter(i => RARITY_ORDER.indexOf(i.rarity) < cutoffIndex);
        if (toSell.length === 0) return 0;

        let totalGold = 0;
        for (const item of toSell) {
            totalGold += getSellValue(item);
        }

        useResourceStore.getState().addGold(totalGold);
        set((state) => ({
            items: state.items.filter(i => RARITY_ORDER.indexOf(i.rarity) >= cutoffIndex)
        }));

        useToastStore.getState().addToast({
            type: 'gold',
            message: `Sold ${toSell.length} items for ${totalGold} gold`,
            icon: '💰',
            color: '#f1c40f',
            duration: 3000,
        });

        return totalGold;
    },

    // Upgrade an item: +20% stats, costs statValue * 10 gold, max 3 upgrades
    getUpgradeCost: (instanceId) => {
        const item = get().items.find(i => i.instanceId === instanceId);
        if (!item) return Infinity;
        const statTotal = Object.values(item.stats || {}).reduce((sum, v) => sum + v, 0);
        return Math.max(10, Math.floor(statTotal * 10));
    },

    upgradeItem: (instanceId) => {
        const items = get().items;
        const itemIndex = items.findIndex(i => i.instanceId === instanceId);
        if (itemIndex < 0) return false;

        const item = items[itemIndex];
        const upgradeCount = item.upgradeCount || 0;
        if (upgradeCount >= 3) {
            useToastStore.getState().addToast({ type: 'warning', message: 'Item fully upgraded!', icon: '⚒️', color: '#e67e22', duration: 2000 });
            return false;
        }

        const cost = get().getUpgradeCost(instanceId);
        const { gold, removeGold } = useResourceStore.getState();
        if (gold < cost) {
            useToastStore.getState().addToast({ type: 'warning', message: `Need ${cost} Gold to upgrade!`, icon: '💰', color: '#e74c3c', duration: 2000 });
            return false;
        }

        removeGold(cost);

        // Upgrade stats by 20%
        const newStats = {};
        for (const [key, val] of Object.entries(item.stats || {})) {
            newStats[key] = Math.floor(val * 1.2) || val + 1;
        }

        const upgradedItem = {
            ...item,
            stats: newStats,
            upgradeCount: upgradeCount + 1,
            name: upgradeCount === 0 ? item.name + ' +1' : item.name.replace(/\+\d+$/, `+${upgradeCount + 1}`),
        };

        set((state) => ({
            items: state.items.map(i => i.instanceId === instanceId ? upgradedItem : i)
        }));

        useToastStore.getState().addToast({ type: 'upgrade', message: `Upgraded ${upgradedItem.name}!`, icon: '⚒️', color: '#27ae60', duration: 3000 });
        return true;
    },

    // Equip an item from inventory onto a party member
    equipItem: (memberId, item) => {
        const slot = item.type; // mainHand, offHand, armor, trinket
        const member = usePartyStore.getState().members.find(m => m.id === memberId);
        if (!member) return false;

        // If slot already has an item, unequip it first
        const currentItem = member.equipment?.[slot];
        if (currentItem && currentItem.instanceId) {
            get().addItem(currentItem);
        }

        // Remove item from inventory
        set((state) => ({
            items: state.items.filter(i => i.instanceId !== item.instanceId)
        }));

        // Equip on party member
        usePartyStore.getState().equipItem(memberId, slot, item);
        return true;
    },

    // Unequip an item from a party member back to inventory
    unequipItem: (memberId, slot) => {
        const member = usePartyStore.getState().members.find(m => m.id === memberId);
        if (!member) return false;

        const item = member.equipment?.[slot];
        if (!item || !item.instanceId) return false;

        // Add back to inventory
        get().addItem(item);

        // Clear the slot
        usePartyStore.getState().equipItem(memberId, slot, null);
        return true;
    },

    // Get items that fit a specific slot
    getItemsForSlot: (slot) => {
        return get().items.filter(item => item.type === slot);
    },

    // ---- CRAFTING ----

    /** Salvage an item for materials. */
    salvageItem: (instanceId) => {
        const item = get().items.find(i => i.instanceId === instanceId);
        if (!item) return null;

        const yields = SALVAGE_YIELDS[item.rarity] || { scrap: 1 };
        const resStore = useResourceStore.getState();

        for (const [mat, amount] of Object.entries(yields)) {
            resStore.addMaterial(mat, amount);
        }

        // Remove item
        set((state) => ({
            items: state.items.filter(i => i.instanceId !== instanceId)
        }));

        // Feedback
        const yieldStr = Object.entries(yields).map(([k, v]) => `${v} ${k}`).join(', ');
        useToastStore.getState().addToast({
            type: 'salvage',
            message: `Salvaged: ${yieldStr}`,
            icon: '\u2699\uFE0F',
            color: '#95a5a6',
            duration: 2500,
        });

        return yields;
    },

    /** Salvage all items below a given rarity. */
    salvageAllBelow: (rarity) => {
        const cutoffIndex = RARITY_ORDER.indexOf(rarity);
        if (cutoffIndex < 0) return {};

        const items = get().items;
        const toSalvage = items.filter(i => RARITY_ORDER.indexOf(i.rarity) < cutoffIndex);
        if (toSalvage.length === 0) return {};

        const totalYields = {};
        const resStore = useResourceStore.getState();
        for (const item of toSalvage) {
            const yields = SALVAGE_YIELDS[item.rarity] || { scrap: 1 };
            for (const [mat, amount] of Object.entries(yields)) {
                totalYields[mat] = (totalYields[mat] || 0) + amount;
                resStore.addMaterial(mat, amount);
            }
        }

        set((state) => ({
            items: state.items.filter(i => RARITY_ORDER.indexOf(i.rarity) >= cutoffIndex)
        }));

        const yieldStr = Object.entries(totalYields).map(([k, v]) => `${v} ${k}`).join(', ');
        useToastStore.getState().addToast({
            type: 'salvage',
            message: `Salvaged ${toSalvage.length} items: ${yieldStr}`,
            icon: '\u2699\uFE0F',
            color: '#95a5a6',
            duration: 3000,
        });

        return totalYields;
    },

    /** Craft an item from a recipe. */
    craftItem: (recipeId) => {
        const recipe = RECIPES.find(r => r.id === recipeId);
        if (!recipe) return false;

        if (get().items.length >= MAX_ITEMS) {
            useToastStore.getState().addToast({ type: 'warning', message: 'Inventory full!', icon: '\uD83D\uDCE6', color: '#e67e22', duration: 2000 });
            return false;
        }

        // Check materials
        const { materials } = useResourceStore.getState();
        for (const [mat, amount] of Object.entries(recipe.cost)) {
            if ((materials[mat] || 0) < amount) {
                useToastStore.getState().addToast({ type: 'warning', message: `Not enough ${mat}!`, icon: '\u274C', color: '#e74c3c', duration: 2000 });
                return false;
            }
        }

        // Deduct materials
        const resStore = useResourceStore.getState();
        for (const [mat, amount] of Object.entries(recipe.cost)) {
            resStore.addMaterial(mat, -amount);
        }

        // Generate item
        const { type, rarity, statMult, base, stat } = recipe.result;
        const currentZone = useGameStore.getState().zone || 1;
        const statValue = Math.floor(base * statMult * (1 + currentZone * 0.25));
        const item = {
            id: `craft_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: recipe.name,
            type,
            rarity,
            rarityColor: RARITY_COLORS[rarity] || '#fff',
            stats: { [stat]: statValue },
            zone: currentZone,
            crafted: true,
        };

        get().addItem(item);
        useToastStore.getState().addToast({
            type: 'craft',
            message: `Crafted: ${item.name}!`,
            icon: '\u2728',
            color: RARITY_COLORS[rarity] || '#f1c40f',
            duration: 3000,
        });
        return true;
    },

    /** Check if player can afford a recipe. */
    canAffordRecipe: (recipeId) => {
        const recipe = RECIPES.find(r => r.id === recipeId);
        if (!recipe) return false;
        const { materials } = useResourceStore.getState();
        return Object.entries(recipe.cost).every(([mat, amount]) => (materials[mat] || 0) >= amount);
    },

    reset: () => set({ items: [] }),
}));

export default useInventoryStore;
export { MAX_ITEMS, getSellValue, RARITY_ORDER };
