import React from 'react';
import useMetaStore, { UPGRADES } from '../../store/useMetaStore';
import useGameStore from '../../store/useGameStore';
import { Skull, TrendingUp, X } from 'lucide-react';
import GameButton from '../components/GameButton';
import AudioManager from '../../audio/AudioManager';

const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
};

const MetaPanel = () => {
    const { activePanel, closePanel, zone } = useGameStore();
    const { souls, generation, upgrades, getUpgradeCost, buyUpgrade, triggerTPK, getPendingSouls, highestZone, totalKillsAllTime, totalPlaytimeSeconds } = useMetaStore();

    React.useEffect(() => {
        if (activePanel === 'meta') {
            AudioManager.playSFX('panel_open');
        }
    }, [activePanel]);

    if (activePanel !== 'meta') return null;

    const pendingSouls = getPendingSouls();

    const handleTPK = () => {
        closePanel();
        useGameStore.getState().endGame();
        AudioManager.playSFX('ui_equip');
    };

    return (
        <div className="glass-panel anim-scale-in" style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(10, 10, 15, 0.98)',
            border: '2px solid var(--accent-secondary)',
            borderRadius: 'var(--radius-xl)',
            padding: '2rem',
            width: '620px',
            maxHeight: '90vh',
            overflowY: 'auto',
            color: 'var(--text-main)',
            boxShadow: '0 0 80px rgba(142, 68, 173, 0.4)',
            zIndex: 2000
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--panel-border)', paddingBottom: '1rem' }}>
                <h1 className="font-display" style={{ fontSize: '2rem', color: 'var(--accent-secondary)', margin: 0 }}>Soul Shop</h1>
                <GameButton onClick={closePanel} style={{ padding: '8px', background: 'transparent', border: 'none' }}>
                    <X size={28} />
                </GameButton>
            </div>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#bdc3c7' }}>Generation {generation}</div>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#bdc3c7' }}>Souls</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#f1c40f' }}>{souls}</div>
                </div>
                <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#bdc3c7' }}>Pending</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#e74c3c' }}>+{pendingSouls}</div>
                </div>
                <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#bdc3c7' }}>Best Zone</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#3498db' }}>{highestZone}</div>
                </div>
                <div style={{ textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '0.75rem', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#bdc3c7' }}>Total Kills</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#27ae60' }}>{totalKillsAllTime}</div>
                </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ borderBottom: '1px solid #8e44ad', paddingBottom: '0.5rem', margin: '0 0 0.75rem' }}>Meta Upgrades</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '350px', overflowY: 'auto' }}>
                    {Object.entries(UPGRADES).map(([id, data]) => {
                        const level = upgrades[id] || 0;
                        const cost = getUpgradeCost(id);
                        const isMax = level >= data.maxLevel;

                        return (
                            <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{data.name} <span style={{ fontSize: '0.75rem', color: '#9b59b6' }}>Lvl {level}/{data.maxLevel}</span></div>
                                    <div style={{ fontSize: '0.75rem', color: '#7f8c8d' }}>{data.description}</div>
                                </div>
                                <GameButton
                                    onClick={() => buyUpgrade(id)}
                                    disabled={isMax || souls < cost}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: isMax ? 'var(--accent-success)' : souls >= cost ? 'var(--accent-secondary)' : 'var(--bg-panel)',
                                        border: (isMax || souls >= cost) ? 'none' : '1px solid var(--panel-border)',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        minWidth: '90px',
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    {isMax ? 'MAX' : `${cost} ✦`}
                                </GameButton>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MetaPanel;
