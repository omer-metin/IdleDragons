import React, { useEffect, useState } from 'react';
import useMetaStore from '../../store/useMetaStore';
import useGameStore from '../../store/useGameStore';
import GameButton from '../components/GameButton';
import AudioManager from '../../audio/AudioManager';
import { Skull, TrendingUp, Clock, MapPin } from 'lucide-react';
import { ReviveAdButton } from '../components/AdButtons';

const ResultsPanel = () => {
    const { getPendingSouls, triggerTPK, souls } = useMetaStore();
    const { zone, wave, totalKills, gameState } = useGameStore();

    const [displayedSouls, setDisplayedSouls] = useState(0);
    const pendingSouls = getPendingSouls();

    useEffect(() => {
        if (gameState !== 'GAMEOVER') return;

        AudioManager.playSFX('boss_death'); // Initial impact sound

        // Animate souls counting up
        let start = 0;
        const duration = 2000; // 2 seconds
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out quart
            const ease = 1 - Math.pow(1 - progress, 4);

            const currentVal = Math.floor(pendingSouls * ease);
            setDisplayedSouls(currentVal);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                AudioManager.playSFX('level_up'); // done
            }
        };
        requestAnimationFrame(animate);

    }, [gameState, pendingSouls]);

    const handleTPK = () => {
        triggerTPK(); // Resets game and goes to LOBBY
        AudioManager.playSFX('ui_start_game');
    };

    if (gameState !== 'GAMEOVER') return null;

    return (
        <div className="anim-fade-in" style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(5, 5, 10, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            backdropFilter: 'blur(8px)',
            color: 'white'
        }}>
            <div className="glass-panel anim-scale-in" style={{
                padding: '3rem',
                borderRadius: 'var(--radius-xl)',
                border: '2px solid var(--accent-danger)',
                background: 'rgba(20, 10, 10, 0.95)',
                width: 'min(500px, 92vw)',
                textAlign: 'center',
                boxShadow: '0 0 100px rgba(192, 57, 43, 0.3)'
            }}>
                <Skull size={64} color="var(--accent-danger)" style={{ marginBottom: '1rem' }} />

                <h1 className="font-display" style={{ fontSize: '3rem', margin: '0 0 0.5rem', color: 'var(--accent-danger)', textShadow: '0 0 20px rgba(192, 57, 43, 0.6)' }}>
                    TOTAL PARTY KILL
                </h1>

                <p style={{ color: 'var(--text-dim)', marginBottom: '2rem', fontSize: '1.1rem' }}>
                    Your journey has ended... for now.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                    <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)' }}>
                        <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Zone Reached</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{zone}</div>
                    </div>
                    <div className="glass-panel" style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)' }}>
                        <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Total Kills</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{totalKills}</div>
                    </div>
                </div>

                <div style={{ marginBottom: '2.5rem' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--accent-secondary)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '0.5rem' }}>
                        Souls Harvested
                    </div>
                    <div className="font-display" style={{ fontSize: '4rem', fontWeight: 'bold', color: 'var(--accent-secondary)', lineHeight: 1 }}>
                        +{displayedSouls}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                        Total Souls: {souls + displayedSouls}
                    </div>
                </div>

                <GameButton
                    onClick={handleTPK}
                    style={{
                        width: '100%',
                        padding: '1.2rem',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        background: 'var(--accent-secondary)',
                        border: 'none',
                        color: 'white',
                        justifyContent: 'center',
                        boxShadow: '0 0 30px rgba(142, 68, 173, 0.4)'
                    }}
                >
                    <Skull size={24} /> ACCEPT TPK
                </GameButton>

                <div style={{ marginTop: '1rem' }}>
                    <ReviveAdButton onRevive={() => {
                        // Close Results Panel logic? ResultsPanel renders if gameState === 'GAMEOVER'.
                        // ReviveAdButton sets gameState to RUNNING. So this panel will unmount automatically.
                        // We might want to play a sound or toast here.
                        AudioManager.playSFX('ui_equip');
                    }} />
                </div>
            </div>
        </div>
    );
};

export default ResultsPanel;
