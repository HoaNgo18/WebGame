import React from 'react';
import './DeathScreen.css';

export function DeathScreen({ killerName, onRespawn }) {
    return (
        <div className="death-screen">
            <div className="death-content">
                {/* Skull Icon */}
                <div className="death-icon">💀</div>

                {/* Death Message */}
                <h1 className="death-title">YOU DIED</h1>

                {killerName && (
                    <p className="killer-info">
                        Destroyed by <span className="killer-name">{killerName}</span>
                    </p>
                )}

                {/* Respawn Button */}
                <button className="respawn-button" onClick={onRespawn}>
                    <span>RESPAWN</span>
                </button>

                {/* Countdown */}
                <p className="respawn-hint">or wait for auto-respawn...</p>
            </div>

            {/* Red overlay effect */}
            <div className="death-overlay"></div>
        </div>
    );
}
