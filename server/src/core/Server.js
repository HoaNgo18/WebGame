import { WebSocketServer } from 'ws';
import { PacketType } from 'shared/packetTypes';

export class Server {
    constructor(port = 3000) {
        this.port = port;
        this.wss = null;
        this.players = new Map();
        this.playerIdCounter = 0;
    }

    start() {
        this.wss = new WebSocketServer({ port: this.port });

        this.wss.on('connection', (ws) => {
            this.handleConnection(ws);
        });

        console.log(`WebSocket server running on port ${this.port}`);
    }

    handleConnection(ws) {
        const playerId = ++this.playerIdCounter;
        ws.playerId = playerId;

        console.log(`Player ${playerId} connected`);

        ws.on('message', (data) => {
            this.handleMessage(ws, playerId, data);
        });

        ws.on('close', () => {
            this.handleDisconnect(playerId);
        });
    }

    handleMessage(ws, playerId, data) {
        try {
            const packet = JSON.parse(data);

            switch (packet.type) {
                case PacketType.JOIN:
                    this.handleJoin(ws, playerId, packet);
                    break;

                case PacketType.INPUT:
                    this.handleInput(playerId, packet);
                    break;
            }
        } catch (err) {
            console.error('Error parsing message:', err);
        }
    }

    handleJoin(ws, playerId, packet) {
        const player = {
            id: playerId,
            name: packet.name || `Player${playerId}`,
            x: Math.random() * 1000,
            y: Math.random() * 1000,
            rotation: 0,
            ws
        };

        this.players.set(playerId, player);

        // Send init to new player
        this.send(ws, {
            type: PacketType.INIT,
            playerId,
            players: this.getPlayersData()
        });

        // Broadcast new player to others
        this.broadcast({
            type: PacketType.PLAYER_JOIN,
            player: this.getPlayerData(player)
        }, playerId);
    }

    handleInput(playerId, packet) {
        const player = this.players.get(playerId);
        if (!player) return;

        // TODO: Process input in Phase 4
        player.input = packet.input;
    }

    handleDisconnect(playerId) {
        console.log(`Player ${playerId} disconnected`);
        this.players.delete(playerId);

        this.broadcast({
            type: PacketType.PLAYER_LEAVE,
            playerId
        });
    }

    getPlayerData(player) {
        return {
            id: player.id,
            name: player.name,
            x: player.x,
            y: player.y,
            rotation: player.rotation
        };
    }

    getPlayersData() {
        return Array.from(this.players.values()).map(p => this.getPlayerData(p));
    }

    send(ws, data) {
        if (ws.readyState === 1) {
            ws.send(JSON.stringify(data));
        }
    }

    broadcast(data, excludeId = null) {
        const message = JSON.stringify(data);
        this.players.forEach((player) => {
            if (player.id !== excludeId && player.ws.readyState === 1) {
                player.ws.send(message);
            }
        });
    }
}
