import React from 'react';
import useInventoryStore from '../../store/useInventoryStore';
import useGameStore from '../../store/useGameStore';
import { Package, Sword, Shield, Heart } from 'lucide-react';

const SLOT_ICONS = {
    mainHand: '⚔️',
    offHand: '🛡️',
    armor: '🧥',
    trinket: '💎',
};

const STAT_ICONS = {
    atk: <Sword size={12} color="#f1c40f" />,
    def: <Shield size={12} color="#3498db" />,
    hp: <Heart size={12} color="#e74c3c" />,
};

const InventoryPanel = () => {
    const { items } = useInventoryStore();
    const { activePanel } = useGameStore();

    // Don't show if character details is open (it has its own picker)
    if (activePanel === 'character_details') return null;

    return (
        <div className="glass-panel" style={{
            position: 'absolute',
            bottom: '1rem',
            right: '1rem',
            width: '260px',
            padding: '1rem',
            borderRadius: '14px',
            color: 'white',
            pointerEvents: 'auto',
            maxHeight: '320px',
            display: 'flex',
            flexDirection: 'column',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                <Package size={16} />
                <h3 style={{ margin: 0, fontSize: '1rem', letterSpacing: '0.3px' }}>Inventory ({items.length})</h3>
            </div>

            <div style={{ fontSize: '0.7rem', color: '#7f8c8d', marginBottom: '0.5rem' }}>
                Click a hero to equip items
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.4rem',
                overflowY: 'auto',
                flex: 1,
            }}>
                {items.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', color: '#555', fontStyle: 'italic', textAlign: 'center', padding: '1rem', fontSize: '0.8rem' }}>
                        Empty — kill enemies for loot!
                    </div>
                )}
                {items.map(item => (
                    <div
                        key={item.instanceId}
                        title={`${item.name}\n${item.rarity}\n${Object.entries(item.stats || {}).map(([k, v]) => `+${v} ${k.toUpperCase()}`).join('\n')}`}
                        style={{
                            width: '100%',
                            aspectRatio: '1',
                            background: `${item.rarityColor || '#555'}11`,
                            border: `2px solid ${item.rarityColor || '#555'}`,
                            borderRadius: '8px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.65rem',
                            cursor: 'default',
                            transition: 'transform 0.1s',
                            position: 'relative',
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <div style={{ fontSize: '1.1rem' }}>{SLOT_ICONS[item.type] || '📦'}</div>
                        <div style={{ color: item.rarityColor, fontWeight: 'bold', textAlign: 'center', lineHeight: '1.1', marginTop: '0.1rem' }}>
                            {Object.entries(item.stats || {}).map(([k, v]) => (
                                <span key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.1rem', justifyContent: 'center' }}>
                                    {STAT_ICONS[k]} {v}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InventoryPanel;
