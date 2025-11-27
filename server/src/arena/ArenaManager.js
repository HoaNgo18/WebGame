// server/src/arena/ArenaManager.js
import { ArenaRoom } from './ArenaRoom.js';
import { OneVsOneRoom } from './OneVsOneRoom.js';
import { PacketType } from 'shared/packetTypes';

export class ArenaManager {
    constructor(server) {
        this.server = server;
        this.rooms = new Map(); // roomId -> ArenaRoom
        this.currentWaitingRoom = null;
        this.roomCounter = 0;

        // Create new waiting room every minute
        this.roomCreateInterval = setInterval(() => {
            this.createNewWaitingRoom();
        }, 60000);

        // Create first room immediately
        this.createNewWaitingRoom();
    }

    createNewWaitingRoom() {
        // If current waiting room has players but isn't full, let it continue
        if (this.currentWaitingRoom && this.currentWaitingRoom.status === 'waiting') {
            const playerCount = this.currentWaitingRoom.getRealPlayerCount();
            if (playerCount > 0) {
                // Start the old room 
                this.currentWaitingRoom.startCountdown();
            } else {
                // No players, destroy the empty room
                this.currentWaitingRoom.destroy();
            }
        }

        // Create new room
        this.roomCounter++;
        const roomId = `arena_${this.roomCounter}_${Date.now()}`;
        const room = new ArenaRoom(roomId, this);

        this.rooms.set(roomId, room);
        this.currentWaitingRoom = room;

        // Start room's wait timer
        room.startWaitTimer();

        return room;
    }

    // Find a room for player to join
    getWaitingRoom() {
        if (this.currentWaitingRoom &&
            this.currentWaitingRoom.status === 'waiting' &&
            this.currentWaitingRoom.players.size < this.currentWaitingRoom.maxPlayers) {
            return this.currentWaitingRoom;
        }

        // Create new room if needed
        return this.createNewWaitingRoom();
    }

    // Handle player joining arena queue
    joinArena(clientId, name, userId = null, skinId = 'default') {
        const room = this.getWaitingRoom();

        if (room.addPlayer(clientId, name, userId, skinId)) {
            return room;
        }

        return null;
    }

    // Handle player joining 1v1 queue
    join1v1(clientId, name, userId = null, skinId = 'default', roomId = null) {
        if (roomId) {
            const room = this.rooms.get(roomId);
            if (room && room instanceof OneVsOneRoom && room.status === 'waiting' && room.getRealPlayerCount() < room.maxPlayers) {
                if (room.addPlayer(clientId, name, userId, skinId)) {
                    return room;
                }
            }
            return null;
        }

        const room = this.getWaiting1v1Room();
        if (room.addPlayer(clientId, name, userId, skinId)) {
            return room;
        }
        return null;
    }

    getWaiting1v1Room() {
        // Find existing 1v1 room that is waiting and not full
        for (const room of this.rooms.values()) {
            if (room instanceof OneVsOneRoom &&
                room.status === 'waiting' &&
                room.getRealPlayerCount() < room.maxPlayers) {
                return room;
            }
        }

        // Create new 1v1 room
        return this.create1v1Room();
    }

    create1v1Room() {
        this.roomCounter++;
        const roomId = `1v1_${this.roomCounter}_${Date.now()}`;
        const room = new OneVsOneRoom(roomId, this);

        this.rooms.set(roomId, room);

        // Start waiting
        room.startWaitTimer();

        return room;
    }

    // Handle player leaving arena
    leaveArena(clientId) {
        const client = this.server.clients.get(clientId);
        if (!client || !client.arenaRoomId) return;

        const room = this.rooms.get(client.arenaRoomId);
        if (room) {
            room.removePlayer(clientId);
        }
    }

    // Get room by ID
    getRoom(roomId) {
        return this.rooms.get(roomId);
    }

    // Get room by client
    getRoomByClient(clientId) {
        const client = this.server.clients.get(clientId);
        if (!client || !client.arenaRoomId) return null;
        return this.rooms.get(client.arenaRoomId);
    }

    // Remove room
    removeRoom(roomId) {
        const room = this.rooms.get(roomId);
        if (room === this.currentWaitingRoom) {
            this.currentWaitingRoom = null;
        }
        this.rooms.delete(roomId);
    }

    // Get status of all rooms
    getStatus() {
        return {
            totalRooms: this.rooms.size,
            waitingRoom: this.currentWaitingRoom ? {
                id: this.currentWaitingRoom.id,
                playerCount: this.currentWaitingRoom.getRealPlayerCount(),
                maxPlayers: this.currentWaitingRoom.maxPlayers,
                status: this.currentWaitingRoom.status
            } : null,
            rooms: Array.from(this.rooms.values()).map(r => ({
                id: r.id,
                status: r.status,
                playerCount: r.getRealPlayerCount(),
                totalPlayers: r.players.size
            }))
        };
    }

    destroy() {
        clearInterval(this.roomCreateInterval);
        this.rooms.forEach(room => room.destroy());
        this.rooms.clear();
    }
}
