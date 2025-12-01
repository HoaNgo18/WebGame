import { Entity } from './Entity.js';
import { WEAPON_STATS, PROJECTILE_RADIUS, MAP_SIZE } from 'shared/constants';

export class Projectile extends Entity {
    constructor(id, ownerId, x, y, rotation, weaponType = 'BLUE') {
        super(id, x, y);
        this.ownerId = ownerId;
        this.rotation = rotation;
        this.weaponType = weaponType;
        this.radius = PROJECTILE_RADIUS;

        const stats = WEAPON_STATS[weaponType];
        this.damage = stats.damage;
        this.speed = stats.speed;
        this.range = stats.range;
        this.color = stats.color;

        // Calculate velocity
        this.vx = Math.cos(rotation) * this.speed;
        this.vy = Math.sin(rotation) * this.speed;

        // Track distance traveled
        this.distanceTraveled = 0;
        this.startX = x;
        this.startY = y;
    }

    update(deltaTime) {
        const dt = deltaTime / 1000;

        // Move projectile
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Calculate distance traveled
        const dx = this.x - this.startX;
        const dy = this.y - this.startY;
        this.distanceTraveled = Math.sqrt(dx * dx + dy * dy);

        // Check if out of range or bounds
        if (this.distanceTraveled >= this.range) {
            this.active = false;
        }

        if (this.x < 0 || this.x > MAP_SIZE || this.y < 0 || this.y > MAP_SIZE) {
            this.active = false;
        }
    }

    toJSON() {
        return {
            ...super.toJSON(),
            ownerId: this.ownerId,
            weaponType: this.weaponType,
            color: this.color
        };
    }
}
