import React from 'react';
import useDailyRewardStore, { DAILY_REWARDS } from '../../store/useDailyRewardStore';
import useMetaStore from '../../store/useMetaStore';
import GameButton from './GameButton';
import AudioManager from '../../audio/AudioManager';

const DailyRewardPopup = () => {
    const { showPopup, streak, claim, dismissPopup } = useDailyRewardStore();
    const gen = useMetaStore(s => s.generation);

    if (!showPopup) return null;

    const mult = 1 + (gen - 1) * 0.1;
    const currentReward = DAILY_REWARDS[streak % DAILY_REWARDS.length];

    return (
        <div className="anim-fade-in" style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            backdropFilter: 'blur(4px)',
        }}>
            <div className="glass-panel anim-scale-in" style={{
                width: 'min(420px, 90vw)',
                padding: '1.5rem',
                borderRadius: 'var(--radius-xl)',
                border: '2px solid var(--accent-gold)',
                background: 'rgba(15, 15, 25, 0.95)',
                color: 'var(--text-main)',
                textAlign: 'center',
            }}>
                <h2 className="font-display" style={{ fontSize: '1.4rem', color: 'var(--accent-gold)', marginBottom: '0.5rem' }}>
                    Daily Reward
                </h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>
                    Day {streak + 1} of 7 {gen > 1 ? `(+${Math.round((mult - 1) * 100)}% Gen bonus)` : ''}
                </div>

                {/* Day circles */}
                <div style={{
                    display: 'flex',
                    gap: '0.3rem',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                    flexWrap: 'wrap',
                }}>
                    {DAILY_REWARDS.map((reward, i) => {
                        const isCurrent = i === streak % DAILY_REWARDS.length;
                        const isPast = i < streak % DAILY_REWARDS.length;
                        return (
                            <div key={i} style={{
                                width: 44,
                                height: 54,
                                borderRadius: 8,
                                background: isCurrent ? 'rgba(241, 196, 15, 0.2)' : isPast ? 'rgba(39, 174, 96, 0.15)' : 'rgba(255,255,255,0.05)',
                                border: `2px solid ${isCurrent ? '#f1c40f' : isPast ? '#27ae60' : '#333'}`,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.65rem',
                                transition: 'all 0.2s',
                                transform: isCurrent ? 'scale(1.1)' : 'scale(1)',
                                boxShadow: isCurrent ? '0 0 12px rgba(241, 196, 15, 0.4)' : 'none',
                            }}>
                                <span style={{ fontSize: '1.1rem' }}>{reward.icon}</span>
                                <span style={{ color: 'var(--text-dim)', fontSize: '0.55rem', marginTop: '2px' }}>
                                    Day {i + 1}
                                </span>
                                {isPast && <span style={{ fontSize: '0.6rem', color: '#27ae60' }}>{'\u2713'}</span>}
                            </div>
                        );
                    })}
                </div>

                {/* Current reward display */}
                <div style={{
                    padding: '0.8rem',
                    background: 'rgba(241, 196, 15, 0.1)',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    border: '1px solid rgba(241, 196, 15, 0.3)',
                }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>{currentReward.icon}</div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{currentReward.label}</div>
                    {gen > 1 && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--accent-gold)' }}>
                            ({Math.round(mult * 100)}% with Gen bonus)
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <GameButton
                        onClick={() => {
                            AudioManager.playSFX('loot_rare');
                            claim();
                        }}
                        style={{
                            padding: '0.6rem 2rem',
                            background: 'linear-gradient(135deg, #f1c40f, #e67e22)',
                            border: '3px solid #000',
                            color: '#000',
                            fontWeight: '900',
                            fontSize: '1rem',
                        }}
                    >
                        Claim!
                    </GameButton>
                    <GameButton
                        onClick={dismissPopup}
                        style={{
                            padding: '0.6rem 1rem',
                            background: 'rgba(255,255,255,0.1)',
                            border: '2px solid #555',
                            color: '#aaa',
                            fontSize: '0.8rem',
                        }}
                    >
                        Later
                    </GameButton>
                </div>
            </div>
        </div>
    );
};

export default DailyRewardPopup;
