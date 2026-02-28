import React, { useEffect, useState, useCallback, useRef } from 'react';
import CanvasContainer from './components/CanvasContainer';
import OfflineEarningsPopup from './components/OfflineEarningsPopup';
import LoadingScreen from './components/LoadingScreen';
import TutorialOverlay from './components/TutorialOverlay';
import DailyRewardPopup from './components/DailyRewardPopup';
import HUD from './HUD/HUD';
import SkillBar from './HUD/SkillBar';
import PartyPanel from './Panels/PartyPanel';
import PartySidebar from './HUD/PartySidebar';
import InventoryPanel from './Panels/InventoryPanel';
import RecruitmentPanel from './Panels/RecruitmentPanel';
import CharacterDetailsPanel from './Panels/CharacterDetailsPanel';
import MetaPanel from './Panels/MetaPanel';
import LobbyPanel from './Panels/LobbyPanel';
import ResultsPanel from './Panels/ResultsPanel';
import HelpPanel from './Panels/HelpPanel';
import useGameStore from '../store/useGameStore';
import useTutorialStore from '../store/useTutorialStore';
import useMetaStore from '../store/useMetaStore';
import usePartyStore from '../store/usePartyStore';
import SaveSystem from '../store/useSaveSystem';
import ToastNotification from './components/ToastNotification';
import MainMenuPanel from './Panels/MainMenuPanel';
import TPKPanel from './Panels/TPKPanel';
import SettingsPanel from './Panels/SettingsPanel';
import CreditsPanel from './Panels/CreditsPanel';
import AchievementsPanel from './Panels/AchievementsPanel';
import CraftingPanel from './Panels/CraftingPanel';
import StatsPanel from './Panels/StatsPanel';
import LeaderboardPanel from './Panels/LeaderboardPanel';
import EventPanel from './Panels/EventPanel';
import PartyWipePanel from './Panels/PartyWipePanel';
import PauseOverlay from './Panels/PauseOverlay';
import ConfirmDialog from './components/ConfirmDialog';
import CrazyGamesSDK from '../platform/CrazyGames';
import useAnalyticsStore from '../store/useAnalyticsStore';

