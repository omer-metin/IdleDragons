import React from 'react';
import usePartyStore from '../../store/usePartyStore';
import useGameStore from '../../store/useGameStore';
import { UserPlus, Shield, Sword, Crosshair, Zap } from 'lucide-react';

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
        <div className="glass-panel" style={{
            position: 'absolute',
            bottom: '1rem',
            left: '1rem',
            width: '320px',
            padding: '1.25rem',
            borderRadius: '16px',
            color: 'white',
            pointerEvents: 'auto'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', letterSpacing: '0.5px' }}>Warband ({members.length}/4)</h3>
                <button
                    onClick={handleAddHero}
                    disabled={members.length >= 4}
                    title="Add Hero"
                    style={{ padding: '0.4rem', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <UserPlus size={16} />
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '250px', overflowY: 'auto' }}>
                {members.map(member => (
                    <div key={member.id}
                        onClick={() => {
                            useGameStore.getState().selectGridSlot(member.x, member.y);
                            useGameStore.getState().openPanel('character_details');
                        }}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            padding: '0.75rem',
                            borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            cursor: 'pointer',
                            transition: 'border-color 0.2s, background 0.2s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ color: 'var(--accent-primary)' }}>{member.name}</strong>
                            <small style={{ background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem' }}>{member.class.toUpperCase()}</small>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#ff7675' }} title="Attack (Base + Gear)">
                                <Sword size={14} /> {member.stats.atk + (member.equipment?.combinedStats?.atk || 0)}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#55efc4' }} title="Defense (Base + Gear)">
                                <Shield size={14} /> {member.stats.def + (member.equipment?.combinedStats?.def || 0)}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#e67e22' }} title="Range">
                                <Crosshair size={12} /> {(member.range || 100) >= 300 ? 'Far' : 'Near'}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#f39c12' }} title="Attack Speed">
                                <Zap size={12} /> {member.attackSpeed || 1.0}s
                            </span>
                            <span style={{ marginLeft: 'auto', color: '#81ecec' }}>HP: {member.currentHp ?? member.stats.hp}/{member.stats.hp + (member.equipment?.combinedStats?.hp || 0)}</span>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); removeMember(member.id); }}
                            style={{
                                marginTop: '0.75rem',
                                width: '100%',
                                padding: '0.4rem',
                                fontSize: '0.75rem',
                                background: 'rgba(231, 76, 60, 0.2)',
                                border: '1px solid rgba(231, 76, 60, 0.4)',
                                color: '#ff7675'
                            }}
                        >
                            Dismiss from Warband
                        </button>
                    </div>
                ))}
                {members.length === 0 && <div style={{ color: 'var(--text-dim)', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>Your warband is empty. Recruit members to begin.</div>}
            </div>
        </div>
    );
};

export default PartyPanel;
