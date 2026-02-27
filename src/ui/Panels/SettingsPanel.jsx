import React from 'react';
import useGameStore from '../../store/useGameStore';
import useSettingsStore from '../../store/useSettingsStore';
import SaveSystem from '../../store/useSaveSystem';
import { X, Volume2, Volume1, VolumeX, RefreshCw, Trash2, Crosshair, BookOpen } from 'lucide-react';
import useTutorialStore from '../../store/useTutorialStore';
import GameButton from '../components/GameButton';
import AudioManager from '../../audio/AudioManager';

const SettingsPanel = () => {
    const { activePanel, closePanel } = useGameStore();
    const {
        masterVolume,
        musicVolume,
        sfxVolume,
        setVolume,
        showDamageNumbers,
        toggleDamageNumbers
    } = useSettingsStore();

    React.useEffect(() => {
        if (activePanel === 'settings') {
            AudioManager.playSFX('panel_open');
        }
    }, [activePanel]);

    if (activePanel !== 'settings') return null;

    const handleVolumeChange = (type, e) => {
        const val = parseFloat(e.target.value);
        setVolume(type, val);
        AudioManager.updateVolumes({ ...useSettingsStore.getState(), [`${type}Volume`]: val });
    };

    const handleHardReset = () => {
        SaveSystem.hardReset();
    };

    const VolumeSlider = ({ label, value, type }) => (
        <div style={{ marginBottom: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', color: '#bdc3c7', fontSize: '0.9rem' }}>
                <span>{label}</span>
                <span>{Math.round(value * 100)}%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {value === 0 ? <VolumeX size={18} /> : value < 0.5 ? <Volume1 size={18} /> : <Volume2 size={18} />}
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={value}
                    onChange={(e) => handleVolumeChange(type, e)}
                    style={{ flex: 1 }}
                />
            </div>
        </div>
    );

    return (
        <div className="glass-panel anim-scale-in" style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(15, 15, 20, 0.98)',
            border: '2px solid var(--panel-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '2rem',
            width: 'min(450px, 92vw)',
            color: 'var(--text-main)',
            boxShadow: '0 0 50px rgba(0,0,0,0.5)',
            zIndex: 2500
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--panel-border)', paddingBottom: '1rem' }}>
                <h2 className="font-display" style={{ fontSize: '1.8rem', color: 'var(--text-main)', margin: 0 }}>Settings</h2>
                <GameButton onClick={closePanel} style={{ padding: '8px', background: 'transparent', border: 'none' }}>
                    <X size={24} />
                </GameButton>
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--accent-info)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Audio</h3>
                <VolumeSlider label="Master Volume" value={masterVolume} type="master" />
                <VolumeSlider label="Music Volume" value={musicVolume} type="music" />
                <VolumeSlider label="SFX Volume" value={sfxVolume} type="sfx" />
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--accent-info)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Gameplay</h3>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <Crosshair size={20} color="#e74c3c" />
                        <span>Show Damage Numbers</span>
                    </div>
                    <GameButton
                        onClick={toggleDamageNumbers}
                        style={{
                            padding: '0.4rem 0.8rem',
                            background: showDamageNumbers ? 'var(--accent-success)' : 'var(--bg-deep)',
                            border: '1px solid var(--panel-border)',
                            fontSize: '0.8rem',
                            minWidth: '60px'
                        }}
                    >
                        {showDamageNumbers ? 'ON' : 'OFF'}
                    </GameButton>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '0.8rem', borderRadius: '8px', marginTop: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <BookOpen size={20} color="#3498db" />
                        <span>Tutorial</span>
                    </div>
                    <GameButton
                        onClick={() => {
                            useTutorialStore.getState().restartTutorial();
                            closePanel();
                        }}
                        style={{
                            padding: '0.4rem 0.8rem',
                            background: 'var(--accent-info)',
                            border: 'none',
                            fontSize: '0.8rem',
                            color: 'white',
                        }}
                    >
                        Restart
                    </GameButton>
                </div>
            </div>

            <div>
                <h3 style={{ fontSize: '1rem', color: 'var(--accent-danger)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Danger Zone</h3>

                <GameButton
                    onClick={handleHardReset}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        background: 'rgba(231, 76, 60, 0.1)',
                        border: '1px solid var(--accent-danger)',
                        color: 'var(--accent-danger)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.8rem',
                        fontWeight: 'bold'
                    }}
                >
                    <Trash2 size={20} />
                    HARD RESET SAVE DATA
                </GameButton>
                <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#7f8c8d', marginTop: '0.5rem' }}>
                    Irreversible. Will reload the game.
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;
