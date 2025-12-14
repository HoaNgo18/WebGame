import { ArenaRoom } from './ArenaRoom.js';

export class ArenaManager {
    constructor(server) {
        this.server = server;
        this.rooms = new Map();
        this.roomIdCounter = 0;
        this.maxRooms = 10;
    }

    createRoom() {
        if (this.rooms.size >= this.maxRooms) {
            return null;
        }

        const roomId = ++this.roomIdCounter;
        const room = new ArenaRoom(roomId, this.server);
        this.rooms.set(roomId, room);

        console.log(`Arena room ${roomId} created`);
        return room;
    }

    findAvailableRoom() {
        // Find room that's waiting and has space
        for (const [id, room] of this.rooms) {
            if (room.state === 'waiting' && room.players.size < 20) {
                return room;
            }
        }

        // Create new room if none available
        return this.createRoom();
    }

    joinRoom(player, roomId = null) {
        let room;

        if (roomId) {
            room = this.rooms.get(roomId);
            if (!room) return null;
        } else {
            room = this.findAvailableRoom();
        }

        if (!room) return null;

        if (room.addPlayer(player)) {
            player.arenaRoomId = room.id;
            return room;
        }

        return null;
    }

    leaveRoom(player) {
        if (!player.arenaRoomId) return;

        const room = this.rooms.get(player.arenaRoomId);
        if (room) {
            room.removePlayer(player.id);

            // Clean up empty rooms
            if (room.players.size === 0 && room.state === 'waiting') {
                this.rooms.delete(room.id);
                console.log(`Arena room ${room.id} removed (empty)`);
            }
        }

        player.arenaRoomId = null;
    }

    getRoom(roomId) {
        return this.rooms.get(roomId);
    }

    getRoomsList() {
        return Array.from(this.rooms.values()).map(room => ({
            id: room.id,
            state: room.state,
            players: room.players.size,
            maxPlayers: 20
        }));
    }
}
