import React from 'react';
import useGameStore from '../../store/useGameStore';
import { X, Heart, Github } from 'lucide-react';
import GameButton from '../components/GameButton';
import AudioManager from '../../audio/AudioManager';

const CreditsPanel = () => {
    const { activePanel, closePanel } = useGameStore();

    React.useEffect(() => {
        if (activePanel === 'credits') {
            AudioManager.playSFX('panel_open');
        }
    }, [activePanel]);

    if (activePanel !== 'credits') return null;

    const sections = [
        {
            title: 'Game Design & Development',
            items: ['Omer Metin', 'Google DeepMind Team']
        },
        {
            title: 'Art & Assets',
            items: ['Lucide React Icons', 'Google Fonts (Inter, MedievalSharp)', 'Kenney Assets (Inspiration)']
        },
        {
            title: 'Special Thanks',
            items: ['Open Source Community', 'React Team', 'Vite Team']
        }
    ];

    return (
        <div className="glass-panel anim-scale-in" style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(10, 10, 15, 0.98)',
            border: '2px solid var(--accent-arcane)',
            borderRadius: 'var(--radius-xl)',
            padding: '2rem',
            width: 'min(500px, 92vw)',
            maxHeight: '80vh',
            overflowY: 'auto',
            color: 'var(--text-main)',
            boxShadow: '0 0 80px rgba(142, 68, 173, 0.3)',
            zIndex: 2500,
            textAlign: 'center'
        }}>
            <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
                <GameButton onClick={closePanel} style={{ padding: '8px', background: 'transparent', border: 'none' }}>
                    <X size={24} />
                </GameButton>
            </div>

            <h1 className="font-display" style={{ fontSize: '2.5rem', color: 'var(--accent-arcane)', marginBottom: '0.5rem', textShadow: '0 0 20px rgba(142, 68, 173, 0.5)' }}>Credits</h1>
            <p style={{ color: '#bdc3c7', marginBottom: '2rem', fontStyle: 'italic' }}>Those who forged the realm...</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {sections.map((section, idx) => (
                    <div key={idx} className="anim-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                        <h3 style={{ color: 'var(--accent-gold)', marginBottom: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.9rem' }}>{section.title}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {section.items.map((item, i) => (
                                <div key={i} style={{ fontSize: '1.1rem' }}>{item}</div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--panel-border)', fontSize: '0.8rem', color: '#7f8c8d' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    Made with <Heart size={14} fill="#e74c3c" color="#e74c3c" /> by Omer Metin
                </div>
                <div>v0.1.0 Alpha</div>
            </div>
        </div>
    );
};

export default CreditsPanel;
