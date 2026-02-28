import React, { useEffect, useState } from 'react';
import useAdStore from '../../store/useAdStore';
import GameButton from './GameButton';
import { Zap, Play, RotateCw, Skull, Video, FastForward, Ghost } from 'lucide-react';
import useRecruitmentStore from '../../store/useRecruitmentStore';
import useGameStore from '../../store/useGameStore';
import usePartyStore from '../../store/usePartyStore';
import AudioManager from '../../audio/AudioManager';

export const GoldBoostButton = () => {
    // Subscribe to store to trigger re-renders on state change
    const goldBoostActive = useAdStore((state) => state.goldBoostActive);
    const { getBoostTimeRemaining, watchAd, getCooldownRemaining, activateGoldBoost } = useAdStore.getState();

    // Local state for timer ticks
    const [timeLeft, setTimeLeft] = useState(0);
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        const update = () => {
            setTimeLeft(getBoostTimeRemaining());
            setCooldown(getCooldownRemaining('gold'));
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [goldBoostActive]); // Re-run effect if active state changes

    const formatTime = (ms) => {
        if (ms <= 0) return '0:00';
        const s = Math.ceil(ms / 1000);
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    if (goldBoostActive) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.3rem 0.6rem',
                background: 'linear-gradient(45deg, #f1c40f, #f39c12)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                boxShadow: '0 0 10px rgba(241, 196, 15, 0.4)',
                border: '1px solid rgba(255,255,255,0.3)',
                animation: 'pulse 2s infinite'
            }} title="2x Gold Active">
                <Zap size={14} fill="currentColor" />
                {formatTime(timeLeft)}
            </div>
        );
    }

    const isCooldown = cooldown > 0;

    return (
        <GameButton
            onClick={() => {
                AudioManager.playSFX('ui_click');
                watchAd('gold', activateGoldBoost);
            }}
            disabled={isCooldown}
            style={{
                padding: '0.3rem 0.6rem',
                background: isCooldown ? 'rgba(0,0,0,0.5)' : '#27ae60', // Green for action
                border: '1px solid rgba(255,255,255,0.2)',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: isCooldown ? '#bdc3c7' : 'white',
                minWidth: '90px',
                justifyContent: 'center'
            }}
            title={isCooldown ? `Cooldown: ${formatTime(cooldown)}` : "Watch Ad for 2x Gold (5m)"}
        >
            {isCooldown ? (
                <>⏳ {formatTime(cooldown)}</>
            ) : (
                <><Video size={14} /> 2x Gold</>
            )}
        </GameButton>
    );
};

export const RerollAdButton = () => {
    const { watchAd, getCooldownRemaining } = useAdStore.getState();
    const { freeReroll } = useRecruitmentStore();

    // We don't subscribe to active state as reroll is instant
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        const update = () => setCooldown(getCooldownRemaining('reroll'));
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (ms) => {
        const s = Math.ceil(ms / 1000);
        return `${s}s`;
    };

    const isCooldown = cooldown > 0;

    return (
        <GameButton
            onClick={() => {
                AudioManager.playSFX('ui_click');
                watchAd('reroll', () => {
                    freeReroll();
                    AudioManager.playSFX('ui_augment');
                });
            }}
            disabled={isCooldown}
            style={{
                padding: '0.8rem 1.5rem',
                background: isCooldown ? 'var(--bg-panel)' : '#e67e22', // Orange for reroll
                border: isCooldown ? '1px solid var(--panel-border)' : '1px solid rgba(255,255,255,0.2)',
                color: isCooldown ? '#7f8c8d' : 'white',
                fontSize: '1rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: isCooldown ? 0.7 : 1
            }}
        >
            {isCooldown ? (
                <>⏳ {formatTime(cooldown)}</>
            ) : (
                <><Video size={18} /> Free Reroll</>
            )}
        </GameButton>
    );
};

