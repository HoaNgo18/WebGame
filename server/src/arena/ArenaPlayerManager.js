import { MAP_SIZE, ARENA_CONFIG } from 'shared/constants';

export class ArenaPlayerManager {
    constructor(room) {
        this.room = room;
        this.lastDamageTime = new Map();
    }

    spawnAllPlayers() {
        const players = Array.from(this.room.players.values());
        const spawnPoints = this.generateSpawnPoints(players.length);

        players.forEach((player, index) => {
            const spawn = spawnPoints[index];
            player.x = spawn.x;
            player.y = spawn.y;
            player.rotation = spawn.rotation;
            player.alive = true;
            player.placement = 0;
            player.kills = 0;
            player.lives = 5;
            player.vx = 0;
            player.vy = 0;
        });
    }

    generateSpawnPoints(count) {
        const points = [];
        const centerX = MAP_SIZE / 2;
        const centerY = MAP_SIZE / 2;
        const radius = MAP_SIZE * 0.35; // Spawn in a circle

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            points.push({
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius,
                rotation: angle + Math.PI // Face center
            });
        }

        return points;
    }

    applyZoneDamage(zone) {
        if (!zone) return;

        const now = Date.now();

        this.room.players.forEach((player, playerId) => {
            if (!player.alive) return;

            const dx = player.x - zone.centerX;
            const dy = player.y - zone.centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > zone.radius) {
                // Outside zone
                const lastDamage = this.lastDamageTime.get(playerId) || 0;

                if (now - lastDamage >= ARENA_CONFIG.ZONE_DAMAGE_INTERVAL) {
                    this.lastDamageTime.set(playerId, now);

                    const isDead = player.takeDamage(ARENA_CONFIG.ZONE_DAMAGE);

                    if (isDead) {
                        this.room.eliminatePlayer(playerId, null);
                    }
                }
            }
        });
    }

    respawnPlayer(playerId) {
        // In arena mode, no respawn - player is eliminated
        // This method exists for consistency with normal game mode
        return false;
    }

    getAliveCount() {
        let count = 0;
        this.room.players.forEach(player => {
            if (player.alive) count++;
        });
        return count;
    }

    reset() {
        this.lastDamageTime.clear();
    }
}
