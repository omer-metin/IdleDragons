import React, { useEffect } from 'react';
import { X, BarChart2, Activity } from 'lucide-react';
import GameButton from '../components/GameButton';
import useGameStore from '../../store/useGameStore';
import useMetaStore from '../../store/useMetaStore';
import useAchievementStore from '../../store/useAchievementStore';
import useAnalyticsStore from '../../store/useAnalyticsStore';
import AudioManager from '../../audio/AudioManager';

const ACHIEVEMENTS_TOTAL = 20;

const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m`;
    return '<1m';
};

const formatNumber = (n) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
};

const StatCard = ({ label, value, color }) => (
    <div style={{
        textAlign: 'center',
        background: 'rgba(255,255,255,0.05)',
        padding: '0.75rem',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.05)',
    }}>
        <div style={{ fontSize: '0.7rem', color: '#bdc3c7', marginBottom: '0.25rem' }}>{label}</div>
        <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: color || '#ecf0f1' }}>{value}</div>
    </div>
);

const BalanceIndicator = ({ indicator }) => {
    if (!indicator) return null;
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1rem',
            borderRadius: '8px',
            background: `${indicator.color}15`,
            border: `1px solid ${indicator.color}40`,
            color: indicator.color,
            fontSize: '0.85rem',
            fontWeight: 'bold',
        }}>
            <span>{indicator.icon}</span>
            <span>Difficulty: {indicator.label}</span>
        </div>
    );
};

const StatsPanel = () => {
    const { activePanel, closePanel } = useGameStore();
    const { souls, generation, highestZone, totalKillsAllTime, totalPlaytimeSeconds } = useMetaStore();
    const { totalGoldEarned, totalItemsFound, legendariesFound, totalSoulsEarned, unlocked } = useAchievementStore();
    const analytics = useAnalyticsStore();

    useEffect(() => {
        if (activePanel === 'stats') {
            AudioManager.playSFX('panel_open');
        }
    }, [activePanel]);

    if (activePanel !== 'stats') return null;

    const achievementCount = Object.keys(unlocked).length;
    const medianTPK = analytics.getMedianTPKZone();
    const avgRun = analytics.getAverageRunDuration();
    const balanceIndicator = analytics.getBalanceIndicator();

    return (
        <div className="anim-fade-in" style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2500,
            backdropFilter: 'blur(3px)',
        }} onClick={closePanel}>
            <div
                className="glass-panel anim-scale-in"
                style={{
                    width: 'min(550px, 92vw)',
                    maxHeight: '85vh',
                    overflowY: 'auto',
                    padding: '2rem',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid var(--accent-info)',
                    background: 'rgba(15, 15, 25, 0.95)',
                    color: 'var(--text-main)',
                    position: 'relative',
                }}
                onClick={e => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--panel-border)', paddingBottom: '1rem' }}>
                    <h2 className="font-display" style={{ margin: 0, fontSize: '1.8rem', color: 'var(--accent-info)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BarChart2 size={24} /> Statistics
                    </h2>
                    <GameButton onClick={closePanel} style={{ background: 'transparent', border: 'none' }}>
                        <X size={24} />
                    </GameButton>
                </div>

                {/* Core Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
                    <StatCard label="Total Playtime" value={formatTime(totalPlaytimeSeconds)} color="#3498db" />
                    <StatCard label="Highest Zone" value={highestZone} color="#e67e22" />
                    <StatCard label="Total Kills" value={formatNumber(totalKillsAllTime)} color="#e74c3c" />
                    <StatCard label="Generations" value={generation} color="#9b59b6" />
                    <StatCard label="Current Souls" value={formatNumber(souls)} color="#f1c40f" />
                    <StatCard label="Souls Earned" value={formatNumber(totalSoulsEarned)} color="#f39c12" />
                    <StatCard label="Gold Earned" value={formatNumber(totalGoldEarned)} color="#f1c40f" />
                    <StatCard label="Items Found" value={formatNumber(totalItemsFound)} color="#2ecc71" />
                    <StatCard label="Legendaries" value={legendariesFound} color="#ff6600" />
                    <StatCard label="Achievements" value={`${achievementCount}/${ACHIEVEMENTS_TOTAL}`} color="#1abc9c" />
                </div>

                {/* Analytics Section */}
                <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--panel-border)', paddingTop: '1rem' }}>
                    <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.1rem', color: '#8e44ad', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Activity size={18} /> Analytics
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
                        <StatCard label="Sessions" value={analytics.sessionCount} color="#9b59b6" />
                        <StatCard label="Session Time" value={formatTime(analytics.totalSessionSeconds)} color="#3498db" />
                        <StatCard label="Zones Cleared" value={formatNumber(analytics.zoneAdvanceCount)} color="#e67e22" />
                        <StatCard label="Items Equipped" value={formatNumber(analytics.itemsEquipped)} color="#2ecc71" />
                        <StatCard label="Ads Watched" value={analytics.adWatchCount} color="#f39c12" />
                        {medianTPK !== null && (
                            <StatCard label="Median TPK Zone" value={medianTPK} color="#e74c3c" />
                        )}
                        {avgRun > 0 && (
                            <StatCard label="Avg Run" value={formatTime(avgRun)} color="#1abc9c" />
                        )}
                        <StatCard
                            label="Tutorial"
                            value={analytics.tutorialCompleted ? 'Done' : analytics.tutorialSkipped ? 'Skipped' : `Step ${analytics.tutorialDropoffStep}`}
                            color={analytics.tutorialCompleted ? '#2ecc71' : '#95a5a6'}
                        />
                    </div>

                    {/* Balance Indicator (9.2) */}
                    {balanceIndicator && (
                        <div style={{ marginTop: '0.75rem' }}>
                            <BalanceIndicator indicator={balanceIndicator} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatsPanel;
