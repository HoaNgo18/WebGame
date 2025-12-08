import { PacketType } from 'shared/packetTypes';

class SocketManager {
    constructor() {
        this.socket = null;
        this.playerId = null;
        this.callbacks = new Map();
    }

    connect(url = 'ws://localhost:3000') {
        return new Promise((resolve, reject) => {
            this.socket = new WebSocket(url);

            this.socket.onopen = () => {
                console.log('Connected to server');
                resolve();
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                reject(error);
            };

            this.socket.onmessage = (event) => {
                try {
                    const packet = JSON.parse(event.data);
                    this.handlePacket(packet);
                } catch (err) {
                    console.error('Error parsing message:', err);
                }
            };

            this.socket.onclose = () => {
                console.log('Disconnected from server');
                this.emit('disconnect');
            };
        });
    }

    handlePacket(packet) {
        switch (packet.type) {
            case PacketType.INIT:
                this.playerId = packet.playerId;
                this.emit('init', packet);
                break;

            case PacketType.UPDATE:
                this.emit('update', packet);
                break;

            case PacketType.PLAYER_JOIN:
                this.emit('playerJoin', packet.player);
                break;

            case PacketType.PLAYER_LEAVE:
                this.emit('playerLeave', packet.playerId);
                break;

            case PacketType.PLAYER_DIED:
                this.emit('playerDied', packet);
                break;

            default:
                console.log('Unknown packet type:', packet.type);
        }
    }

    send(type, data = {}) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type, ...data }));
        }
    }

    join(name) {
        this.send(PacketType.JOIN, { name });
    }

    sendInput(input) {
        this.send(PacketType.INPUT, { input });
    }

    attack() {
        this.send(PacketType.ATTACK);
    }

    selectSlot(slot) {
        this.send(PacketType.SELECT_SLOT, { slot });
    }

    useItem() {
        this.send(PacketType.USE_ITEM);
    }

    on(event, callback) {
        if (!this.callbacks.has(event)) {
            this.callbacks.set(event, []);
        }
        this.callbacks.get(event).push(callback);
    }

    emit(event, data) {
        const callbacks = this.callbacks.get(event);
        if (callbacks) {
            callbacks.forEach(cb => cb(data));
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }
}

export const socketManager = new SocketManager();
