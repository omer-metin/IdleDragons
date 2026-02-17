import React from 'react';

const OfflineEarningsPopup = ({ offlineData, onClaim, onDouble }) => {
    if (!offlineData) return null;

    const { elapsed, goldEarned } = offlineData;

    // Format time (e.g., "2h 15m 30s")
    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);

        const parts = [];
        if (h > 0) parts.push(`${h}h`);
        if (m > 0) parts.push(`${m}m`);
        parts.push(`${s}s`);
        return parts.join(' ');
    };

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2000,
            backdropFilter: 'blur(5px)'
        }}>
            <div style={{
                background: 'linear-gradient(180deg, rgba(20, 20, 30, 0.95) 0%, rgba(30, 30, 45, 0.95) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '16px',
                padding: '32px',
                width: '90%',
                maxWidth: '400px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                boxShadow: '0 0 50px rgba(0, 0, 0, 0.8), inset 0 0 20px rgba(255, 215, 0, 0.05)',
                color: '#fff',
                fontFamily: '"Cinzel", serif',
                animation: 'fadeIn 0.3s ease-out'
            }}>
                <h2 style={{
                    margin: '0 0 16px 0',
                    fontSize: '24px',
                    color: '#ffd700',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                }}>Welcome Back!</h2>

                <p style={{
                    margin: '0 0 24px 0',
                    color: '#aaa',
                    fontSize: '14px',
                    textAlign: 'center'
                }}>
                    Your heroes were hard at work while you were away.
                </p>

                <div style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    padding: '16px',
                    borderRadius: '8px',
                    width: '100%',
                    marginBottom: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                    <div style={{ fontSize: '14px', color: '#888', marginBottom: '8px' }}>
                        Time Away: <span style={{ color: '#fff' }}>{formatTime(elapsed)}</span>
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '28px',
                        fontWeight: 'bold',
                        color: '#ffd700',
                        textShadow: '0 0 10px rgba(255, 215, 0, 0.3)'
                    }}>
                        <span>💰</span>
                        <span>{Math.floor(goldEarned).toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>Gold Earned</div>
                </div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    width: '100%'
                }}>
                    <button
                        onClick={onDouble}
                        style={{
                            background: 'linear-gradient(180deg, #4CAF50 0%, #388E3C 100%)',
                            border: '1px solid #66BB6A',
                            padding: '12px',
                            borderRadius: '8px',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '16px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 0 #2E7D32',
                            transition: 'transform 0.1s'
                        }}
                        onMouseDown={e => e.currentTarget.style.transform = 'translateY(2px)'}
                        onMouseUp={e => e.currentTarget.style.transform = 'translateY(0)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <span>📺</span>
                        <span>Double It! (Watch Ad)</span>
                    </button>

                    <button
                        onClick={onClaim}
                        style={{
                            background: 'transparent',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            padding: '10px',
                            borderRadius: '8px',
                            color: '#aaa',
                            fontSize: '14px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            marginTop: '4px'
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                            e.currentTarget.style.color = '#fff';
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                            e.currentTarget.style.color = '#aaa';
                        }}
                    >
                        Just Claim
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OfflineEarningsPopup;
