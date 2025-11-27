import { ArenaRoom } from './ArenaRoom.js';
import { ARENA_CONFIG } from 'shared/constants';

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
    }
}
