import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        // Log detailed error info for debugging
        console.error('[ErrorBoundary] Caught error:', error);
        console.error('[ErrorBoundary] Component stack:', errorInfo?.componentStack);
    }

    handleReload = () => {
        window.location.reload();
    };

    handleClearAndReload = () => {
        try {
            localStorage.removeItem('idlesndragons_save');
        } catch (e) {
            console.warn('Failed to clear save:', e);
        }
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a0a1a 100%)',
                    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                    color: '#e0e0e0',
                    zIndex: 99999,
                }}>
                    <div style={{
                        maxWidth: '500px',
                        width: '90vw',
                        padding: '2.5rem',
                        background: 'rgba(15, 12, 30, 0.95)',
                        border: '1px solid rgba(231, 76, 60, 0.4)',
                        borderRadius: '16px',
                        boxShadow: '0 0 40px rgba(231, 76, 60, 0.15), 0 20px 60px rgba(0,0,0,0.5)',
                        textAlign: 'center',
                    }}>
                        {/* Icon */}
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                            💀
                        </div>

                        {/* Title */}
                        <h1 style={{
                            margin: '0 0 0.75rem',
                            fontSize: '1.6rem',
                            color: '#e74c3c',
                            textShadow: '0 0 10px rgba(231, 76, 60, 0.3)',
                            letterSpacing: '1px',
                        }}>
                            Something Went Wrong
                        </h1>

                        {/* Description */}
                        <p style={{
                            margin: '0 0 1.5rem',
                            color: '#95a5a6',
                            fontSize: '0.95rem',
                            lineHeight: 1.6,
                        }}>
                            The Dungeon Master encountered a critical error.
                            Your save data should be safe — try reloading first.
                        </p>

                        {/* Error details (collapsed) */}
                        <details style={{
                            marginBottom: '1.5rem',
                            textAlign: 'left',
                        }}>
                            <summary style={{
                                cursor: 'pointer',
                                color: '#7f8c8d',
                                fontSize: '0.8rem',
                                padding: '0.5rem 0',
                                userSelect: 'none',
                            }}>
                                Error Details
                            </summary>
                            <pre style={{
                                margin: '0.5rem 0 0',
                                padding: '1rem',
                                background: 'rgba(0, 0, 0, 0.4)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                color: '#e74c3c',
                                fontSize: '0.75rem',
                                lineHeight: 1.5,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                maxHeight: '150px',
                                overflowY: 'auto',
                            }}>
                                {this.state.error?.toString()}
                                {this.state.errorInfo?.componentStack}
                            </pre>
                        </details>

                        {/* Buttons */}
                        <div style={{
                            display: 'flex',
                            gap: '1rem',
                            justifyContent: 'center',
                            flexWrap: 'wrap',
                        }}>
                            <button
                                onClick={this.handleReload}
                                style={{
                                    padding: '0.8rem 2rem',
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    background: 'linear-gradient(to bottom, rgba(39, 174, 96, 0.9), rgba(30, 130, 72, 0.9))',
                                    border: '1px solid rgba(39, 174, 96, 0.5)',
                                    borderRadius: '8px',
                                    color: 'white',
                                    cursor: 'pointer',
                                    boxShadow: '0 0 15px rgba(39, 174, 96, 0.2)',
                                    transition: 'all 0.15s ease',
                                    fontFamily: 'inherit',
                                }}
                            >
                                🔄 Reload Game
                            </button>
                            <button
                                onClick={this.handleClearAndReload}
                                style={{
                                    padding: '0.8rem 2rem',
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    background: 'linear-gradient(to bottom, rgba(70, 70, 90, 0.9), rgba(40, 40, 60, 0.9))',
                                    border: '1px solid rgba(231, 76, 60, 0.4)',
                                    borderRadius: '8px',
                                    color: '#e74c3c',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    fontFamily: 'inherit',
                                }}
                            >
                                🗑️ Clear Save &amp; Reload
                            </button>
                        </div>

                        {/* Warning for clear save */}
                        <p style={{
                            margin: '1rem 0 0',
                            color: '#7f8c8d',
                            fontSize: '0.7rem',
                            fontStyle: 'italic',
                        }}>
                            "Clear Save" will delete all progress. Use only as a last resort.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
