import React from 'react';
import AudioManager from '../../audio/AudioManager';

const GameButton = ({ onClick, onMouseEnter, children, className, disabled, ...props }) => {
    const handleClick = (e) => {
        if (!disabled) {
            AudioManager.playSFX('button_click');
            if (onClick) onClick(e);
        }
    };

    const handleMouseEnter = (e) => {
        if (!disabled) {
            AudioManager.playSFX('button_hover');
            if (onMouseEnter) onMouseEnter(e);
        }
    };

    return (
        <button
            className={`glass-panel ${className || ''}`}
            onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            disabled={disabled}
            style={{
                background: disabled ? 'rgba(50,50,50,0.5)' : 'linear-gradient(to bottom, rgba(70, 70, 90, 0.9), rgba(40, 40, 60, 0.9))',
                border: '1px solid rgba(255,255,255,0.2)',
                color: disabled ? '#888' : 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontFamily: 'inherit',
                ...props.style
            }}
            {...props}
        >
            {children}
        </button>
    );
};

export default GameButton;
