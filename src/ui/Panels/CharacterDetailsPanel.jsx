import React, { useState } from 'react';
import useGameStore from '../../store/useGameStore';
import usePartyStore, { xpToLevel } from '../../store/usePartyStore';
import useResourceStore from '../../store/useResourceStore';
import useInventoryStore from '../../store/useInventoryStore';
import { X, Sword, Shield, Heart, ArrowUpCircle, Package, Crosshair, Zap } from 'lucide-react';
import GameButton from '../components/GameButton';
import AudioManager from '../../audio/AudioManager';

const SLOT_NAMES = {
    mainHand: 'Main Hand',
    offHand: 'Off Hand',
    armor: 'Armor',
    trinket: 'Trinket',
};

const SLOT_ICONS = {
    mainHand: '⚔️',
    offHand: '🛡️',
    armor: '🧥',
    trinket: '💎',
};

const CharacterDetailsPanel = () => {
    const { activePanel, closePanel, selectedGridSlot } = useGameStore();
    const { members, updateMember, removeMember } = usePartyStore();
    const { gold, removeGold } = useResourceStore();
    const inventory = useInventoryStore();
    const [openSlot, setOpenSlot] = useState(null); // Which equipment slot picker is open

    // Calculate member (safe even if selectedGridSlot is null)
    const member = selectedGridSlot
        ? members.find(m => m.x === selectedGridSlot.x && m.y === selectedGridSlot.y)
        : null;

    React.useEffect(() => {
        if (activePanel === 'character_details') {
            AudioManager.playSFX('panel_open');
        }
    }, [activePanel]);

    React.useEffect(() => {
        // Auto-close if member doesn't exist (e.g. dismissed or bug)
        if (!member && activePanel === 'character_details') {
            closePanel();
        }
    }, [member, activePanel, closePanel]);

    if (activePanel !== 'character_details' || !selectedGridSlot) return null;
    if (!member) return null;

    const level = member.level || 1;
    const xp = member.xp || 0;
    const xpNeeded = xpToLevel(level);
    const xpRatio = Math.min(1, xp / xpNeeded);
    const upgradeCost = Math.floor(100 * Math.pow(1.5, level - 1));
    const equipStats = member.equipment?.combinedStats || { atk: 0, def: 0, hp: 0 };

    const currentHp = member.currentHp ?? member.stats.hp;
    const maxHp = member.stats.hp;
    const needsHeal = currentHp < maxHp;
    const healCost = level * 5;
    const { gameState } = useGameStore();

    const handleUpgrade = () => {
        if (gold >= upgradeCost) {
            removeGold(upgradeCost);
            updateMember(member.id, {
                level: level + 1,
                stats: {
                    ...member.stats,
                    hp: Math.floor(member.stats.hp * 1.1),
                    atk: Math.floor(member.stats.atk * 1.1) || member.stats.atk + 1,
                    def: (member.stats.def || 0) + 1,
                },
                currentHp: Math.floor(member.stats.hp * 1.1),
            });
        }
    };

    const handleHealInTown = () => {
        if (!needsHeal || gold < healCost) return;
        removeGold(healCost);
        updateMember(member.id, { currentHp: maxHp });
        AudioManager.playSFX('ui_click');
    };

    const handleDismiss = () => {
        removeMember(member.id);
        closePanel();
    };

    const handleSlotClick = (slot) => {
        const currentItem = member.equipment?.[slot];
        if (currentItem && currentItem.instanceId) {
            // Unequip
            inventory.unequipItem(member.id, slot);
            setOpenSlot(null);
        } else {
            // Toggle picker
            setOpenSlot(openSlot === slot ? null : slot);
        }
    };

    const handleEquipItem = (item) => {
        inventory.equipItem(member.id, item);
        setOpenSlot(null);
    };

    const equipSlots = ['mainHand', 'offHand', 'armor', 'trinket'];

    return (
        <div className="glass-panel anim-scale-in" style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(15, 15, 20, 0.98)',
            border: '1px solid var(--panel-border)',
            borderRadius: 'var(--radius-xl)',
            padding: 'clamp(1rem, 3vw, 2rem)',
            width: 'min(460px, 95vw)',
            maxHeight: '90vh',
            overflowY: 'auto',
            color: 'var(--text-main)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
            zIndex: 1000
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--panel-border)', paddingBottom: '1rem' }}>
                <div>
                    <h2 className="font-display" style={{ margin: 0, fontSize: '1.8rem', color: 'var(--accent-gold)' }}>{member.name}</h2>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                        <span style={{ fontWeight: 'bold', color: 'white' }}>{member.class}</span> <span style={{ opacity: 0.5 }}>|</span> Level {level}
                        {member.canHeal && <span className="text-heal" style={{ marginLeft: '0.5rem', fontWeight: 'bold' }}>✚ Healer</span>}
                    </div>
                </div>
                <GameButton onClick={closePanel} style={{ padding: '8px', background: 'transparent', border: 'none' }}>
                    <X size={24} />
                </GameButton>
            </div>

            {/* XP Bar */}
            <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#bdc3c7', marginBottom: '0.2rem' }}>
                    <span>XP</span>
                    <span>{xp} / {xpNeeded}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                    <div style={{
                        width: `${xpRatio * 100}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #3498db, #2ecc71)',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                    }} />
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center' }}>
                    <Heart size={16} color="#e74c3c" />
                    <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{member.currentHp ?? member.stats.hp}/{member.stats.hp}</div>
                    {equipStats.hp > 0 && <div style={{ color: '#27ae60', fontSize: '0.7rem' }}>+{equipStats.hp}</div>}
                </div>
                <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center' }}>
                    <Sword size={16} color="#f1c40f" />
                    <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{member.stats.atk}</div>
                    {equipStats.atk > 0 && <div style={{ color: '#27ae60', fontSize: '0.7rem' }}>+{equipStats.atk}</div>}
                </div>
                <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center' }}>
                    <Shield size={16} color="#3498db" />
                    <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{member.stats.def || 0}</div>
                    {equipStats.def > 0 && <div style={{ color: '#27ae60', fontSize: '0.7rem' }}>+{equipStats.def}</div>}
                </div>
                <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center' }}>
                    <Crosshair size={16} color="#e67e22" />
                    <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: (member.range || 100) >= 300 ? '#27ae60' : '#bdc3c7' }}>{(member.range || 100) >= 300 ? 'Ranged' : 'Melee'}</div>
                </div>
                <div style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center' }}>
                    <Zap size={16} color="#f39c12" />
                    <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{member.attackSpeed || 1.0}s</div>
                </div>
            </div>

            {/* Equipment Slots (Clickable) */}
            <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.85rem', color: '#95a5a6', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Package size={14} /> Equipment <span style={{ fontSize: '0.7rem', color: '#7f8c8d' }}>(click to equip/unequip)</span>
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    {equipSlots.map(slot => {
                        const item = member.equipment?.[slot];
                        const hasItem = item && item.instanceId;
                        const isPickerOpen = openSlot === slot;

                        return (
                            <div key={slot}>
                                <GameButton
                                    onClick={() => handleSlotClick(slot)}
                                    style={{
                                        width: '100%',
                                        padding: '0.8rem',
                                        background: isPickerOpen ? 'rgba(52,152,219,0.2)' : 'rgba(255,255,255,0.03)',
                                        border: `1px solid ${hasItem ? (item.rarityColor || '#555') : isPickerOpen ? 'var(--accent-info)' : 'var(--panel-border)'}`,
                                        textAlign: 'left',
                                        display: 'block' // Override flex
                                    }}
                                >
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <span style={{ fontSize: '1.1rem' }}>{SLOT_ICONS[slot]}</span> {SLOT_NAMES[slot]}
                                    </div>
                                    {hasItem ? (
                                        <div>
                                            <div style={{ color: item.rarityColor || '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>{item.name}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                {Object.entries(item.stats || {}).map(([k, v]) => `+${v} ${k.toUpperCase()}`).join(' ')}
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8rem', padding: '0.2rem 0' }}>Empty Slot</div>
                                    )}
                                </GameButton>
                            </div>
                        );
                    })}
                </div>

                {/* Equipment Picker (dropdown for selected slot) */}
                {openSlot && (
                    <div style={{
                        marginTop: '0.5rem',
                        background: 'rgba(30, 30, 50, 0.95)',
                        border: '1px solid #3498db',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        maxHeight: '180px',
                        overflowY: 'auto',
                    }}>
                        <div style={{ fontSize: '0.75rem', color: '#3498db', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                            Available for {SLOT_NAMES[openSlot]}:
                        </div>
                        {(() => {
                            const items = inventory.getItemsForSlot(openSlot);
                            if (items.length === 0) {
                                return <div style={{ color: '#7f8c8d', fontStyle: 'italic', fontSize: '0.8rem' }}>No items in inventory for this slot.</div>;
                            }
                            return items.map(item => (
                                <GameButton
                                    key={item.instanceId}
                                    onClick={() => handleEquipItem(item)}
                                    style={{
                                        width: '100%',
                                        padding: '0.6rem',
                                        marginBottom: '0.4rem',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: `1px solid ${item.rarityColor || 'var(--panel-border)'}`,
                                        textAlign: 'left',
                                        justifyContent: 'space-between'
                                    }}
                                >
                                    <div>
                                        <div style={{ color: item.rarityColor || '#fff', fontWeight: 'bold', fontSize: '0.85rem' }}>{item.name}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                            {Object.entries(item.stats || {}).map(([k, v]) => `+${v} ${k.toUpperCase()}`).join(' ')}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.65rem', color: item.rarityColor, background: `${item.rarityColor}22`, padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                                        {item.rarity}
                                    </div>
                                </GameButton>
                            ));
                        })()}
                    </div>
                )}
            </div>

            {/* Upgrade Button */}
            <GameButton
                onClick={handleUpgrade}
                disabled={gold < upgradeCost}
                style={{
                    width: '100%',
                    padding: '0.8rem',
                    background: gold >= upgradeCost ? 'var(--accent-heal)' : 'var(--bg-panel)',
                    border: gold >= upgradeCost ? '1px solid var(--accent-heal)' : '1px solid var(--panel-border)',
                    marginBottom: '0.8rem',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    color: gold >= upgradeCost ? '#fff' : '#888'
                }}
            >
                <ArrowUpCircle size={20} />
                Upgrade ({upgradeCost} G)
            </GameButton>

            {/* Lobby Heal */}
            {gameState === 'LOBBY' && needsHeal && (
                <GameButton
                    onClick={handleHealInTown}
                    disabled={gold < healCost}
                    style={{
                        width: '100%',
                        padding: '0.7rem',
                        background: gold >= healCost ? 'rgba(231, 76, 60, 0.3)' : 'var(--bg-panel)',
                        border: gold >= healCost ? '1px solid #e74c3c' : '1px solid var(--panel-border)',
                        marginBottom: '0.8rem',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        color: gold >= healCost ? '#e74c3c' : '#888'
                    }}
                >
                    <Heart size={16} /> Heal to Full ({healCost} G)
                </GameButton>
            )}

            <GameButton
                onClick={handleDismiss}
                style={{
                    width: '100%',
                    padding: '0.6rem',
                    background: 'rgba(231, 76, 60, 0.2)',
                    border: '1px solid #e74c3c',
                    color: '#e74c3c', // danger
                }}
            >
                <X size={14} /> Dismiss Character
            </GameButton>
        </div>
    );
};

export default CharacterDetailsPanel;
