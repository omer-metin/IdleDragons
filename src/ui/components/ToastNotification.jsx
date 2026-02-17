import React from 'react';
import useToastStore from '../../store/useToastStore';

const ToastNotification = () => {
    const { toasts } = useToastStore();

    return (
        <div style={{
            position: 'absolute',
            top: '100px', // Below HUD top bar which is usually around 60-80px
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            zIndex: 9000,
            pointerEvents: 'none',
            maxWidth: '100vw',
            alignItems: 'center'
        }}>
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className="glass-panel anim-slide-down"
                    style={{
                        padding: '10px 16px',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        minWidth: '280px',
                        maxWidth: '90vw',
                        borderLeft: `4px solid ${toast.color || 'var(--text-main)'}`,
                        background: 'rgba(15, 15, 20, 0.95)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                        animationDuration: '0.3s'
                    }}
                >
                    <div style={{ fontSize: '1.2rem', lineHeight: 1 }}>
                        {toast.icon || 'ℹ️'}
                    </div>
                    <div style={{
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        color: 'var(--text-main)',
                        textShadow: '0 1px 2px rgba(0,0,0,0.8)'
                    }}>
                        {toast.message}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ToastNotification;
