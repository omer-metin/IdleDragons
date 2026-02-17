import React, { useEffect } from 'react';
import GameButton from '../components/GameButton';
import { X, MousePointer, Shield, Sword, Heart, Coins, Skull } from 'lucide-react';
import useGameStore from '../../store/useGameStore';
import AudioManager from '../../audio/AudioManager';

const HelpPanel = () => {
    const { activePanel, closePanel } = useGameStore();

    useEffect(() => {
        if (activePanel === 'help') {
            AudioManager.playSFX('panel_open');
        }
    }, [activePanel]);

    if (activePanel !== 'help') return null;

    return (
        <div className="anim-fade-in" style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2500,
            backdropFilter: 'blur(3px)'
        }} onClick={closePanel}>
            <div
                className="glass-panel anim-scale-in"
                style={{
                    width: 'min(600px, 92vw)',
                    maxHeight: '80vh',
                    overflowY: 'auto',
                    padding: '2rem',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--accent-primary)',
                    background: 'rgba(15, 15, 25, 0.95)',
                    color: 'var(--text-main)',
                    position: 'relative'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--panel-border)', paddingBottom: '1rem' }}>
                    <h2 className="font-display" style={{ margin: 0, fontSize: '1.8rem', color: 'var(--accent-info)' }}>Adventurer's Guide</h2>
                    <GameButton onClick={closePanel} style={{ background: 'transparent', border: 'none' }}>
                        <X size={24} />
                    </GameButton>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* section 1 */}
                    <div>
                        <h3 style={{ color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MousePointer size={20} /> Controls & Gameplay
                        </h3>
                        <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-dim)' }}>
                            <strong>Idles N Dragons</strong> is a semi-idle RPG. Your heroes fight automatically, but you manage their equipment, positioning, and strategy.
                        </p>
                        <ul style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-dim)' }}>
                            <li><strong>Recruit:</strong> Use Souls to hire heroes in the Lobby.</li>
                            <li><strong>Position:</strong> Click a hero to inspect them. You can dismiss them to free up space.</li>
                            <li><strong>Equip:</strong> Loot items from enemies. Equip them to your heroes to boost stats.</li>
                        </ul>
                    </div>

                    {/* section 2 */}
                    <div>
                        <h3 style={{ color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Sword size={20} /> Classes & Roles
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="glass-panel" style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.03)' }}>
                                <strong style={{ color: '#e74c3c' }}>Warrior</strong>
                                <div style={{ fontSize: '0.8rem', color: '#bdc3c7' }}>High HP & Defense. Tanks damage.</div>
                            </div>
                            <div className="glass-panel" style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.03)' }}>
                                <strong style={{ color: '#3498db' }}>Mage</strong>
                                <div style={{ fontSize: '0.8rem', color: '#bdc3c7' }}>Ranged Magic Attacks. High Burst.</div>
                            </div>
                            <div className="glass-panel" style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.03)' }}>
                                <strong style={{ color: '#2ecc71' }}>Ranger</strong>
                                <div style={{ fontSize: '0.8rem', color: '#bdc3c7' }}>Fast Ranged Attacks. DPS.</div>
                            </div>
                            <div className="glass-panel" style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.03)' }}>
                                <strong style={{ color: '#f1c40f' }}>Cleric</strong>
                                <div style={{ fontSize: '0.8rem', color: '#bdc3c7' }}>Heals allies. Vital for survival.</div>
                            </div>
                        </div>
                    </div>

                    {/* section 3 */}
                    <div>
                        <h3 style={{ color: 'var(--accent-danger)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Skull size={20} /> Progression & TPK
                        </h3>
                        <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-dim)' }}>
                            Enemies get stronger every Zone. Every 10th wave is a <strong>Boss Fight</strong>.
                            <br /><br />
                            When you hit a wall, use the <strong>DM Mode</strong> (Dungeon Master) to trigger a <strong>Total Party Kill (TPK)</strong>.
                            You will restart, but gain <strong>Souls</strong> to buy permanent upgrades and recruit stronger heroes.
                        </p>
                    </div>

                    {/* Hard Reset */}
                    <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--panel-border)', textAlign: 'center' }}>
                        <h3 style={{ color: '#e74c3c', fontSize: '1rem', marginBottom: '0.5rem' }}>Danger Zone</h3>
                        <GameButton
                            onClick={() => import('../../store/useSaveSystem').then(m => m.default.hardReset())}
                            style={{
                                background: '#c0392b',
                                border: '2px solid #e74c3c',
                                color: 'white',
                                width: '100%',
                                padding: '1rem',
                                fontWeight: 'bold',
                                fontSize: '1.2rem',
                                justifyContent: 'center',
                                boxShadow: '0 0 15px rgba(192, 57, 43, 0.5)'
                            }}
                        >
                            <Skull size={24} /> PERMANENTLY DELETE SAVE
                        </GameButton>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default HelpPanel;
