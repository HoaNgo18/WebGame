// server/src/core/handlers/MessageHandler.js
import { PacketType } from 'shared/packetTypes';
import { AuthService } from '../../services/AuthService.js';
import { SkinService } from '../../services/SkinService.js';

/**
 * Handler xử lý tất cả message types từ WebSocket
 */
export class MessageHandler {
    constructor(server) {
        this.server = server;
    }

    /**
     * Xử lý message chính - dispatch đến handler tương ứng
     */
    async handle(clientId, packet) {
        const client = this.server.clients.get(clientId);
        if (!client) return;

        // Check if client is in arena room
        if (client.arenaRoomId) {
            const room = this.server.arena.getRoom(client.arenaRoomId);
            if (room) {
                await this.handleArenaMessage(clientId, packet, room);
                return;
            }
        }

        // Main game message handling
        switch (packet.type) {
            case PacketType.JOIN:
                await this.handleJoin(clientId, packet);
                break;

            case PacketType.ARENA_JOIN:
                await this.handleArenaJoin(clientId, packet);
                break;

            case PacketType.ARENA_LEAVE:
                this.server.arena.leaveArena(clientId);
                break;

            case PacketType.FRIEND_INVITE:
                await this.handleFriendInvite(clientId, packet);
                break;

            case PacketType.INPUT:
                this.server.game.handleInput(clientId, packet.data);
                break;

            case PacketType.ATTACK:
                this.server.game.handleAttack(clientId);
                break;

            case PacketType.PONG:
                if (client?.player) {
                    client.player.lastPong = Date.now();
                }
                break;

            case PacketType.RESPAWN:
                const skinIdToUse = packet.skinId || client.player?.skinId;
                this.server.game.respawnPlayer(clientId, skinIdToUse);
                break;

            case PacketType.BUY_SKIN:
                await this.handleBuySkin(clientId, packet.skinId);
                break;

            case PacketType.EQUIP_SKIN:
                await this.handleEquipSkin(clientId, packet.skinId);
                break;

            case PacketType.DASH:
                const player = this.server.game.players.get(clientId);
                if (player && typeof player.performDash === 'function') {
                    player.performDash();
                }
                break;

            case PacketType.SELECT_SLOT:
                if (typeof packet.slotIndex === 'number') {
                    this.server.game.handleSelectSlot(clientId, packet.slotIndex);
                }
                break;

            case PacketType.USE_ITEM:
                this.server.game.handleUseItem(clientId);
                break;

            case PacketType.REQUEST_USER_DATA:
                await this.handleRequestUserData(clientId);
                break;
        }
    }

    /**
     * Handle JOIN packet - authenticate and add player to game
     */
    async handleJoin(clientId, packet) {
        const client = this.server.clients.get(clientId);
        const playerInfo = await AuthService.getPlayerInfo(packet.token, packet);

        if (playerInfo.userId) {
            client.userId = playerInfo.userId;
        }

        // Send user data if authenticated
        if (playerInfo.user) {
            this.server.sendToClient(clientId,
                AuthService.createUserDataPacket(playerInfo.user)
            );
        }

        this.server.game.addPlayer(
            clientId,
            playerInfo.name,
            playerInfo.userId,
            playerInfo.skinId
        );
    }

    /**
     * Handle ARENA_JOIN packet
     */
    async handleArenaJoin(clientId, packet) {
        const client = this.server.clients.get(clientId);
        if (!client) return;

        const playerInfo = await AuthService.getPlayerInfo(packet.token, packet);

        if (playerInfo.userId) {
            client.userId = playerInfo.userId;
        }

        // Send user data if authenticated
        if (playerInfo.user) {
            this.server.sendToClient(clientId,
                AuthService.createUserDataPacket(playerInfo.user)
            );
        }

        const mode = packet.mode || 'arena';
        const roomId = packet.roomId || null;
        let room;

        if (mode === '1v1') {
            room = this.server.arena.join1v1(
                clientId,
                playerInfo.name,
                playerInfo.userId,
                playerInfo.skinId,
                roomId
            );
        } else {
            room = this.server.arena.joinArena(
                clientId,
                playerInfo.name,
                playerInfo.userId,
                playerInfo.skinId
            );
        }

        if (!room) {
            this.server.sendToClient(clientId, {
                type: PacketType.ARENA_STATUS,
                error: 'Failed to join arena'
            });
        }
    }

