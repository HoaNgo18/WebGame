import { WebSocketServer } from 'ws';
import { PacketType } from 'shared/packetTypes';
import { Game } from './Game.js';

export class Server {
    constructor(port = 3000) {
        this.port = port;
        this.wss = null;
        this.game = new Game(this);
        this.playerIdCounter = 0;
    }

    start() {
        this.wss = new WebSocketServer({ port: this.port });

        this.wss.on('connection', (ws) => {
            this.handleConnection(ws);
        });

        // Start game loop
        this.game.start();

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
                    this.game.handleInput(playerId, packet.input);
                    break;
            }
        } catch (err) {
            console.error('Error parsing message:', err);
        }
    }

    handleJoin(ws, playerId, packet) {
        const player = this.game.addPlayer(playerId, packet.name || `Player${playerId}`, ws);

        // Send init to new player
        this.send(ws, {
            type: PacketType.INIT,
            playerId,
            players: this.game.getPlayersData()
        });

        // Broadcast new player to others
        this.broadcast({
            type: PacketType.PLAYER_JOIN,
            player: player.toJSON()
        }, playerId);
    }

    handleDisconnect(playerId) {
        console.log(`Player ${playerId} disconnected`);
        this.game.removePlayer(playerId);

        this.broadcast({
            type: PacketType.PLAYER_LEAVE,
            playerId
        });
    }

    send(ws, data) {
        if (ws.readyState === 1) {
            ws.send(JSON.stringify(data));
        }
    }

    broadcast(data, excludeId = null) {
        const message = JSON.stringify(data);
        this.game.players.forEach((player) => {
            if (player.id !== excludeId && player.ws && player.ws.readyState === 1) {
                player.ws.send(message);
            }
        });
    }
}
