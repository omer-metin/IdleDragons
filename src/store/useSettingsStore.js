import { create } from 'zustand';

const useSettingsStore = create((set) => ({
    masterVolume: 0.5,
    sfxVolume: 0.5,
    musicVolume: 0.5,
    showDamageNumbers: true,

    setVolume: (type, level) => set((state) => ({ [`${type}Volume`]: level })),
    toggleDamageNumbers: () => set((state) => ({ showDamageNumbers: !state.showDamageNumbers })),
}));

export default useSettingsStore;