    /**
     * Handle arena-specific messages
     */
    async handleArenaMessage(clientId, packet, room) {
        const client = this.server.clients.get(clientId);

        switch (packet.type) {
            case PacketType.INPUT:
                room.handleInput(clientId, packet.data);
                break;

            case PacketType.ATTACK:
                room.handleAttack(clientId);
                break;

            case PacketType.DASH:
                room.handleDash(clientId);
                break;

            case PacketType.SELECT_SLOT:
                if (typeof packet.slotIndex === 'number') {
                    room.handleSelectSlot(clientId, packet.slotIndex);
                }
                break;

            case PacketType.USE_ITEM:
                room.handleUseItem(clientId);
                break;

            case PacketType.ARENA_LEAVE:
                this.server.arena.leaveArena(clientId);
                break;

            case PacketType.PONG:
                if (client?.player) {
                    client.player.lastPong = Date.now();
                }
                break;
        }
    }

    /**
     * Handle BUY_SKIN packet
     */
    async handleBuySkin(clientId, skinId) {
        const client = this.server.clients.get(clientId);
        if (!client?.userId) return;

        const result = await SkinService.buySkin(client.userId, skinId);

        if (result.success) {
            this.server.sendToClient(clientId, {
                type: 'USER_DATA_UPDATE',
                coins: result.coins,
                skins: result.skins
            });
        }
    }

    /**
     * Handle EQUIP_SKIN packet
     */
    async handleEquipSkin(clientId, skinId) {
        const client = this.server.clients.get(clientId);
        if (!client) return;

        // For registered users with userId - save to database
        if (client.userId) {
            const result = await SkinService.equipSkin(client.userId, skinId);

            if (result.success) {
                this.server.sendToClient(clientId, {
                    type: 'USER_DATA_UPDATE',
                    equippedSkin: result.equippedSkin
                });

                // Update player skin in game
                if (client.player) {
                    client.player.skinId = skinId;
                }
            }
        } else {
            // For guest users - just update locally (no database)
            this.server.sendToClient(clientId, {
                type: 'USER_DATA_UPDATE',
                equippedSkin: skinId
            });

            // Update player skin in game  
            if (client.player) {
                client.player.skinId = skinId;
            }
        }
    }

    /**
     * Handle REQUEST_USER_DATA packet
     */
    async handleRequestUserData(clientId) {
        const client = this.server.clients.get(clientId);
        if (!client?.userId) return;

        const profile = await SkinService.getUserProfile(client.userId);

        if (profile) {
            this.server.sendToClient(clientId, {
                type: 'USER_DATA_UPDATE',
                ...profile
            });
        }
    }

    /**
     * Handle FRIEND_INVITE
     */
    async handleFriendInvite(clientId, packet) {
        const client = this.server.clients.get(clientId);
        const { friendId, mode } = packet;

        // Check if inviter is in a room
        if (!client.arenaRoomId) {
            return;
        }

        const room = this.server.arena.getRoom(client.arenaRoomId);
        if (!room) return;

        // Find friend's client
        let friendClient = null;
        for (const [cid, c] of this.server.clients) {
            if (c.userId && c.userId.toString() === friendId) {
                friendClient = c;
                break;
            }
        }

        if (friendClient) {
            this.server.sendToClient(friendClient.id, {
                type: PacketType.GAME_INVITE,
                inviterName: client.player ? client.player.name : 'A friend',
                mode: mode || '1v1',
                roomId: room.id
            });
        }
    }
}
