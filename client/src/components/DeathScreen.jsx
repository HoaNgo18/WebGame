import React, { useMemo } from 'react';
import './DeathScreen.css';

// Random quotes about weapons and items
const DEATH_QUOTES = [
    "The Plasma Blaster fires balanced shots with 3-round magazines.",
    "Heavy Cannon deals 3 damage per shot but requires you to stand still.",
    "Rapid Laser shoots fast with 6 rounds, perfect for close combat.",
    "Energy Shield grants 5 seconds of invulnerability.",
    "Speed Boost doubles your velocity for 5 seconds.",
    "Space Mine detonates when enemies get close, dealing 3 damage.",
    "Cloaking Device makes you invisible for 5 seconds.",
    "Health Pack restores 1 life when picked up.",
    "Gold coins are rare but worth 5 coins each.",
    "Dash to blink forward and dodge enemy fire.",
    "Destroy space stations to get more loot drops.",
    "Stay inside the zone or take constant damage!",
    "Save coins to unlock new ship skins in the shop."
];

const DeathScreen = ({ killerName, score, onQuit, onRespawn, arenaMode = 'endless', rank = null, isVictory = false }) => {

    const isSuicide = !killerName || killerName === 'Yourself';

    // Random quote - memoized so it doesn't change on re-render
    const randomQuote = useMemo(() => {
        return DEATH_QUOTES[Math.floor(Math.random() * DEATH_QUOTES.length)];
    }, []);

    // ============ ARENA MODE (Legacy Code) ============
    if (arenaMode === 'arena') {
        return (
            <div className={`death-screen-container ${isVictory ? 'victory-mode' : ''}`}>

                {/* Tiêu đề */}
                <h1 className={`death-title ${isVictory ? 'victory-text' : ''}`}>
                    {isVictory ? 'VICTORY' : 'YOU DIED'}
                </h1>

                {/* Combined info box - quote inside */}
                <div className="death-content-box">
                    {/* Thông tin kẻ giết hoặc Victory message */}
                    {isVictory ? (
                        <div className="death-info-row victory-info">
                            YOU ARE THE CHAMPION!
                        </div>
                    ) : (
                        <div className="death-info-row">
                            {isSuicide && !true ? (
                                <span>💔 You eliminated yourself!</span>
                            ) : (
                                <span>
                                    Eliminated by <strong className="killer-name">{killerName || 'Unknown'}</strong>
                                </span>
                            )}
                        </div>
                    )}

                    {/* Divider */}
                    <div className="death-divider"></div>

                    {/* Điểm số / Rank */}
                    <div className="death-score-row">
                        {rank !== null && rank !== undefined ? (
                            <>
                                <span className="stat-label">RANK</span>
                                <span className="stat-value" style={{ color: isVictory || rank === 1 ? '#FFD700' : '#FFF' }}>
                                    #{rank}
                                </span>
                            </>
                        ) : (
                            <>
                                <span className="stat-label">SCORE</span>
                                <span className="stat-value">{score}</span>
                            </>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="death-divider"></div>

                    {/* Random Quote - inside box */}
                    <div className="death-quote">
                        {randomQuote}
                    </div>
                </div>

                {/* Nút bấm */}
                <div className="death-btn-group">
                    {onRespawn && (
                        <button
                            onClick={onRespawn}
                            className="death-btn respawn-btn"
                        >
                            PLAY AGAIN
                        </button>
                    )}

                    <button
                        onClick={onQuit}
                        className="death-btn quit-btn"
                    >
                        MENU
                    </button>
                </div>
            </div>
        );
    }

    // ============ 1V1 MODE & ENDLESS MODE (Current Code) ============
    return (
        <div className={`death-screen-container ${isVictory ? 'victory-mode' : ''}`}>

            {/* Tiêu đề chính */}
            <h1 className="death-title">GAME OVER</h1>

            {/* Combined info box - quote inside */}
            <div className="death-content-box">
                {/* Thông tin kẻ giết hoặc Victory message */}
                {isVictory ? (
                    <div className="death-info-row victory-info">
                        YOU ARE THE CHAMPION!
                    </div>
                ) : (
                    <div className="death-info-row">
                        {arenaMode === '1v1' ? (
                            <div className="death-info-row defeated-info">BETTER LUCK NEXT TIME!</div>
                        ) : isSuicide ? (
                            <span>💔 You eliminated yourself!</span>
                        ) : (
                            <span>
                                Eliminated by <strong className="killer-name">{killerName || 'Unknown'}</strong>
                            </span>
                        )}
                    </div>
                )}

                {/* Divider */}
                <div className="death-divider"></div>

                {/* Result: Victory/Defeated for 1v1, Score for Endless */}
                <div className="death-score-row">
                    {arenaMode === '1v1' ? (
                        <span className={`result-text ${isVictory ? 'victory-text' : 'defeated-text'}`}>
                            {isVictory ? 'VICTORY' : 'DEFEATED'}
                        </span>
                    ) : (
                        <>
                            <span className="stat-label">SCORE</span>
                            <span className="stat-value">{score}</span>
                        </>
                    )}
                </div>

                {/* Divider */}
                <div className="death-divider"></div>

                {/* Random Quote - inside box */}
                <div className="death-quote">
                    {randomQuote}
                </div>
            </div>

            {/* Nút bấm */}
            <div className="death-btn-group">
                {onRespawn && (
                    <button
                        onClick={onRespawn}
                        className="death-btn respawn-btn"
                    >
                        PLAY AGAIN
                    </button>
                )}

                <button
                    onClick={onQuit}
                    className="death-btn quit-btn"
                >
                    MENU
                </button>
            </div>
        </div>
    );
};

export default DeathScreen;
