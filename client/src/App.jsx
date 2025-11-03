import { useEffect, useRef } from 'react';
import Phaser from 'phaser';

function App() {
    const gameRef = useRef(null);

    useEffect(() => {
        if (gameRef.current) return;

        const config = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: 'game-container',
            backgroundColor: '#1a1a2e',
            scene: {
                preload: function () {
                    // Assets will be loaded in Phase 4
                },
                create: function () {
                    this.add.text(400, 300, 'WebGame - Space Shooter', {
                        fontSize: '32px',
                        fill: '#ffffff'
                    }).setOrigin(0.5);

                    this.add.text(400, 350, 'Phase 3: Basic Client Setup', {
                        fontSize: '18px',
                        fill: '#888888'
                    }).setOrigin(0.5);
                },
                update: function () {
                    // Game loop will be added in Phase 4
                }
            }
        };

        gameRef.current = new Phaser.Game(config);

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
