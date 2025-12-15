import React from 'react';
import './ArenaUI.css';

export function ArenaUI({ arenaState, zone, players, gameTime, countdown }) {
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="arena-ui">
            {/* Arena Timer */}
            <div className="arena-timer">
                <span className="timer-label">TIME</span>
                <span className="timer-value">{formatTime(gameTime)}</span>
            </div>

            {/* Players Alive */}
            <div className="players-alive">
                <span className="alive-icon">👥</span>
                <span className="alive-count">
                    {players?.filter(p => p.alive).length || 0}
                </span>
                <span className="alive-label">ALIVE</span>
            </div>

            {/* Zone Warning */}
            {zone?.shrinking && (
                <div className="zone-warning">
                    <span className="warning-icon">⚠️</span>
                    <span>ZONE SHRINKING</span>
                </div>
            )}

            {/* Countdown Overlay */}
            {arenaState === 'countdown' && (
                <div className="countdown-overlay">
                    <div className="countdown-number">{countdown}</div>
                    <div className="countdown-text">GET READY</div>
                </div>
            )}

            {/* Waiting Overlay */}
            {arenaState === 'waiting' && (
                <div className="waiting-overlay">
                    <div className="waiting-spinner">⏳</div>
                    <div className="waiting-text">WAITING FOR PLAYERS</div>
                    <div className="waiting-count">
                        {players?.length || 0} / 2 minimum
                    </div>
                </div>
            )}

            {/* Kill Feed */}
            <div className="kill-feed">
                {/* Kill messages would be rendered here */}
            </div>

            {/* Mini Leaderboard */}
            <div className="mini-leaderboard">
                <div className="leaderboard-title">TOP PLAYERS</div>
                {players?.slice(0, 5).map((p, i) => (
                    <div key={p.id} className={`leaderboard-row ${!p.alive ? 'eliminated' : ''}`}>
                        <span className="rank">#{i + 1}</span>
                        <span className="name">{p.name}</span>
                        <span className="kills">{p.kills || 0} ⚔️</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
