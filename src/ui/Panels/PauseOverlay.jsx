import React, { useEffect } from 'react';
import useGameStore from '../../store/useGameStore';
import GameButton from '../components/GameButton';
import { Play, Settings, HelpCircle, LogOut } from 'lucide-react';
import AudioManager from '../../audio/AudioManager';

const PauseOverlay = () => {
    const { gameState, togglePause, openPanel, resetGame } = useGameStore();

    // Handle Escape key within the overlay context (optional backup to global listener)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                togglePause();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePause]);

    const handleResume = () => {
        AudioManager.playSFX('ui_click');
        togglePause();
    };

    const handleSettings = () => {
        AudioManager.playSFX('ui_click');
        openPanel('settings');
    };

    const handleHelp = () => {
        AudioManager.playSFX('ui_click');
        openPanel('help');
    };

    const handleRetreat = () => {
        AudioManager.playSFX('ui_click');
        useGameStore.getState().showConfirm({
            title: 'Retreat to Lobby?',
            message: 'Current run progress will be reset. You will keep your collected Souls.',
            isDanger: true,
            confirmText: 'RETREAT',
            onConfirm: () => {
                resetGame();
            }
        });
    };

    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 3000,
            background: 'rgba(5, 5, 8, 0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <div className="glass-panel anim-scale-in" style={{
                width: 'min(360px, 90vw)',
                padding: '2.5rem',
                border: '1px solid var(--accent-primary)',
                boxShadow: '0 0 50px rgba(0,0,0,0.8), 0 0 20px rgba(155, 89, 182, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                alignItems: 'center'
            }}>
                {/* Title */}
                <h2 className="font-display" style={{
                    fontSize: '2.5rem',
                    margin: 0,
                    color: 'var(--text-main)',
                    letterSpacing: '2px',
                    textShadow: '0 0 10px rgba(255,255,255,0.3)'
                }}>
                    PAUSED
                </h2>

                <div style={{
                    width: '100%',
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent, var(--panel-border), transparent)',
                    marginBottom: '0.5rem'
                }} />

                {/* Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                    <GameButton onClick={handleResume} style={{ justifyContent: 'center', fontSize: '1.1rem', padding: '1rem' }}>
                        <Play size={20} style={{ marginRight: '8px' }} /> RESUME
                    </GameButton>

                    <GameButton onClick={handleSettings} style={{ justifyContent: 'center', fontSize: '1.1rem', padding: '1rem' }}>
                        <Settings size={20} style={{ marginRight: '8px' }} /> SETTINGS
                    </GameButton>

                    <GameButton onClick={handleHelp} style={{ justifyContent: 'center', fontSize: '1.1rem', padding: '1rem' }}>
                        <HelpCircle size={20} style={{ marginRight: '8px' }} /> HELP
                    </GameButton>

                    <div style={{ height: '0.5rem' }} />

                    <GameButton
                        onClick={handleRetreat}
                        style={{
                            justifyContent: 'center',
                            fontSize: '1rem',
                            padding: '1rem',
                            background: 'rgba(192, 57, 43, 0.2)',
                            border: '1px solid var(--accent-danger)',
                            color: 'var(--accent-danger)'
                        }}
                    >
                        <LogOut size={20} style={{ marginRight: '8px' }} /> RETREAT
                    </GameButton>
                </div>
            </div>
        </div>
    );
};

export default PauseOverlay;
