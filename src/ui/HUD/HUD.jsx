import React from 'react';
import useResourceStore from '../../store/useResourceStore';
import useGameStore from '../../store/useGameStore';
import { Coins, Swords, Pause, Play, Zap, FastForward } from 'lucide-react';

const HUD = () => {
    const { gold, xp } = useResourceStore();
    const { isRunning, zone, wave, wavesPerZone, totalKills, togglePause, timeMultiplier, setTimeMultiplier } = useGameStore();

    const speedOptions = [1, 2, 5];

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            padding: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            pointerEvents: 'none',
            color: 'white',
            fontFamily: 'sans-serif',
            boxSizing: 'border-box'
        }}>
            {/* Top Left: Resources */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem 1rem', borderRadius: '12px', pointerEvents: 'auto' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Coins size={18} color="#f1c40f" />
                        <span style={{ fontWeight: 'bold' }}>{gold}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Swords size={18} color="#3498db" />
                        <span style={{ fontWeight: 'bold' }}>{xp}</span>
                    </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#95a5a6' }}>
                    Kills: {totalKills}
                </div>
            </div>

            {/* Top Center: Zone/Wave */}
            <div className="glass-panel" style={{ textAlign: 'center', padding: '0.5rem 1.5rem', borderRadius: '12px', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>Zone {zone}</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Wave {wave}/{wavesPerZone}</div>
                {wave === wavesPerZone && (
                    <div style={{
                        marginTop: '0.3rem',
                        padding: '0.2rem 0.8rem',
                        background: 'linear-gradient(135deg, #c0392b, #e74c3c)',
                        borderRadius: '10px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        color: '#fff',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        animation: 'pulse 1.5s infinite',
                        boxShadow: '0 0 10px rgba(231, 76, 60, 0.5)',
                    }}>
                        ⚔️ BOSS WAVE
                    </div>
                )}
            </div>

            {/* Top Right: Controls */}
            <div style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                    onClick={togglePause}
                    className="glass-panel"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: isRunning ? 'rgba(0,0,0,0.3)' : 'var(--accent-primary)',
                        color: 'white',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    {isRunning ? <Pause size={16} /> : <Play size={16} />}
                    {isRunning ? 'PAUSE' : 'RESUME'}
                </button>

                {/* Speed Controls */}
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                    {speedOptions.map(speed => (
                        <button
                            key={speed}
                            onClick={() => setTimeMultiplier(speed)}
                            className="glass-panel"
                            style={{
                                flex: 1,
                                padding: '0.3rem 0.5rem',
                                background: timeMultiplier === speed ? '#8e44ad' : 'rgba(0,0,0,0.3)',
                                color: 'white',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                fontSize: '0.75rem'
                            }}
                        >
                            {speed}x
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => useGameStore.getState().openPanel('meta')}
                    className="glass-panel"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        background: '#8e44ad',
                        color: 'white',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}
                >
                    DM
                </button>
            </div>
        </div>
    );
};

export default HUD;
