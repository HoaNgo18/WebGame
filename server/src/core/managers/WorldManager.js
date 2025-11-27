import {
    MAP_SIZE, FOOD_COUNT, OBSTACLE_COUNT, OBSTACLE_RADIUS_MIN, OBSTACLE_RADIUS_MAX,
    CHEST_COUNT, CHEST_RADIUS, CHEST_TYPES, ITEM_TYPES, ITEM_CONFIG,
    NEBULA_COUNT, NEBULA_RADIUS,
    STATION_COUNT, STATION_STATS,
    WORMHOLE_COUNT, WORMHOLE_RADIUS, WORMHOLE_PULL_RADIUS, WORMHOLE_ISOLATION_RADIUS
} from 'shared/constants';
import { Chest } from '../../entities/Chest.js';
import { Item } from '../../entities/Item.js';
import { SpawnValidator } from '../../utils/SpawnValidator.js';

export class WorldManager {
    constructor() {
        this.foods = [];
        this.obstacles = [];
        this.chests = [];
        this.items = [];
        this.nebulas = [];
        this.wormholes = [];

        // Delta tracking (Change Logs)
        this.delta = {
            foodsAdded: [],
            foodsRemoved: [],
            chestsAdded: [],
            chestsRemoved: [],
            itemsAdded: [],
            itemsRemoved: []
        };

        // Spawn validator - khởi tạo sau khi các arrays đã được tạo
        this.spawnValidator = new SpawnValidator(this);

        // Init - WORMHOLES FIRST to establish isolation zones
        this.initWormholes();     // Wormholes TRƯỚC TIÊN
        this.initObstacles();     // Obstacles (được phép overlap nhau)
        this.initStations();      // Stations 
        this.initChests();        // Chests
        this.initNebulas();       // Nebulas (phải tránh wormhole zones)
        this.initFood();          // Food cuối vì nhiều và nhỏ
    }

    resetDelta() {
        this.delta.foodsAdded = [];
        this.delta.foodsRemoved = [];
        this.delta.chestsAdded = [];
        this.delta.chestsRemoved = [];
        this.delta.itemsAdded = [];
        this.delta.itemsRemoved = [];
    }

    // --- INITIALIZATION (GIỮ NGUYÊN) ---
    initFood() {
        for (let i = 0; i < FOOD_COUNT; i++) {
            this.foods.push(this._createFoodObject());
        }
    }

    initObstacles() {
        // User-specified sizes: small=10, med=25, big=50 (radius = visual/2)
        const meteorSizes = {
            small: { width: 20, height: 20, radius: 10 },   // Visual: 20x20
            med: { width: 50, height: 50, radius: 25 },     // Visual: 50x50
            big: { width: 100, height: 100, radius: 50 },    // Visual: 100x100
            super: { width: 200, height: 200, radius: 100 }  // Visual: 200x200
        };
        const meteorSprites = {
            small: ['meteorBrown_small1', 'meteorBrown_small2', 'meteorGrey_small1', 'meteorGrey_small2'],
            med: ['meteorBrown_med1', 'meteorBrown_med3', 'meteorGrey_med1', 'meteorGrey_med2'],
            big: ['meteorBrown_big1', 'meteorBrown_big2', 'meteorBrown_big3', 'meteorBrown_big4',
                'meteorGrey_big1', 'meteorGrey_big2', 'meteorGrey_big3', 'meteorGrey_big4'],
            super: ['spaceMeteors_001', 'spaceMeteors_002', 'spaceMeteors_003', 'spaceMeteors_004']
        };

        let spawned = 0;
        let attempts = 0;
        const maxAttempts = OBSTACLE_COUNT * 20;

        while (spawned < OBSTACLE_COUNT && attempts < maxAttempts) {
            attempts++;

            // Balanced spawn ratio for better visual variety
            const rand = Math.random();
            let randomSize;
            if (rand < 0.20) randomSize = 'big';        // 25% big (100px)
            else if (rand < 0.60) randomSize = 'med';   // 50% med (50px)
            else if (rand < 0.90) randomSize = 'small'; // 20% small (20px)
            else randomSize = 'super';                 // 15% super (200px)

            const sizeData = meteorSizes[randomSize];
            const max = MAP_SIZE / 2 - Math.max(sizeData.width, sizeData.height) / 2;

            let x, y;

            if (randomSize === 'small') {
                // Cluster spawning for small meteors
                const clusterX = (Math.random() * MAP_SIZE * 0.8) - MAP_SIZE * 0.4;
                const clusterY = (Math.random() * MAP_SIZE * 0.8) - MAP_SIZE * 0.4;

                // Check cluster center first
                if (this.isInWormholeZone(clusterX, clusterY)) {
                    continue;
                }

                const clusterSize = Math.floor(Math.random() * 3) + 2;
                for (let j = 0; j < clusterSize && spawned < OBSTACLE_COUNT; j++) {
                    const offsetDist = 100 + Math.random() * 50;
                    const offsetAngle = Math.random() * Math.PI * 2;
                    x = clusterX + Math.cos(offsetAngle) * offsetDist;
                    y = clusterY + Math.sin(offsetAngle) * offsetDist;

                    // Skip if in wormhole zone
                    if (this.isInWormholeZone(x, y)) continue;

                    const spriteKey = meteorSprites[randomSize][Math.floor(Math.random() * meteorSprites[randomSize].length)];
                    this.obstacles.push({
                        id: `obs_${spawned}`,
                        x, y, radius: sizeData.radius, width: sizeData.width, height: sizeData.height,
                        size: randomSize, sprite: spriteKey
                    });
                    spawned++;
                }
            } else {
                x = (Math.random() * MAP_SIZE) - max;
                y = (Math.random() * MAP_SIZE) - max;

                // Check wormhole zone
                if (this.isInWormholeZone(x, y)) {
                    continue;
                }

                const spriteKey = meteorSprites[randomSize][Math.floor(Math.random() * meteorSprites[randomSize].length)];
                this.obstacles.push({
                    id: `obs_${spawned}`,
                    x, y, radius: sizeData.radius, width: sizeData.width, height: sizeData.height,
                    size: randomSize, sprite: spriteKey
                });
                spawned++;
            }
        }
        console.log(`[WorldManager] ${spawned} obstacles spawned (${attempts} attempts)`);
    }

