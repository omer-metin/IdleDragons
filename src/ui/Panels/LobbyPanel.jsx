import React, { useEffect } from 'react';
import useGameStore from '../../store/useGameStore';
import useMetaStore from '../../store/useMetaStore';
import useRecruitmentStore from '../../store/useRecruitmentStore';
import usePartyStore from '../../store/usePartyStore';
import { Play, Coins, Trophy, Skull, Swords, LogOut } from 'lucide-react';
import GameButton from '../components/GameButton';
import AudioManager from '../../audio/AudioManager';

const LobbyPanel = () => {
    const { gameState, startGame, startAdventure } = useGameStore();
    const { souls, checkStarterSouls, generation, highestZone, totalKillsAllTime } = useMetaStore();
    const { members } = usePartyStore();

    useEffect(() => {
        AudioManager.startBGM('lobby');
        checkStarterSouls();
        if (useRecruitmentStore.getState().candidates.length === 0) {
            useRecruitmentStore.getState().generateCandidates();
        }
    }, [checkStarterSouls]);

    if (gameState !== 'LOBBY') return null;

    const hasParty = members.length > 0;

    const handleStart = () => {
        if (hasParty) {
            AudioManager.playSFX('ui_start_game');
            AudioManager.startBGM('adventure');
            startAdventure();
        }
    };

    const hintText = hasParty
        ? `${members.length}/4 heroes ready. Click heroes to manage, or Start Adventure!`
        : 'Click on Empty Grid Tiles to Recruit Heroes (Cost: 10 Souls)';

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'radial-gradient(ellipse at center, rgba(20, 20, 30, 0.0) 0%, rgba(20, 20, 30, 0.0) 50%, rgba(20, 20, 30, 0.9) 85%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            pointerEvents: 'none',
            paddingTop: '2rem',
            paddingBottom: '2rem',
        }}>
            <div style={{
                pointerEvents: 'auto',
                textAlign: 'center',
                marginBottom: '1.5rem',
                zIndex: 10,
                width: '100%',
                position: 'relative'
            }}>
                <div style={{ position: 'absolute', top: 0, right: '2rem' }}>
                    <GameButton
                        onClick={() => {
                            AudioManager.playSFX('ui_click');
                            useGameStore.getState().enterMenu();
                        }}
                        style={{
                            padding: '0.5rem 1rem',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid var(--panel-border)',
                            color: '#bdc3c7',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.8rem',
                            borderRadius: '20px'
                        }}
                    >
                        <LogOut size={16} />
                        EXIT
                    </GameButton>
                </div>
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

            {/* Bottom Section: Hint + Button */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginBottom: '5rem',
                gap: '1rem',
                pointerEvents: 'none', // Wrapper is partial pass-through
                marginTop: 'auto'
            }}>
                {/* Hint Text */}
                <div style={{
                    pointerEvents: 'auto',
                    color: hasParty ? '#27ae60' : 'white',
                    background: 'rgba(0,0,0,0.6)',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '0.95rem'
                }}>
                    {hintText}
                </div>

                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    justifyContent: 'center',
                    width: '100%',
                    pointerEvents: 'auto'
                }}>
                    {/* Upgrades Button */}
                    <GameButton
                        onClick={() => useGameStore.getState().openPanel('meta')}
                        style={{
                            padding: '1.5rem 2rem',
                            background: 'var(--accent-secondary)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '50px',
                            color: 'white',
                            fontSize: '1.2rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.8rem',
                            boxShadow: '0 0 20px rgba(142, 68, 173, 0.4)'
                        }}
                    >
                        <Coins size={24} />
                        SOUL SHOP
                    </GameButton>

                    {/* Start Button */}
                    <GameButton
                        onClick={() => {
                            AudioManager.playSFX('ui_start_game');
                            AudioManager.startBGM('adventure');
                            startAdventure();
                        }}
                        disabled={!hasParty}
                        style={{
                            padding: '1.5rem 4rem',
                            background: hasParty ? 'var(--accent-success)' : 'var(--bg-panel)',
                            border: hasParty ? 'none' : '1px solid var(--panel-border)',
                            borderRadius: '50px',
                            color: hasParty ? 'white' : 'var(--text-muted)',
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            boxShadow: hasParty ? '0 0 30px rgba(39, 174, 96, 0.4)' : 'none',
                            opacity: hasParty ? 1 : 0.6,
                        }}
                    >
                        <Play size={32} fill="currentColor" />
                        {hasParty ? 'START ADVENTURE' : 'RECRUIT HEROES FIRST'}
                    </GameButton>
                </div>
            </div>
        </div>
    );
};

export default LobbyPanel;
