import React, { useEffect } from 'react';
import useRecruitmentStore from '../../store/useRecruitmentStore';
import { CLASS_DEFINITIONS } from '../../store/useRecruitmentStore';
import useGameStore from '../../store/useGameStore';
import useMetaStore from '../../store/useMetaStore';
import useResourceStore from '../../store/useResourceStore';
import useTutorialStore from '../../store/useTutorialStore';
import useAdStore from '../../store/useAdStore';
import { UserPlus, RefreshCw, X, Sword, Shield, Heart, Crosshair, Zap, Video } from 'lucide-react';
import GameButton from '../components/GameButton';
import AudioManager from '../../audio/AudioManager';
import useToastStore from '../../store/useToastStore';
import CrazyGamesSDK from '../../platform/CrazyGames';
import { RerollAdButton } from '../components/AdButtons';

const RecruitmentPanel = () => {
    const { activePanel, closePanel, selectedGridSlot, gameState } = useGameStore();
    const { candidates, generateCandidates, reroll, recruit, getGoldCost } = useRecruitmentStore();
    const { souls } = useMetaStore();
    const { gold } = useResourceStore();

    useEffect(() => {
        if (activePanel === 'recruitment') {
            AudioManager.playSFX('panel_open');
            if (candidates.length === 0) generateCandidates();
        }
    }, [activePanel, candidates.length, generateCandidates]);

    if (activePanel !== 'recruitment') return null;

    if (gameState !== 'LOBBY') {
        closePanel();
        return null;
    }

    const handleRecruit = (index) => {
        if (!selectedGridSlot) return;
        const success = recruit(index, selectedGridSlot.x, selectedGridSlot.y);
        if (success) {
            AudioManager.playSFX('ui_recruit');
            useTutorialStore.getState().onHeroRecruited();
            closePanel();
        }
    };

    const recruitSoulCost = 10;
    const recruitGoldCost = getGoldCost();
    const rerollCost = 5;
    const canAffordRecruit = souls >= recruitSoulCost && gold >= recruitGoldCost;

    return (
        <div className="glass-panel anim-scale-in" style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(20, 20, 30, 0.98)',
            border: '2px solid var(--accent-secondary)',
            borderRadius: 'var(--radius-xl)',
            padding: '2rem',
            width: 'min(900px, 92vw)',
            maxWidth: '95vw',
            color: 'var(--text-main)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
            zIndex: 1000
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--panel-border)', paddingBottom: '1rem' }}>
                <div>
                    <h2 className="font-display" style={{ margin: 0, fontSize: '2rem', color: 'var(--accent-secondary)' }}>Choose Your Hero</h2>
                    <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        Target Slot: <span style={{ color: 'white', fontWeight: 'bold' }}>#{selectedGridSlot ? selectedGridSlot.x + 1 : '?'}</span>
                        <span style={{ marginLeft: '1.5rem', color: 'var(--accent-secondary)' }}>Cost: {recruitSoulCost} Souls + {recruitGoldCost} Gold</span>
                    </div>
                </div>
                <GameButton onClick={closePanel} style={{ padding: '8px', background: 'transparent', border: 'none' }}>
                    <X size={28} />
                </GameButton>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(candidates.length, 4)}, 1fr)`, gap: '1rem', marginBottom: '1.5rem' }}>
                {candidates.map((candidate, index) => {
                    if (!candidate) return null;
                    const classDef = CLASS_DEFINITIONS[candidate.class];

                    return (
                        <div key={index} style={{
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '12px',
                            padding: '1.25rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                            border: `2px solid ${classDef?.color || '#555'}33`,
                            transition: 'border-color 0.2s, transform 0.2s',
                        }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = classDef?.color || '#fff'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${classDef?.color || '#555'}33`; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            {/* Class Badge */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: classDef?.color || '#fff' }}>
                                    {candidate.class}
                                </div>
                                <div style={{
                                    fontSize: '0.65rem',
                                    background: `${classDef?.color || '#555'}33`,
                                    color: classDef?.color || '#bdc3c7',
                                    padding: '0.15rem 0.5rem',
                                    borderRadius: '10px',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    {candidate.role}
                                </div>
                            </div>

                            {/* Name */}
                            <div style={{ fontSize: '1rem' }}>{candidate.name}</div>

                            {/* Description */}
                            <div style={{ fontSize: '0.75rem', color: '#7f8c8d', lineHeight: '1.3', minHeight: '2.8rem' }}>
                                {candidate.description}
                            </div>

                            {/* Stats */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.85rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Heart size={14} color="#e74c3c" /> <span>{candidate.stats.hp}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Sword size={14} color="#f1c40f" /> <span>{candidate.stats.atk}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Shield size={14} color="#3498db" /> <span>{candidate.stats.def}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.3rem' }}>
                                    <Crosshair size={14} color="#e67e22" /> <span style={{ color: candidate.range >= 300 ? '#27ae60' : '#bdc3c7' }}>{candidate.range >= 300 ? 'Ranged' : 'Melee'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Zap size={14} color="#f39c12" /> <span>{candidate.attackSpeed}s</span>
                                </div>
                            </div>

                            {/* Recruit Button */}
                            <GameButton
                                onClick={() => handleRecruit(index)}
                                disabled={!canAffordRecruit}
                                style={{
                                    marginTop: 'auto',
                                    padding: '0.8rem',
                                    background: canAffordRecruit ? classDef?.color || 'var(--accent-secondary)' : 'var(--bg-panel)',
                                    border: canAffordRecruit ? `1px solid ${classDef?.color}` : '1px solid var(--panel-border)',
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    justifyContent: 'center'
                                }}
                            >
                                <UserPlus size={18} /> Recruit
                            </GameButton>
                            {!canAffordRecruit && (
                                <div style={{ fontSize: '0.7rem', color: '#e74c3c', textAlign: 'center', marginTop: '0.2rem' }}>
                                    {souls < recruitSoulCost ? 'Not enough Souls' : 'Not enough Gold'}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem', gap: '1rem' }}>
                <GameButton
                    onClick={reroll}
                    disabled={souls < rerollCost}
                    style={{
                        padding: '0.8rem 2.5rem',
                        background: 'var(--accent-warning)', // orange
                        border: 'none',
                        fontSize: '1.1rem',
                        fontWeight: 'bold'
                    }}
                >
                    <RefreshCw size={20} /> Reroll ({rerollCost} Souls)
                </GameButton>

                <RerollAdButton />

                <GameButton
                    onClick={() => {
                        AudioManager.playSFX('ui_click');
                        useAdStore.getState().watchAd('souls', () => {
                            useMetaStore.getState().addSouls(25);
                            AudioManager.playSFX('ui_recruit');
                            useToastStore.getState().addToast({
                                type: 'resource',
                                message: 'Received 25 Souls!',
                                icon: '💎',
                                color: '#9b59b6'
                            });
                        });
                    }}
                    style={{
                        padding: '0.8rem 1.5rem',
                        background: '#8e44ad',
                        border: 'none',
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <Video size={18} /> Get 25 Souls
                </GameButton>
            </div>
        </div>
    );
};

export default RecruitmentPanel;
