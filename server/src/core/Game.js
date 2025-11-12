import { TICK_RATE, MAP_SIZE } from 'shared/constants';
import { PacketType } from 'shared/packetTypes';
import { Player } from '../entities/Player.js';

export class Game {
    constructor(server) {
        this.server = server;
        this.players = new Map();
        this.lastUpdate = Date.now();
        this.tickInterval = null;
    }

    start() {
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
        });

        // Send state to all clients
        this.broadcastState();
    }

    broadcastState() {
        const state = {
            type: PacketType.UPDATE,
            players: Array.from(this.players.values()).map(p => p.toJSON()),
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

    getPlayer(id) {
        return this.players.get(id);
    }

    getPlayersData() {
        return Array.from(this.players.values()).map(p => p.toJSON());
    }
}
