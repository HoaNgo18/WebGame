import {
    MAP_SIZE,
    OBSTACLE_COUNT,
    OBSTACLE_RADIUS_MIN,
    OBSTACLE_RADIUS_MAX,
    NEBULA_COUNT,
    NEBULA_RADIUS
} from 'shared/constants';

export class ObstacleManager {
    constructor(game) {
        this.game = game;
        this.obstacles = new Map();
        this.nebulas = new Map();
        this.obstacleIdCounter = 0;
        this.nebulaIdCounter = 0;
    }

    init() {
        for (let i = 0; i < OBSTACLE_COUNT; i++) {
            this.spawnObstacle();
        }
        for (let i = 0; i < NEBULA_COUNT; i++) {
            this.spawnNebula();
        }
    }

    spawnObstacle() {
        const id = ++this.obstacleIdCounter;
        const radius = OBSTACLE_RADIUS_MIN + Math.random() * (OBSTACLE_RADIUS_MAX - OBSTACLE_RADIUS_MIN);
        const x = Math.random() * (MAP_SIZE - radius * 2) + radius;
        const y = Math.random() * (MAP_SIZE - radius * 2) + radius;

        const obstacle = {
            id,
            x,
            y,
            radius,
            rotation: Math.random() * Math.PI * 2,
            type: 'asteroid'
        };

        this.obstacles.set(id, obstacle);
        return obstacle;
    }

    spawnNebula() {
        const id = ++this.nebulaIdCounter;
        const x = Math.random() * MAP_SIZE;
        const y = Math.random() * MAP_SIZE;

        const nebula = {
            id,
            x,
            y,
            radius: NEBULA_RADIUS + Math.random() * 50,
            color: this.getRandomNebulaColor(),
            alpha: 0.3 + Math.random() * 0.3
        };

        this.nebulas.set(id, nebula);
        return nebula;
    }

    getRandomNebulaColor() {
        const colors = [0x4400ff, 0xff00ff, 0x00ffff, 0x0044ff];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    checkPlayerCollision(player) {
        for (const [id, obstacle] of this.obstacles) {
            const dx = player.x - obstacle.x;
            const dy = player.y - obstacle.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < player.radius + obstacle.radius) {
                return obstacle;
            }
        }
        return null;
    }

    checkProjectileCollision(projectile) {
        for (const [id, obstacle] of this.obstacles) {
            const dx = projectile.x - obstacle.x;
            const dy = projectile.y - obstacle.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < projectile.radius + obstacle.radius) {
                return obstacle;
            }
        }
        return null;
    }

    getObstaclesData() {
        return Array.from(this.obstacles.values());
    }

    getNebulasData() {
        return Array.from(this.nebulas.values());
    }
}
