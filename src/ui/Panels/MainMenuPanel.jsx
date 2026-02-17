import React from 'react';
import useGameStore from '../../store/useGameStore';
import useMetaStore from '../../store/useMetaStore';
import { Play, Scroll, Settings, Info } from 'lucide-react';
import GameButton from '../components/GameButton';
import AudioManager from '../../audio/AudioManager';

const MainMenuPanel = () => {
    const { gameState, startGame } = useGameStore();
    const { generation, souls } = useMetaStore();

    if (gameState !== 'MENU') return null;

    const handleNewCampaign = () => {
        AudioManager.playSFX('ui_start_game');
        AudioManager.startBGM('lobby');
        startGame(); // Goes to LOBBY
    };

    return (
        <div className="anim-fade-in" style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            color: 'white'
        }}>
            <h1 className="font-display anim-slide-down" style={{
                fontSize: '4rem',
                marginBottom: '2rem',
                textShadow: '0 0 20px #8e44ad, 0 0 40px #2c3e50',
                letterSpacing: '4px'
            }}>
                IDLES N DRAGONS
            </h1>

            <div className="anim-fade-in" style={{ fontStyle: 'italic', color: '#bdc3c7', marginBottom: '4rem', fontSize: '1.2rem', animationDelay: '0.5s' }}>
                "The Game Master's burden is eternal..."
            </div>

            <div className="anim-scale-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '300px', animationDelay: '0.8s' }}>
                <GameButton
                    onClick={handleNewCampaign}
                    style={{
                        padding: '1.2rem',
                        fontSize: '1.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1rem',
                        background: 'var(--accent-primary)',
                        boxShadow: '0 0 15px rgba(155, 89, 182, 0.4)'
                    }}
                >
                    <Play size={24} />
                    {generation > 1 ? 'CONTINUE CAMPAIGN' : 'NEW CAMPAIGN'}
                </GameButton>

                {/* Placeholders for future settings/credits */}
                <GameButton
                    onClick={() => useGameStore.getState().openPanel('settings')}
                    style={{
                        padding: '1rem',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1rem',
                        background: 'rgba(255,255,255,0.1)',
                        color: 'white',
                        border: '1px solid var(--panel-border)'
                    }}
                >
                    <Settings size={20} />
                    SETTINGS
                </GameButton>

                <GameButton
                    onClick={() => useGameStore.getState().openPanel('credits')}
                    style={{
                        padding: '1rem',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1rem',
                        background: 'transparent',
                        color: '#bdc3c7',
                        border: 'none',
                        fontSize: '0.9rem'
                    }}
                >
                    <Info size={18} />
                    CREDITS
                </GameButton>

                <div style={{ marginTop: '2rem', textAlign: 'center', color: '#7f8c8d', fontSize: '0.9rem' }}>
                    Generation: {generation} | Souls: {souls}
                </div>
            </div>

            <div style={{ position: 'absolute', bottom: '20px', right: '20px', fontSize: '0.8rem', color: '#bdc3c7' }}>
                v0.1.0 - Main Menu Feature
            </div>
        </div>
    );
};

export default MainMenuPanel;
