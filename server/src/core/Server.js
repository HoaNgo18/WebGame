import { WebSocketServer } from 'ws';
import { PacketType } from 'shared/packetTypes';
import { Game } from './Game.js';
import { rateLimit } from '../utils/rateLimit.js';
import { ArenaManager } from '../arena/ArenaManager.js';
import { MessageHandler } from './handlers/MessageHandler.js';
import { notifyFriendStatus } from '../api/friends.js';

const onlineUsers = new Map();

let serverInstance = null;

export const setServerInstance = (server) => {
    serverInstance = server;
};

export const isUserOnline = (userId) => {
    if (!userId) return false;
    return onlineUsers.has(userId.toString());
};

export const setUserOnline = (userId, clientId) => {
    if (userId) onlineUsers.set(userId.toString(), clientId);
};

export const setUserOffline = (userId) => {
    if (userId) onlineUsers.delete(userId.toString());
};

export const sendToUserById = (userId, packet) => {
    if (!serverInstance || !userId) return false;

    const clientId = onlineUsers.get(userId.toString());
    if (clientId) {
        serverInstance.sendToClient(clientId, packet);
        return true;
    }
    return false;
};


export class Server {
    constructor(serverOrPort = 3000) {
        if (typeof serverOrPort === 'number') {
            this.wss = new WebSocketServer({ port: serverOrPort });
        } else {
            this.wss = new WebSocketServer({ server: serverOrPort });
        }

        this.game = new Game(this);
        this.clients = new Map();
        this.arena = new ArenaManager(this);
        this.messageHandler = new MessageHandler(this);

        setServerInstance(this);

        this.setupWSS();
    }


    setupWSS() {
        const limiter = rateLimit('10s', 100, (ws) => {
            ws.close(1008, 'Rate limit exceeded');
        });

        this.wss.on('connection', (ws) => {
            limiter(ws);
            const clientId = this.generateId();

            this.clients.set(clientId, { ws, id: clientId, player: null });

            ws.on('message', async (data) => {
                try {
                    const packet = JSON.parse(data.toString());
                    await this.messageHandler.handle(clientId, packet);
                } catch (err) {
                    console.error('Invalid packet:', err);
                }
            });

            ws.on('close', () => this.handleDisconnect(clientId));
            ws.on('error', (err) => {
                console.error('WebSocket error:', err);
                this.handleDisconnect(clientId);
            });
        });
    }


    handleDisconnect(clientId) {
        const client = this.clients.get(clientId);
        if (!client) return;

        if (client.userId) {
            setUserOffline(client.userId);
            notifyFriendStatus(this, client.userId, false);
        }

        if (client.arenaRoomId) {
            this.arena.leaveArena(clientId);
        } else {
            this.game.removePlayer(clientId);
        }

        this.clients.delete(clientId);
        this.broadcast({ type: PacketType.PLAYER_LEAVE, id: clientId });
    }


    sendToClient(clientId, data) {
        const client = this.clients.get(clientId);
        if (client?.ws.readyState === 1) {
            client.ws.send(JSON.stringify(data));
        }
    }


    broadcast(data, excludeId = null) {
        const message = JSON.stringify(data);
        this.clients.forEach((client, id) => {
            if (id !== excludeId && client.ws.readyState === 1) {
                client.ws.send(message);
            }
        });
    }


    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }


    start() {
        this.game.start();
    }
}
