import {
    MAP_SIZE,
    CHEST_COUNT,
    CHEST_RADIUS
} from 'shared/constants';
import { Chest } from '../../entities/Chest.js';
import { Item } from '../../entities/Item.js';

export class ChestManager {
    constructor(game) {
        this.game = game;
        this.chests = new Map();
        this.items = new Map();
        this.chestIdCounter = 0;
        this.itemIdCounter = 0;
    }

    init() {
        for (let i = 0; i < CHEST_COUNT; i++) {
            this.spawnChest();
        }
    }

    spawnChest() {
        const id = ++this.chestIdCounter;
        const x = Math.random() * (MAP_SIZE - 200) + 100;
        const y = Math.random() * (MAP_SIZE - 200) + 100;

        const chest = new Chest(id, x, y);
        this.chests.set(id, chest);
        return chest;
    }

    damageChest(chestId, damage) {
        const chest = this.chests.get(chestId);
        if (!chest) return [];

        const destroyed = chest.takeDamage(damage);
        if (destroyed) {
            // Drop items
            const drops = chest.getRandomDrop();
            const droppedItems = [];

            drops.forEach((itemType, index) => {
                const item = this.spawnItem(
                    chest.x + (Math.random() - 0.5) * 50,
                    chest.y + (Math.random() - 0.5) * 50,
                    itemType
                );
                droppedItems.push(item);
            });

            // Remove chest and respawn new one
            this.chests.delete(chestId);
            setTimeout(() => this.spawnChest(), 10000); // Respawn after 10s

            return droppedItems;
        }
        return [];
    }

    spawnItem(x, y, itemType) {
        const id = ++this.itemIdCounter;
        const item = new Item(id, x, y, itemType);
        this.items.set(id, item);
        return item;
    }

    collectItem(itemId, player) {
        const item = this.items.get(itemId);
        if (!item || !item.active) return false;

        // Try to add to inventory
        if (player.addToInventory(item.itemType)) {
            this.items.delete(itemId);
            return true;
        }
        return false;
    }

    update(deltaTime) {
        // Update items (check lifetime)
        this.items.forEach((item, id) => {
            item.update(deltaTime);
            if (!item.active) {
                this.items.delete(id);
            }
        });
    }

    checkItemCollision(player) {
        const collected = [];

        this.items.forEach((item, id) => {
            if (!item.active) return;

            const dx = player.x - item.x;
            const dy = player.y - item.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < player.radius + item.radius) {
                if (this.collectItem(id, player)) {
                    collected.push(item);
                }
            }
        });

        return collected;
    }

    getChestsData() {
        return Array.from(this.chests.values()).map(c => c.toJSON());
    }

    getItemsData() {
        return Array.from(this.items.values()).map(i => i.toJSON());
    }
}
