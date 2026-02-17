import React from 'react';
import usePartyStore from '../../store/usePartyStore';
import useGameStore from '../../store/useGameStore';

const PartySidebar = () => {
    const members = usePartyStore(state => state.members);
    const { selectGridSlot, openPanel, selectedGridSlot, gameState } = useGameStore();

    // Only show in relevant states
    if (!['LOBBY', 'RUNNING', 'PAUSED'].includes(gameState)) return null;

    if (members.length === 0) return null;

    const handleSelect = (member) => {
        selectGridSlot(member.x, member.y);
        openPanel('character_details');
    };

    const getClassColor = (className) => {
        switch (className) {
            case 'Warrior': return '#e74c3c';
            case 'Mage': return '#3498db';
            case 'Archer': return '#2ecc71';
            case 'Cleric': return '#f1c40f';
            default: return '#95a5a6';
        }
    };

    return (
        <div style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            pointerEvents: 'auto',
            zIndex: 100 // Ensure above canvas
        }}>
            {members.map(member => {
                const isSelected = selectedGridSlot &&
                    selectedGridSlot.x === member.x &&
                    selectedGridSlot.y === member.y;

                const hpRatio = member.currentHp / (member.stats.hp + (member.equipment?.combinedStats?.hp || 0));

                return (
                    <div
                        key={member.id}
                        onClick={() => handleSelect(member)}
                        style={{
                            width: '60px',
                            height: '60px',
                            backgroundColor: 'rgba(0,0,0,0.8)',
                            border: `2px solid ${isSelected ? '#ffffff' : getClassColor(member.class)}`,
                            borderRadius: '50%', // Circle portrait
                            position: 'relative',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            boxShadow: isSelected ? '0 0 10px #ffffff' : '0 0 5px #000000',
                            transition: 'all 0.2s ease',
                            transform: isSelected ? 'scale(1.1)' : 'scale(1.0)'
                        }}
                    >
                        {/* Class Icon / Initial (Placeholder) */}
                        <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px',
                            fontWeight: 'bold',
                            color: getClassColor(member.class),
                        }}>
                            {member.class[0]}
                        </div>

                        {/* Level Badge */}
                        <div style={{
                            position: 'absolute',
                            bottom: '2px',
                            right: '2px',
                            fontSize: '10px',
                            backgroundColor: '#333',
                            borderRadius: '4px',
                            padding: '1px 3px',
                            color: '#fff',
                            border: '1px solid #555'
                        }}>
                            Lv{member.level}
                        </div>

                        {/* HP Bar Overlay (Circular or Bottom) */}
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            width: '100%',
                            height: '6px',
                            backgroundColor: '#555'
                        }}>
                            <div style={{
                                width: `${Math.max(0, Math.min(100, hpRatio * 100))}%`,
                                height: '100%',
                                backgroundColor: hpRatio < 0.3 ? '#c0392b' : '#2ecc71',
                                transition: 'width 0.2s'
                            }} />
                        </div>

                        {/* Dead/Sleep Overlay */}
                        {(member.currentHp <= 0) && (
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                backgroundColor: 'rgba(0,0,0,0.6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px'
                            }}>
                                💤
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default PartySidebar;
