import { create } from 'zustand';

const useResourceStore = create((set, get) => ({
    gold: 0,
    xp: 0,
    materials: {},

    addGold: (amount) => set((state) => ({ gold: state.gold + amount })),
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
