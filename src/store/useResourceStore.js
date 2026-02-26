import { create } from 'zustand';
import useAdStore from './useAdStore';

const useResourceStore = create((set, get) => ({
    gold: 0,
    xp: 0,
    materials: {}, // @planned — reserved for crafting system (Phase 2+)

    addGold: (amount) => set((state) => {
        const isBoostActive = useAdStore.getState().goldBoostActive;
        const finalAmount = isBoostActive ? amount * 2 : amount;
        return { gold: state.gold + finalAmount };
    }),
    removeGold: (amount) => set((state) => ({ gold: Math.max(0, state.gold - amount) })),

    addXp: (amount) => set((state) => ({ xp: state.xp + amount })),

    addMaterial: (material, amount) => set((state) => ({
        materials: {
            ...state.materials,
            [material]: (state.materials[material] || 0) + amount,
        },
    })),

    reset: () => set({ gold: 0, xp: 0, materials: {} }),
}));

export default useResourceStore;
