import { Physics } from '../Physics.js';
import { SHIP_RADIUS, PROJECTILE_RADIUS } from 'shared/constants';

export class CollisionResolver {
    constructor(game) {
        this.game = game;
    }

    update() {
        this.checkProjectilePlayerCollisions();
        this.checkProjectileObstacleCollisions();
        this.checkPlayerObstacleCollisions();
    }

    checkProjectilePlayerCollisions() {
        const projectiles = this.game.projectiles;
        const players = this.game.players;

        projectiles.forEach((projectile, projectileId) => {
            if (!projectile.active) return;

            players.forEach((player, playerId) => {
                // Don't hit owner
                if (playerId === projectile.ownerId) return;
                if (!player.active) return;

                // Check collision
                const dist = Physics.distance(
                    projectile.x, projectile.y,
                    player.x, player.y
                );

                if (dist < SHIP_RADIUS + PROJECTILE_RADIUS) {
                    // Hit!
                    projectile.active = false;

                    const isDead = player.takeDamage(projectile.damage);

                    if (isDead) {
                        this.game.handlePlayerDeath(playerId, projectile.ownerId);
                    }
                }
            });
        });
    }

    checkProjectileObstacleCollisions() {
        const projectiles = this.game.projectiles;
        const obstacles = this.game.obstacleManager.obstacles;

        projectiles.forEach((projectile) => {
            if (!projectile.active) return;

            obstacles.forEach((obstacle) => {
                const dist = Physics.distance(
                    projectile.x, projectile.y,
                    obstacle.x, obstacle.y
                );

                if (dist < projectile.radius + obstacle.radius) {
                    // Projectile hits obstacle
                    projectile.active = false;
                }
            });
        });
    }

    checkPlayerObstacleCollisions() {
        const players = this.game.players;
        const obstacles = this.game.obstacleManager.obstacles;

        players.forEach((player) => {
            obstacles.forEach((obstacle) => {
                const dist = Physics.distance(
                    player.x, player.y,
                    obstacle.x, obstacle.y
                );

                const minDist = player.radius + obstacle.radius;
                if (dist < minDist) {
                    // Push player out of obstacle
                    const angle = Physics.angleBetween(obstacle.x, obstacle.y, player.x, player.y);
                    const overlap = minDist - dist;

                    player.x += Math.cos(angle) * overlap;
                    player.y += Math.sin(angle) * overlap;

                    // Reduce velocity on collision
                    player.vx *= 0.5;
                    player.vy *= 0.5;
                }
            });
        });
    }
}
