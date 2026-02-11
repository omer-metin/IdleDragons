import React, { useState } from 'react';
import useGameStore from '../../store/useGameStore';
import usePartyStore, { xpToLevel } from '../../store/usePartyStore';
import useResourceStore from '../../store/useResourceStore';
import useInventoryStore from '../../store/useInventoryStore';
import { X, Sword, Shield, Heart, ArrowUpCircle, Package, Crosshair, Zap } from 'lucide-react';

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

    if (activePanel !== 'character_details' || !selectedGridSlot) return null;

    const member = members.find(m => m.x === selectedGridSlot.x && m.y === selectedGridSlot.y);

    if (!member) {
        closePanel();
        return null;
    }

    const level = member.level || 1;
    const xp = member.xp || 0;
    const xpNeeded = xpToLevel(level);
    const xpRatio = Math.min(1, xp / xpNeeded);
    const upgradeCost = Math.floor(100 * Math.pow(1.5, level - 1));
    const equipStats = member.equipment?.combinedStats || { atk: 0, def: 0, hp: 0 };

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
        <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(20, 20, 30, 0.95)',
            border: '2px solid #34495e',
            borderRadius: '16px',
            padding: '2rem',
            width: '440px',
            maxHeight: '85vh',
            overflowY: 'auto',
            color: 'white',
            fontFamily: 'Inter, sans-serif',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            zIndex: 1000
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{member.name}</h2>
                    <div style={{ fontSize: '0.85rem', color: '#bdc3c7' }}>
                        <span style={{ color: '#f39c12', fontWeight: 'bold' }}>{member.class}</span> · Level {level}
                        {member.canHeal && <span style={{ color: '#2ecc71', marginLeft: '0.5rem' }}>✚ Healer</span>}
                    </div>
                </div>
                <button onClick={closePanel} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                    <X size={24} />
                </button>
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
                                <button
                                    onClick={() => handleSlotClick(slot)}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        background: isPickerOpen ? 'rgba(52,152,219,0.2)' : 'rgba(255,255,255,0.03)',
                                        borderRadius: '8px',
                                        border: `1px solid ${hasItem ? (item.rarityColor || '#555') : isPickerOpen ? '#3498db' : 'rgba(255,255,255,0.1)'}`,
                                        color: 'white',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    <div style={{ fontSize: '0.65rem', color: '#7f8c8d', marginBottom: '0.2rem' }}>
                                        {SLOT_ICONS[slot]} {SLOT_NAMES[slot]}
                                    </div>
                                    {hasItem ? (
                                        <div>
                                            <div style={{ color: item.rarityColor || '#fff', fontWeight: 'bold', fontSize: '0.8rem' }}>{item.name}</div>
                                            <div style={{ fontSize: '0.65rem', color: '#bdc3c7' }}>
                                                {Object.entries(item.stats || {}).map(([k, v]) => `+${v} ${k.toUpperCase()}`).join(' ')}
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ color: '#555', fontStyle: 'italic', fontSize: '0.8rem' }}>Empty</div>
                                    )}
                                </button>
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
                                <button
                                    key={item.instanceId}
                                    onClick={() => handleEquipItem(item)}
                                    style={{
                                        width: '100%',
                                        padding: '0.5rem',
                                        marginBottom: '0.3rem',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: `1px solid ${item.rarityColor || '#555'}`,
                                        borderRadius: '6px',
                                        color: 'white',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        transition: 'background 0.15s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(52,152,219,0.15)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                >
                                    <div>
                                        <div style={{ color: item.rarityColor || '#fff', fontWeight: 'bold', fontSize: '0.8rem' }}>{item.name}</div>
                                        <div style={{ fontSize: '0.65rem', color: '#bdc3c7' }}>
                                            {Object.entries(item.stats || {}).map(([k, v]) => `+${v} ${k.toUpperCase()}`).join(' ')}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.65rem', color: item.rarityColor, background: `${item.rarityColor}22`, padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                        {item.rarity}
                                    </div>
                                </button>
                            ));
                        })()}
                    </div>
                )}
            </div>

            {/* Upgrade Button */}
            <button
                onClick={handleUpgrade}
                disabled={gold < upgradeCost}
                style={{
                    width: '100%',
                    padding: '0.7rem',
                    background: gold >= upgradeCost ? '#2980b9' : '#7f8c8d',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.95rem',
                    cursor: gold >= upgradeCost ? 'pointer' : 'not-allowed',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                }}
            >
                <ArrowUpCircle size={18} />
                Upgrade ({upgradeCost} G)
            </button>

            <button
                onClick={handleDismiss}
                style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'none',
                    border: '1px solid #c0392b',
                    borderRadius: '8px',
                    color: '#c0392b',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                }}
            >
                Dismiss Character
            </button>
        </div>
    );
};

export default CharacterDetailsPanel;
