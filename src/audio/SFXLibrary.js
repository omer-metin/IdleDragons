/**
 * Procedural Sound Effects Library
 * All sounds are synthesized at runtime using Web Audio API.
 * No external audio files required.
 */

// Helper: Create a noise buffer
const createNoiseBuffer = (ctx) => {
    const bufferSize = ctx.sampleRate * 2; // 2 seconds of noise
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    return buffer;
};

let noiseBuffer = null;

const getNoiseBuffer = (ctx) => {
    if (!noiseBuffer) {
        noiseBuffer = createNoiseBuffer(ctx);
    }
    return noiseBuffer;
};

export const SFX = {
    // Combat Sounds
    hit_melee: (ctx, dest, vol) => {
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        // White noise burst for impact
        const noise = ctx.createBufferSource();
        noise.buffer = getNoiseBuffer(ctx);
        const noiseGain = ctx.createGain();

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, t);
        filter.frequency.exponentialRampToValueAtTime(100, t + 0.1);

        noiseGain.gain.setValueAtTime(vol, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

        noise.connect(filter).connect(noiseGain).connect(dest);
        noise.start(t);
        noise.stop(t + 0.1);

        // Low thud
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(0.001, t + 0.1);
        gain.gain.setValueAtTime(vol * 0.8, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

        osc.connect(gain).connect(dest);
        osc.start(t);
        osc.stop(t + 0.1);
    },

    hit_arrow: (ctx, dest, vol) => {
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.frequency.setValueAtTime(2000, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.15);

        gain.gain.setValueAtTime(vol * 0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

        osc.connect(gain).connect(dest);
        osc.start(t);
        osc.stop(t + 0.15);
    },

    hit_magic: (ctx, dest, vol) => {
        const t = ctx.currentTime;
        // Chord
        [440, 554, 659].forEach(freq => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(vol * 0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

            osc.connect(gain).connect(dest);
            osc.start(t);
            osc.stop(t + 0.3);
        });

        // Sparkle
        const noise = ctx.createBufferSource();
        noise.buffer = getNoiseBuffer(ctx);
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 2000;
        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(vol * 0.1, t);
        nGain.gain.linearRampToValueAtTime(0, t + 0.2);

        noise.connect(filter).connect(nGain).connect(dest);
        noise.start(t);
        noise.stop(t + 0.2);
    },

    hit_enemy_attack: (ctx, dest, vol) => {
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);

        gain.gain.setValueAtTime(vol * 0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

        osc.connect(gain).connect(dest);
        osc.start(t);
        osc.stop(t + 0.1);
    },

    heal: (ctx, dest, vol) => {
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.linearRampToValueAtTime(800, t + 0.4);

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(vol * 0.4, t + 0.1);
        gain.gain.linearRampToValueAtTime(0, t + 0.4);

        osc.connect(gain).connect(dest);
        osc.start(t);
        osc.stop(t + 0.4);
    },

    enemy_death: (ctx, dest, vol) => {
        const t = ctx.currentTime;
        const noise = ctx.createBufferSource();
        noise.buffer = getNoiseBuffer(ctx);
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, t);
        filter.frequency.exponentialRampToValueAtTime(100, t + 0.2);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(vol * 0.6, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

        noise.connect(filter).connect(gain).connect(dest);
        noise.start(t);
        noise.stop(t + 0.2);
    },

    boss_death: (ctx, dest, vol) => {
        const t = ctx.currentTime;
        // Rumble
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, t);
        osc.frequency.exponentialRampToValueAtTime(10, t + 1.0);
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(vol, t);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
        osc.connect(oscGain).connect(dest);
        osc.start(t);
        osc.stop(t + 1.0);

        // Crash
        const noise = ctx.createBufferSource();
        noise.buffer = getNoiseBuffer(ctx);
        const nGain = ctx.createGain();
        nGain.gain.setValueAtTime(vol, t);
        nGain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
        noise.connect(nGain).connect(dest);
        noise.start(t);
        noise.stop(t + 1.5);
    },

    level_up: (ctx, dest, vol) => {
        const t = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C E G C
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.value = freq;

            const start = t + i * 0.08;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(vol * 0.2, start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);

            osc.connect(gain).connect(dest);
            osc.start(start);
            osc.stop(start + 0.5);
        });
    },

    loot_drop: (ctx, dest, vol) => {
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(2000, t);
        gain.gain.setValueAtTime(vol * 0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.connect(gain).connect(dest);
        osc.start(t);
        osc.stop(t + 0.1);
    },

    loot_rare: (ctx, dest, vol) => {
        const t = ctx.currentTime;
        [2000, 3000].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const start = t + i * 0.05;
            gain.gain.setValueAtTime(vol * 0.3, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
            osc.connect(gain).connect(dest);
            osc.start(start);
            osc.stop(start + 0.3);
        });
    },

    wave_clear: (ctx, dest, vol) => {
        const t = ctx.currentTime;
        [523.25, 659.25, 783.99].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const start = t + i * 0.1;
            gain.gain.setValueAtTime(vol * 0.2, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
            osc.connect(gain).connect(dest);
            osc.start(start);
            osc.stop(start + 0.3);
        });
    },

    boss_wave_start: (ctx, dest, vol) => {
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.linearRampToValueAtTime(50, t + 0.5);
        gain.gain.setValueAtTime(vol * 0.5, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.5);
        osc.connect(gain).connect(dest);
        osc.start(t);
        osc.stop(t + 0.5);
    },

    tpk: (ctx, dest, vol) => {
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(50, t);
        osc.frequency.exponentialRampToValueAtTime(10, t + 1.5);
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
        osc.connect(gain).connect(dest);
        osc.start(t);
        osc.stop(t + 1.5);
    },

    recruit: (ctx, dest, vol) => {
        const t = ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => { // Major chord
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            const start = t + i * 0.05;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(vol * 0.2, start + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
            osc.connect(gain).connect(dest);
            osc.start(start);
            osc.stop(start + 0.4);
        });
    },

    equip: (ctx, dest, vol) => {
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(3000, t);
        gain.gain.setValueAtTime(vol * 0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.connect(gain).connect(dest);
        osc.start(t);
        osc.stop(t + 0.05);
    },

    button_click: (ctx, dest, vol) => {
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(800, t);
        gain.gain.setValueAtTime(vol * 0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.connect(gain).connect(dest);
        osc.start(t);
        osc.stop(t + 0.05);
    },

    button_hover: (ctx, dest, vol) => {
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(1200, t);
        gain.gain.setValueAtTime(vol * 0.02, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
        osc.connect(gain).connect(dest);
        osc.start(t);
        osc.stop(t + 0.02);
    },

    ui_start_game: (ctx, dest, vol) => {
        const t = ctx.currentTime;
        // Ascending fanfare — C5 E5 G5 C6
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const start = t + i * 0.1;
            gain.gain.setValueAtTime(0, start);
            gain.gain.linearRampToValueAtTime(vol * 0.25, start + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
            osc.connect(gain).connect(dest);
            osc.start(start);
            osc.stop(start + 0.5);
        });
    },

    panel_open: (ctx, dest, vol) => {
        const t = ctx.currentTime;
        const noise = ctx.createBufferSource();
        noise.buffer = getNoiseBuffer(ctx);
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, t);
        filter.frequency.linearRampToValueAtTime(1000, t + 0.15);

        gain.gain.setValueAtTime(vol * 0.2, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.15);

        noise.connect(filter).connect(gain).connect(dest);
        noise.start(t);
        noise.stop(t + 0.15);
    },

    panel_close: (ctx, dest, vol) => {
        const t = ctx.currentTime;
        const noise = ctx.createBufferSource();
        noise.buffer = getNoiseBuffer(ctx);
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, t);
        filter.frequency.linearRampToValueAtTime(200, t + 0.1);

        gain.gain.setValueAtTime(vol * 0.2, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.1);

        noise.connect(filter).connect(gain).connect(dest);
        noise.start(t);
        noise.stop(t + 0.1);
    },

    gold_gain: (ctx, dest, vol) => {
        const t = ctx.currentTime;
        [2000, 2500].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, t);
            const start = t + i * 0.05;
            gain.gain.setValueAtTime(vol * 0.15, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.1);
            osc.connect(gain).connect(dest);
            osc.start(start);
            osc.stop(start + 0.2);
        });
    },

    upgrade_buy: (ctx, dest, vol) => {
        const t = ctx.currentTime;
        [440, 880].forEach(freq => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(vol * 0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
            osc.connect(gain).connect(dest);
            osc.start(t);
            osc.stop(t + 0.3);
        });
    },

    // Skill activation — whoosh + sparkle
    skill_activate: (ctx, dest, vol) => {
        const t = ctx.currentTime;
        // Whoosh sweep
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(1200, t + 0.15);
        gain.gain.setValueAtTime(vol * 0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(gain).connect(dest);
        osc.start(t);
        osc.stop(t + 0.2);
        // Sparkle
        [1200, 1600, 2000].forEach((freq, i) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'sine';
            o.frequency.value = freq;
            const s = t + 0.05 + i * 0.03;
            g.gain.setValueAtTime(vol * 0.15, s);
            g.gain.exponentialRampToValueAtTime(0.001, s + 0.15);
            o.connect(g).connect(dest);
            o.start(s);
            o.stop(s + 0.15);
        });
    },

    // Crafting — anvil hit
    craft_success: (ctx, dest, vol) => {
        const t = ctx.currentTime;
        // Metal clang
        [800, 1200, 1600].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            const s = t + i * 0.04;
            gain.gain.setValueAtTime(vol * 0.25, s);
            gain.gain.exponentialRampToValueAtTime(0.001, s + 0.3);
            osc.connect(gain).connect(dest);
            osc.start(s);
            osc.stop(s + 0.3);
        });
        // Impact thud
        const lo = ctx.createOscillator();
        const loG = ctx.createGain();
        lo.frequency.setValueAtTime(100, t);
        lo.frequency.exponentialRampToValueAtTime(40, t + 0.15);
        loG.gain.setValueAtTime(vol * 0.4, t);
        loG.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        lo.connect(loG).connect(dest);
        lo.start(t);
        lo.stop(t + 0.15);
    },

    // Salvage — grinding
    salvage: (ctx, dest, vol) => {
        const t = ctx.currentTime;
        const noise = ctx.createBufferSource();
        noise.buffer = getNoiseBuffer(ctx);
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2000, t);
        filter.frequency.linearRampToValueAtTime(500, t + 0.3);
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(vol * 0.3, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.3);
        noise.connect(filter).connect(gain).connect(dest);
        noise.start(t);
        noise.stop(t + 0.3);
    },

    // Achievement unlock — triumphant arpeggio
    achievement: (ctx, dest, vol) => {
        const t = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C E G C' E'
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const s = t + i * 0.06;
            gain.gain.setValueAtTime(0, s);
            gain.gain.linearRampToValueAtTime(vol * 0.2, s + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, s + 0.5);
            osc.connect(gain).connect(dest);
            osc.start(s);
            osc.stop(s + 0.5);
        });
    },

    // Zone transition — rising sweep
    zone_advance: (ctx, dest, vol) => {
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(1200, t + 0.6);
        gain.gain.setValueAtTime(vol * 0.3, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.6);
        osc.connect(gain).connect(dest);
        osc.start(t);
        osc.stop(t + 0.6);
    },

    // UI click (alias)
    ui_click: (ctx, dest, vol) => {
        const t = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(800, t);
        gain.gain.setValueAtTime(vol * 0.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.connect(gain).connect(dest);
        osc.start(t);
        osc.stop(t + 0.05);
    },
};
