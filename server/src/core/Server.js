import { WebSocketServer } from 'ws';
import { PacketType } from 'shared/packetTypes';
import { Game } from './Game.js';
import { rateLimit } from '../utils/rateLimit.js';
import { ArenaManager } from '../arena/ArenaManager.js';
import { MessageHandler } from './handlers/MessageHandler.js';
import { notifyFriendStatus } from '../api/friends.js';

// Track online users by userId for friends online status
const onlineUsers = new Map(); // userId -> clientId

// Global server instance for API access
let serverInstance = null;

export const setServerInstance = (server) => {
    serverInstance = server;
};

// Export function to check if a user is online
export const isUserOnline = (userId) => {
    if (!userId) return false;
    return onlineUsers.has(userId.toString());
};

// Export function to add/remove users (called from MessageHandler)
export const setUserOnline = (userId, clientId) => {
    if (userId) onlineUsers.set(userId.toString(), clientId);
};

export const setUserOffline = (userId) => {
    if (userId) onlineUsers.delete(userId.toString());
};

// Export function to send message to user by userId (for API controllers)
export const sendToUserById = (userId, packet) => {
    if (!serverInstance || !userId) return false;

    const clientId = onlineUsers.get(userId.toString());
    if (clientId) {
        serverInstance.sendToClient(clientId, packet);
        return true;
    }
    return false;
};

/**
 * WebSocket Server - Manages connections and lifecycle
 * Message handling is delegated to MessageHandler
 */
export class Server {
    constructor(port = 3000) {
        this.wss = new WebSocketServer({ port });
        this.game = new Game(this);
        this.clients = new Map();
        this.arena = new ArenaManager(this);
        this.messageHandler = new MessageHandler(this);

        // Set global instance for API access
        setServerInstance(this);

        console.log(`WebSocket server running on port ${port}`);
        this.setupWSS();
    }

    /**
     * Setup WebSocket connection handlers
     */
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

    /**
     * Handle client disconnection
     */
    handleDisconnect(clientId) {
        const client = this.clients.get(clientId);
        if (!client) return;

        // Remove user from online tracking
        if (client.userId) {
            setUserOffline(client.userId);
            notifyFriendStatus(this, client.userId, false);
        }

        // Remove from arena if in arena
        if (client.arenaRoomId) {
            this.arena.leaveArena(clientId);
        } else {
            this.game.removePlayer(clientId);
        }

        this.clients.delete(clientId);
        this.broadcast({ type: PacketType.PLAYER_LEAVE, id: clientId });
    }

    /**
     * Send data to a specific client
     */
    sendToClient(clientId, data) {
        const client = this.clients.get(clientId);
        if (client?.ws.readyState === 1) {
            client.ws.send(JSON.stringify(data));
        }
    }

    /**
     * Broadcast data to all clients (optionally excluding one)
     */
    broadcast(data, excludeId = null) {
        const message = JSON.stringify(data);
        this.clients.forEach((client, id) => {
            if (id !== excludeId && client.ws.readyState === 1) {
                client.ws.send(message);
            }
        });
    }

    /**
     * Generate unique client ID
     */
    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    /**
     * Start game loop
     */
    start() {
        this.game.start();
    }
}
