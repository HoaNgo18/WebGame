import React, { useState, useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { BootScene } from './game/scenes/BootScene';
import { GameScene } from './game/scenes/GameScene';
import { ArenaScene } from './game/scenes/ArenaScene';
import HUD from './components/HUD';
import DeathScreen from './components/DeathScreen';
import HomeScreen from './components/HomeScreen';
import BackgroundMusic from './components/BackgroundMusic';
import { socket } from './network/socket';
import { PacketType } from 'shared/packetTypes';
import './components/ArenaUI.css';

function App() {
    const [gameState, setGameState] = useState('home');
    const [user, setUser] = useState(null);
    const [isDead, setIsDead] = useState(false);
    const [killerName, setKillerName] = useState('');
    const [finalScore, setFinalScore] = useState(0);
    const [arenaRank, setArenaRank] = useState(null);

    // Arena state
    const [arenaCountdown, setArenaCountdown] = useState(null);
    const [arenaPlayerCount, setArenaPlayerCount] = useState(0);
    const [arenaWinner, setArenaWinner] = useState(null);
    const [arenaWaitTime, setArenaWaitTime] = useState(60);
    const [arenaMode, setArenaMode] = useState('arena'); // 'arena' or '1v1'
    const arenaTimeoutRef = useRef(null);
    const [isGameReady, setIsGameReady] = useState(false);
    const [arenaGameStarted, setArenaGameStarted] = useState(false); // Track if arena match has started

    // Endless Loading State
    const [endlessLoading, setEndlessLoading] = useState(null); // Number (5,4,3...) or null

    // Safe timeout cleanup
    const clearArenaTimeout = () => {
        if (arenaTimeoutRef.current) {
            clearTimeout(arenaTimeoutRef.current);
            arenaTimeoutRef.current = null;
        }
    };

    const handleStartGame = async (selectedSkinId) => {
        // Guard: ensure user is logged in
        if (!user) {
            alert('Please login first!');
            return;
        }

        clearArenaTimeout();
        setIsDead(false);
        setKillerName('');
        setFinalScore(0);

        socket.isInArena = false;
        socket.arenaRoomId = null;

        if (socket.ws) {
            socket.ws.close();
            socket.ws = null;
            socket.isConnected = false;
            socket.gameScene = null;
            socket.initData = null;
        }

        try {
            // Determine in-game name: displayName (if exists) or username
            const ingameName = (user.displayName && user.displayName.trim())
                ? user.displayName
                : (user.username || user.name || 'Player');

            await socket.connect({
                token: sessionStorage.getItem('game_token') || localStorage.getItem('game_token'),
                name: ingameName
            });
        } catch (err) {
            alert('Cannot connect to game server!');
            return;
        }

        // Small delay to ensure connection
        await new Promise(resolve => setTimeout(resolve, 100));

        // Start Phaser immediately, but wait for visual countdown to respawn
        setIsGameReady(false);
        setGameState('playing');
        setEndlessLoading(5); // Start 5s countdown
    };

    const handleStartArena = async (selectedSkinId, mode = 'arena', roomId = null) => {
        // Guard: ensure user is logged in
        if (!user) {
            alert('Please login first!');
            return;
        }

        clearArenaTimeout();

        setIsDead(false);
        setKillerName('');
        setFinalScore(0);
        setArenaWinner(null);
        setArenaCountdown(null);
        setArenaWaitTime(60);
        setArenaPlayerCount(0);
        setArenaMode(mode);
        setIsGameReady(false);
        setArenaGameStarted(false);

        const skinToUse = selectedSkinId || user.equippedSkin || 'default';

        try {
            // Determine in-game name: displayName (if exists) or username
            const ingameName = (user.displayName && user.displayName.trim())
                ? user.displayName
                : (user.username || user.name || 'Player');

            await socket.connectArena({
                token: sessionStorage.getItem('game_token') || localStorage.getItem('game_token'),
                name: ingameName,
                skinId: skinToUse,
                mode: mode,
                roomId: roomId
            });

            setGameState('arena_waiting');
        } catch (err) {
            console.error('Arena connection error:', err);
            alert('Cannot connect to arena server!');
        }
    };

    const handleLeaveArena = () => {
        socket.leaveArena();
        if (socket.ws) {
            socket.ws.close();
            socket.ws = null;
            socket.isConnected = false;
        }
        setGameState('home');
        setArenaCountdown(null);
        setArenaPlayerCount(0);
    };

    const handleLoginSuccess = (userData) => {
        setUser(userData);
    };

    const handleLogout = () => {
        socket.fullReset();
        sessionStorage.removeItem('game_token');
        sessionStorage.removeItem('game_username');
        localStorage.removeItem('game_token');
        localStorage.removeItem('game_username');
        setUser(null);
    };

    const handleQuitToMenu = () => {
        clearArenaTimeout();

        setIsDead(false);
        setGameState('home');
        setArenaWinner(null);
        setArenaCountdown(null);
        if (socket.isInArena) {
            socket.leaveArena();
            // DO NOT close socket here - we need it for HomeScreen to work
            // socket.ws.close() was causing skin equip to fail after Arena
        }

        // Clear Endless loading if quitting mid-load
        setEndlessLoading(null);
        setArenaGameStarted(false);
    };

    const handleRespawn = () => {
        setIsDead(false);
        setKillerName('');
        socket.send({ type: PacketType.RESPAWN });
    };

    // GLOBAL LISTENER
    useEffect(() => {
        const handleGlobalMessage = (packet) => {
            // User data updates
            if (packet.type === 'USER_DATA_UPDATE') {
                setUser(prevUser => {
                    if (!prevUser) return null;
                    return {
                        ...prevUser,
                        coins: packet.coins !== undefined ? packet.coins : prevUser.coins,
                        highScore: packet.highScore !== undefined ? packet.highScore : prevUser.highScore,
                        totalKills: packet.totalKills !== undefined ? packet.totalKills : prevUser.totalKills,
                        totalDeaths: packet.totalDeaths !== undefined ? packet.totalDeaths : prevUser.totalDeaths,
                        skins: packet.skins !== undefined ? packet.skins : prevUser.skins,
                        equippedSkin: packet.equippedSkin !== undefined ? packet.equippedSkin : prevUser.equippedSkin,
                        arenaWins: packet.arenaWins !== undefined ? packet.arenaWins : prevUser.arenaWins,
                        arenaTop2: packet.arenaTop2 !== undefined ? packet.arenaTop2 : prevUser.arenaTop2,
                        arenaTop3: packet.arenaTop3 !== undefined ? packet.arenaTop3 : prevUser.arenaTop3
                    };
                });
            }

            // Arena packets
            if (packet.type === PacketType.ARENA_STATUS) {
                setArenaPlayerCount(packet.playerCount || 0);
                if (packet.waitTimeRemaining !== undefined) {
                    setArenaWaitTime(Math.ceil(packet.waitTimeRemaining / 1000));
                }
            }

            if (packet.type === PacketType.ARENA_COUNTDOWN) {
                setArenaCountdown(packet.seconds);
            }

            if (packet.type === PacketType.ARENA_START) {
                setGameState('arena_playing');
                setArenaCountdown(null);
                setArenaGameStarted(true); // Mark arena as started, but keep overlay until ready
            }

            // PLAYER DIED EVENT
            if (packet.type === PacketType.PLAYER_DIED && packet.victimId === socket.myId) {
                setIsDead(true);
                setKillerName(packet.killerName);
                setFinalScore(packet.score);
                setArenaRank(packet.rank || '?');

                // Handle Guest Data update - session only, no localStorage persistence
                setUser(prevUser => {
                    if (prevUser && prevUser.isGuest) {
                        // Update guest data in session state only (not persisted)
                        return {
                            ...prevUser,
                            coins: (prevUser.coins || 0) + (packet.coins || 0),
                            highScore: Math.max(prevUser.highScore || 0, packet.score),
                            totalKills: (prevUser.totalKills || 0) + (packet.kills || 0),
                            totalDeaths: (prevUser.totalDeaths || 0) + 1
                        };
                    }
                    return prevUser;
                });
            }

            if (packet.type === PacketType.ARENA_VICTORY) {
                setArenaWinner({
                    name: packet.winnerName,
                    score: packet.score,
                    isMe: packet.winnerId === socket.myId
                });
            }

            if (packet.type === PacketType.ARENA_END) {
                clearArenaTimeout();
                // Removed auto-redirect. User must manually exit.
            }
        };

        const unsubscribe = socket.subscribe(handleGlobalMessage);
        return () => {
            unsubscribe();
            socket.resetGameScene();
            clearArenaTimeout();
        };
    }, []);

    // ENDLESS LOADING COUNTDOWN
    useEffect(() => {
        if (endlessLoading === null) return;

        if (endlessLoading > 0) {
            const timer = setTimeout(() => {
                setEndlessLoading(prev => prev - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else {
            // Countdown finished (0). Wait for Game Ready?
            // Actually, we should WAIT for gameReady before removing overlay.
            if (isGameReady) {
                // Countdown finished AND Game is Ready -> Respawn
                const skinToUse = user?.equippedSkin || 'default';
                socket.send({
                    type: PacketType.RESPAWN,
                    skinId: skinToUse
                });
                setEndlessLoading(null);
            }
            // If !isGameReady, we stay at 0 (showing "CONNECTING..." in UI)
        }
    }, [endlessLoading, user, isGameReady]);

    // GAME INITIALIZATION
    useEffect(() => {
        let game = null;

        // Factory function to create Phaser game config
        const createGameConfig = (targetScene, scenes) => ({
            type: Phaser.AUTO,
            width: window.innerWidth,
            height: window.innerHeight,
            parent: 'phaser-container',
            physics: { default: 'arcade', arcade: { debug: false } },
            scene: scenes,
            callbacks: {
                preBoot: (game) => {
                    game.registry.set('targetScene', targetScene);
                    game.registry.set('notifyReady', () => setIsGameReady(true));
                }
            },
            scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH }
        });

        if (gameState === 'playing') {
            game = new Phaser.Game(createGameConfig('GameScene', [BootScene, GameScene]));

            return () => {
                if (game) game.destroy(true);
                socket.resetGameScene();
            };
        }

        if (gameState === 'arena_playing') {
            socket.resetGameScene();
            game = new Phaser.Game(createGameConfig('ArenaScene', [BootScene, ArenaScene]));

            return () => {
                if (game) game.destroy(true);
                socket.resetGameScene();
            };
        }
    }, [gameState]);

    return (
        <div className="App">
            <BackgroundMusic />
            {gameState === 'home' && (
                <HomeScreen
                    user={user}
                    onPlayClick={(skinId) => handleStartGame(skinId)}
                    onArenaClick={(skinId, mode, roomId) => handleStartArena(skinId, mode, roomId)}
                    onLogout={handleLogout}
                    onLoginSuccess={handleLoginSuccess}
                />
            )}

            {/* Arena Waiting Room */}
            {gameState === 'arena_waiting' && (
                <div className="arena-waiting-container">


                    <h1 className="arena-title">{arenaMode === '1v1' ? '1 VS 1' : 'ARENA'}</h1>

                    {arenaCountdown !== null ? (
                        <div className="arena-countdown-container">
                            <p className="arena-countdown-text">Match starts in...</p>
                            <div className="arena-countdown-number">
                                {arenaCountdown}
                            </div>
                        </div>
                    ) : (
                        <div className="arena-status-container">
                            <p className="arena-status-text">Waiting for players...</p>
                            <div className="arena-player-count">
                                {arenaPlayerCount} / {arenaMode === '1v1' ? 2 : 10}
                            </div>

                            {/* Simplified text form */}
                            <p className="arena-wait-time">
                                Auto-start in {arenaWaitTime}s
                            </p>
                            <p className="arena-hint">
                                (Bots will join if not full)
                            </p>
                        </div>
                    )}

                    <button
                        onClick={handleLeaveArena}
                        className="arena-cancel-btn"
                    >
                        CANCEL
                    </button>
                </div>
            )}

            {/* Arena Playing */}
            {gameState === 'arena_playing' && (
                <>
                    <div id="phaser-container" className="phaser-container" />

                    {/* Arena Loading Overlay - show until game is ready */}
                    {arenaGameStarted && !isGameReady && (
                        <div className="arena-waiting-container" style={{ position: 'absolute', top: 0, left: 0, zIndex: 1000 }}>
                            <h1 className="arena-title">{arenaMode === '1v1' ? '1 VS 1' : 'ARENA'}</h1>
                            <div className="arena-countdown-container">
                                <p className="arena-countdown-text">LOADING MATCH...</p>
                                <div className="arena-countdown-spinner" style={{
                                    width: 60, height: 60,
                                    border: '4px solid rgba(255,255,255,0.1)',
                                    borderTop: '4px solid #FFD700',
                                    borderRadius: '50%',
                                    margin: '20px auto',
                                    animation: 'spin 1s linear infinite'
                                }} />
                            </div>
                        </div>
                    )}

                    {!isDead && !arenaWinner && isGameReady && <HUD isArena={true} arenaMode={arenaMode} />}


                    {/* Victory/Defeat Screen for Arena */}
                    {arenaWinner && (
                        <DeathScreen
                            isVictory={arenaWinner.isMe}
                            arenaMode={arenaMode}
                            killerName={arenaWinner.isMe ? null : arenaWinner.name}
                            score={arenaWinner.score}
                            rank={arenaWinner.isMe ? 1 : 2}
                            onQuit={() => {
                                handleQuitToMenu();
                                // DO NOT call socket.fullReset() here - we need the socket 
                                // connected for HomeScreen to work (friend status, equip skin)
                            }}
                            onRespawn={() => {
                                setArenaWinner(null);
                                setIsDead(false);
                                socket.fullReset();
                                handleStartArena(user?.equippedSkin, arenaMode);
                            }}
                        />
                    )}

                    {/* Death screen - with play again */}
                    {isDead && !arenaWinner && (
                        <DeathScreen
                            isVictory={false}
                            arenaMode={arenaMode}
                            killerName={killerName}
                            score={finalScore}
                            rank={arenaRank}
                            onQuit={handleQuitToMenu}
                            onRespawn={() => {
                                setIsDead(false);
                                socket.fullReset();
                                handleStartArena(user?.equippedSkin);
                            }}
                        />
                    )}
                </>
            )}

            {/* Normal Game */}
            {gameState === 'playing' && (
                <>
                    <div id="phaser-container" className="phaser-container" />

                    {/* Endless Loading Overlay */}
                    {endlessLoading !== null && (
                        <div className="arena-waiting-container" style={{ position: 'absolute', top: 0, left: 0, zIndex: 1000 }}>
                            <h1 className="arena-title">ENDLESS</h1>
                            <div className="arena-countdown-container">
                                {endlessLoading > 0 ? (
                                    <>
                                        <p className="arena-countdown-text">MATCH STARTING IN...</p>
                                        <div className="arena-countdown-number">
                                            {endlessLoading}
                                        </div>
                                    </>
                                ) : (
                                    <p className="arena-countdown-text" style={{ fontSize: '32px' }}>
                                        CONNECTING...
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={handleQuitToMenu}
                                className="arena-cancel-btn"
                            >
                                CANCEL
                            </button>
                        </div>
                    )}

                    {!isDead && endlessLoading === null && <HUD />}
                    {isDead && endlessLoading === null && (
                        <DeathScreen
                            arenaMode="endless"
                            killerName={killerName}
                            score={finalScore}
                            onQuit={handleQuitToMenu}
                            onRespawn={handleRespawn}
                        />
                    )}
                </>
            )}
        </div>
    );
}

export default App;
