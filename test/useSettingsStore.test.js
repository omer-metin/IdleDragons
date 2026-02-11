import { describe, it, expect, beforeEach } from 'vitest';
import useSettingsStore from '../src/store/useSettingsStore';

describe('useSettingsStore', () => {
    beforeEach(() => {
        useSettingsStore.setState({
            masterVolume: 0.5,
            sfxVolume: 0.5,
            musicVolume: 0.5,
            showDamageNumbers: true,
        });
    });

    it('has correct default values', () => {
        const state = useSettingsStore.getState();
        expect(state.masterVolume).toBe(0.5);
        expect(state.sfxVolume).toBe(0.5);
        expect(state.musicVolume).toBe(0.5);
        expect(state.showDamageNumbers).toBe(true);
    });

    it('setVolume updates specific volume type', () => {
        useSettingsStore.getState().setVolume('master', 0.8);
        expect(useSettingsStore.getState().masterVolume).toBe(0.8);
    });

    it('setVolume sfx to 0', () => {
        useSettingsStore.getState().setVolume('sfx', 0);
        expect(useSettingsStore.getState().sfxVolume).toBe(0);
    });

    it('setVolume does not affect other volumes', () => {
        useSettingsStore.getState().setVolume('master', 1.0);
        expect(useSettingsStore.getState().sfxVolume).toBe(0.5);
        expect(useSettingsStore.getState().musicVolume).toBe(0.5);
    });

    it('toggleDamageNumbers flips true to false', () => {
        useSettingsStore.getState().toggleDamageNumbers();
        expect(useSettingsStore.getState().showDamageNumbers).toBe(false);
    });

    it('toggleDamageNumbers twice returns to true', () => {
        useSettingsStore.getState().toggleDamageNumbers();
        useSettingsStore.getState().toggleDamageNumbers();
        expect(useSettingsStore.getState().showDamageNumbers).toBe(true);
    });
});
