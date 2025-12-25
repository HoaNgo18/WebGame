// server/src/core/physics/CollisionResolver.js
import { PacketType } from 'shared/packetTypes';
import {
    XP_PER_FOOD, CHEST_TYPES, ITEM_RADIUS, SHIP_RADIUS,
    WORMHOLE_CORE_RADIUS, WORMHOLE_PULL_FORCE, WORMHOLE_DRAG, WORMHOLE_TELEPORT_COOLDOWN
} from 'shared/constants';

export class CollisionResolver {
    constructor(game) {
        this.game = game;
    }

    // --- PROJECTILES HITS ---

    hitPlayer(player, projectile) {
        player.takeDamage(projectile.damage, projectile.ownerId);
        if (player.isDead()) {
            this.handlePlayerDeath(player, projectile.ownerId, projectile.ownerName);
        }
    }

    hitChest(chest, projectile) {
        chest.takeDamage(projectile.damage);
        if (chest.dead) {
            this.game.world.spawnItem(chest.x, chest.y, chest.type);
            this.game.world.delta.chestsRemoved.push(chest.id);

            // Xóa khỏi mảng chests của world
            const idx = this.game.world.chests.indexOf(chest);
            if (idx !== -1) this.game.world.chests.splice(idx, 1);

            if (chest.type === CHEST_TYPES.STATION) {
                setTimeout(() => this.game.world.spawnStationIfNeeded(), 60000);
            }
        }
    }

    // --- PLAYER COLLECTIBLES ---

    collectFood(player, food) {
        player.score += XP_PER_FOOD;
        player.checkLevelUp();
        this.game.world.removeFood(food.id);
    }

    collectItem(player, item) {
        player.applyItem(item.type);

        if (!player.isBot) {
            this.game.server.sendToClient(player.id, {
                type: 'ITEM_PICKED_UP',
                playerId: player.id,
                itemType: item.type
            });
        }

        this.game.world.delta.itemsRemoved.push(item.id);
        const idx = this.game.world.items.indexOf(item);
        if (idx !== -1) this.game.world.items.splice(idx, 1);
    }

    // --- PHYSICS PUSH ---

    resolveEntityPush(dynamicEntity, staticEntityX, staticEntityY, staticRadius) {
        const dx = dynamicEntity.x - staticEntityX;
        const dy = dynamicEntity.y - staticEntityY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = (dynamicEntity.radius || SHIP_RADIUS) + staticRadius;

        if (dist < minDist) {
            if (dist > 0) {
                const pushOut = minDist - dist;
                dynamicEntity.x += (dx / dist) * pushOut;
                dynamicEntity.y += (dy / dist) * pushOut;
            } else {
                dynamicEntity.x += minDist; // Fallback trùng tâm
            }
        }
    }

    resolvePlayerVsPlayerPush(p1, p2) {
        const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const minDist = (p1.radius || SHIP_RADIUS) + (p2.radius || SHIP_RADIUS);

        if (dist < minDist && dist > 0) {
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            const overlap = (minDist - dist) / 2;

            p1.x -= Math.cos(angle) * overlap;
            p1.y -= Math.sin(angle) * overlap;
            p2.x += Math.cos(angle) * overlap;
            p2.y += Math.sin(angle) * overlap;
        }
    }

    applyPushVector(player, vector) {
        if (vector) {
            player.x += vector.x;
            player.y += vector.y;
        }
    }

    // --- EXPLOSIONS ---

    applyExplosionDamage(player, explosion) {
        player.takeDamage(explosion.damage, explosion.ownerId);

        // Check death after damage
        if (player.isDead()) {
            this.handlePlayerDeath(player, explosion.ownerId, explosion.ownerName);
        }
    }

    // --- DEATH LOGIC ---