export const ReviveAdButton = ({ onRevive }) => {
    const { watchAd } = useAdStore.getState();
    const { reviveAll } = usePartyStore.getState();

    return (
        <GameButton
            onClick={() => {
                AudioManager.playSFX('ui_click');
                watchAd('revive', () => {
                    reviveAll(0.5); // 50% HP
                    useGameStore.setState({ gameState: 'RUNNING' });
                    AudioManager.startBGM('adventure');
                    if (onRevive) onRevive();
                });
            }}
            style={{
                padding: '1rem 2rem',
                background: '#e74c3c',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '0.8rem',
                boxShadow: '0 0 20px rgba(231, 76, 60, 0.4)',
                animation: 'pulse 1.5s infinite'
            }}
        >
            <Video size={24} /> REVIVE PARTY (50% HP)
        </GameButton>
    );
};

export const SpeedBoostButton = () => {
    const speedBoostActive = useAdStore((state) => state.speedBoostActive);
    const { getSpeedBoostTimeRemaining, watchAd, getCooldownRemaining, activateSpeedBoost } = useAdStore.getState();

    const [timeLeft, setTimeLeft] = useState(0);
    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        const update = () => {
            // Check if boost expired and revert speed
            useAdStore.getState().checkBoosts();
            setTimeLeft(getSpeedBoostTimeRemaining());
            setCooldown(getCooldownRemaining('speed'));
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [speedBoostActive]);

    const formatTime = (ms) => {
        if (ms <= 0) return '0:00';
        const s = Math.ceil(ms / 1000);
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    if (speedBoostActive) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.3rem 0.6rem',
                background: 'linear-gradient(45deg, #e67e22, #e74c3c)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                boxShadow: '0 0 10px rgba(230, 126, 34, 0.4)',
                border: '1px solid rgba(255,255,255,0.3)',
                animation: 'pulse 2s infinite'
            }} title="5x Speed Active">
                <FastForward size={14} fill="currentColor" />
                {formatTime(timeLeft)}
            </div>
        );
    }

    const isCooldown = cooldown > 0;

    return (
        <GameButton
            onClick={() => {
                AudioManager.playSFX('ui_click');
                watchAd('speed', activateSpeedBoost);
            }}
            disabled={isCooldown}
            style={{
                padding: '0.3rem 0.6rem',
                background: isCooldown ? 'rgba(0,0,0,0.5)' : '#e67e22',
                border: '1px solid rgba(255,255,255,0.2)',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: isCooldown ? '#bdc3c7' : 'white',
                minWidth: '90px',
                justifyContent: 'center'
            }}
            title={isCooldown ? `Cooldown: ${formatTime(cooldown)}` : "Watch Ad for 5x Speed (2m)"}
        >
            {isCooldown ? (
                <>⏳ {formatTime(cooldown)}</>
            ) : (
                <><Video size={14} /> 5x Speed</>
            )}
        </GameButton>
    );
};

export const SoulDoubleButton = () => {
    const soulDoubleActive = useAdStore((state) => state.soulDoubleActive);
    const { watchAd, getCooldownRemaining, activateSoulDouble } = useAdStore.getState();

    const [cooldown, setCooldown] = useState(0);

    useEffect(() => {
        const update = () => setCooldown(getCooldownRemaining('soulDouble'));
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [soulDoubleActive]);

    if (soulDoubleActive) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: 'linear-gradient(45deg, #8e44ad, #9b59b6)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                boxShadow: '0 0 15px rgba(142, 68, 173, 0.4)',
                border: '1px solid rgba(255,255,255,0.3)',
                animation: 'pulse 2s infinite'
            }}>
                <Ghost size={16} fill="currentColor" />
                2x Souls Ready!
            </div>
        );
    }

    const isCooldown = cooldown > 0;
    const formatTime = (ms) => `${Math.ceil(ms / 1000)}s`;

    return (
        <GameButton
            onClick={() => {
                AudioManager.playSFX('ui_click');
                watchAd('soulDouble', activateSoulDouble);
            }}
            disabled={isCooldown}
            style={{
                padding: '0.5rem 1rem',
                background: isCooldown ? 'rgba(0,0,0,0.5)' : '#8e44ad',
                border: '1px solid rgba(255,255,255,0.2)',
                fontSize: '0.9rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: isCooldown ? '#bdc3c7' : 'white',
                opacity: isCooldown ? 0.7 : 1
            }}
        >
            {isCooldown ? (
                <>⏳ {formatTime(cooldown)}</>
            ) : (
                <><Video size={16} /> Double Souls</>
            )}
        </GameButton>
    );
};
