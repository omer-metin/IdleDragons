import React, { useEffect } from 'react';
import GameButton from '../components/GameButton';
import { X, Trophy } from 'lucide-react';
import useGameStore from '../../store/useGameStore';
import useAchievementStore, { ACHIEVEMENTS } from '../../store/useAchievementStore';
import AudioManager from '../../audio/AudioManager';

const CATEGORIES = ['Combat', 'Economy', 'Prestige', 'Exploration'];

const AchievementsPanel = () => {
    const { activePanel, closePanel } = useGameStore();
    const { unlocked } = useAchievementStore();

    useEffect(() => {
        if (activePanel === 'achievements') {
            AudioManager.playSFX('panel_open');
        }
    }, [activePanel]);

    if (activePanel !== 'achievements') return null;

    const unlockedCount = Object.keys(unlocked).length;

    return (
        <div className="anim-fade-in" style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2500,
            backdropFilter: 'blur(3px)'
        }} onClick={closePanel}>
            <div
                className="glass-panel anim-scale-in"
                style={{
                    width: 'min(550px, 92vw)',
                    maxHeight: '80vh',
                    overflowY: 'auto',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--accent-gold)',
                    background: 'rgba(15, 15, 25, 0.95)',
                    color: 'var(--text-main)',
                    position: 'relative'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Close */}
                <GameButton
                    onClick={closePanel}
                    style={{
                        position: 'absolute', top: '0.8rem', right: '0.8rem',
                        padding: '0.4rem', background: 'transparent', border: 'none'
                    }}
                >
                    <X size={20} />
                </GameButton>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <Trophy size={28} color="var(--accent-gold)" style={{ marginBottom: '0.3rem' }} />
                    <h2 className="font-display" style={{ fontSize: '1.4rem', margin: 0 }}>
                        Achievements
                    </h2>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>
                        {unlockedCount} / {ACHIEVEMENTS.length} unlocked
                    </div>
                </div>

                {/* Categories */}
                {CATEGORIES.map(cat => {
                    const achs = ACHIEVEMENTS.filter(a => a.category === cat);
                    return (
                        <div key={cat} style={{ marginBottom: '1rem' }}>
                            <div style={{
                                fontSize: '0.75rem',
                                textTransform: 'uppercase',
                                letterSpacing: '1.5px',
                                color: 'var(--text-dim)',
                                marginBottom: '0.4rem',
                                borderBottom: '1px solid rgba(255,255,255,0.1)',
                                paddingBottom: '0.3rem',
                            }}>
                                {cat}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                                {achs.map(ach => {
                                    const isUnlocked = !!unlocked[ach.id];
                                    return (
                                        <div key={ach.id} style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.6rem',
                                            padding: '0.4rem 0.6rem',
                                            borderRadius: '6px',
                                            background: isUnlocked ? 'rgba(241, 196, 15, 0.1)' : 'rgba(255,255,255,0.03)',
                                            border: `1px solid ${isUnlocked ? 'rgba(241,196,15,0.3)' : 'rgba(255,255,255,0.05)'}`,
                                            opacity: isUnlocked ? 1 : 0.5,
                                        }}>
                                            <span style={{ fontSize: '1.2rem', minWidth: '1.5rem', textAlign: 'center' }}>
                                                {isUnlocked ? ach.icon : '\uD83D\uDD12'}
                                            </span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{ach.name}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{ach.desc}</div>
                                            </div>
                                            <div style={{
                                                fontSize: '0.7rem',
                                                color: 'var(--accent-gold)',
                                                fontWeight: 'bold',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                +{ach.soulReward} souls
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AchievementsPanel;
