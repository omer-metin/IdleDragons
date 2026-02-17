import React, { useEffect } from 'react';
import useInventoryStore from '../../store/useInventoryStore';
import useGameStore from '../../store/useGameStore';
import { Package, Sword, Shield, Heart } from 'lucide-react';
import AudioManager from '../../audio/AudioManager';

const SLOT_ICONS = {
    mainHand: '⚔️',
    offHand: '🛡️',
    armor: '🧥',
    trinket: '💎',
};

const STAT_ICONS = {
    atk: <Sword size={12} color="var(--accent-gold)" />,
    def: <Shield size={12} color="var(--accent-info)" />,
    hp: <Heart size={12} color="var(--accent-danger)" />,
};

const InventoryPanel = () => {
    const { items } = useInventoryStore();
    const { activePanel } = useGameStore();

    useEffect(() => {
        if (activePanel !== 'character_details') {
            AudioManager.playSFX('panel_open');
        }
    }, []);

    // Don't show if character details is open (it has its own picker)
    if (activePanel === 'character_details') return null;

    return (
        <div className="glass-panel anim-slide-up" style={{
            position: 'absolute',
            bottom: '1rem',
            right: '1rem',
            width: 'min(280px, 45vw)',
            padding: '1rem',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--text-main)',
            pointerEvents: 'auto',
            maxHeight: '360px',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 100
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--panel-border)', paddingBottom: '0.5rem' }}>
                <Package size={18} className="text-gold" />
                <h3 className="font-display" style={{ margin: 0, fontSize: '1.2rem', letterSpacing: '0.5px' }}>Inventory ({items.length})</h3>
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.8rem', textAlign: 'center' }}>
                Select a hero to equip items
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.5rem',
                overflowY: 'auto',
                flex: 1,
                paddingRight: '4px' // Space for scrollbar
            }}>
                {items.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '1.5rem', fontSize: '0.9rem' }}>
                        Empty — defeat enemies to find loot!
                    </div>
                )}
                {items.map(item => (
                    <div
                        key={item.instanceId}
                        title={`${item.name}\n${item.rarity}\n${Object.entries(item.stats || {}).map(([k, v]) => `+${v} ${k.toUpperCase()}`).join('\n')}`}
                        className="glass-panel"
                        style={{
                            width: '100%',
                            aspectRatio: '1',
                            background: `${item.rarityColor || '#555'}22`,
                            border: `1px solid ${item.rarityColor || 'var(--panel-border)'}`,
                            borderRadius: 'var(--radius-sm)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.7rem',
                            cursor: 'help',
                            transition: 'all var(--transition-fast)',
                            position: 'relative',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.borderColor = 'white';
                            AudioManager.playSFX('button_hover');
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.borderColor = item.rarityColor || 'var(--panel-border)';
                        }}
                    >
                        <div style={{ fontSize: '1.2rem', marginBottom: '2px' }}>{SLOT_ICONS[item.type] || '📦'}</div>
                        {/* Mini stats */}
                        <div style={{ display: 'flex', gap: '2px', opacity: 0.8 }}>
                            {Object.keys(item.stats || {}).slice(0, 1).map(k => (
                                <span key={k}>{STAT_ICONS[k]}</span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InventoryPanel;
