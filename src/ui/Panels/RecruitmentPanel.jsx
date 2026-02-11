import React, { useEffect } from 'react';
import useRecruitmentStore from '../../store/useRecruitmentStore';
import { CLASS_DEFINITIONS } from '../../store/useRecruitmentStore';
import useGameStore from '../../store/useGameStore';
import useMetaStore from '../../store/useMetaStore';
import { UserPlus, RefreshCw, X, Sword, Shield, Heart, Crosshair, Zap } from 'lucide-react';

const RecruitmentPanel = () => {
    const { activePanel, closePanel, selectedGridSlot, gameState } = useGameStore();
    const { candidates, generateCandidates, reroll, recruit } = useRecruitmentStore();
    const { souls } = useMetaStore();

    useEffect(() => {
        if (activePanel === 'recruitment' && candidates.length === 0) {
            generateCandidates();
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
            closePanel();
        }
    };

    const recruitCost = 10;
    const rerollCost = 5;

    return (
        <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(20, 20, 30, 0.95)',
            border: '2px solid #8e44ad',
            borderRadius: '16px',
            padding: '2rem',
            width: '900px',
            maxWidth: '95vw',
            color: 'white',
            fontFamily: 'Inter, sans-serif',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            zIndex: 1000
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.6rem' }}>Choose Your Hero</h2>
                    <div style={{ color: '#bdc3c7', fontSize: '0.85rem', marginTop: '0.3rem' }}>
                        Target Slot: <span style={{ color: '#9b59b6', fontWeight: 'bold' }}>({selectedGridSlot?.x}, {selectedGridSlot?.y})</span>
                        <span style={{ marginLeft: '1rem' }}>Cost: {recruitCost} Souls</span>
                    </div>
                </div>
                <button onClick={closePanel} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                    <X size={24} />
                </button>
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
                            <button
                                onClick={() => handleRecruit(index)}
                                disabled={souls < recruitCost}
                                style={{
                                    marginTop: 'auto',
                                    padding: '0.7rem',
                                    background: souls >= recruitCost ? classDef?.color || '#8e44ad' : '#7f8c8d',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    cursor: souls >= recruitCost ? 'pointer' : 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    transition: 'opacity 0.2s',
                                }}
                            >
                                <UserPlus size={16} />
                                Recruit
                            </button>
                        </div>
                    );
                })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <button
                    onClick={reroll}
                    disabled={souls < rerollCost}
                    style={{
                        padding: '0.8rem 2rem',
                        background: '#e67e22',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        cursor: souls >= rerollCost ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <RefreshCw size={18} />
                    Reroll Names ({rerollCost} Souls)
                </button>
            </div>
        </div>
    );
};

export default RecruitmentPanel;
