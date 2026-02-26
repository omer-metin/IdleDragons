import React, { useEffect } from 'react';
import GameButton from '../components/GameButton';
import { X, Hammer } from 'lucide-react';
import useGameStore from '../../store/useGameStore';
import useInventoryStore from '../../store/useInventoryStore';
import useResourceStore from '../../store/useResourceStore';
import { RECIPES, RARITY_COLORS, MATERIAL_NAMES } from '../../game/data/CraftingRecipes';
import AudioManager from '../../audio/AudioManager';

const CraftingPanel = () => {
    const { activePanel, closePanel } = useGameStore();
    const { craftItem, canAffordRecipe } = useInventoryStore();
    const { materials } = useResourceStore();

    useEffect(() => {
        if (activePanel === 'crafting') {
            AudioManager.playSFX('panel_open');
        }
    }, [activePanel]);

    if (activePanel !== 'crafting') return null;

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
                    width: 'min(500px, 92vw)',
                    maxHeight: '80vh',
                    overflowY: 'auto',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--accent-primary)',
                    background: 'rgba(15, 15, 25, 0.95)',
                    color: 'var(--text-main)',
                    position: 'relative'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Close */}
                <GameButton
                    onClick={closePanel}
                    style={{
                        position: 'absolute', top: '0.8rem', right: '0.8rem',
                        padding: '0.4rem', background: 'transparent', border: 'none'
                    }}
                >
                    <X size={20} />
                </GameButton>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <Hammer size={28} color="var(--accent-primary)" style={{ marginBottom: '0.3rem' }} />
                    <h2 className="font-display" style={{ fontSize: '1.4rem', margin: 0 }}>Crafting</h2>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>
                        Salvage items for materials, then craft powerful gear
                    </div>
                </div>

                {/* Materials Display */}
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    justifyContent: 'center',
                    marginBottom: '1rem',
                    padding: '0.5rem',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                }}>
                    {Object.entries(MATERIAL_NAMES).map(([key, mat]) => (
                        <div key={key} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.2rem' }}>{mat.icon}</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: mat.color }}>
                                {materials[key] || 0}
                            </div>
                            <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>{mat.name}</div>
                        </div>
                    ))}
                </div>

                {/* Recipes */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {RECIPES.map(recipe => {
                        const affordable = canAffordRecipe(recipe.id);
                        return (
                            <div key={recipe.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.6rem',
                                padding: '0.5rem 0.6rem',
                                borderRadius: '6px',
                                background: affordable ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)',
                                border: `1px solid ${affordable ? (RARITY_COLORS[recipe.result.rarity] + '44') : 'rgba(255,255,255,0.05)'}`,
                                opacity: affordable ? 1 : 0.5,
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        fontWeight: 'bold',
                                        fontSize: '0.85rem',
                                        color: RARITY_COLORS[recipe.result.rarity],
                                    }}>
                                        {recipe.name}
                                    </div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
                                        {recipe.desc}
                                    </div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
                                        Cost: {Object.entries(recipe.cost).map(([mat, amount]) => (
                                            <span key={mat} style={{
                                                marginRight: '0.5rem',
                                                color: (materials[mat] || 0) >= amount ? '#2ecc71' : '#e74c3c',
                                            }}>
                                                {MATERIAL_NAMES[mat]?.icon} {amount}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <GameButton
                                    onClick={() => {
                                        AudioManager.playSFX('ui_click');
                                        craftItem(recipe.id);
                                    }}
                                    disabled={!affordable}
                                    style={{
                                        padding: '0.3rem 0.8rem',
                                        fontSize: '0.75rem',
                                        background: affordable ? '#27ae60' : '#555',
                                        border: '2px solid #000',
                                        color: '#fff',
                                        fontWeight: 'bold',
                                        opacity: affordable ? 1 : 0.4,
                                    }}
                                >
                                    Craft
                                </GameButton>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CraftingPanel;
