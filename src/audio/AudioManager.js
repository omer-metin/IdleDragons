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
        this.stopMelodyLoop();
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

            // Melodic arpeggio layer
            this.startMelodyLoop('lobby', [
                261.63, 311.13, 392.00, 466.16, 392.00, 311.13, // Cm9 arp
            ], 0.4, 0.06, 'triangle');

        } else if (type === 'adventure') {
            // "The March" - Cm drone + melody
            addOsc('sawtooth', 65.41, 0.08); // C2
            addOsc('triangle', 130.81, 0.06); // C3
            addOsc('triangle', 196.00, 0.05); // G3
            addOsc('sawtooth', 65.41, 0.04, 5);
            addOsc('sawtooth', 65.41, 0.04, -5);

            // Melodic loop — pentatonic march
            this.startMelodyLoop('adventure', [
                261.63, 293.66, 349.23, 392.00, 349.23, 293.66,  // C D F G F D
                261.63, 196.00, 261.63, 293.66, 349.23, 392.00,  // C G4 C D F G
            ], 0.25, 0.08, 'square');

        } else if (type === 'boss') {
            // "The Challenge" - Dissonant/Tense
            addOsc('sawtooth', 58.27, 0.15); // Bb1
            addOsc('sawtooth', 116.54, 0.08); // Bb2
            addOsc('square', 174.61, 0.05); // F3
            addOsc('sawtooth', 233.08, 0.04); // Bb3
            addOsc('triangle', 246.94, 0.03); // B3 (Tritone)
            addNoise('bandpass', 100, 0.05);

            // Aggressive melody loop
            this.startMelodyLoop('boss', [
                233.08, 246.94, 233.08, 174.61, // Bb B Bb F
                233.08, 311.13, 293.66, 233.08, // Bb Eb D Bb
            ], 0.2, 0.1, 'sawtooth');
        }

        this.currentBgmNodes = nodes;
    }

    /** Play a looping melody sequence on top of the BGM drone. */
    startMelodyLoop(id, notes, noteDuration, vol, oscType = 'sine') {
        this.stopMelodyLoop();

        let noteIndex = 0;
        const playNote = () => {
            if (!this.initialized || !this.ctx || this.activeBgm !== id) {
                this.melodyInterval = null;
                return;
            }

            const t = this.ctx.currentTime;
            const freq = notes[noteIndex % notes.length];
            noteIndex++;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = oscType;
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(vol, t + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, t + noteDuration * 0.9);

            osc.connect(gain).connect(this.bgmGain);
            osc.start(t);
            osc.stop(t + noteDuration);
        };

        // Play first note immediately, then loop
        playNote();
        this.melodyInterval = setInterval(playNote, noteDuration * 1000);
    }

    stopMelodyLoop() {
        if (this.melodyInterval) {
            clearInterval(this.melodyInterval);
            this.melodyInterval = null;
        }
    }

    mute() {
        if (!this.ctx || !this.masterGain) return;
        this._preMuteVolume = this.masterGain.gain.value;
        this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }

    unmute() {
        if (!this.ctx || !this.masterGain) return;
        const vol = this._preMuteVolume ?? useSettingsStore.getState().masterVolume;
        this.masterGain.gain.setValueAtTime(vol, this.ctx.currentTime);
        this._preMuteVolume = null;
    }
}

export default new AudioManager();
