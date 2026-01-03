import React, { useState, useEffect } from 'react';
import { socket } from '../network/socket';
import { PacketType } from 'shared/packetTypes';
import './HomeScreen.css';

const SKIN_IMAGES = {
    'default': '/Ships/playerShip1_red.png',
    'ship_1': '/Ships/playerShip2_red.png',
    'ship_2': '/Ships/playerShip3_red.png',
    'ship_3': '/Ships/ufoRed.png',
    'ship_4': '/Ships/spaceShips_001.png',
    'ship_5': '/Ships/spaceShips_002.png',
    'ship_6': '/Ships/spaceShips_004.png',
    'ship_7': '/Ships/spaceShips_007.png',
    'ship_8': '/Ships/spaceShips_008.png',
    'ship_9': '/Ships/spaceShips_009.png'
};

const HomeScreen = ({ user, onPlayClick, onArenaClick, onLogout, onLoginSuccess }) => {
    const [activeTab, setActiveTab] = useState('home');
    const [skins, setSkins] = useState([]);
    const [endlessLeaderboard, setEndlessLeaderboard] = useState([]);
    const [arenaLeaderboard, setArenaLeaderboard] = useState([]);
    const [localUser, setLocalUser] = useState(user);
    const [showLogin, setShowLogin] = useState(!user);
    const [loginTab, setLoginTab] = useState('guest');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [connecting, setConnecting] = useState(false);
    const [error, setError] = useState('');
    const [settingsTab, setSettingsTab] = useState('general'); // general, account, controls
    const [accountModal, setAccountModal] = useState(null); // 'displayName', 'password', 'delete'
    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    const API_URL = `${BASE_URL}/api`;

    // Track if we've already requested fresh data to prevent infinite loop
    const hasRequestedData = React.useRef(false);

    // Sync local user state with prop (only on user change)
    useEffect(() => {
        setLocalUser(user);
        setShowLogin(!user);
        setConnecting(false); // Reset connecting state when user changes (logout)
        setError(''); // Clear any previous errors
        // Reset input fields on logout
        if (!user) {
            setUsername('');
            setPassword('');
            setEmail('');
            setDisplayName('');
        }
        if (user) {
            loadSkins();
            loadLeaderboard();
        }
        // Reset the request flag when user changes (e.g., login/logout)
        hasRequestedData.current = false;
    }, [user]);

    // Request fresh data ONCE after mount when user exists
    useEffect(() => {
        if (user && socket.isConnected && !hasRequestedData.current) {
            console.log('[HomeScreen] Requesting fresh user data from server (once)');
            socket.send({ type: PacketType.REQUEST_USER_DATA });
            hasRequestedData.current = true;
        }
    }, [user]);

    // Note: USER_DATA_UPDATE is handled by App.jsx which updates the `user` prop
    // HomeScreen just syncs localUser from the prop - no separate listener needed

    // Load leaderboard when tab changes to leaderboard
    useEffect(() => {
        if (activeTab === 'leaderboard') {
            loadLeaderboard();
        }
    }, [activeTab]);

    const loadSkins = () => {
        setSkins([
            { id: 'default', name: 'Starter Red', price: 0 },
            { id: 'ship_1', name: 'Interceptor', price: 100 },
            { id: 'ship_2', name: 'Bomber', price: 250 },
            { id: 'ship_3', name: 'UFO Red', price: 500 },
            { id: 'ship_4', name: 'Scout', price: 1000 },
            { id: 'ship_5', name: 'Frigate', price: 1500 },
            { id: 'ship_6', name: 'Destroyer', price: 2000 },
            { id: 'ship_7', name: 'Speeder', price: 3000 },
            { id: 'ship_8', name: 'Tanker', price: 4000 },
            { id: 'ship_9', name: 'Mothership', price: 5000 }
        ]);
    };

    const loadLeaderboard = async () => {
        console.log('[HomeScreen] Loading leaderboard from:', API_URL);
        try {
            // Fetch Endless leaderboard (top 3 by highScore)
            const endlessRes = await fetch(`${API_URL}/leaderboard?type=endless&limit=3`);
            console.log('[HomeScreen] Endless response status:', endlessRes.status);
            if (endlessRes.ok) {
                const data = await endlessRes.json();
                console.log('[HomeScreen] Endless data:', data);
                // Handle both {players: [...]} and direct array format
                const players = data.players || data || [];
                setEndlessLeaderboard(players);
            }

            // Fetch Arena leaderboard (top 3 by arenaWins)
            const arenaRes = await fetch(`${API_URL}/leaderboard?type=arena&limit=3`);
            console.log('[HomeScreen] Arena response status:', arenaRes.status);
            if (arenaRes.ok) {
                const data = await arenaRes.json();
                console.log('[HomeScreen] Arena data:', data);
                // Handle both {players: [...]} and direct array format
                const players = data.players || data || [];
                setArenaLeaderboard(players);
            }
        } catch (err) {
            console.error('[HomeScreen] Leaderboard error:', err);
            setEndlessLeaderboard([]);
            setArenaLeaderboard([]);
        }
    };

    const handleGuestPlay = async () => {
        if (!username) {
            setError('Please enter a name!');
            return;
        }
        setConnecting(true);
        try {
            await socket.connect({ name: username });
            const savedGuest = localStorage.getItem('guest_data');
            let guestData;
            if (savedGuest) {
                const parsed = JSON.parse(savedGuest);
                guestData = {
                    ...parsed,
                    username: username,
                    isGuest: true,
                    totalKills: parsed.totalKills || 0,
                    totalDeaths: parsed.totalDeaths || 0,
                    coins: parsed.coins || 0,
                    highScore: parsed.highScore || 0,
                    equippedSkin: parsed.equippedSkin || 'default'
                };
            } else {
                guestData = {
                    username: username,
                    coins: 0,
                    highScore: 0,
                    isGuest: true,
                    equippedSkin: 'default'
                };
            }
            setLocalUser(guestData);
            setShowLogin(false);
            onLoginSuccess(guestData);
        } catch (err) {
            setError('Cannot connect to game server!');
            setConnecting(false);
        }
    };

    const handleLogin = async () => {
        if (!username || !password) return setError('Missing login info');
        setError('');
        setConnecting(true);

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, displayName })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Login failed');

            localStorage.setItem('game_token', data.token);
            localStorage.setItem('game_username', data.user.username);

            // Determine in-game name:
            // - If displayName exists and not empty → use it
            // - Otherwise fallback to username
            const ingameName = (data.user.displayName && data.user.displayName.trim())
                ? data.user.displayName
                : data.user.username;

            await socket.connect({
                token: data.token,
                name: ingameName
            });

            setLocalUser(data.user);
            setShowLogin(false);
            onLoginSuccess(data.user);
        } catch (err) {
            setError(err.message);
            setConnecting(false);
        }
    };

    const handleRegister = async () => {
        if (!username || !password || !email) return setError('Fill all fields');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return setError('Invalid email format');
        if (password.length < 6) return setError('Password must be at least 6 characters');
        setError('');
        setConnecting(true);

        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, email, displayName })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Register failed');

            setError('Registration successful! Please login.');
            setLoginTab('login');
            setConnecting(false);
        } catch (err) {
            setError(err.message);
            setConnecting(false);
        }
    };

    const handleEquipSkin = (skinId) => {
        if (!socket.isConnected) {
            console.error('[HomeScreen] Cannot equip skin - socket not connected');
            setError('Connection lost. Please refresh the page.');
            return;
        }
        console.log('[HomeScreen] Equipping skin:', skinId);
        socket.send({
            type: PacketType.EQUIP_SKIN,
            skinId: skinId
        });
    };

    const handleBuySkin = (skinId) => {
        socket.send({
            type: PacketType.BUY_SKIN,
            skinId: skinId
        });
    };

    const handleLogout = () => {
        onLogout();
        setShowLogin(true);
        setActiveTab('home');
    };

    return (
        <div className="home-container">
            {/* Header with login/logout */}
            <div className="home-header">
                {localUser ? (
                    <button className="auth-btn logout-btn" onClick={handleLogout}>Logout</button>
                ) : (
                    <button className="auth-btn login-btn" onClick={() => setShowLogin(true)}>Login</button>
                )}
            </div>

            {/* Main Content - only show when menu card is not displayed */}
            {!localUser && (
                <div className="main-content">
                    <h1 className="game-title">SHOOTER<span style={{ color: '#FFD700' }}>.IO</span></h1>
                    <p className="game-subtitle">Battle Royale Multiplayer</p>
                </div>
            )}

            {/* Menu Card if logged in */}
            {localUser && (
                <div className="menu-card-container">
                    <div className="menu-card">
                        <div className="menu-sidebar">
                            <div className="user-section">
                                <div className="user-name">{localUser.username}</div>
                                <div className="user-coin">{localUser.coins} COINS</div>
                            </div>
                            <button className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>Home</button>
                            <button className={`nav-btn ${activeTab === 'shop' ? 'active' : ''}`} onClick={() => setActiveTab('shop')}>Shop</button>
                            <button className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>Stats</button>
                            <button className={`nav-btn ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>Leaderboard</button>

                            {/* Settings at bottom with border */}
                            <div className="nav-spacer"></div>
                            <div className="nav-divider"></div>
                            <button className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>Settings</button>
                        </div>

                        <div className="menu-content">
                            {activeTab === 'home' && (
                                <div className="button-container">
                                    <h2>Welcome back, {localUser.username}!</h2>
                                    <p>Ready to dominate the battlefield?</p>
                                    <button
                                        onClick={() => onPlayClick(localUser.equippedSkin)}
                                        className="game-mode-btn play-btn"
                                    >
                                        ENDLESS
                                    </button>

                                    <button
                                        onClick={() => onArenaClick(localUser.equippedSkin)}
                                        className="game-mode-btn arena-btn"
                                    >
                                        ARENA
                                    </button>
                                </div>
                            )}

                            {activeTab === 'shop' && (
                                <div>
                                    <h2 className="section-title">Skin Collection</h2>
                                    <div className="skin-grid">
                                        {skins.map(s => {
                                            const isOwned = localUser.skins?.includes(s.id) || s.price === 0;
                                            const isEquipped = localUser.equippedSkin === s.id;
                                            const imgPath = SKIN_IMAGES[s.id] || SKIN_IMAGES['default'];

                                            return (
                                                <div key={s.id} className={`skin-card ${isEquipped ? 'active' : ''}`}>
                                                    <div className="skin-image-container">
                                                        <img
                                                            src={imgPath}
                                                            alt={s.name}
                                                            className="skin-img"
                                                            onError={(e) => {
                                                                e.target.style.border = "2px solid red";
                                                                e.target.alt = "IMG ERROR";
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="skin-name">{s.name}</div>

                                                    {isOwned ? (
                                                        <button
                                                            onClick={() => handleEquipSkin(s.id)}
                                                            className={`action-btn ${isEquipped ? 'equipped' : 'equip'}`}
                                                            disabled={isEquipped}
                                                        >
                                                            {isEquipped ? 'EQUIPPED' : 'EQUIP'}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleBuySkin(s.id)}
                                                            className="action-btn buy"
                                                        >
                                                            BUY {s.price}
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'profile' && (
                                <div>
                                    <h2 className="section-title">PLAYER STATS</h2>

                                    {/* Endless Mode */}
                                    <div className="stats-section">
                                        <h3 className="stats-section-title">ENDLESS MODE</h3>
                                        <div className="stats-list">
                                            <div className="stats-row">
                                                <span>High Score</span>
                                                <span className="stats-value gold">{localUser?.highScore || 0}</span>
                                            </div>
                                            <div className="stats-row">
                                                <span>Total Kills</span>
                                                <span className="stats-value">{localUser?.totalKills || 0}</span>
                                            </div>
                                            <div className="stats-row">
                                                <span>Deaths</span>
                                                <span className="stats-value">{localUser?.totalDeaths || 0}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Arena Mode */}
                                    <div className="stats-section">
                                        <h3 className="stats-section-title">ARENA MODE</h3>
                                        <div className="stats-list">
                                            <div className="stats-row">
                                                <span>Top 1 (Wins)</span>
                                                <span className="stats-value gold">{localUser?.arenaWins || 0}</span>
                                            </div>
                                            <div className="stats-row">
                                                <span>Top 2</span>
                                                <span className="stats-value">{localUser?.arenaTop2 || 0}</span>
                                            </div>
                                            <div className="stats-row">
                                                <span>Top 3</span>
                                                <span className="stats-value">{localUser?.arenaTop3 || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'leaderboard' && (
                                <div>
                                    <h2 className="section-title">TOP PLAYERS</h2>

                                    {/* Endless Mode Top 3 */}
                                    <div className="stats-section">
                                        <div className="stats-section-title">
                                            <span>ENDLESS MODE</span>
                                            <span className="title-hint">High Score</span>
                                        </div>
                                        <div className="stats-list">
                                            {endlessLeaderboard.slice(0, 3).map((p, idx) => (
                                                <div key={idx} className="stats-row">
                                                    <span>
                                                        <span className="rank-gold">#{idx + 1}</span>
                                                        {' '}{p.displayName || p.username || 'Unknown'}
                                                    </span>
                                                    <span className="stats-value gold">{p.score ?? p.highScore ?? 0}</span>
                                                </div>
                                            ))}
                                            {endlessLeaderboard.length === 0 && <div className="stats-row" style={{ justifyContent: 'center', color: '#666' }}>No data yet</div>}
                                        </div>
                                    </div>

                                    {/* Arena Mode Top 3 */}
                                    <div className="stats-section">
                                        <div className="stats-section-title">
                                            <span>ARENA MODE</span>
                                            <span className="title-hint">Top 1 Wins</span>
                                        </div>
                                        <div className="stats-list">
                                            {arenaLeaderboard.slice(0, 3).map((p, idx) => (
                                                <div key={idx} className="stats-row">
                                                    <span>
                                                        <span className="rank-gold">#{idx + 1}</span>
                                                        {' '}{p.displayName || p.username || 'Unknown'}
                                                    </span>
                                                    <span className="stats-value gold">{p.score ?? p.arenaWins ?? 0}</span>
                                                </div>
                                            ))}
                                            {arenaLeaderboard.length === 0 && <div className="stats-row" style={{ justifyContent: 'center', color: '#666' }}>No data yet</div>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'settings' && (
                                <div className="settings-page">
                                    <h2 className="section-title">SETTINGS</h2>

                                    {/* Sub-tabs */}
                                    <div className="settings-tabs">
                                        <button
                                            className={`settings-tab ${settingsTab === 'general' ? 'active' : ''}`}
                                            onClick={() => setSettingsTab('general')}
                                        >
                                            General
                                        </button>
                                        <button
                                            className={`settings-tab ${settingsTab === 'account' ? 'active' : ''}`}
                                            onClick={() => setSettingsTab('account')}
                                        >
                                            Account
                                        </button>
                                        <button
                                            className={`settings-tab ${settingsTab === 'controls' ? 'active' : ''}`}
                                            onClick={() => setSettingsTab('controls')}
                                        >
                                            Controls
                                        </button>
                                    </div>

                                    {/* General Tab - Compact */}
                                    {settingsTab === 'general' && (
                                        <div className="settings-container-compact">
                                            <div className="settings-section-compact">
                                                <div className="settings-row-inline">
                                                    <span className="settings-label">Language</span>
                                                    <select className="settings-select-sm" disabled>
                                                        <option value="en">English</option>
                                                        <option value="vi">Tiếng Việt (Soon)</option>
                                                    </select>
                                                </div>

                                                {/* Sound Settings - Cleaner UI */}
                                                <div style={{ marginTop: '20px', padding: '15px 0', borderTop: '1px solid rgba(255,255,255,0.1)' }}>

                                                    <div className="settings-row-inline" style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
                                                        <span className="settings-label" style={{ minWidth: '180px' }}>
                                                            Master Volume <span style={{ color: '#FFD700', fontSize: '12px' }} id="master-volume-display">(50%)</span>
                                                        </span>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="100"
                                                            defaultValue="50"
                                                            style={{ width: '33%', cursor: 'pointer', marginLeft: '10px' }}
                                                            onChange={(e) => {
                                                                const settings = JSON.parse(localStorage.getItem('soundSettings') || '{}');
                                                                settings.masterVolume = e.target.value / 100;
                                                                settings.enabled = true;
                                                                localStorage.setItem('soundSettings', JSON.stringify(settings));
                                                                document.getElementById('master-volume-display').textContent = `(${e.target.value}%)`;
                                                            }}
                                                        />
                                                    </div>

                                                    <div className="settings-row-inline" style={{ display: 'flex', alignItems: 'center' }}>
                                                        <span className="settings-label" style={{ minWidth: '180px' }}>
                                                            SFX Volume <span style={{ color: '#FFD700', fontSize: '12px' }} id="sfx-volume-display">(70%)</span>
                                                        </span>
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="100"
                                                            defaultValue="70"
                                                            style={{ width: '33%', cursor: 'pointer', marginLeft: '10px' }}
                                                            onChange={(e) => {
                                                                const settings = JSON.parse(localStorage.getItem('soundSettings') || '{}');
                                                                settings.sfxVolume = e.target.value / 100;
                                                                localStorage.setItem('soundSettings', JSON.stringify(settings));
                                                                document.getElementById('sfx-volume-display').textContent = `(${e.target.value}%)`;
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Account Tab - Compact with buttons */}
                                    {settingsTab === 'account' && (
                                        <div className="settings-container-compact">
                                            {localUser && !localUser.isGuest ? (
                                                <>
                                                    <div className="account-info-compact">
                                                        <div className="info-row-compact">
                                                            <span>Username:</span>
                                                            <strong>{localUser.username}</strong>
                                                        </div>
                                                        <div className="info-row-compact">
                                                            <span>Display Name:</span>
                                                            <strong>{localUser.displayName || localUser.username}</strong>
                                                        </div>
                                                        <div className="info-row-compact">
                                                            <span>Email:</span>
                                                            <strong>{localUser.email || 'Not set'}</strong>
                                                        </div>
                                                    </div>

                                                    <div className="account-actions">
                                                        <button className="account-action-btn" onClick={() => setAccountModal('displayName')}>
                                                            Change Display Name
                                                        </button>
                                                        <button className="account-action-btn" onClick={() => setAccountModal('password')}>
                                                            Change Password
                                                        </button>
                                                        <button className="account-action-btn danger-btn-sm" onClick={() => setAccountModal('delete')}>
                                                            Delete Account
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="settings-guest-message-compact">
                                                    Account settings require a registered account.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Controls Tab - Compact */}
                                    {settingsTab === 'controls' && (
                                        <div className="settings-container-compact">
                                            <div className="controls-grid-compact">
                                                <div className="control-row-compact"><span>Move Up</span><span>W / ↑</span></div>
                                                <div className="control-row-compact"><span>Move Left</span><span>A / ←</span></div>
                                                <div className="control-row-compact"><span>Move Down</span><span>S / ↓</span></div>
                                                <div className="control-row-compact"><span>Move Right</span><span>D / →</span></div>
                                                <div className="control-row-compact"><span>Shoot</span><span>Left Click</span></div>
                                                <div className="control-row-compact"><span>Use Item</span><span>Space</span></div>
                                                <div className="control-row-compact"><span>Select Slot</span><span>1 2 3 4 5</span></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Login Modal */}
            {showLogin && (
                <>
                    <div className="modal-overlay" onClick={() => setShowLogin(false)}></div>
                    <div className="login-modal">
                        <div style={{ display: 'flex', marginBottom: '20px' }}>
                            <button className={`tab-btn ${loginTab === 'guest' ? 'active' : ''}`} onClick={() => setLoginTab('guest')}>Guest</button>
                            <button className={`tab-btn ${loginTab === 'login' ? 'active' : ''}`} onClick={() => setLoginTab('login')}>Login</button>
                            <button className={`tab-btn ${loginTab === 'register' ? 'active' : ''}`} onClick={() => setLoginTab('register')}>Register</button>
                        </div>

                        {loginTab === 'guest' && (
                            <div>
                                <input
                                    type="text"
                                    placeholder="Enter your name"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="modal-input"
                                />
                                <button onClick={handleGuestPlay} disabled={connecting} className="modal-btn">
                                    {connecting ? 'Connecting...' : 'Play as Guest'}
                                </button>
                            </div>
                        )}

                        {loginTab === 'login' && (
                            <div>
                                <input
                                    type="text"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="modal-input"
                                />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="modal-input"
                                />
                                <button onClick={handleLogin} disabled={connecting} className="modal-btn">
                                    {connecting ? 'Logging in...' : 'Login'}
                                </button>
                            </div>
                        )}

                        {loginTab === 'register' && (
                            <div>
                                <input
                                    type="text"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="modal-input"
                                />
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="modal-input"
                                />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="modal-input"
                                />
                                <input
                                    type="text"
                                    placeholder="Display Name"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="modal-input"
                                />
                                <button onClick={handleRegister} disabled={connecting} className="modal-btn">
                                    {connecting ? 'Registering...' : 'Register'}
                                </button>
                            </div>
                        )}

                        {error && <div className="error-msg">{error}</div>}
                    </div>
                </>
            )}

            {/* Account Modals */}
            {accountModal && (
                <>
                    <div className="modal-overlay" onClick={() => setAccountModal(null)}></div>
                    <div className="account-modal">
                        {/* Change Display Name Modal */}
                        {accountModal === 'displayName' && (
                            <>
                                <h3>Change Display Name</h3>
                                <input
                                    type="text"
                                    placeholder="New display name"
                                    className="modal-input"
                                    defaultValue={localUser?.displayName || localUser?.username || ''}
                                    id="modal-display-name"
                                />
                                <div className="modal-btns">
                                    <button className="modal-btn-cancel" onClick={() => setAccountModal(null)}>Cancel</button>
                                    <button className="modal-btn-primary" onClick={async () => {
                                        const input = document.getElementById('modal-display-name');
                                        const newName = input.value.trim();
                                        if (!newName) return;

                                        try {
                                            const token = localStorage.getItem('game_token');
                                            const res = await fetch(`${API_URL}/auth/update-profile`, {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    'Authorization': `Bearer ${token}`
                                                },
                                                body: JSON.stringify({ displayName: newName })
                                            });
                                            if (res.ok) {
                                                // Update local state immediately
                                                const updatedUser = { ...localUser, displayName: newName };
                                                setLocalUser(updatedUser);
                                                setAccountModal(null);
                                            }
                                        } catch (err) {
                                            console.error('Failed to update display name');
                                        }
                                    }}>Save</button>
                                </div>
                            </>
                        )}

                        {/* Change Password Modal */}
                        {accountModal === 'password' && (
                            <>
                                <h3>Change Password</h3>
                                <input type="password" placeholder="Current password" className="modal-input" id="modal-current-pw" />
                                <input type="password" placeholder="New password" className="modal-input" id="modal-new-pw" />
                                <input type="password" placeholder="Confirm password" className="modal-input" id="modal-confirm-pw" />
                                <p id="pw-error" style={{ color: '#FF4444', fontSize: '12px', margin: '5px 0', display: 'none' }}></p>
                                <div className="modal-btns">
                                    <button className="modal-btn-cancel" onClick={() => setAccountModal(null)}>Cancel</button>
                                    <button className="modal-btn-primary" onClick={async () => {
                                        const currentPw = document.getElementById('modal-current-pw').value;
                                        const newPw = document.getElementById('modal-new-pw').value;
                                        const confirmPw = document.getElementById('modal-confirm-pw').value;
                                        const errorEl = document.getElementById('pw-error');

                                        const showError = (msg) => {
                                            errorEl.textContent = msg;
                                            errorEl.style.display = 'block';
                                        };

                                        if (!currentPw || !newPw || !confirmPw) {
                                            showError('Please fill all fields');
                                            return;
                                        }
                                        if (newPw !== confirmPw) {
                                            showError('Passwords do not match');
                                            return;
                                        }
                                        if (newPw.length < 6) {
                                            showError('Password must be at least 6 characters');
                                            return;
                                        }

                                        try {
                                            const token = localStorage.getItem('game_token');
                                            const res = await fetch(`${API_URL}/auth/change-password`, {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    'Authorization': `Bearer ${token}`
                                                },
                                                body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw })
                                            });
                                            const data = await res.json();
                                            if (res.ok) {
                                                setAccountModal(null);
                                            } else {
                                                showError(data.error || 'Failed to change password');
                                            }
                                        } catch (err) {
                                            showError('Failed to change password');
                                        }
                                    }}>Change Password</button>
                                </div>
                            </>
                        )}

                        {/* Delete Account Modal */}
                        {accountModal === 'delete' && (
                            <>
                                <h3 style={{ color: '#FF4444' }}>Delete Account</h3>
                                <p style={{ color: '#888', marginBottom: '20px' }}>
                                    This will permanently delete your account and all data. This cannot be undone.
                                </p>
                                <div className="modal-btns">
                                    <button className="modal-btn-cancel" onClick={() => setAccountModal(null)}>Cancel</button>
                                    <button className="modal-btn-danger" onClick={async () => {
                                        if (!confirm('Are you ABSOLUTELY sure? ALL data will be lost!')) return;

                                        try {
                                            const token = localStorage.getItem('game_token');
                                            const res = await fetch(`${API_URL}/auth/delete-account`, {
                                                method: 'DELETE',
                                                headers: { 'Authorization': `Bearer ${token}` }
                                            });
                                            if (res.ok) {
                                                onLogout();
                                            }
                                        } catch (err) {
                                            console.error('Failed to delete account');
                                        }
                                    }}>Delete My Account</button>
                                </div>
                            </>
                        )}
                    </div>
                </>
            )}

            {/* Version at bottom left */}
            <div className="version-text">
                <div>v1.0.0</div>
                <div className="developer-text">Developed by Hoa Ngo</div>
            </div>
        </div>
    );
};

export default HomeScreen;
