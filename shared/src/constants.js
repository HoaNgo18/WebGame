// Game Settings
export const MAP_SIZE = 5000;

// Game Timing
export const TICK_RATE = 60;
export const INTERPOLATION_DELAY = 100;

// Ship Stats
export const SHIP_RADIUS = 20;
export const SHIP_MAX_LIVES = 5;
export const SHIP_MAX_SPEED = 300;
export const SHIP_ACCELERATION = 600;
export const SHIP_DECELERATION = 300;
export const SHIP_ROTATION_SPEED = 3.5;

// Weapon Stats
export const WEAPON_STATS = {
    BLUE: {
        cooldown: 300,
        damage: 1,
        speed: 600,
        range: 500,
        color: 0x00E5FF
    },
    RED: {
        cooldown: 1000,
        damage: 3,
        speed: 400,
        range: 800,
        color: 0xFF0000
    },
    GREEN: {
        cooldown: 100,
        damage: 0.5,
        speed: 800,
        range: 400,
        color: 0x00FF00
    }
};

// Projectile
export const PROJECTILE_RADIUS = 5;

// Food (XP orbs)
export const FOOD_COUNT = 300;
export const FOOD_RADIUS = 5;
export const XP_PER_FOOD = 10;

// Obstacles (Asteroids)
export const OBSTACLE_COUNT = 120;
export const OBSTACLE_RADIUS_MIN = 30;
export const OBSTACLE_RADIUS_MAX = 120;

// Nebula (Visual decoration)
export const NEBULA_COUNT = 15;
export const NEBULA_RADIUS = 70;

// Chest
export const CHEST_COUNT = 15;
export const CHEST_RADIUS = 25;
export const CHEST_HP = 3;

// Item Types
export const ITEM_TYPES = {
    HEALTH_PACK: 'HEALTH_PACK',
    SHIELD: 'SHIELD',
    SPEED_BOOST: 'SPEED_BOOST',
    BOMB: 'BOMB',
    WEAPON_BLUE: 'WEAPON_BLUE',
    WEAPON_RED: 'WEAPON_RED',
    WEAPON_GREEN: 'WEAPON_GREEN',
    COIN_BRONZE: 'COIN_BRONZE',
    COIN_SILVER: 'COIN_SILVER',
    COIN_GOLD: 'COIN_GOLD',
};

export const ITEM_RADIUS = 15;

export const ITEM_CONFIG = {
    [ITEM_TYPES.HEALTH_PACK]: {
        name: 'Health Pack',
        description: '+1 Life',
        effect: { type: 'heal', value: 1 },
        glowColor: 0x00FF00,
        dropChance: 0.15
    },
    [ITEM_TYPES.SHIELD]: {
        name: 'Energy Shield',
        description: 'Invulnerability 5s',
        effect: { type: 'shield', duration: 5000 },
        glowColor: 0xFFD700,
        dropChance: 0.20
    },
    [ITEM_TYPES.SPEED_BOOST]: {
        name: 'Speed Boost',
        description: 'x2 Speed for 5s',
        effect: { type: 'speed', multiplier: 2.0, duration: 5000 },
        glowColor: 0x00FFFF,
        dropChance: 0.20
    },
    [ITEM_TYPES.BOMB]: {
        name: 'Space Mine',
        description: 'Place a bomb',
        effect: { type: 'plant_bomb', damage: 3, radius: 100 },
        glowColor: 0xFF0000,
        dropChance: 0.20
    },
    [ITEM_TYPES.WEAPON_BLUE]: {
        name: 'Plasma Blaster',
        description: 'Balanced weapon',
        effect: { type: 'weapon', weaponType: 'BLUE' },
        glowColor: 0x0000FF,
        dropChance: 0.20
    },
    [ITEM_TYPES.WEAPON_RED]: {
        name: 'Heavy Cannon',
        description: 'High damage, slow',
        effect: { type: 'weapon', weaponType: 'RED' },
        glowColor: 0xFF0000,
        dropChance: 0.15
    },
    [ITEM_TYPES.WEAPON_GREEN]: {
        name: 'Rapid Laser',
        description: 'Fast fire, low damage',
        effect: { type: 'weapon', weaponType: 'GREEN' },
        glowColor: 0x00FF00,
        dropChance: 0.15
    },
    [ITEM_TYPES.COIN_BRONZE]: {
        name: 'Bronze Coin',
        description: '+1 Coin',
        effect: { type: 'coin', value: 1 },
        glowColor: 0xCD7F32,
        dropChance: 0.20
    },
    [ITEM_TYPES.COIN_SILVER]: {
        name: 'Silver Coin',
        description: '+3 Coins',
        effect: { type: 'coin', value: 3 },
        glowColor: 0xC0C0C0,
        dropChance: 0.15
    },
    [ITEM_TYPES.COIN_GOLD]: {
        name: 'Gold Coin',
        description: '+5 Coins',
        effect: { type: 'coin', value: 5 },
        glowColor: 0xFFD700,
        dropChance: 0.10
    }
};

// Arena Mode Config
export const ARENA_CONFIG = {
    // Lobby
    MIN_PLAYERS: 2,
    MAX_PLAYERS: 20,
    LOBBY_COUNTDOWN: 30, // seconds

    // Game Duration
    GAME_DURATION: 300, // 5 minutes

    // Zone shrinking
    ZONE_SHRINK_PHASES: [
        { time: 0, radius: MAP_SIZE / 2, centerX: MAP_SIZE / 2, centerY: MAP_SIZE / 2 },
        { time: 60, radius: MAP_SIZE * 0.4, centerX: MAP_SIZE / 2, centerY: MAP_SIZE / 2 },
        { time: 120, radius: MAP_SIZE * 0.3, centerX: null, centerY: null }, // Random center
        { time: 180, radius: MAP_SIZE * 0.2, centerX: null, centerY: null },
        { time: 240, radius: MAP_SIZE * 0.1, centerX: null, centerY: null },
        { time: 280, radius: 200, centerX: null, centerY: null }
    ],
    ZONE_SHRINK_SPEED: 50, // pixels per second
    ZONE_DAMAGE: 1, // damage per second outside zone
    ZONE_DAMAGE_INTERVAL: 1000, // ms

    // Rewards
    KILL_REWARD: 50, // XP
    WIN_REWARD: 500, // XP
    PLACEMENT_REWARDS: [500, 300, 200, 100, 50], // Top 5

    // Visual
    ZONE_COLOR: 0x4400FF,
    DANGER_ZONE_COLOR: 0xFF0000
};

// Arena States
export const ARENA_STATE = {
    WAITING: 'waiting',
    COUNTDOWN: 'countdown',
    PLAYING: 'playing',
    ENDING: 'ending'
};

