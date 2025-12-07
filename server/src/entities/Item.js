import { Entity } from './Entity.js';
import { ITEM_RADIUS, ITEM_CONFIG } from 'shared/constants';

export class Item extends Entity {
    constructor(id, x, y, itemType) {
        super(id, x, y);
        this.itemType = itemType;
        this.radius = ITEM_RADIUS;

        const config = ITEM_CONFIG[itemType];
        this.name = config.name;
        this.effect = config.effect;
        this.glowColor = config.glowColor;

        // Items disappear after 30 seconds
        this.lifetime = 30000;
        this.spawnTime = Date.now();
    }

    update(deltaTime) {
        // Check if expired
        if (Date.now() - this.spawnTime > this.lifetime) {
            this.active = false;
        }
    }

    toJSON() {
        return {
            ...super.toJSON(),
            itemType: this.itemType,
            glowColor: this.glowColor
        };
    }
}