    // Helper: Check if position is within any wormhole's isolation zone
    isInWormholeZone(x, y) {
        for (const wh of this.wormholes) {
            const dist = Math.hypot(x - wh.x, y - wh.y);
            if (dist < WORMHOLE_ISOLATION_RADIUS) {
                return true;
            }
        }
        return false;
    }

    initNebulas() {
        let spawned = 0;
        let attempts = 0;
        const maxAttempts = NEBULA_COUNT * 10;

        while (spawned < NEBULA_COUNT && attempts < maxAttempts) {
            attempts++;
            const max = MAP_SIZE / 2 - NEBULA_RADIUS;
            const x = (Math.random() * MAP_SIZE) - max;
            const y = (Math.random() * MAP_SIZE) - max;

            // Check wormhole isolation zone
            if (this.isInWormholeZone(x, y)) {
                continue; // Try again
            }

            this.nebulas.push({
                id: `nebula_${spawned}`,
                x: x,
                y: y,
                radius: NEBULA_RADIUS
            });
            spawned++;
        }
        console.log(`[WorldManager] ${spawned} nebulas spawned (${attempts} attempts)`);
    }

    initWormholes() {
        // Spawn wormholes in pairs (linked to each other)
        const pairCount = Math.floor(WORMHOLE_COUNT / 2);

        for (let i = 0; i < pairCount; i++) {
            const id1 = `wormhole_${i * 2}`;
            const id2 = `wormhole_${i * 2 + 1}`;

            // Use SpawnValidator to find clear positions (away from obstacles)
            const pos1 = this.spawnValidator.findValidPosition(WORMHOLE_RADIUS, 150, 30, WORMHOLE_PULL_RADIUS + 100);

            // Second wormhole - try to place far from first
            let pos2;
            let attempts = 0;
            do {
                pos2 = this.spawnValidator.findValidPosition(WORMHOLE_RADIUS, 150, 30, WORMHOLE_PULL_RADIUS + 100);
                attempts++;
            } while (Math.hypot(pos2.x - pos1.x, pos2.y - pos1.y) < MAP_SIZE * 0.3 && attempts < 50);

            const wormhole1 = {
                id: id1,
                x: pos1.x,
                y: pos1.y,
                radius: WORMHOLE_RADIUS,
                pullRadius: WORMHOLE_PULL_RADIUS,
                targetId: id2,  // Links to wormhole2
                pairIndex: i
            };

            const wormhole2 = {
                id: id2,
                x: pos2.x,
                y: pos2.y,
                radius: WORMHOLE_RADIUS,
                pullRadius: WORMHOLE_PULL_RADIUS,
                targetId: id1,  // Links to wormhole1
                pairIndex: i
            };

            this.wormholes.push(wormhole1, wormhole2);
        }

        console.log(`[WorldManager] Spawned ${this.wormholes.length} wormholes (${pairCount} pairs)`);
    }

    initStations() {
        for (let i = 0; i < STATION_COUNT; i++) {
            const id = `station_${i}`;
            const pos = this.spawnValidator.findStationPosition();
            const station = new Chest(pos.x, pos.y, id, CHEST_TYPES.STATION);
            this.chests.push(station);
        }
    }

    initChests() {
        for (let i = 0; i < CHEST_COUNT; i++) {
            this.chests.push(this._spawnRandomChest(`chest_${i}`));
        }
    }

    // --- SPAWNING LOGIC ---
    _createFoodObject() {
        const pos = this.spawnValidator.findFoodPosition();
        return {
            id: Math.random().toString(36).substr(2, 9),
            x: pos.x,
            y: pos.y,
            type: Math.floor(Math.random() * 3)
        };
    }

    spawnFood() {
        if (this.foods.length < FOOD_COUNT) {
            const food = this._createFoodObject();
            this.foods.push(food);
            this.delta.foodsAdded.push(food);
        }
    }

