import React, { useEffect } from 'react';
import useInventoryStore from '../../store/useInventoryStore';
import { MAX_ITEMS, getSellValue } from '../../store/useInventoryStore';
import useGameStore from '../../store/useGameStore';
import { Package, Sword, Shield, Heart, Trash2 } from 'lucide-react';
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
    const { items, sellItem, sellAllBelow, salvageAllBelow } = useInventoryStore();
    const { activePanel, openPanel } = useGameStore();

    useEffect(() => {
        if (activePanel !== 'character_details') {
            AudioManager.playSFX('panel_open');
        }
    }, []);

    // Don't show if character details is open (it has its own picker)
    if (activePanel === 'character_details') return null;

    const commonCount = items.filter(i => i.rarity === 'Common').length;

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
            maxHeight: '400px',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 100
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', borderBottom: '1px solid var(--panel-border)', paddingBottom: '0.5rem' }}>
                <Package size={18} className="text-gold" />
                <h3 className="font-display" style={{ margin: 0, fontSize: '1.2rem', letterSpacing: '0.5px' }}>
                    Inventory
                    <span style={{
                        fontSize: '0.8rem',
                        fontWeight: 'normal',
                        marginLeft: '0.5rem',
                        color: items.length >= MAX_ITEMS ? 'var(--accent-danger)' : 'var(--text-dim)'
                    }}>
                        {items.length}/{MAX_ITEMS}
                    </span>
                </h3>
            </div>

            {/* Sell / Salvage / Craft controls */}
            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                {items.length > 0 && commonCount > 0 && (
                    <button
                        onClick={() => {
                            AudioManager.playSFX('ui_click');
                            sellAllBelow('Uncommon');
                        }}
                        style={{
                            flex: 1,
                            padding: '0.35rem 0.5rem',
                            background: 'rgba(149, 165, 166, 0.2)',
                            border: '1px solid #95a5a6',
                            borderRadius: 'var(--radius-sm)',
                            color: '#95a5a6',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.3rem',
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(149, 165, 166, 0.4)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(149, 165, 166, 0.2)'; }}
                        title={`Sell ${commonCount} common items`}
                    >
                        <Trash2 size={12} /> Sell ({commonCount})
                    </button>
                )}
                {items.length > 0 && commonCount > 0 && (
                    <button
                        onClick={() => {
                            AudioManager.playSFX('ui_click');
                            salvageAllBelow('Uncommon');
                        }}
                        style={{
                            flex: 1,
                            padding: '0.35rem 0.5rem',
                            background: 'rgba(149, 165, 166, 0.15)',
                            border: '1px solid #7f8c8d',
                            borderRadius: 'var(--radius-sm)',
                            color: '#bdc3c7',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.3rem',
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(149, 165, 166, 0.35)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(149, 165, 166, 0.15)'; }}
                        title={`Salvage ${commonCount} common items for materials`}
                    >
                        {'\u2699\uFE0F'} Salvage
                    </button>
                )}
                <button
                    onClick={() => {
                        AudioManager.playSFX('ui_click');
                        openPanel('crafting');
                    }}
                    style={{
                        flex: 1,
                        padding: '0.35rem 0.5rem',
                        background: 'rgba(39, 174, 96, 0.2)',
                        border: '1px solid #27ae60',
                        borderRadius: 'var(--radius-sm)',
                        color: '#27ae60',
                        fontSize: '0.7rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.3rem',
                        transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(39, 174, 96, 0.4)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(39, 174, 96, 0.2)'; }}
                >
                    {'\uD83D\uDD28'} Craft
                </button>
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
                {items.map(item => {
                    const sellValue = getSellValue(item);
                    return (
                        <div
                            key={item.instanceId}
                            title={`${item.name}\n${item.rarity}\n${Object.entries(item.stats || {}).map(([k, v]) => `+${v} ${k.toUpperCase()}`).join('\n')}\nSell: ${sellValue}g`}
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
                                cursor: 'pointer',
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
                            onContextMenu={(e) => {
                                e.preventDefault();
                                AudioManager.playSFX('ui_click');
                                sellItem(item.instanceId);
                            }}
                        >
                            <div style={{ fontSize: '1.2rem', marginBottom: '2px' }}>{SLOT_ICONS[item.type] || '📦'}</div>
                            {/* Mini stats */}
                            <div style={{ display: 'flex', gap: '2px', opacity: 0.8 }}>
                                {Object.keys(item.stats || {}).slice(0, 1).map(k => (
                                    <span key={k}>{STAT_ICONS[k]}</span>
                                ))}
                            </div>
                            {/* Sell value hint */}
                            <div style={{ fontSize: '0.55rem', color: 'var(--accent-gold)', opacity: 0.6, marginTop: '1px' }}>
                                {sellValue}g
                            </div>
                        </div>
                    );
                })}
            </div>

            {items.length > 0 && (
                <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textAlign: 'center', marginTop: '0.5rem', borderTop: '1px solid var(--panel-border)', paddingTop: '0.4rem' }}>
                    Right-click to sell
                </div>
            )}
        </div>
    );
};

export default InventoryPanel;
