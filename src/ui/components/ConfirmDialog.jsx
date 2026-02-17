import React from 'react';
import useGameStore from '../../store/useGameStore';
import GameButton from '../components/GameButton';
import { AlertTriangle, Check, X } from 'lucide-react';
import AudioManager from '../../audio/AudioManager';

const ConfirmDialog = () => {
    const { confirmation, closeConfirm } = useGameStore();
    const { isOpen, title, message, onConfirm, onCancel, isDanger, confirmText, cancelText } = confirmation;

    if (!isOpen) return null;

    const handleConfirm = () => {
        AudioManager.playSFX(isDanger ? 'ui_equip' : 'ui_click'); // Heavier sound for danger
        if (onConfirm) onConfirm();
        closeConfirm();
    };

    const handleCancel = () => {
        AudioManager.playSFX('ui_click');
        if (onCancel) onCancel();
        closeConfirm();
    };

    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 4000, // Higher than PauseOverlay (3000) and TPKPanel (2000)
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <div className="glass-panel anim-scale-in" style={{
                width: 'min(400px, 90vw)',
                padding: '2rem',
                border: isDanger ? '1px solid var(--accent-danger)' : '1px solid var(--accent-primary)',
                boxShadow: isDanger
                    ? '0 0 40px rgba(192, 57, 43, 0.3), 0 20px 40px rgba(0,0,0,0.6)'
                    : '0 0 40px rgba(155, 89, 182, 0.2), 0 20px 40px rgba(0,0,0,0.6)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                alignItems: 'center',
                textAlign: 'center'
            }}>
                {/* Icon */}
                <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: isDanger ? 'rgba(192, 57, 43, 0.2)' : 'rgba(155, 89, 182, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '-0.5rem',
                    border: isDanger ? '1px solid var(--accent-danger)' : '1px solid var(--accent-primary)'
                }}>
                    <AlertTriangle size={32} color={isDanger ? 'var(--accent-danger)' : 'var(--accent-primary)'} />
                </div>

                {/* Content */}
                <div>
                    <h3 className="font-display" style={{
                        fontSize: '1.5rem',
                        margin: '0 0 0.5rem 0',
                        color: isDanger ? 'var(--accent-danger)' : 'var(--text-main)'
                    }}>
                        {title}
                    </h3>
                    <p style={{ color: 'var(--text-dim)', fontSize: '1rem', lineHeight: '1.5' }}>
                        {message}
                    </p>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '1rem', width: '100%', justifyContent: 'center' }}>
                    <GameButton
                        onClick={handleCancel}
                        style={{
                            padding: '0.8rem 1.5rem',
                            background: 'transparent',
                            border: '1px solid var(--text-dim)',
                            color: 'var(--text-dim)',
                            flex: 1
                        }}
                    >
                        <X size={18} style={{ marginRight: '6px' }} />
                        {cancelText}
                    </GameButton>

                    <GameButton
                        onClick={handleConfirm}
                        style={{
                            padding: '0.8rem 1.5rem',
                            background: isDanger ? 'var(--accent-danger)' : 'var(--accent-primary)',
                            border: 'none',
                            color: 'white',
                            flex: 1,
                            boxShadow: isDanger
                                ? '0 0 15px rgba(192, 57, 43, 0.4)'
                                : '0 0 15px rgba(155, 89, 182, 0.4)'
                        }}
                    >
                        <Check size={18} style={{ marginRight: '6px' }} />
                        {confirmText}
                    </GameButton>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
