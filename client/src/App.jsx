import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { gameConfig } from './game/config';
import { HUD } from './components/HUD';
import { HomeScreen } from './components/HomeScreen';
import { DeathScreen } from './components/DeathScreen';
import { socketManager } from './network/SocketManager';

function App() {
    const gameRef = useRef(null);
    const [playerData, setPlayerData] = useState(null);
    const [gameState, setGameState] = useState('home'); // 'home', 'playing', 'dead'
    const [killerName, setKillerName] = useState(null);

    useEffect(() => {
        // Listen for player updates
        socketManager.on('update', (data) => {
            const localPlayer = data.players.find(p => p.id === socketManager.playerId);
            if (localPlayer) {
                setPlayerData(localPlayer);
            }
        });

        socketManager.on('playerDied', (data) => {
            if (data.playerId === socketManager.playerId) {
                // Find killer name
                const killer = data.killerName || 'Unknown';
                setKillerName(killer);
                setGameState('dead');
            }
        });

        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, []);

    const handlePlay = (playerName) => {
        // Start game
        if (!gameRef.current) {
            gameRef.current = new Phaser.Game(gameConfig);
        }

        setGameState('connecting');

        // Store player name for later
        window.playerName = playerName;

        // Wait a bit for game to initialize then set playing
        setTimeout(() => {
            setGameState('playing');
        }, 500);
    };

    const handleRespawn = () => {
        setGameState('playing');
        setKillerName(null);
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            backgroundColor: '#0f0f23'
        }}>
            {/* Game Container */}
            <div id="game-container" />

            {/* Home Screen */}
            {gameState === 'home' && (
                <HomeScreen onPlay={handlePlay} />
            )}

            {/* HUD Overlay */}
            {gameState === 'playing' && <HUD playerData={playerData} />}

            {/* Death Screen */}
            {gameState === 'dead' && (
                <DeathScreen
                    killerName={killerName}
                    onRespawn={handleRespawn}
                />
            )}
        </div>
    );
}

export default App;
