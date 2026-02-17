import React, { useEffect } from 'react';
import CanvasContainer from './components/CanvasContainer';
import HUD from './HUD/HUD';
import PartyPanel from './Panels/PartyPanel';
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

const App = () => {
    const gameState = useGameStore(state => state.gameState);

    useEffect(() => {
        SaveSystem.start();
        return () => SaveSystem.stop();
    }, []);

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            <CanvasContainer />
            <ToastNotification />

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
