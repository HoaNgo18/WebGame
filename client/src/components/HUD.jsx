import React from 'react';
import './HUD.css';

export function HUD({ playerData }) {
    if (!playerData) return null;

    const { lives, inventory, selectedSlot, currentWeapon, xp, coins, shield, speedMultiplier } = playerData;

    return (
        <div className="hud">
            {/* Health Bar */}
            <div className="hud-health">
                <div className="health-label">HP</div>
                <div className="health-bar-container">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className={`health-heart ${i < lives ? 'active' : 'empty'}`}
                        >
                            ❤️
                        </div>
                    ))}
                </div>
            </div>

            {/* Current Weapon */}
            <div className="hud-weapon">
                <div className="weapon-label">WEAPON</div>
                <div className={`weapon-display weapon-${currentWeapon.toLowerCase()}`}>
                    {currentWeapon}
                </div>
            </div>

            {/* Inventory */}
            <div className="hud-inventory">
                <div className="inventory-label">INVENTORY</div>
                <div className="inventory-slots">
                    {inventory.map((item, index) => (
                        <div
                            key={index}
                            className={`inventory-slot ${index === selectedSlot ? 'selected' : ''}`}
                        >
                            <span className="slot-number">{index + 1}</span>
                            {item && <span className="slot-item">{getItemIcon(item)}</span>}
                        </div>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="hud-stats">
                <div className="stat">
                    <span className="stat-icon">⭐</span>
                    <span className="stat-value">{xp || 0}</span>
                </div>
                <div className="stat">
                    <span className="stat-icon">🪙</span>
                    <span className="stat-value">{coins || 0}</span>
                </div>
            </div>

            {/* Active Buffs */}
            <div className="hud-buffs">
                {shield && <div className="buff buff-shield">🛡️ SHIELD</div>}
                {speedMultiplier > 1 && <div className="buff buff-speed">⚡ SPEED x{speedMultiplier}</div>}
            </div>
        </div>
    );
}

function getItemIcon(itemType) {
    const icons = {
        'HEALTH_PACK': '💊',
        'SHIELD': '🛡️',
        'SPEED_BOOST': '⚡',
        'BOMB': '💣',
        'WEAPON_BLUE': '🔫',
        'WEAPON_RED': '🔴',
        'WEAPON_GREEN': '🟢',
        'COIN_BRONZE': '🥉',
        'COIN_SILVER': '🥈',
        'COIN_GOLD': '🥇'
    };
    return icons[itemType] || '❓';
}
