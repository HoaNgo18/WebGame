import { TICK_RATE, MAP_SIZE, WEAPON_STATS, SHIP_RADIUS } from 'shared/constants';
import { PacketType } from 'shared/packetTypes';
import { Player } from '../entities/Player.js';
import { Projectile } from '../entities/Projectile.js';
import { CollisionResolver } from './physics/CollisionResolver.js';
import { FoodManager } from './managers/FoodManager.js';
import { ObstacleManager } from './managers/ObstacleManager.js';
import { ChestManager } from './managers/ChestManager.js';

export class Game {
    constructor(server) {
        this.server = server;
        this.players = new Map();
        this.projectiles = new Map();
        this.projectileIdCounter = 0;
        this.lastUpdate = Date.now();
        this.tickInterval = null;

        // Managers
        this.foodManager = new FoodManager(this);
        this.obstacleManager = new ObstacleManager(this);
        this.chestManager = new ChestManager(this);
        this.collisionResolver = new CollisionResolver(this);
    }

    start() {
        // Initialize managers
        this.foodManager.init();
        this.obstacleManager.init();
        this.chestManager.init();

        const tickTime = 1000 / TICK_RATE;
        this.tickInterval = setInterval(() => this.update(), tickTime);
        console.log(`Game loop started at ${TICK_RATE} ticks/second`);
    }

    stop() {
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
            this.tickInterval = null;
        }
    }

    update() {
        const now = Date.now();
        const deltaTime = now - this.lastUpdate;
        this.lastUpdate = now;

        // Update all players
        this.players.forEach(player => {
            player.update(deltaTime);

            // Check food collision
            this.foodManager.checkCollision(player);

            // Check item collision
            this.chestManager.checkItemCollision(player);
        });

        // Update all projectiles
        this.projectiles.forEach((projectile, id) => {
            projectile.update(deltaTime);
            if (!projectile.active) {
                this.projectiles.delete(id);
            }
        });

        // Update managers
        this.chestManager.update(deltaTime);

        // Check collisions
        this.collisionResolver.update();

        // Send state to all clients
        this.broadcastState();
    }

    broadcastState() {
        const state = {
            type: PacketType.UPDATE,
            players: Array.from(this.players.values()).map(p => p.toJSON()),
            projectiles: Array.from(this.projectiles.values()).map(p => p.toJSON()),
            foods: this.foodManager.getFoodsData(),
            obstacles: this.obstacleManager.getObstaclesData(),
            nebulas: this.obstacleManager.getNebulasData(),
            chests: this.chestManager.getChestsData(),
            items: this.chestManager.getItemsData(),
            timestamp: Date.now()
        };

        this.server.broadcast(state);
    }

    addPlayer(id, name, ws) {
        const x = Math.random() * (MAP_SIZE - 200) + 100;
        const y = Math.random() * (MAP_SIZE - 200) + 100;

        const player = new Player(id, name, x, y);
        player.ws = ws;

        this.players.set(id, player);
        return player;
    }

    removePlayer(id) {
        this.players.delete(id);
    }

    handleInput(playerId, input) {
        const player = this.players.get(playerId);
        if (player) {
            player.setInput(input);
        }
    }

    handleAttack(playerId) {
        const player = this.players.get(playerId);
        if (!player) return;

        // Use current weapon
        const weaponType = player.currentWeapon || 'BLUE';
        const weaponStats = WEAPON_STATS[weaponType];

        // Check cooldown
        const now = Date.now();
        if (player.lastAttack && now - player.lastAttack < weaponStats.cooldown) {
            return;
        }

        player.lastAttack = now;

        // Create projectile at ship nose
        const projectileId = ++this.projectileIdCounter;
        const spawnX = player.x + Math.cos(player.rotation) * SHIP_RADIUS;
        const spawnY = player.y + Math.sin(player.rotation) * SHIP_RADIUS;

        const projectile = new Projectile(
            projectileId,
            playerId,
            spawnX,
            spawnY,
            player.rotation,
            weaponType
        );

        this.projectiles.set(projectileId, projectile);
    }

    handleSelectSlot(playerId, slot) {
        const player = this.players.get(playerId);
        if (player) {
            player.selectSlot(slot);
        }
    }

    handleUseItem(playerId) {
        const player = this.players.get(playerId);
        if (!player) return;

        const effect = player.useItem();
        if (effect && effect.type === 'plant_bomb') {
            // TODO: Implement bomb planting in future
        }
    }

    handlePlayerDeath(playerId, killerId) {
        const player = this.players.get(playerId);
        if (!player) return;

        const killer = this.players.get(killerId);
        if (killer) {
            killer.kills++;
        }

        // Broadcast death
        this.server.broadcast({
            type: PacketType.PLAYER_DIED,
            playerId,
            killerId
        });

        // Respawn player
        player.lives = 5;
        player.x = Math.random() * (MAP_SIZE - 200) + 100;
        player.y = Math.random() * (MAP_SIZE - 200) + 100;
        player.vx = 0;
        player.vy = 0;
        player.inventory = [null, null, null, null];
        player.currentWeapon = 'BLUE';
    }

    getPlayer(id) {
        return this.players.get(id);
    }

    getPlayersData() {
        return Array.from(this.players.values()).map(p => p.toJSON());
    }
}
