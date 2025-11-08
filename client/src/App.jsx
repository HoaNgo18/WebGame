import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { gameConfig } from './game/config';

function App() {
    const gameRef = useRef(null);

    useEffect(() => {
        if (gameRef.current) return;

        gameRef.current = new Phaser.Game(gameConfig);

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
        </div>
    );
}

export default App;
