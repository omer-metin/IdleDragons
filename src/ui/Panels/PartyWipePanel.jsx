import React from 'react';
import useGameStore from '../../store/useGameStore';
import usePartyStore from '../../store/usePartyStore';
import useResourceStore from '../../store/useResourceStore';
import { Skull, RotateCcw, Flag } from 'lucide-react';
import GameButton from '../components/GameButton';
import AudioManager from '../../audio/AudioManager';
import { ReviveAdButton } from '../components/AdButtons';

const PartyWipePanel = () => {
    const { activePanel, zone, wave, retryWave, endGame, getRetryCost } = useGameStore();
    const { reviveAll } = usePartyStore();
    const { gold, removeGold } = useResourceStore();

    if (activePanel !== 'party_wipe') return null;

    const retryCost = getRetryCost();
    const canAffordRetry = retryCost === 0 || gold >= retryCost;

    const handleRetry = () => {
        if (!canAffordRetry) return;
        if (retryCost > 0) removeGold(retryCost);

        // Revive all party members to full HP
        reviveAll();

        // Resume the game at the current wave
        retryWave();

        AudioManager.playSFX('heal');
        AudioManager.startBGM('adventure');
    };

    const handleEndAdventure = () => {
        // Transition to GAMEOVER — ResultsPanel will show
        useGameStore.setState({ activePanel: null });
        endGame();
    };

    return (
        <div className="anim-fade-in" style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(5, 5, 10, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            backdropFilter: 'blur(6px)',
        }}>
            <div className="glass-panel anim-scale-in" style={{
                padding: 'clamp(1.5rem, 4vw, 3rem)',
                borderRadius: 'var(--radius-xl)',
                border: '2px solid var(--accent-danger)',
                background: 'rgba(20, 10, 10, 0.95)',
                width: 'min(460px, 92vw)',
                textAlign: 'center',
                boxShadow: '0 0 80px rgba(192, 57, 43, 0.3)',
                color: 'white',
            }}>
                <Skull size={56} color="var(--accent-danger)" style={{ marginBottom: '0.8rem' }} />

                <h2 className="font-display" style={{
                    fontSize: '2.2rem',
                    margin: '0 0 0.3rem',
                    color: 'var(--accent-danger)',
                    textShadow: '0 0 15px rgba(192, 57, 43, 0.5)',
                }}>
                    PARTY WIPED!
                </h2>

                <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem', fontSize: '1rem' }}>
                    Zone {zone} — Wave {wave}
                </p>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.8rem',
                }}>
                    {/* Retry Wave */}
                    <GameButton
                        onClick={handleRetry}
                        disabled={!canAffordRetry}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            background: canAffordRetry ? 'var(--accent-heal)' : 'var(--bg-panel)',
                            border: canAffordRetry ? '1px solid var(--accent-heal)' : '1px solid var(--panel-border)',
                            color: canAffordRetry ? 'white' : '#888',
                            justifyContent: 'center',
                        }}
                    >
                        <RotateCcw size={20} />
                        {retryCost === 0
                            ? 'Retry Wave (Free)'
                            : `Retry Wave (${retryCost} G)`}
                    </GameButton>

                    {/* Revive via Ad */}
                    <ReviveAdButton onRevive={() => {
                        useGameStore.setState({ activePanel: null });
                    }} />

                    {/* End Adventure */}
                    <GameButton
                        onClick={handleEndAdventure}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            background: 'rgba(192, 57, 43, 0.2)',
                            border: '1px solid var(--accent-danger)',
                            color: 'var(--accent-danger)',
                            justifyContent: 'center',
                        }}
                    >
                        <Flag size={18} />
                        End Adventure (TPK)
                    </GameButton>
                </div>

                <p style={{
                    fontSize: '0.75rem',
                    color: '#7f8c8d',
                    marginTop: '1rem',
                    fontStyle: 'italic',
                }}>
                    "Fall seven times, stand up eight."
                </p>
            </div>
        </div>
    );
};

export default PartyWipePanel;
