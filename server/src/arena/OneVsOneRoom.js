import { ArenaRoom } from './ArenaRoom.js';
import { ARENA_CONFIG } from 'shared/constants';
import { PacketType } from 'shared/packetTypes';

export class OneVsOneRoom extends ArenaRoom {
    constructor(id, manager) {
        super(id, manager);
        this.maxPlayers = 2;
        this.waitTime = 15000; // 15 seconds to wait for opponent
        this.gameDuration = 300000; // 5 minutes max

        // Custom Zone Settings for 1v1 (Smaller map)
        this.initialZoneRadius = 1500; // Smaller than normal Arena

        // Apply initial zone
        if (this.zoneManager && this.zoneManager.zone) {
            this.zoneManager.zone.radius = this.initialZoneRadius;
            this.zoneManager.zone.targetRadius = this.initialZoneRadius;
        }
    }

    // Override start game to setup faster zone shrinking
    startGame() {
        super.startGame();

        // Configure swift zone phases for 1v1
        // We act directly on the zoneManager's state or config if possible.
        // Since ArenaZoneManager reads from ARENA_CONFIG constant, we might need to override behavior 
        // or just accept global config.
        // Ideally we should have instance-based config.

        // For now, let's just forcefully set the zone to be smaller immediately.
        this.zoneManager.resetForGame();
        this.zoneManager.zone.radius = this.initialZoneRadius;
        this.zoneManager.zone.targetRadius = this.initialZoneRadius * 0.8;

        // Re-position ALL players to be inside the zone
        this.playerManager.forEach(player => {
            this.spawnPlayerInZone(player);
        });
    }

    /**
     * Spawn or reposition a player inside the initial zone
     */
    spawnPlayerInZone(player) {
        // Spawn within 80% of zone radius to be safe
        const safeRadius = this.initialZoneRadius * 0.7;
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * safeRadius;

        player.x = Math.cos(angle) * distance;
        player.y = Math.sin(angle) * distance;
        player.vx = 0;
        player.vy = 0;
    }

    /**
     * Override announceWinner to broadcast to all players
     * Client will determine if they're winner or loser based on winnerId === myId
     */
    announceWinner(winner) {
        // Broadcast ARENA_VICTORY to ALL real players
        // Client will show Victory if winnerId === myId, Defeated otherwise
        this.playerManager.forEach(player => {
            if (!player.isBot) {
                this.sendToClient(player.id, {
                    type: PacketType.ARENA_VICTORY,
                    winnerId: winner.id,
                    winnerName: winner.name,
                    score: winner.score
                });
            }
        });

        // Also broadcast ARENA_END for cleanup
        this.broadcast({
            type: PacketType.ARENA_END,
            reason: 'winner_declared',
            winnerId: winner.id,
            winnerName: winner.name
        });
    }
}

