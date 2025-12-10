import React, { useState } from 'react';
import './HomeScreen.css';

export function HomeScreen({ onPlay }) {
    const [playerName, setPlayerName] = useState('');

    const handlePlay = () => {
        const name = playerName.trim() || 'Player';
        onPlay(name);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handlePlay();
        }
    };

    return (
        <div className="home-screen">
            <div className="home-content">
                {/* Title */}
                <h1 className="game-title">
                    <span className="title-space">SPACE</span>
                    <span className="title-shooter">SHOOTER</span>
                </h1>

                {/* Subtitle */}
                <p className="game-subtitle">Battle for survival in the void</p>

                {/* Name Input */}
                <div className="name-input-container">
                    <input
                        type="text"
                        className="name-input"
                        placeholder="Enter your name..."
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        maxLength={15}
                    />
                </div>

                {/* Play Button */}
                <button className="play-button" onClick={handlePlay}>
                    <span className="play-icon">▶</span>
                    <span>PLAY</span>
                </button>

                {/* Controls Info */}
                <div className="controls-info">
                    <h3>CONTROLS</h3>
                    <div className="control-row">
                        <span className="key">WASD</span>
                        <span className="desc">Move ship</span>
                    </div>
                    <div className="control-row">
                        <span className="key">CLICK</span>
                        <span className="desc">Shoot</span>
                    </div>
                    <div className="control-row">
                        <span className="key">1-4</span>
                        <span className="desc">Select item</span>
                    </div>
                    <div className="control-row">
                        <span className="key">E</span>
                        <span className="desc">Use item</span>
                    </div>
                </div>
            </div>

            {/* Background effects */}
            <div className="stars"></div>
        </div>
    );
}
