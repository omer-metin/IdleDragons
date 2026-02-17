import React from 'react';
import useMetaStore from '../../store/useMetaStore';
import useGameStore from '../../store/useGameStore';
import { Skull, X } from 'lucide-react';
import GameButton from '../components/GameButton';
import AudioManager from '../../audio/AudioManager';

const TPKPanel = () => {
    const { activePanel, closePanel } = useGameStore();
    const { souls, getPendingSouls, triggerTPK, generation } = useMetaStore();

    React.useEffect(() => {
        if (activePanel === 'tpk') { // Changed from 'ascend'
            AudioManager.playSFX('panel_open');
        }
    }, [activePanel]);

    if (activePanel !== 'tpk') return null; // Changed from 'ascend'

    const pendingSouls = getPendingSouls();

    const handleTPK = () => {
        useGameStore.getState().showConfirm({
            title: 'Confirm TPK?',
            message: `You are about to reset all progress for ${pendingSouls} Souls. This cannot be undone.`,
            isDanger: true,
            confirmText: 'ASCEND',
            onConfirm: () => {
                // Trigger TPK (Full Reset)
                triggerTPK();
                closePanel();
                AudioManager.playSFX('ui_equip'); // Heavy sound
            }
        });
    };

    return (
        <div className="glass-panel anim-scale-in" style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(15, 5, 5, 0.98)',
            border: '2px solid var(--accent-danger)',
            borderRadius: 'var(--radius-xl)',
            padding: '2rem',
            width: 'min(500px, 92vw)',
            color: 'var(--text-main)',
            boxShadow: '0 0 100px rgba(192, 57, 43, 0.6)',
            zIndex: 2000,
            textAlign: 'center'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--panel-border)', paddingBottom: '1rem' }}>
                <h1 className="font-display" style={{ fontSize: '2rem', color: 'var(--accent-danger)', margin: 0 }}>TOTAL PARTY KILL</h1>
                <GameButton onClick={closePanel} style={{ padding: '8px', background: 'transparent', border: 'none' }}>
                    <X size={28} />
                </GameButton>
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <p style={{ fontSize: '1.1rem', color: '#e74c3c' }}>
                    End this Campaign?
                </p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                    This will <strong style={{ color: 'white' }}>WIPE</strong> your current party and zone progress.
                </p>
                <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    margin: '1.5rem 0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                }}>
                    <span style={{ fontSize: '0.9rem', color: '#bdc3c7' }}>You will harvest:</span>
                    <span className="font-display" style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f1c40f', textShadow: '0 0 20px rgba(241, 196, 15, 0.5)' }}>
                        {pendingSouls} <span style={{ fontSize: '1.5rem' }}>Souls</span>
                    </span>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                        <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>Current: {souls}</div>
                        <div style={{ fontSize: '0.8rem', color: '#2ecc71' }}>Next: {souls + pendingSouls}</div>
                    </div>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#bdc3c7', fontStyle: 'italic' }}>
                    "Every end is a new beginning... for the next party."<br />
                    (Next Generation: {generation + 1})
                </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <GameButton
                    onClick={closePanel}
                    style={{
                        padding: '1rem 2rem',
                        background: 'transparent',
                        border: '1px solid var(--text-dim)',
                        color: 'var(--text-dim)'
                    }}
                >
                    CANCEL
                </GameButton>

                <GameButton
                    onClick={handleTPK}
                    style={{
                        padding: '1.2rem 3rem',
                        background: 'var(--accent-danger)',
                        border: 'none',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1.2rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.8rem',
                        boxShadow: '0 0 30px rgba(192, 57, 43, 0.4)'
                    }}
                >
                    <Skull size={24} />
                    TPK the Party
                </GameButton>
            </div>
        </div>
    );
};

export default TPKPanel;