    handlePlayerDeath(player, killerId, killerName) {
        // GUARD: Chỉ xử lý 1 lần - nếu đã dead thì skip
        if (player.dead) return;

        // Mark as dead FIRST to prevent duplicate calls
        player.dead = true;
        player.lives = 0;
        player.deathTime = Date.now();
        player.inventory = [null, null, null, null, null];

        // Spawn drops
        this.game.world.spawnItem(player.x, player.y, 'ENEMY');

        const killer = this.game.players.get(killerId);
        if (killer) {
            killer.score += 100;
            killer.lives = Math.min(killer.lives + 1, killer.maxLives);
            killer.sessionKills = (killer.sessionKills || 0) + 1;

            if (!killer.isBot) {
                // Chỉ cộng điểm và save stats, không tự cộng coin
                // Coin sẽ rơi ra từ enemy drops
                this.game.saveKillerStats(killer);
            }
        }

        // Broadcast death - works for both normal game and arena
        // Check if this is an arena room (has broadcast method directly) or normal game (has server.broadcast)
        const broadcastData = {
            type: PacketType.PLAYER_DIED,
            victimId: player.id,
            killerId: killerId,
            killerName: killerName || 'Unknown',
            score: player.score,
            coins: player.coins,
            kills: player.sessionKills,
            rank: (this.game.getTotalAliveCount && typeof this.game.getTotalAliveCount === 'function')
                ? this.game.getTotalAliveCount() + 1
                : undefined
        };

        if (this.game.broadcast) {
            // This is an ArenaRoom
            this.game.broadcast(broadcastData);

            // Save arena ranking for PvP deaths (if not a bot and has userId)
            if (!player.isBot && player.userId && broadcastData.rank) {
                this.game.savePlayerRanking(player, broadcastData.rank);
            }
        } else if (this.game.server) {
            // This is the main Game
            this.game.server.broadcast(broadcastData);
        }

        // Handle bot cleanup - only for normal game mode (arena handles its own cleanup)
        if (player.isBot) {
            setTimeout(() => {
                if (this.game.broadcast) {
                    // Arena
                    if (this.game.players.has(player.id)) {
                        this.game.players.delete(player.id);
                        this.game.broadcast({
                            type: PacketType.PLAYER_LEAVE,
                            id: player.id
                        });
                    }
                } else if (this.game.bots) {
                    // Normal game
                    if (this.game.players.has(player.id)) {
                        this.game.removePlayer(player.id);
                        this.game.bots.manageBots();
                    }
                }
            }, 2000);
        } else if (!player.isBot) {
            this.game.savePlayerScore(player);
        }
    }

    // --- WORMHOLE PHYSICS ---

    applyWormholePull(player, wormhole, dt) {
        const dx = wormhole.x - player.x;
        const dy = wormhole.y - player.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 1) return; // Prevent division by zero

        // Direction vector towards center (normalized)
        const dirX = dx / dist;
        const dirY = dy / dist;

        // Calculate pull force (stronger closer to center)
        const distanceRatio = 1 - (dist / wormhole.pullRadius); // 0 at edge, 1 at center

        // Check player's current speed and input
        const vx = player.vx || 0;
        const vy = player.vy || 0;
        const currentSpeed = Math.hypot(vx, vy);
        const hasInput = player.input && (player.input.up || player.input.down || player.input.left || player.input.right);

        // If no input or barely moving, apply strong constant pull towards center
        if (!hasInput || currentSpeed < 50) {
            // Strong constant pull - directly move player towards center
            const pullSpeed = WORMHOLE_PULL_FORCE * distanceRatio * 3 * dt;
            player.vx = vx + dirX * pullSpeed;
            player.vy = vy + dirY * pullSpeed;
        } else {
            // Player is actively moving - apply weaker pull
            const pullStrength = WORMHOLE_PULL_FORCE * distanceRatio * dt;
            player.vx = vx + dirX * pullStrength;
            player.vy = vy + dirY * pullStrength;

            // Check if player is trying to escape (velocity pointing away from center)
            const dotProduct = player.vx * dirX + player.vy * dirY;
            if (dotProduct < 0) {
                // Player is trying to escape - apply drag
                const scaledDrag = WORMHOLE_DRAG + (1 - WORMHOLE_DRAG) * (1 - distanceRatio);
                player.vx *= scaledDrag;
                player.vy *= scaledDrag;
            }
        }
    }

    applyWormholeDrag(player, dt) {
        // Now handled inside applyWormholePull based on direction
        // This method kept for backwards compatibility but does nothing
    }

    teleportPlayer(player, targetWormhole) {
        // Check cooldown
        const now = Date.now();
        if (player.lastTeleportTime && (now - player.lastTeleportTime) < WORMHOLE_TELEPORT_COOLDOWN) {
            return false; // Still on cooldown
        }

        // Teleport to target wormhole (offset slightly to avoid immediate re-teleport)
        const offsetDist = targetWormhole.radius * 0.8;
        const angle = Math.random() * Math.PI * 2;

        player.x = targetWormhole.x + Math.cos(angle) * offsetDist;
        player.y = targetWormhole.y + Math.sin(angle) * offsetDist;

        // Reset velocity
        player.vx = 0;
        player.vy = 0;

        // Set cooldown
        player.lastTeleportTime = now;

        console.log(`[Wormhole] Player ${player.name} teleported to ${targetWormhole.id}`);
        return true;
    }
}
