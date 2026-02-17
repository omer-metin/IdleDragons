import { SFX } from './SFXLibrary';
import useSettingsStore from '../store/useSettingsStore';

class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.bgmGain = null;
        this.sfxGain = null;
        this.currentBgmNodes = [];
        this.activeBgm = null; // 'lobby', 'adventure', 'boss'
        this.initialized = false;

        // Subscribe to volume changes
        useSettingsStore.subscribe((state) => {
            if (this.initialized) {
                this.updateVolumes(state);
            }
        });
    }

    init() {
        if (this.initialized) return;

        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

        // Master Gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);

        // BGM Sub-mix
        this.bgmGain = this.ctx.createGain();
        this.bgmGain.connect(this.masterGain);

        // SFX Sub-mix
        this.sfxGain = this.ctx.createGain();
        this.sfxGain.connect(this.masterGain);

        this.initialized = true;
        this.updateVolumes(useSettingsStore.getState());

        // Resume if suspended (browser autoplay policy)
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    updateVolumes(state) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        this.masterGain.gain.setTargetAtTime(state.masterVolume, now, 0.1);
        this.bgmGain.gain.setTargetAtTime(state.musicVolume, now, 0.1);
        this.sfxGain.gain.setTargetAtTime(state.sfxVolume, now, 0.1);
    }

    playSFX(name) {
        if (!this.initialized || !SFX[name]) return;
        // Resume on first interaction if needed
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const vol = useSettingsStore.getState().sfxVolume * useSettingsStore.getState().masterVolume;
        if (vol <= 0.01) return; // Optimization

        // We pass the sfxGain node so the mixer controls volume
        // But individual SFX might need their own envelope. 
        // Best practice: Pass context and sfxGain destination.
        // SFXLibrary functions expect (ctx, destination, volumeMultiplier)
        // We pass 1.0 as volume to the function, and let the mixer handle the global volume.
        // wait, SFXLibrary uses `vol` parameter for internal gain. 
        // If we connect to sfxGain, that node already applies sfxVolume * masterVolume (via hierarchy).
        // So we should pass 1.0 to SFX library? 
        // Actually, let's pass 1.0 and let the sfxGain handle the scaling.
        // Wait, updateVolumes sets sfxGain.gain to state.sfxVolume.
        // Master sets masterGain.gain to state.masterVolume.
        // So total gain is master * sfx.
        // So passing 1.0 to SFX is correct.

        try {
            SFX[name](this.ctx, this.sfxGain, 1.0);
        } catch (e) {
            console.warn(`Error playing SFX ${name}:`, e);
        }
    }

    stopBGM(fadeDuration = 1.0) {
        if (!this.currentBgmNodes.length) return;
        const now = this.ctx.currentTime;

        this.currentBgmNodes.forEach(({ node, gain }) => {
            try {
                gain.gain.cancelScheduledValues(now);
                gain.gain.setValueAtTime(gain.gain.value, now);
                gain.gain.linearRampToValueAtTime(0, now + fadeDuration);
                node.stop(now + fadeDuration);
            } catch (e) { /* ignore */ }
        });

        this.currentBgmNodes = [];
        this.activeBgm = null;
    }

    startBGM(type) {
        if (!this.initialized) return;
        if (this.activeBgm === type) return;

        // Crossfade
        this.stopBGM(2.0);
        this.activeBgm = type;

        const now = this.ctx.currentTime;
        const nodes = [];

        // Helper to add oscillator node
        const addOsc = (type, freq, vol, detune = 0) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            osc.detune.value = detune;

            gain.gain.value = 0;
            gain.gain.linearRampToValueAtTime(vol, now + 2.0); // Fade in

            osc.connect(gain).connect(this.bgmGain);
            osc.start(now);
            nodes.push({ node: osc, gain });
        };

        // Helper to add noise node
        const addNoise = (filterType, freq, vol) => {
            const bufferSize = this.ctx.sampleRate * 2;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            noise.loop = true;

            const filter = this.ctx.createBiquadFilter();
            filter.type = filterType;
            filter.frequency.value = freq;
            const gain = this.ctx.createGain();

            gain.gain.value = 0;
            gain.gain.linearRampToValueAtTime(vol, now + 2.0);

            noise.connect(filter).connect(gain).connect(this.bgmGain);
            noise.start(now);
            nodes.push({ node: noise, gain });
        };

        if (type === 'lobby') {
            // "The Gathering" - Cm9 pad (C - Eb - G - Bb - D)
            addOsc('sine', 65.41, 0.1); // C2
            addOsc('triangle', 130.81, 0.05); // C3
            addOsc('triangle', 155.56, 0.04); // Eb3
            addOsc('triangle', 196.00, 0.04); // G3
            addNoise('lowpass', 200, 0.02);

        } else if (type === 'adventure') {
            // "The March" - Cm add9 (more rhythmic/forward)
            addOsc('sawtooth', 65.41, 0.08); // C2
            addOsc('triangle', 130.81, 0.06); // C3
            addOsc('triangle', 196.00, 0.05); // G3
            addOsc('sine', 392.00, 0.02); // G4

            // LFO for rhythm
            const lfo = this.ctx.createOscillator();
            lfo.frequency.value = 2.0; // 120bpm feel
            const lfoGain = this.ctx.createGain();
            lfoGain.gain.value = 100;

            // Connect LFO to something? For now simple drone is safer for CPU/complexity
            // Let's just add detuned saws for thickness
            addOsc('sawtooth', 65.41, 0.04, 5);
            addOsc('sawtooth', 65.41, 0.04, -5);

        } else if (type === 'boss') {
            // "The Challenge" - Dissonant/Tense
            addOsc('sawtooth', 58.27, 0.15); // Bb1 (Low rumble)
            addOsc('sawtooth', 116.54, 0.08); // Bb2
            addOsc('square', 174.61, 0.05); // F3
            addOsc('sawtooth', 233.08, 0.04); // Bb3
            addOsc('triangle', 246.94, 0.03); // B3 (Tritone clash against F)

            addNoise('bandpass', 100, 0.05);
        }

        this.currentBgmNodes = nodes;
    }
}

export default new AudioManager();
