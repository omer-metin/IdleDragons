import React, { useEffect, useState } from 'react';
import useTutorialStore from '../../store/useTutorialStore';
import GameButton from './GameButton';

const TutorialOverlay = () => {
    const isActive = useTutorialStore(state => state.isActive);
    const currentStep = useTutorialStore(state => state.currentStep);
    const steps = useTutorialStore(state => state.steps);
    const nextStep = useTutorialStore(state => state.nextStep);
    const skipTutorial = useTutorialStore(state => state.skipTutorial);
    const [animating, setAnimating] = useState(false);

    const step = isActive ? steps[currentStep] : null;

    // Trigger entrance animation on step change
    useEffect(() => {
        if (step) {
            setAnimating(true);
            const timer = setTimeout(() => setAnimating(false), 50);
            return () => clearTimeout(timer);
        }
    }, [currentStep, isActive]);

    // Apply/remove glow class directly on target DOM elements
    useEffect(() => {
        // Clean up any existing highlights first
        const previouslyHighlighted = document.querySelectorAll('.tutorial-highlight');
        previouslyHighlighted.forEach(el => el.classList.remove('tutorial-highlight'));

        // Apply highlight to current step's target element
        if (step && step.highlight) {
            const target = document.querySelector(`[data-tutorial="${step.highlight}"]`);
            if (target) {
                target.classList.add('tutorial-highlight');
            }
        }

        // Cleanup on unmount or step change
        return () => {
            const highlighted = document.querySelectorAll('.tutorial-highlight');
            highlighted.forEach(el => el.classList.remove('tutorial-highlight'));
        };
    }, [step]);

    if (!step) return null;

    // Steps with waitForAction are non-blocking: no backdrop, no "NEXT" button
    const isActionStep = !!step.waitForAction;
    const showNextButton = !isActionStep;
    const isLastStep = currentStep >= steps.length - 1;

    // Position the dialog box
    const getDialogPosition = () => {
        switch (step.position) {
            case 'top':
                return { top: '80px', left: '50%', transform: 'translateX(-50%)' };
            case 'bottom':
                return { bottom: '120px', left: '50%', transform: 'translateX(-50%)' };
            case 'center':
            default:
                return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
        }
    };

    return (
        <>
            {/* Backdrop — only for non-action steps (informational panels with NEXT button) */}
            {!isActionStep && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: step.highlight ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.5)',
                    zIndex: 8000,
                }} />
            )}

            {/* Tutorial dialog */}
            <div style={{
                position: 'absolute',
                ...getDialogPosition(),
                zIndex: 8002,
                width: 'clamp(300px, 85vw, 480px)',
                pointerEvents: 'none', // Container doesn't block clicks
                opacity: animating ? 0 : 1,
                transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
            }}>
                <div style={{
                    background: isActionStep
                        ? 'rgba(15, 12, 30, 0.85)'
                        : 'rgba(15, 12, 30, 0.95)',
                    border: `1px solid rgba(142, 68, 173, ${isActionStep ? 0.3 : 0.5})`,
                    borderRadius: '16px',
                    padding: isActionStep ? '1.25rem 1.5rem' : '2rem',
                    boxShadow: isActionStep
                        ? '0 0 20px rgba(142, 68, 173, 0.15), 0 10px 30px rgba(0,0,0,0.3)'
                        : '0 0 40px rgba(142, 68, 173, 0.2), 0 20px 60px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(10px)',
                    pointerEvents: 'auto', // Dialog itself is clickable (for SKIP, NEXT)
                }}>
                    {/* Step indicator */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: isActionStep ? '0.5rem' : '1rem',
                    }}>
                        <div style={{
                            display: 'flex',
                            gap: '6px',
                        }}>
                            {steps.map((_, i) => (
                                <div key={i} style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    background: i === currentStep
                                        ? '#9b59b6'
                                        : i < currentStep
                                            ? 'rgba(155, 89, 182, 0.4)'
                                            : 'rgba(255, 255, 255, 0.15)',
                                    transition: 'background 0.3s',
                                }} />
                            ))}
                        </div>
                        <button
                            onClick={skipTutorial}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'rgba(255,255,255,0.35)',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                padding: '0.25rem 0.5rem',
                                letterSpacing: '1px',
                            }}
                        >
                            SKIP
                        </button>
                    </div>

                    {/* Icon — smaller for action steps */}
                    {!isActionStep && (
                        <div style={{
                            fontSize: '2.5rem',
                            marginBottom: '0.75rem',
                            textAlign: 'center',
                        }}>
                            {step.icon}
                        </div>
                    )}

                    {/* Title */}
                    <h2 className="font-display" style={{
                        margin: `0 0 ${isActionStep ? '0.5rem' : '0.75rem'}`,
                        fontSize: isActionStep ? '1.1rem' : '1.4rem',
                        color: '#f1c40f',
                        textShadow: '0 0 10px rgba(241, 196, 15, 0.3)',
                        textAlign: 'center',
                        letterSpacing: '1px',
                    }}>
                        {step.icon && isActionStep && <span style={{ marginRight: '0.5rem' }}>{step.icon}</span>}
                        {step.title}
                    </h2>

                    {/* Body text */}
                    <p style={{
                        margin: `0 0 ${isActionStep ? '0.75rem' : '1.5rem'}`,
                        color: '#bdc3c7',
                        fontSize: isActionStep ? '0.85rem' : '0.95rem',
                        lineHeight: 1.6,
                        textAlign: 'center',
                    }}>
                        {step.text}
                    </p>

                    {/* Buttons / Action hint */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '1rem',
                    }}>
                        {showNextButton && (
                            <GameButton
                                onClick={() => {
                                    if (isLastStep) {
                                        skipTutorial();
                                    } else {
                                        nextStep();
                                    }
                                }}
                                style={{
                                    padding: '0.8rem 2.5rem',
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    background: 'var(--accent-primary, #9b59b6)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white',
                                    boxShadow: '0 0 15px rgba(155, 89, 182, 0.3)',
                                }}
                            >
                                {isLastStep ? 'GOT IT!' : 'NEXT'}
                            </GameButton>
                        )}
                        {isActionStep && step.actionHint && (
                            <div style={{
                                color: 'rgba(241, 196, 15, 0.7)',
                                fontSize: '0.85rem',
                                fontStyle: 'italic',
                                animation: 'tutorialTextPulse 2s ease-in-out infinite',
                            }}>
                                {step.actionHint}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* CSS for tutorial highlight glow — applied directly to target elements */}
            <style>{`
                @keyframes tutorialGlow {
                    0%, 100% {
                        box-shadow: 0 0 8px 2px rgba(241, 196, 15, 0.3),
                                    0 0 20px 4px rgba(241, 196, 15, 0.15);
                    }
                    50% {
                        box-shadow: 0 0 15px 5px rgba(241, 196, 15, 0.6),
                                    0 0 40px 10px rgba(241, 196, 15, 0.25);
                    }
                }
                @keyframes tutorialTextPulse {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }
                .tutorial-highlight {
                    animation: tutorialGlow 2s ease-in-out infinite !important;
                    outline: 2px solid rgba(241, 196, 15, 0.6) !important;
                    outline-offset: 4px !important;
                    border-radius: inherit;
                    position: relative;
                    z-index: 8001 !important;
                }
            `}</style>
        </>
    );
};

export default TutorialOverlay;
