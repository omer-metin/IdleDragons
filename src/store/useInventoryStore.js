import { create } from 'zustand';
import usePartyStore from './usePartyStore';

const useInventoryStore = create((set, get) => ({
    items: [],

    addItem: (item) => set((state) => ({
        items: [...state.items, { ...item, instanceId: item.instanceId || Math.random().toString(36).substr(2, 9) }]
    })),

    removeItem: (instanceId) => set((state) => ({
        items: state.items.filter(i => i.instanceId !== instanceId)
    })),

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

    reset: () => set({ items: [] }),
}));

export default useInventoryStore;