    removeFood(id) {
        const idx = this.foods.findIndex(f => f.id === id);
        if (idx !== -1) {
            this.foods.splice(idx, 1);
            this.delta.foodsRemoved.push(id);
        }
    }

    _spawnRandomChest(id, type = CHEST_TYPES.NORMAL) {
        const pos = this.spawnValidator.findChestPosition();
        return new Chest(pos.x, pos.y, id, type);
    }

    spawnNormalChestIfNeeded() {
        const currentNormalChests = this.chests.filter(c => c.type === CHEST_TYPES.NORMAL).length;
        if (currentNormalChests < CHEST_COUNT) {
            const newChest = this._spawnRandomChest(Math.random().toString(36).substr(2, 9), CHEST_TYPES.NORMAL);
            this.chests.push(newChest);
            this.delta.chestsAdded.push(newChest);
        }
    }

    spawnStationIfNeeded() {
        const currentStations = this.chests.filter(c => c.type === CHEST_TYPES.STATION).length;
        if (currentStations < STATION_COUNT) {
            const id = `station_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            const pos = this.spawnValidator.findStationPosition();
            const newStation = new Chest(pos.x, pos.y, id, CHEST_TYPES.STATION);
            this.chests.push(newStation);
            this.delta.chestsAdded.push(newStation);
        }
    }

    spawnItem(x, y, sourceType = 'CHEST') {
        let itemsToSpawn = [];
        let spawnRadius = 20;

        if (sourceType === CHEST_TYPES.STATION || sourceType === 'STATION') {
            const dropCount = Math.random() < 0.5 ? 1 : 2;
            for (let i = 0; i < dropCount; i++) {
                itemsToSpawn.push(this.rollStationDrop());
            }
            spawnRadius = 50;
        } else if (sourceType === 'ENEMY') {
            const dropCount = Math.random() < 0.5 ? 2 : 3;
            for (let i = 0; i < dropCount; i++) {
                itemsToSpawn.push(this.rollAnyItem());
            }
            spawnRadius = 40;
        } else {
            itemsToSpawn.push(this.rollChestDrop());
            spawnRadius = 0;
        }

        const startAngle = Math.random() * Math.PI * 2;
        const angleStep = (Math.PI * 2) / (itemsToSpawn.length || 1);

        itemsToSpawn.forEach((itemType, index) => {
            let itemX = x;
            let itemY = y;

            if (itemsToSpawn.length > 1) {
                const angle = startAngle + (index * angleStep);
                const currentRadius = spawnRadius * (0.8 + Math.random() * 0.4);
                itemX = x + Math.cos(angle) * currentRadius;
                itemY = y + Math.sin(angle) * currentRadius;
            }

            const uniqueId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
            const item = new Item(itemX, itemY, itemType);
            item.id = uniqueId;

            this.items.push(item);
            this.delta.itemsAdded.push(item);
        });
    }

    // --- DROP TABLES ---
    rollCoinOnly() {
        const pool = [
            ITEM_TYPES.COIN_BRONZE,
            ITEM_TYPES.COIN_SILVER,
            ITEM_TYPES.COIN_GOLD
        ];
        return this.weightedRandom(pool);
    }

    rollAnyItem() {
        const allItems = Object.values(ITEM_TYPES);
        return this.weightedRandom(allItems);
    }

    rollStationDrop() {
        const itemsAndWeapons = [
            ITEM_TYPES.HEALTH_PACK,
            ITEM_TYPES.SPEED_BOOST,
            ITEM_TYPES.WEAPON_BLUE,
            ITEM_TYPES.WEAPON_GREEN,
            ITEM_TYPES.WEAPON_RED,
            ITEM_TYPES.BOMB,
            ITEM_TYPES.SHIELD,
            ITEM_TYPES.INVISIBLE
        ];
        return itemsAndWeapons[Math.floor(Math.random() * itemsAndWeapons.length)];
    }

    rollChestDrop() {
        if (Math.random() < 0.6) {
            return this.rollCoinOnly();
        }
        const nonCoinItems = [
            ITEM_TYPES.HEALTH_PACK,
            ITEM_TYPES.SPEED_BOOST,
            ITEM_TYPES.WEAPON_BLUE,
            ITEM_TYPES.BOMB,
            ITEM_TYPES.SHIELD
        ];
        return nonCoinItems[Math.floor(Math.random() * nonCoinItems.length)];
    }

    rollCommonDrop() {
        return this.rollChestDrop();
    }

    weightedRandom(itemTypes) {
        const weights = itemTypes.map(type => {
            return ITEM_CONFIG[type]?.dropChance || 10;
        });

        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        let random = Math.random() * totalWeight;

        for (let i = 0; i < itemTypes.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return itemTypes[i];
            }
        }
        return itemTypes[0];
    }

    update(dt) {
        for (let i = this.items.length - 1; i >= 0; i--) {
            if (this.items[i].shouldDespawn()) {
                this.delta.itemsRemoved.push(this.items[i].id);
                this.items.splice(i, 1);
            }
        }
    }
}
