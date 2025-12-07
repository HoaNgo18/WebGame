import { Entity } from './Entity.js';
import {
    MAP_SIZE,
    SHIP_RADIUS,
    SHIP_MAX_LIVES,
    SHIP_MAX_SPEED,
    SHIP_ACCELERATION,
    SHIP_DECELERATION,
    SHIP_ROTATION_SPEED,
    ITEM_CONFIG
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

        // Inventory (4 slots)
        this.inventory = [null, null, null, null];
        this.selectedSlot = 0;
        this.currentWeapon = 'BLUE';

        // Stats
        this.xp = 0;
        this.coins = 0;
        this.kills = 0;

        // Buffs
        this.shield = false;
        this.shieldEndTime = 0;
        this.speedMultiplier = 1;
        this.speedEndTime = 0;

        // Attack cooldown
        this.lastAttack = 0;
    }

    update(deltaTime) {
        const dt = deltaTime / 1000;
        const now = Date.now();

        // Check buff expiration
        if (this.shield && now > this.shieldEndTime) {
            this.shield = false;
        }
        if (this.speedMultiplier > 1 && now > this.speedEndTime) {
            this.speedMultiplier = 1;
        }

        // Rotation
        if (this.input.left) {
            this.rotation -= SHIP_ROTATION_SPEED * dt;
        }
        if (this.input.right) {
            this.rotation += SHIP_ROTATION_SPEED * dt;
        }

        // Calculate max speed with buff
        const maxSpeed = SHIP_MAX_SPEED * this.speedMultiplier;

        // Acceleration
        if (this.input.up) {
            this.vx += Math.cos(this.rotation) * SHIP_ACCELERATION * dt;
            this.vy += Math.sin(this.rotation) * SHIP_ACCELERATION * dt;
        }
        if (this.input.down) {
            this.vx *= (1 - SHIP_DECELERATION * dt / maxSpeed);
            this.vy *= (1 - SHIP_DECELERATION * dt / maxSpeed);
        }

        // Apply velocity cap
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > maxSpeed) {
            const scale = maxSpeed / speed;
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

    selectSlot(slot) {
        if (slot >= 0 && slot < 4) {
            this.selectedSlot = slot;
        }
    }

    addToInventory(itemType) {
        // Find empty slot
        for (let i = 0; i < this.inventory.length; i++) {
            if (this.inventory[i] === null) {
                this.inventory[i] = itemType;
                return true;
            }
        }
        return false; // Inventory full
    }

    useItem() {
        const itemType = this.inventory[this.selectedSlot];
        if (!itemType) return null;

        const config = ITEM_CONFIG[itemType];
        if (!config) return null;

        // Remove from inventory
        this.inventory[this.selectedSlot] = null;

        // Apply effect
        return this.applyEffect(config.effect);
    }

    applyEffect(effect) {
        switch (effect.type) {
            case 'heal':
                this.lives = Math.min(SHIP_MAX_LIVES, this.lives + effect.value);
                return { type: 'heal', value: effect.value };

            case 'shield':
                this.shield = true;
                this.shieldEndTime = Date.now() + effect.duration;
                return { type: 'shield', duration: effect.duration };

            case 'speed':
                this.speedMultiplier = effect.multiplier;
                this.speedEndTime = Date.now() + effect.duration;
                return { type: 'speed', multiplier: effect.multiplier };

            case 'weapon':
                this.currentWeapon = effect.weaponType;
                return { type: 'weapon', weaponType: effect.weaponType };

            case 'coin':
                this.coins += effect.value;
                return { type: 'coin', value: effect.value };

            case 'plant_bomb':
                return { type: 'plant_bomb', damage: effect.damage, radius: effect.radius };

            default:
                return null;
        }
    }

    takeDamage(amount = 1) {
        if (this.shield) return false; // Protected by shield
        this.lives -= amount;
        return this.lives <= 0;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            name: this.name,
            lives: this.lives,
            vx: this.vx,
            vy: this.vy,
            inventory: this.inventory,
            selectedSlot: this.selectedSlot,
            currentWeapon: this.currentWeapon,
            xp: this.xp,
            coins: this.coins,
            shield: this.shield,
            speedMultiplier: this.speedMultiplier
        };
    }
}
