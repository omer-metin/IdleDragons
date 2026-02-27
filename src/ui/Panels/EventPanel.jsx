import React from 'react';
import useEventStore from '../../store/useEventStore';
import useGameStore from '../../store/useGameStore';
import GameButton from '../components/GameButton';
import AudioManager from '../../audio/AudioManager';

const EventPanel = () => {
    const { activeEvent, resolveEvent } = useEventStore();
    const { activePanel, closePanel, togglePause } = useGameStore();

    if (!activeEvent || activePanel !== 'event') return null;

    const handleOption = (index) => {
        resolveEvent(index);
        closePanel();
        // Unpause game
        const state = useGameStore.getState();
        if (!state.isRunning) togglePause();
        AudioManager.playSFX('ui_equip');
    };

    const borderColor = activeEvent.type === 'shrine' ? '#8e44ad'
        : activeEvent.type === 'merchant' ? '#f1c40f'
        : activeEvent.type === 'goblin' ? '#27ae60'
        : '#e67e22';

    return (
        <div className="glass-panel anim-scale-in" style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(10, 10, 15, 0.98)',
            border: `2px solid ${borderColor}`,
            borderRadius: 'var(--radius-xl)',
            padding: '2rem',
            width: 'min(460px, 92vw)',
            color: 'var(--text-main)',
            boxShadow: `0 0 80px ${borderColor}44`,
            zIndex: 3000,
            textAlign: 'center',
        }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{activeEvent.icon}</div>
            <h2 className="font-display" style={{ fontSize: '1.6rem', color: borderColor, margin: '0 0 0.75rem' }}>
                {activeEvent.title}
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#bdc3c7', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                {activeEvent.description}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {activeEvent.options.map((opt, i) => (
                    <GameButton
                        key={i}
                        onClick={() => handleOption(i)}
                        style={{
                            padding: '0.9rem 1.5rem',
                            background: opt.action === 'skip' ? 'rgba(255,255,255,0.05)' : borderColor,
                            border: opt.action === 'skip' ? '1px solid var(--panel-border)' : 'none',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            width: '100%',
                        }}
                    >
                        {opt.label}
                    </GameButton>
                ))}
            </div>
        </div>
    );
};

export default EventPanel;
