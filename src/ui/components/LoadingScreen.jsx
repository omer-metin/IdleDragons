import React, { useState, useEffect } from 'react';

const LoadingScreen = ({ progress = 0, visible = true }) => {
    const [showContent, setShowContent] = useState(true);
    const [fadeOut, setFadeOut] = useState(false);

    useEffect(() => {
        if (!visible) {
            // Start fade out animation
            setFadeOut(true);
            const timer = setTimeout(() => {
                setShowContent(false);
            }, 600); // Match CSS transition duration
            return () => clearTimeout(timer);
        }
    }, [visible]);

    if (!showContent) return null;

    const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #0a0a12 0%, #1a1a2e 40%, #16213e 70%, #0a0a12 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            color: 'white',
            opacity: fadeOut ? 0 : 1,
            transition: 'opacity 0.6s ease-out',
            pointerEvents: fadeOut ? 'none' : 'auto',
        }}>
            {/* Ambient glow effect */}
            <div style={{
                position: 'absolute',
                width: '400px',
                height: '400px',
                background: 'radial-gradient(circle, rgba(142, 68, 173, 0.15) 0%, transparent 70%)',
                borderRadius: '50%',
                pointerEvents: 'none',
            }} />

            {/* Title */}
            <h1 className="font-display" style={{
                fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                marginBottom: '0.5rem',
                textShadow: '0 0 30px rgba(142, 68, 173, 0.6), 0 0 60px rgba(44, 62, 80, 0.4)',
                letterSpacing: '6px',
                textAlign: 'center',
                animation: 'loadingPulse 3s ease-in-out infinite',
                padding: '0 1rem',
            }}>
                IDLES 'N DRAGONS
            </h1>

            {/* Subtitle */}
            <div style={{
                fontStyle: 'italic',
                color: '#8e8ea0',
                marginBottom: '3rem',
                fontSize: 'clamp(0.8rem, 2vw, 1.1rem)',
                letterSpacing: '2px',
                textAlign: 'center',
            }}>
                Preparing your adventure...
            </div>

            {/* Progress bar container */}
            <div style={{
                width: 'clamp(200px, 60vw, 360px)',
                height: '6px',
                background: 'rgba(255, 255, 255, 0.08)',
                borderRadius: '3px',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: '0 0 20px rgba(0,0,0,0.3)',
            }}>
                {/* Progress fill */}
                <div style={{
                    height: '100%',
                    width: `${clampedProgress}%`,
                    background: 'linear-gradient(90deg, #8e44ad, #9b59b6, #a66bbe)',
                    borderRadius: '3px',
                    transition: 'width 0.4s ease-out',
                    boxShadow: '0 0 12px rgba(142, 68, 173, 0.6)',
                    position: 'relative',
                }}>
                    {/* Shimmer effect on progress bar */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                        animation: 'loadingShimmer 1.5s ease-in-out infinite',
                    }} />
                </div>
            </div>

            {/* Percentage text */}
            <div style={{
                marginTop: '1rem',
                fontSize: '0.85rem',
                color: '#7f8c8d',
                letterSpacing: '1px',
                fontVariantNumeric: 'tabular-nums',
            }}>
                {clampedProgress}%
            </div>

            {/* Inline keyframes via style tag */}
            <style>{`
                @keyframes loadingPulse {
                    0%, 100% { opacity: 0.85; }
                    50% { opacity: 1; }
                }
                @keyframes loadingShimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(200%); }
                }
            `}</style>
        </div>
    );
};

export default LoadingScreen;
