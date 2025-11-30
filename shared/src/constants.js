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
