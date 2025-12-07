import { Entity } from './Entity.js';
import { CHEST_RADIUS, CHEST_HP, ITEM_TYPES, ITEM_CONFIG } from 'shared/constants';

export class Chest extends Entity {
    constructor(id, x, y) {
        super(id, x, y);
        this.radius = CHEST_RADIUS;
        this.hp = CHEST_HP;
        this.destroyed = false;
    }

    takeDamage(amount = 1) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.destroyed = true;
            return true;
        }
        return false;
    }

    getRandomDrop() {
        const itemTypes = Object.keys(ITEM_CONFIG);
        const drops = [];

        // Roll for 1-3 items
        const dropCount = 1 + Math.floor(Math.random() * 3);

        for (let i = 0; i < dropCount; i++) {
            const randomType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
            drops.push(randomType);
        }

        return drops;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            radius: this.radius,
            hp: this.hp
        };
    }
}
