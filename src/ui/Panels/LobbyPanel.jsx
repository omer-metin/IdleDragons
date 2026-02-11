import React, { useEffect } from 'react';
import useGameStore from '../../store/useGameStore';
import useMetaStore from '../../store/useMetaStore';
import useRecruitmentStore from '../../store/useRecruitmentStore';
import usePartyStore from '../../store/usePartyStore';
import { Play, Coins, Trophy, Skull, Swords } from 'lucide-react';

const LobbyPanel = () => {
    const { gameState, startGame } = useGameStore();
    const { souls, checkStarterSouls, generation, highestZone, totalKillsAllTime } = useMetaStore();
    const { members } = usePartyStore();

    useEffect(() => {
        checkStarterSouls();
        if (useRecruitmentStore.getState().candidates.length === 0) {
            useRecruitmentStore.getState().generateCandidates();
        }
    }, []);

    if (gameState !== 'LOBBY') return null;

    const hasParty = members.length > 0;

    const hintText = hasParty
        ? `${members.length}/4 heroes ready. Click heroes for details, or recruit more!`
        : 'Click on Empty Grid Tiles to Recruit Heroes (Cost: 10 Souls)';

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(20, 20, 30, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
        }}>
            <div style={{
                pointerEvents: 'auto',
                textAlign: 'center',
                marginBottom: '1.5rem',
                zIndex: 10
            }}>
                <h1 style={{ color: '#f1c40f', fontSize: '2.5rem', textShadow: '0 0 10px #f39c12', margin: '0 0 1rem' }}>PREPARE YOUR PARTY</h1>

                {/* Stats Row */}
                <div style={{
                    display: 'flex',
                    gap: '1.5rem',
                    justifyContent: 'center',
                    marginBottom: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.5)', padding: '0.5rem 1rem', borderRadius: '20px', color: '#bdc3c7' }}>
                        <Coins size={20} color="#9b59b6" />
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{souls} Souls</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.5)', padding: '0.5rem 1rem', borderRadius: '20px', color: '#bdc3c7' }}>
                        <Trophy size={20} color="#f1c40f" />
                        <span>Gen {generation}</span>
                    </div>
                </div>

                {/* Previous run stats */}
                {generation > 1 && (
                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        color: '#7f8c8d'
                    }}>
                        <span>Best Zone: {highestZone}</span>
                        <span>•</span>
                        <span>Total Kills: {totalKillsAllTime}</span>
                    </div>
                )}
            </div>

            {/* Hint Text */}
            <div style={{
                pointerEvents: 'auto',
                color: hasParty ? '#27ae60' : 'white',
                marginBottom: '2rem',
                background: 'rgba(0,0,0,0.6)',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontSize: '0.95rem'
            }}>
                {hintText}
            </div>

            {/* Start Button */}
            <button
                onClick={hasParty ? startGame : undefined}
                disabled={!hasParty}
                style={{
                    pointerEvents: 'auto',
                    padding: '1rem 3rem',
                    background: hasParty ? '#27ae60' : '#7f8c8d',
                    border: 'none',
                    borderRadius: '50px',
                    color: 'white',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    cursor: hasParty ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    boxShadow: hasParty ? '0 0 20px rgba(39, 174, 96, 0.5)' : 'none',
                    transition: 'transform 0.2s, background 0.2s',
                    marginTop: 'auto',
                    marginBottom: '5rem',
                    opacity: hasParty ? 1 : 0.6,
                }}
            >
                <Play size={32} />
                {hasParty ? 'START ADVENTURE' : 'RECRUIT HEROES FIRST'}
            </button>
        </div>
    );
};

export default LobbyPanel;
