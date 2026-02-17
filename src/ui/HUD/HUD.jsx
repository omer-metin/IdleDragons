import React from 'react';
import useResourceStore from '../../store/useResourceStore';
import useGameStore from '../../store/useGameStore';
import { Coins, Swords, Pause, Play, Zap, FastForward, Skull, TrendingUp, LogOut } from 'lucide-react';
import GameButton from '../components/GameButton';
import AudioManager from '../../audio/AudioManager';

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
            height: '100%',
            padding: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start', // Align top items
            pointerEvents: 'none',
            color: 'white',
            fontFamily: 'sans-serif',
            boxSizing: 'border-box'
        }}>
            {/* Top Left: Resources */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '0.6rem 1rem', borderRadius: 'var(--radius-lg)', pointerEvents: 'auto', minWidth: '140px' }}>
                <div style={{ display: 'flex', gap: '1.2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} title="Gold">
                        <Coins size={18} color="var(--accent-gold)" />
                        <span className="font-display" style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--accent-gold)' }}>{gold}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} title="XP">
                        <Swords size={18} color="var(--accent-info)" />
                        <span className="font-display" style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--accent-info)' }}>{xp}</span>
                    </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Kills</span> <span style={{ color: 'white' }}>{totalKills}</span>
                </div>
            </div>

            {/* Top Center: Zone/Wave */}
            <div className="glass-panel" style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                top: 0,
                textAlign: 'center',
                padding: '0.5rem 2rem',
                borderRadius: 'var(--radius-lg)',
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0
            }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.2rem' }}>Zone {zone}</div>
                <div className="font-display" style={{ fontSize: '1.4rem', fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>Wave {wave}/{wavesPerZone}</div>
                {wave === wavesPerZone && (
                    <div style={{
                        marginTop: '0.4rem',
                        padding: '0.2rem 0.8rem',
                        background: 'linear-gradient(135deg, var(--accent-danger), #c0392b)',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: 'bold',
                        color: '#fff',
                        textTransform: 'uppercase',
                        letterSpacing: '1.5px',
                        animation: 'pulse 1.5s infinite',
                        boxShadow: '0 0 15px rgba(231, 76, 60, 0.6)',
                        border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                        ⚔️ BOSS BATTLE
                    </div>
                )}
            </div>

            {/* Top Right: Controls */}
            <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                pointerEvents: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                alignItems: 'flex-end'
            }}>
                <GameButton
                    onClick={togglePause}
                    style={{
                        padding: '0.6rem 1.2rem',
                        background: '#FFFFFF', // Pure White
                        border: '3px solid #000000', // Thick Black Border
                        minWidth: '120px',
                        boxShadow: '0 6px 12px rgba(0,0,0,0.6)',
                        color: '#000000', // Pure Black Text
                        fontWeight: '900',
                        fontSize: '1rem'
                    }}
                >
                    {isRunning ? <Pause size={18} fill="#000000" /> : <Play size={18} fill="#2ecc71" />}
                    {isRunning ? 'PAUSE' : 'RESUME'}
                </GameButton>

                {/* Speed Controls */}
                <div style={{ display: 'flex', gap: '0.25rem', background: '#FFFFFF', padding: '6px', borderRadius: 'var(--radius-md)', border: '3px solid #000000', boxShadow: '0 6px 12px rgba(0,0,0,0.6)' }}>
                    {speedOptions.map(speed => (
                        <button
                            key={speed}
                            onClick={() => setTimeMultiplier(speed)}
                            style={{
                                flex: 1,
                                padding: '0.4rem 0.8rem', // Larger touch target
                                background: timeMultiplier === speed ? '#000000' : 'transparent',
                                border: 'none',
                                borderRadius: '4px',
                                color: timeMultiplier === speed ? '#FFFFFF' : '#000000',
                                fontWeight: '900',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                transition: 'all 0.1s'
                            }}
                        >
                            {speed}x
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <GameButton
                        onClick={() => useGameStore.getState().openPanel('help')}
                        title="Game Guide"
                        style={{
                            padding: '0.5rem',
                            background: '#FFFFFF',
                            border: '3px solid #000000',
                            width: '44px', // Min touch
                            height: '44px',
                            justifyContent: 'center',
                            boxShadow: '0 6px 12px rgba(0,0,0,0.6)',
                            color: '#000000'
                        }}
                    >
                        <span style={{ fontWeight: '900', fontSize: '1.4rem' }}>?</span>
                    </GameButton>
                    <GameButton
                        onClick={() => useGameStore.getState().openPanel('tpk')}
                        style={{
                            padding: '0.6rem 1.5rem',
                            background: '#FF0000', // Pure Red
                            border: '3px solid #000000',
                            flex: 1,
                            boxShadow: '0 6px 12px rgba(0,0,0,0.6)',
                            color: '#FFFFFF',
                            fontWeight: '900',
                            fontSize: '1.1rem',
                            textShadow: '2px 2px 0px #000000'
                        }}
                    >
                        <Skull size={20} strokeWidth={3} /> TPK
                    </GameButton>

                    <GameButton
                        onClick={() => {
                            AudioManager.playSFX('ui_click');
                            useGameStore.getState().enterMenu();
                        }}
                        style={{
                            padding: '0.5rem',
                            background: '#2c3e50',
                            border: '3px solid #000000',
                            color: 'white',
                            boxShadow: '0 6px 12px rgba(0,0,0,0.6)',
                            width: '44px',
                            height: '44px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        title="Exit to Menu"
                    >
                        <LogOut size={20} />
                    </GameButton>
                </div>
            </div>
        </div>
    );
};

export default HUD;
