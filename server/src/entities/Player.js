import { Entity } from './Entity.js';
import {
    MAP_SIZE,
    SHIP_RADIUS,
    SHIP_MAX_LIVES,
    SHIP_MAX_SPEED,
    SHIP_ACCELERATION,
    SHIP_DECELERATION,
    SHIP_ROTATION_SPEED
} from 'shared/constants';

export class Player extends Entity {
    constructor(id, name, x, y) {
        super(id, x, y);
        this.name = name;
        this.radius = SHIP_RADIUS;
        this.lives = SHIP_MAX_LIVES;

        // Velocity
        this.vx = 0;
        this.vy = 0;

        // Input state
        this.input = {
            up: false,
            down: false,
            left: false,
            right: false
        };

        // WebSocket reference
        this.ws = null;
    }

    update(deltaTime) {
        const dt = deltaTime / 1000; // Convert to seconds

        // Rotation
        if (this.input.left) {
            this.rotation -= SHIP_ROTATION_SPEED * dt;
        }
        if (this.input.right) {
            this.rotation += SHIP_ROTATION_SPEED * dt;
        }

        // Acceleration
        if (this.input.up) {
            this.vx += Math.cos(this.rotation) * SHIP_ACCELERATION * dt;
            this.vy += Math.sin(this.rotation) * SHIP_ACCELERATION * dt;
        }
        if (this.input.down) {
            // Brake/reverse
            this.vx *= (1 - SHIP_DECELERATION * dt / SHIP_MAX_SPEED);
            this.vy *= (1 - SHIP_DECELERATION * dt / SHIP_MAX_SPEED);
        }

        // Apply velocity cap
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > SHIP_MAX_SPEED) {
            const scale = SHIP_MAX_SPEED / speed;
            this.vx *= scale;
            this.vy *= scale;
        }

        // Apply friction when not accelerating
        if (!this.input.up && !this.input.down) {
            this.vx *= 0.99;
            this.vy *= 0.99;
        }

        // Update position
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Clamp to world bounds
        this.x = Math.max(this.radius, Math.min(MAP_SIZE - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(MAP_SIZE - this.radius, this.y));
    }

    setInput(input) {
        this.input = { ...this.input, ...input };
    }

    takeDamage(amount = 1) {
        this.lives -= amount;
        return this.lives <= 0;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            name: this.name,
            lives: this.lives,
            vx: this.vx,
            vy: this.vy
        };
    }
}
