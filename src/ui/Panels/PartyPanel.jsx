import React from 'react';
import usePartyStore from '../../store/usePartyStore';
import useGameStore from '../../store/useGameStore';
import { UserPlus, Shield, Sword, Crosshair, Zap, Trash2 } from 'lucide-react';
import GameButton from '../components/GameButton';
import AudioManager from '../../audio/AudioManager';

const PartyPanel = () => {
    const { members, addMember, removeMember } = usePartyStore();

    const handleAddHero = () => {
        addMember({
            name: 'Hero ' + (members.length + 1),
            class: 'Warrior',
            stats: { hp: 100, maxHp: 100, atk: 10, def: 5 }
        });
    };

    return (
        <div className="glass-panel anim-slide-right" style={{
            position: 'absolute',
            bottom: '1rem',
            left: '1rem',
            width: 'min(340px, 90vw)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--text-main)',
            pointerEvents: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            zIndex: 100
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--panel-border)', paddingBottom: '0.5rem' }}>
                <h3 className="font-display" style={{ margin: 0, fontSize: '1.2rem', letterSpacing: '0.5px', color: 'var(--accent-primary)' }}>Warband <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>({members.length}/4)</span></h3>
                <GameButton
                    onClick={handleAddHero}
                    disabled={members.length >= 4}
                    title="Recruit Hero"
                    style={{ padding: '0.4rem', borderRadius: '50%', width: '36px', height: '36px' }}
                >
                    <UserPlus size={18} />
                </GameButton>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
                {members.map(member => (
                    <div key={member.id}
                        onClick={() => {
                            AudioManager.playSFX('button_click');
                            useGameStore.getState().selectGridSlot(member.x, member.y);
                            useGameStore.getState().openPanel('character_details');
                        }}
                        className="glass-panel"
                        style={{
                            background: 'rgba(255,255,255,0.03)',
                            padding: '0.8rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--panel-border)',
                            cursor: 'pointer',
                            transition: 'all var(--transition-fast)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.borderColor = 'var(--accent-primary)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            AudioManager.playSFX('button_hover');
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.borderColor = 'var(--panel-border)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <strong style={{ color: 'var(--accent-primary)', fontSize: '1rem' }}>{member.name}</strong>
                            <small style={{ background: 'rgba(255,255,255,0.1)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold' }}>{member.class.toUpperCase()}</small>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }} title="Attack">
                                <Sword size={12} color="var(--accent-gold)" />
                                <span style={{ color: 'var(--text-main)' }}>{member.stats.atk + (member.equipment?.combinedStats?.atk || 0)}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }} title="Defense">
                                <Shield size={12} color="var(--accent-info)" />
                                <span style={{ color: 'var(--text-main)' }}>{member.stats.def + (member.equipment?.combinedStats?.def || 0)}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', gridColumn: 'span 2' }}>
                                <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${(member.currentHp ?? member.stats.hp) / (member.stats.hp + (member.equipment?.combinedStats?.hp || 0)) * 100}%`,
                                        height: '100%',
                                        background: 'var(--accent-danger)'
                                    }} />
                                </div>
                                <span style={{ fontSize: '0.7rem' }}>{Math.floor((member.currentHp ?? member.stats.hp))}/{member.stats.hp + (member.equipment?.combinedStats?.hp || 0)}</span>
                            </div>
                        </div>

                        {/* Hover Overlay Actions could go here, but keep simple for now */}
                    </div>
                ))}

                {members.length === 0 && (
                    <div style={{
                        border: '2px dashed var(--panel-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '2rem',
                        textAlign: 'center',
                        color: 'var(--text-muted)'
                    }}>
                        <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>Warband Empty</p>
                        <p style={{ fontSize: '0.8rem' }}>Recruit heroes from the lobby!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PartyPanel;
