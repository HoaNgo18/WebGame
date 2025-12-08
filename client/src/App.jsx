import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { gameConfig } from './game/config';
import { HUD } from './components/HUD';
import { socketManager } from './network/SocketManager';

function App() {
    const gameRef = useRef(null);
    const [playerData, setPlayerData] = useState(null);
    const [gameState, setGameState] = useState('playing'); // 'playing', 'dead'

    useEffect(() => {
        if (gameRef.current) return;

        gameRef.current = new Phaser.Game(gameConfig);

        // Listen for player updates
        socketManager.on('update', (data) => {
            const localPlayer = data.players.find(p => p.id === socketManager.playerId);
            if (localPlayer) {
                setPlayerData(localPlayer);
            }
        });

        socketManager.on('playerDied', (data) => {
            if (data.playerId === socketManager.playerId) {
                setGameState('dead');
                setTimeout(() => setGameState('playing'), 3000);
            }
        });

        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, []);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            backgroundColor: '#0f0f23'
        }}>
            <div id="game-container" />

            {/* HUD Overlay */}
            {gameState === 'playing' && <HUD playerData={playerData} />}

            {/* Death Overlay */}
            {gameState === 'dead' && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 200
                }}>
                    <div style={{
                        color: '#ff4444',
                        fontSize: '48px',
                        fontWeight: 'bold',
                        textShadow: '0 0 20px rgba(255, 68, 68, 0.8)'
                    }}>
                        YOU DIED
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
