import React, { useEffect } from 'react';
import CanvasContainer from './components/CanvasContainer';
import HUD from './HUD/HUD';
import PartyPanel from './Panels/PartyPanel';
import InventoryPanel from './Panels/InventoryPanel';
import RecruitmentPanel from './Panels/RecruitmentPanel';
import CharacterDetailsPanel from './Panels/CharacterDetailsPanel';
import MetaPanel from './Panels/MetaPanel';
import LobbyPanel from './Panels/LobbyPanel';
import useGameStore from '../store/useGameStore';
import SaveSystem from '../store/useSaveSystem';

const App = () => {
    const gameState = useGameStore(state => state.gameState);

    useEffect(() => {
        SaveSystem.start();
        return () => SaveSystem.stop();
    }, []);

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
            <CanvasContainer />

            {gameState === 'RUNNING' || gameState === 'PAUSED' ? (
                <>
                    <HUD />
                    <PartyPanel />
                    <InventoryPanel />
                    <CharacterDetailsPanel />
                    <MetaPanel />
                </>
            ) : gameState === 'LOBBY' ? (
                <>
                    <LobbyPanel />
                    <RecruitmentPanel />
                    <MetaPanel />
                    <CharacterDetailsPanel />
                </>
            ) : null}
        </div>
    );
};

export default App;
