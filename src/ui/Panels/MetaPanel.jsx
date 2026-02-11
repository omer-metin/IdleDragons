import React from 'react';
import useMetaStore, { UPGRADES } from '../../store/useMetaStore';
import useGameStore from '../../store/useGameStore';
import { Skull, TrendingUp, X } from 'lucide-react';

const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
};

const MetaPanel = () => {
    const { activePanel, closePanel, zone } = useGameStore();
    const { souls, generation, upgrades, getUpgradeCost, buyUpgrade, triggerTPK, getPendingSouls, highestZone, totalKillsAllTime, totalPlaytimeSeconds } = useMetaStore();

    if (activePanel !== 'meta') return null;

    const pendingSouls = getPendingSouls();

    const handleTPK = () => {
        triggerTPK();
        closePanel();
    };

    return (
        <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(10, 10, 15, 0.98)',
            border: '2px solid #8e44ad',
            borderRadius: '16px',
            padding: '2rem',
            width: '620px',
            maxHeight: '85vh',
            overflowY: 'auto',
            color: '#ecf0f1',
            fontFamily: 'Inter, sans-serif',
            boxShadow: '0 0 50px rgba(142, 68, 173, 0.3)',
            zIndex: 2000
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ textAlign: 'center', color: '#9b59b6', margin: 0 }}>Dungeon Master Mode</h1>
                <button onClick={closePanel} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                    <X size={24} />
                </button>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto' }}>
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
                                <button
                                    onClick={() => buyUpgrade(id)}
                                    disabled={isMax || souls < cost}
                                    style={{
                                        padding: '0.4rem 0.8rem',
                                        background: isMax ? '#27ae60' : souls >= cost ? '#8e44ad' : '#34495e',
                                        border: 'none',
                                        borderRadius: '6px',
                                        color: 'white',
                                        cursor: isMax || souls < cost ? 'default' : 'pointer',
                                        fontWeight: 'bold',
                                        minWidth: '80px',
                                        fontSize: '0.85rem'
                                    }}
                                >
                                    {isMax ? 'MAX' : `${cost} ✦`}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            <button
                onClick={handleTPK}
                style={{
                    width: '100%',
                    padding: '1rem',
                    background: '#c0392b',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    boxShadow: '0 4px 15px rgba(192, 57, 43, 0.4)'
                }}
            >
                <Skull size={22} />
                TRIGGER TPK (+{pendingSouls} Souls)
            </button>
        </div>
    );
};

export default MetaPanel;
