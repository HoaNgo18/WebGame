
import { PacketType } from 'shared/packetTypes';
import { AuthService } from '../../services/AuthService.js';
import { SkinService } from '../../services/SkinService.js';
import { setUserOnline } from '../Server.js';
import { notifyFriendStatus } from '../../api/friends.js';


export class MessageHandler {
    constructor(server) {
        this.server = server;
    }


    async handle(clientId, packet) {
        const client = this.server.clients.get(clientId);
        if (!client) return;

        if (client.arenaRoomId) {
            const room = this.server.arena.getRoom(client.arenaRoomId);
            if (room) {
                await this.handleArenaMessage(clientId, packet, room);
                return;
            }
        }

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

            case PacketType.INVITE_RESPONSE:
                await this.handleInviteResponse(clientId, packet);
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


    async handleJoin(clientId, packet) {
        const client = this.server.clients.get(clientId);
        const playerInfo = await AuthService.getPlayerInfo(packet.token, packet);

        if (playerInfo.userId) {
            client.userId = playerInfo.userId;
            setUserOnline(playerInfo.userId, clientId);
            notifyFriendStatus(this.server, playerInfo.userId, true);
        }

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


    async handleArenaJoin(clientId, packet) {
        const client = this.server.clients.get(clientId);
        if (!client) return;

        const playerInfo = await AuthService.getPlayerInfo(packet.token, packet);

        if (playerInfo.userId) {
            client.userId = playerInfo.userId;
            setUserOnline(playerInfo.userId, clientId);
            notifyFriendStatus(this.server, playerInfo.userId, true);
        }

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


    async handleEquipSkin(clientId, skinId) {
        const client = this.server.clients.get(clientId);
        if (!client) return;

        if (client.userId) {
            const result = await SkinService.equipSkin(client.userId, skinId);

            if (result.success) {
                this.server.sendToClient(clientId, {
                    type: 'USER_DATA_UPDATE',
                    equippedSkin: result.equippedSkin
                });

                if (client.player) {
                    client.player.skinId = skinId;
                }
            }
        } else {
            this.server.sendToClient(clientId, {
                type: 'USER_DATA_UPDATE',
                equippedSkin: skinId
            });

            if (client.player) {
                client.player.skinId = skinId;
            }
        }
    }


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


    async handleFriendInvite(clientId, packet) {
        const client = this.server.clients.get(clientId);
        const { friendId, mode } = packet;

        let inviterName = 'Friend';
        if (client.player && client.player.name) {
            inviterName = client.player.name;
        } else if (client.userId) {
            const profile = await SkinService.getUserProfile(client.userId);
            if (profile) {
                inviterName = profile.displayName || profile.username || 'Friend';
            }
        }

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
                inviterName: inviterName,
                inviterId: client.userId?.toString(),
                mode: mode || '1v1',
                roomId: null
            });
        }
    }

    async handleInviteResponse(clientId, packet) {
        const { accepted, inviterId, mode } = packet;

        let inviterClient = null;
        for (const [cid, c] of this.server.clients) {
            if (c.userId && c.userId.toString() === inviterId) {
                inviterClient = c;
                break;
            }
        }

        if (!inviterClient) {
            this.server.sendToClient(clientId, {
                type: PacketType.INVITE_FAILED,
                reason: 'Inviter is offline'
            });
            return;
        }

        if (accepted) {
            const room = this.server.arena.create1v1Room();
            const roomId = room.id;

            this.server.sendToClient(inviterClient.id, {
                type: PacketType.INVITE_ACCEPTED,
                mode: mode,
                roomId: roomId
            });

            this.server.sendToClient(clientId, {
                type: PacketType.INVITE_ACCEPTED,
                mode: mode,
                roomId: roomId
            });
        } else {
            this.server.sendToClient(inviterClient.id, {
                type: PacketType.INVITE_DECLINED
            });
        }
    }
}
