import { ARENA_CONFIG, MAP_SIZE } from 'shared/constants';
import { PacketType } from 'shared/packetTypes';

export class ArenaZoneManager {
    constructor(room) {
        this.room = room;
        this.phases = ARENA_CONFIG.ZONE_SHRINK_PHASES;

        this.currentPhase = 0;
        this.currentZone = null;
        this.targetZone = null;
        this.shrinking = false;
    }

    init() {
        // Set initial zone
        const phase = this.phases[0];
        this.currentZone = {
            centerX: phase.centerX,
            centerY: phase.centerY,
            radius: phase.radius
        };
        this.targetZone = { ...this.currentZone };
        this.currentPhase = 0;
    }

    update(gameTime) {
        const nextPhase = this.phases[this.currentPhase + 1];
        if (!nextPhase) return;

        // Check if it's time to start shrinking
        if (gameTime >= nextPhase.time && !this.shrinking) {
            this.startShrinking(nextPhase);
        }

        // Apply shrinking
        if (this.shrinking) {
            this.applyShrink();
        }
    }

    startShrinking(phase) {
        this.shrinking = true;
        this.currentPhase++;

        // Calculate target center (random if null)
        const centerX = phase.centerX ?? this.getRandomCenter(phase.radius);
        const centerY = phase.centerY ?? this.getRandomCenter(phase.radius);

        this.targetZone = {
            centerX,
            centerY,
            radius: phase.radius
        };

        this.room.broadcast({
            type: PacketType.ARENA_ZONE_UPDATE,
            currentZone: this.currentZone,
            targetZone: this.targetZone,
            phase: this.currentPhase
        });
    }

    applyShrink() {
        const speed = ARENA_CONFIG.ZONE_SHRINK_SPEED / 60; // Per frame

        // Shrink radius
        if (this.currentZone.radius > this.targetZone.radius) {
            this.currentZone.radius = Math.max(
                this.targetZone.radius,
                this.currentZone.radius - speed
            );
        }

        // Move center
        const dx = this.targetZone.centerX - this.currentZone.centerX;
        const dy = this.targetZone.centerY - this.currentZone.centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 1) {
            const moveSpeed = speed * 0.5;
            this.currentZone.centerX += (dx / dist) * moveSpeed;
            this.currentZone.centerY += (dy / dist) * moveSpeed;
        }

        // Check if shrink complete
        if (this.currentZone.radius === this.targetZone.radius && dist <= 1) {
            this.shrinking = false;
        }
    }

    getRandomCenter(radius) {
        const margin = radius + 100;
        return margin + Math.random() * (MAP_SIZE - margin * 2);
    }

    isInZone(x, y) {
        const dx = x - this.currentZone.centerX;
        const dy = y - this.currentZone.centerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist <= this.currentZone.radius;
    }

    getCurrentZone() {
        return this.currentZone;
    }

    getZoneData() {
        return {
            current: this.currentZone,
            target: this.targetZone,
            phase: this.currentPhase,
            shrinking: this.shrinking
        };
    }

    reset() {
        this.currentPhase = 0;
        this.currentZone = null;
        this.targetZone = null;
        this.shrinking = false;
    }
}
