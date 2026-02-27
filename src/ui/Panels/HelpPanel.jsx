import React, { useEffect, useState } from 'react';
import GameButton from '../components/GameButton';
import { X, MousePointer, Shield, Sword, Heart, Coins, Skull, Zap, TrendingUp, Star } from 'lucide-react';
import useGameStore from '../../store/useGameStore';
import AudioManager from '../../audio/AudioManager';

const Section = ({ icon, title, color, children, defaultOpen = false }) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div>
            <div
                onClick={() => setOpen(!open)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    userSelect: 'none',
                    color: color || 'var(--accent-secondary)',
                    padding: '0.4rem 0',
                }}
            >
                {icon}
                <h3 style={{ margin: 0, flex: 1 }}>{title}</h3>
                <span style={{ fontSize: '1.2rem', color: '#7f8c8d', transition: 'transform 0.2s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>&#9654;</span>
            </div>
            {open && <div style={{ paddingTop: '0.5rem' }}>{children}</div>}
        </div>
    );
};

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
                    width: 'min(620px, 92vw)',
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                    {/* Section 1: Controls */}
                    <Section icon={<MousePointer size={20} />} title="Controls & Gameplay" color="var(--accent-secondary)" defaultOpen={true}>
                        <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-dim)' }}>
                            <strong>Idles N Dragons</strong> is a semi-idle RPG. Your heroes fight automatically, but you manage their equipment, positioning, and strategy.
                        </p>
                        <ul style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-dim)' }}>
                            <li><strong>Recruit:</strong> Use Souls to hire heroes in the Lobby.</li>
                            <li><strong>Position:</strong> Click a hero to inspect them. You can dismiss them to free up space.</li>
                            <li><strong>Equip:</strong> Loot items from enemies. Equip them to your heroes to boost stats.</li>
                        </ul>
                    </Section>

                    {/* Section 2: Classes */}
                    <Section icon={<Sword size={20} />} title="Classes & Roles" color="var(--accent-gold)">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            {[
                                { name: 'Warrior', color: '#e74c3c', desc: 'High HP & Defense. Place up front to tank damage.' },
                                { name: 'Mage', color: '#3498db', desc: 'Ranged magic attacks. High burst damage but fragile.' },
                                { name: 'Ranger', color: '#2ecc71', desc: 'Fast ranged DPS. Consistent damage output.' },
                                { name: 'Cleric', color: '#f1c40f', desc: 'Heals allies automatically. Essential for survival.' },
                                { name: 'Rogue', color: '#9b59b6', desc: 'Assassinates lowest HP enemy. Glass cannon. +5% loot drop chance.' },
                                { name: 'Paladin', color: '#bdc3c7', desc: 'Divine Shield protects party. Tanky hybrid.' },
                            ].map(c => (
                                <div key={c.name} className="glass-panel" style={{ padding: '0.7rem', background: 'rgba(255,255,255,0.03)' }}>
                                    <strong style={{ color: c.color }}>{c.name}</strong>
                                    <div style={{ fontSize: '0.78rem', color: '#bdc3c7', marginTop: '0.2rem' }}>{c.desc}</div>
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* Section 3: Progression */}
                    <Section icon={<Skull size={20} />} title="Progression & TPK" color="var(--accent-danger)">
                        <p style={{ fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-dim)' }}>
                            Enemies get stronger every Zone. Every 10th wave is a <strong>Boss Fight</strong>.
                            <br /><br />
                            When you hit a wall, use the <strong>DM Mode</strong> (Dungeon Master) to trigger a <strong>Total Party Kill (TPK)</strong>.
                            You will restart, but gain <strong>Souls</strong> to buy permanent upgrades and recruit stronger heroes.
                        </p>
                    </Section>

                    {/* Section 4: Damage Formula */}
                    <Section icon={<Zap size={20} />} title="Damage Formula" color="#e67e22">
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: '1.7' }}>
                            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.6rem', borderRadius: '6px', fontFamily: 'monospace', marginBottom: '0.5rem' }}>
                                Final DMG = ATK - (Enemy DEF x 0.5)&nbsp;&nbsp;(min 1)
                            </div>
                            <ul style={{ margin: '0.5rem 0', paddingLeft: '1.2rem' }}>
                                <li><strong>Critical Hit:</strong> 10% chance, deals 2x damage (orange text)</li>
                                <li><strong>Attack Speed:</strong> Warriors are slowest, Rogues & Rangers are fastest</li>
                                <li><strong>Defense:</strong> Reduces incoming damage. Stacks from equipment.</li>
                            </ul>
                        </div>
                    </Section>

                    {/* Section 5: Stat Scaling */}
                    <Section icon={<TrendingUp size={20} />} title="Stat Scaling Guide" color="#3498db">
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: '1.7' }}>
                            <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                                <li><strong>Equipment:</strong> +25% stat bonus per zone level</li>
                                <li><strong>Enemies:</strong> 1.25x HP & ATK per zone</li>
                                <li><strong>Bosses:</strong> 8x HP, 3x ATK of normal enemies</li>
                                <li><strong>Wave Size:</strong> 3 + floor(zone/3), max 8 enemies</li>
                                <li><strong>Soul Gain:</strong> Zone^2 x 2 (modified by upgrades)</li>
                            </ul>
                        </div>
                    </Section>

                    {/* Section 6: Rarity Chart */}
                    <Section icon={<Star size={20} />} title="Item Rarities" color="#9b59b6">
                        <div style={{ fontSize: '0.85rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem', textAlign: 'center' }}>
                                <div style={{ fontWeight: 'bold', color: '#7f8c8d', fontSize: '0.7rem' }}>RARITY</div>
                                <div style={{ fontWeight: 'bold', color: '#7f8c8d', fontSize: '0.7rem' }}>STAT MULT</div>
                                <div style={{ fontWeight: 'bold', color: '#7f8c8d', fontSize: '0.7rem' }}>DROP RATE</div>
                                {[
                                    { name: 'Common', mult: '1.0x', rate: '50%', color: '#ecf0f1' },
                                    { name: 'Uncommon', mult: '1.8x', rate: '30%', color: '#2ecc71' },
                                    { name: 'Rare', mult: '3.0x', rate: '15%', color: '#3498db' },
                                    { name: 'Epic', mult: '4.5x', rate: '4%', color: '#9b59b6' },
                                    { name: 'Legendary', mult: '6.0x', rate: '1%', color: '#ff6600' },
                                ].map(r => (
                                    <React.Fragment key={r.name}>
                                        <div style={{ color: r.color, fontWeight: 'bold' }}>{r.name}</div>
                                        <div style={{ color: 'var(--text-dim)' }}>{r.mult}</div>
                                        <div style={{ color: 'var(--text-dim)' }}>{r.rate}</div>
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </Section>

                    {/* Section 7: Upgrade ROI */}
                    <Section icon={<Coins size={20} />} title="Upgrade Priority Guide" color="#f1c40f">
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: '1.7' }}>
                            <ol style={{ margin: 0, paddingLeft: '1.2rem' }}>
                                <li><strong>Expand Territory (Grid Size)</strong> — More heroes = more DPS. Top priority.</li>
                                <li><strong>Dragon Hoard (Gold Gain)</strong> — More gold for upgrades and crafting.</li>
                                <li><strong>Ancient Wisdom (XP Gain)</strong> — Faster leveling, stronger heroes.</li>
                                <li><strong>Inheritance (Start Gold)</strong> — Jump-starts each new generation.</li>
                                <li><strong>Dimensional Rift (Starting Zone)</strong> — Skip easy content. Late-game pick.</li>
                                <li><strong>Soul Siphon</strong> — Only if you prestige often and push deep.</li>
                            </ol>
                        </div>
                    </Section>

                    {/* Hard Reset */}
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--panel-border)', textAlign: 'center' }}>
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
