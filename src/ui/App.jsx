import React, { useEffect, useState, useCallback, useRef } from 'react';
import CanvasContainer from './components/CanvasContainer';
import LoadingScreen from './components/LoadingScreen';
import HUD from './HUD/HUD';
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
import SaveSystem from '../store/useSaveSystem';
import ToastNotification from './components/ToastNotification';
import MainMenuPanel from './Panels/MainMenuPanel';
import TPKPanel from './Panels/TPKPanel';
import SettingsPanel from './Panels/SettingsPanel';
import CreditsPanel from './Panels/CreditsPanel';
import CrazyGamesSDK from '../platform/CrazyGames';

const App = () => {
    const gameState = useGameStore(state => state.gameState);
    const [isLoading, setIsLoading] = useState(true);
    const [loadProgress, setLoadProgress] = useState(0);
    const loadStartTime = useRef(Date.now());

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
            return () => SaveSystem.stop();
        }
    }, [isLoading]);

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

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            <CanvasContainer onInitComplete={handleInitComplete} />
            <LoadingScreen progress={loadProgress} visible={isLoading} />
            <ToastNotification />
            <PartySidebar />

            {gameState === 'MENU' ? (
                <>
                    <MainMenuPanel />
                    <SettingsPanel />
                    <CreditsPanel />
                </>
            ) : gameState === 'RUNNING' || gameState === 'PAUSED' ? (
                <>
                    <HUD />
                    <PartyPanel />
                    <InventoryPanel />
                    <CharacterDetailsPanel />
                    <TPKPanel />
                    <SettingsPanel />
                    <CreditsPanel />
                    <HelpPanel />
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
                </>
            ) : gameState === 'GAMEOVER' ? (
                <ResultsPanel />
            ) : null}
        </div>
    );
};

export default App;
