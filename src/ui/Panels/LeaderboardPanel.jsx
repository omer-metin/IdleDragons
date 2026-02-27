import React, { useEffect, useState } from 'react';
import { X, Crown } from 'lucide-react';
import GameButton from '../components/GameButton';
import useGameStore from '../../store/useGameStore';
import useMetaStore from '../../store/useMetaStore';
import CrazyGamesSDK from '../../platform/CrazyGames';
import AudioManager from '../../audio/AudioManager';

const RANK_COLORS = ['#f1c40f', '#bdc3c7', '#cd7f32']; // Gold, Silver, Bronze

const LeaderboardPanel = () => {
    const { activePanel, closePanel } = useGameStore();
    const { highestZone } = useMetaStore();
    const [scores, setScores] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (activePanel === 'leaderboard') {
            AudioManager.playSFX('panel_open');
            fetchScores();
        }
    }, [activePanel]);

    const fetchScores = async () => {
        setLoading(true);
        const data = await CrazyGamesSDK.getLeaderboard();
        setScores(data);
        setLoading(false);
    };

    if (activePanel !== 'leaderboard') return null;

    return (
        <div className="anim-fade-in" style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2500,
            backdropFilter: 'blur(3px)',
        }} onClick={closePanel}>
            <div
                className="glass-panel anim-scale-in"
                style={{
                    width: 'min(500px, 92vw)',
                    maxHeight: '85vh',
                    overflowY: 'auto',
                    padding: '2rem',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--accent-gold)',
                    background: 'rgba(15, 15, 25, 0.95)',
                    color: 'var(--text-main)',
                    position: 'relative',
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--panel-border)', paddingBottom: '1rem' }}>
                    <h2 className="font-display" style={{ margin: 0, fontSize: '1.8rem', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Crown size={24} /> Leaderboard
                    </h2>
                    <GameButton onClick={closePanel} style={{ background: 'transparent', border: 'none' }}>
                        <X size={24} />
                    </GameButton>
                </div>

                {/* Your Score */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    background: 'rgba(241, 196, 15, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(241, 196, 15, 0.3)',
                }}>
                    <div style={{ fontSize: '0.8rem', color: '#bdc3c7' }}>Your Best</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f1c40f' }}>Zone {highestZone}</div>
                </div>

                {/* Leaderboard Table */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#7f8c8d' }}>Loading...</div>
                ) : scores && scores.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {scores.slice(0, 10).map((entry, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.6rem 0.8rem',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '8px',
                                border: entry.isCurrentPlayer ? '1px solid var(--accent-gold)' : '1px solid transparent',
                            }}>
                                <div style={{
                                    width: '28px',
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                    fontSize: '1.1rem',
                                    color: RANK_COLORS[i] || '#7f8c8d',
                                }}>
                                    {i + 1}
                                </div>
                                <div style={{ flex: 1, fontSize: '0.9rem' }}>
                                    {entry.name || 'Player'}
                                </div>
                                <div style={{ fontWeight: 'bold', color: '#3498db' }}>
                                    Zone {entry.score}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#7f8c8d' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>No scores yet</div>
                        <div style={{ fontSize: '0.85rem' }}>Leaderboard data is available on CrazyGames.</div>
                    </div>
                )}

                <GameButton
                    onClick={() => CrazyGamesSDK.submitScore(highestZone)}
                    style={{
                        marginTop: '1.5rem',
                        width: '100%',
                        padding: '0.8rem',
                        background: 'var(--accent-gold)',
                        border: 'none',
                        color: '#000',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        justifyContent: 'center',
                    }}
                >
                    Submit Score
                </GameButton>
            </div>
        </div>
    );
};

export default LeaderboardPanel;
