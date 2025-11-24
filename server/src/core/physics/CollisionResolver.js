import { Physics } from '../Physics.js';
import { SHIP_RADIUS, PROJECTILE_RADIUS } from 'shared/constants';

export class CollisionResolver {
    constructor(game) {
        this.game = game;
    }

    update() {
        this.checkProjectilePlayerCollisions();
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
}