const App = () => {
    const gameState = useGameStore(state => state.gameState);
    const activePanel = useGameStore(state => state.activePanel);
    const currentZoneTheme = useGameStore(state => state.currentZoneTheme);
    const [isLoading, setIsLoading] = useState(true);
    const [loadProgress, setLoadProgress] = useState(0);
    const [offlineEarnings, setOfflineEarnings] = useState(null);
    const loadStartTime = useRef(Date.now());

    // Update CSS custom properties when zone theme changes
    useEffect(() => {
        if (currentZoneTheme) {
            const root = document.documentElement;
            root.style.setProperty('--zone-accent', currentZoneTheme.uiAccent || '#c9a96e');
            root.style.setProperty('--zone-border', currentZoneTheme.uiBorder || '#6b5530');
            root.style.setProperty('--zone-glow', currentZoneTheme.uiGlow || 'rgba(201,169,110,0.15)');
        }
    }, [currentZoneTheme]);

    // Global Input Listeners (Escape -> Close Panel / Toggle Pause)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                const { activePanel, closePanel, gameState, togglePause, confirmation, closeConfirm } = useGameStore.getState();

                // Priority: Confirm Dialog -> Active Panel -> Pause Toggle
                if (confirmation?.isOpen) {
                    closeConfirm();
                    return;
                }

                if (activePanel && activePanel !== 'party_wipe') {
                    closePanel();
                } else if (gameState === 'RUNNING' || gameState === 'PAUSED') {
                    togglePause();
                }
            }
        };

        const handleBlur = () => {
            const { gameState, togglePause } = useGameStore.getState();
            if (gameState === 'RUNNING') {
                togglePause();
            }
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                const { gameState, togglePause } = useGameStore.getState();
                if (gameState === 'RUNNING') {
                    togglePause();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('blur', handleBlur);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    // Signal SDK loading start on mount
    useEffect(() => {
        CrazyGamesSDK.loadingStart();
        loadStartTime.current = Date.now();

        // Simulate progress stages while engine initializes
        const intervals = [];
        const stages = [
            { delay: 100, progress: 15 },
            { delay: 400, progress: 35 },
            { delay: 800, progress: 55 },
            { delay: 1200, progress: 70 },
        ];

        stages.forEach(({ delay, progress }) => {
            const id = setTimeout(() => setLoadProgress(progress), delay);
            intervals.push(id);
        });

        return () => intervals.forEach(clearTimeout);
    }, []);

    // Start save system once loading is done
    useEffect(() => {
        if (!isLoading) {
            SaveSystem.start();

            // Check for offline earnings immediately after load
            const offlineData = SaveSystem.getOfflineSummary();
            if (offlineData) {
                setOfflineEarnings(offlineData);
            }

            // Session time tracker — update analytics every 30s
            const sessionTimer = setInterval(() => {
                useAnalyticsStore.getState().addSessionTime(30);
            }, 30000);

            return () => {
                clearInterval(sessionTimer);
                SaveSystem.stop();
            };
        }
    }, [isLoading]);

    // Tutorial: start when entering LOBBY for first time (Gen 1, no party)
    useEffect(() => {
        if (gameState === 'LOBBY') {
            const generation = useMetaStore.getState().generation;
            const partySize = usePartyStore.getState().members.length;
            const { isCompleted, isSkipped } = useTutorialStore.getState();
            if (generation <= 1 && partySize === 0 && !isCompleted && !isSkipped) {
                useTutorialStore.getState().startTutorial();
            }
        }
        // Tutorial: trigger TPK step on game over
        if (gameState === 'GAMEOVER') {
            useTutorialStore.getState().onGameOver();
        }
    }, [gameState]);

    // Callback from CanvasContainer when GameApp.init() completes
    const handleInitComplete = useCallback(() => {
        setLoadProgress(100);

        // Ensure minimum 1.5s display to prevent flash
        const elapsed = Date.now() - loadStartTime.current;
        const minDisplayTime = 1500;
        const remaining = Math.max(0, minDisplayTime - elapsed);

        setTimeout(() => {
            CrazyGamesSDK.loadingStop();
            setIsLoading(false);
        }, remaining);
    }, []);

    const handleOfflineClaim = () => {
        setOfflineEarnings(null);
    };

    const handleOfflineDouble = () => {
        CrazyGamesSDK.showRewardedAd(() => {
            // Reward: Add the gold AGAIN (doubling it)
            // The first 1x was already added by SaveSystem.load()
            if (offlineEarnings && offlineEarnings.goldEarned > 0) {
                import('../store/useResourceStore').then(({ default: useResourceStore }) => {
                    useResourceStore.getState().addGold(offlineEarnings.goldEarned);
                    import('../store/useToastStore').then(({ default: useToastStore }) => {
                        useToastStore.getState().addToast({ type: 'buff', message: `Doubled! Earned ${offlineEarnings.goldEarned} extra Gold!`, icon: '💰', color: '#f1c40f' });
                    });
                    setOfflineEarnings(null);
                });
            }
        }, (error) => {
            import('../store/useToastStore').then(({ default: useToastStore }) => {
                useToastStore.getState().addToast({ type: 'error', message: 'Ad failed to load. Try again later.', icon: '❌', color: '#e74c3c' });
            });
        });
    };

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            <CanvasContainer onInitComplete={handleInitComplete} />
            <LoadingScreen progress={loadProgress} visible={isLoading} />
            <TutorialOverlay />
            <ToastNotification />
            <PartySidebar />

            {offlineEarnings && (
                <OfflineEarningsPopup
                    offlineData={offlineEarnings}
                    onClaim={handleOfflineClaim}
                    onDouble={handleOfflineDouble}
                />
            )}

            {gameState === 'MENU' ? (
                <>
                    <MainMenuPanel />
                    <SettingsPanel />
                    <CreditsPanel />
                </>
            ) : gameState === 'RUNNING' || gameState === 'PAUSED' ? (
                <>
                    <HUD />
                    <SkillBar />
                    <PartyPanel />
                    <InventoryPanel />
                    <CharacterDetailsPanel />
                    <TPKPanel />
                    <SettingsPanel />
                    <CreditsPanel />
                    <HelpPanel />
                    <AchievementsPanel />
                    <CraftingPanel />
                    <StatsPanel />
                    <LeaderboardPanel />
                    <EventPanel />
                    <PartyWipePanel />
                    {gameState === 'PAUSED' && !activePanel && <PauseOverlay />}
                </>
            ) : gameState === 'LOBBY' ? (
                <>
                    <LobbyPanel />
                    <RecruitmentPanel />
                    <MetaPanel />
                    <CharacterDetailsPanel />
                    <SettingsPanel />
                    <CreditsPanel />
                    <HelpPanel />
                    <AchievementsPanel />
                    <StatsPanel />
                    <LeaderboardPanel />
                </>
            ) : gameState === 'GAMEOVER' ? (
                <ResultsPanel />
            ) : null}
            <DailyRewardPopup />
            <ConfirmDialog />
        </div>
    );
};

export default App;
