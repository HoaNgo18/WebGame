import { ARENA_CONFIG, ARENA_STATE, MAP_SIZE } from 'shared/constants';
import { PacketType } from 'shared/packetTypes';
import { ArenaZoneManager } from './ArenaZoneManager.js';
import { ArenaPlayerManager } from './ArenaPlayerManager.js';

export class ArenaRoom {
    constructor(id, server) {
        this.id = id;
        this.server = server;
        this.state = ARENA_STATE.WAITING;
        this.players = new Map();

        this.zoneManager = new ArenaZoneManager(this);
        this.playerManager = new ArenaPlayerManager(this);

        this.startTime = null;
        this.countdownTimer = null;
        this.gameTimer = null;
        this.tickInterval = null;

        this.gameTime = 0;
        this.alivePlayers = 0;
    }

    addPlayer(player) {
        if (this.players.size >= ARENA_CONFIG.MAX_PLAYERS) {
            return false;
        }

        this.players.set(player.id, player);
        this.alivePlayers++;

        // Broadcast player joined
        this.broadcast({
            type: PacketType.PLAYER_JOIN,
            player: player.toJSON(),
            playersCount: this.players.size
        });

        // Check if we can start countdown
        if (this.state === ARENA_STATE.WAITING &&
            this.players.size >= ARENA_CONFIG.MIN_PLAYERS) {
            this.startCountdown();
        }

        return true;
    }

    removePlayer(playerId) {
        const player = this.players.get(playerId);
        if (!player) return;

        if (player.alive) {
            this.alivePlayers--;
        }

        this.players.delete(playerId);

        this.broadcast({
            type: PacketType.PLAYER_LEAVE,
            playerId
        });

        // Check win condition
        if (this.state === ARENA_STATE.PLAYING) {
            this.checkWinCondition();
        }

        // Cancel countdown if not enough players
        if (this.state === ARENA_STATE.COUNTDOWN &&
            this.players.size < ARENA_CONFIG.MIN_PLAYERS) {
            this.cancelCountdown();
        }
    }

    startCountdown() {
        this.state = ARENA_STATE.COUNTDOWN;
        let countdown = ARENA_CONFIG.LOBBY_COUNTDOWN;

        this.broadcast({
            type: PacketType.ARENA_STATE,
            state: this.state,
            countdown
        });

        this.countdownTimer = setInterval(() => {
            countdown--;

            this.broadcast({
                type: PacketType.ARENA_COUNTDOWN,
                countdown
            });

            if (countdown <= 0) {
                clearInterval(this.countdownTimer);
                this.startGame();
            }
        }, 1000);
    }

    cancelCountdown() {
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }
        this.state = ARENA_STATE.WAITING;

        this.broadcast({
            type: PacketType.ARENA_STATE,
            state: this.state
        });
    }

    startGame() {
        this.state = ARENA_STATE.PLAYING;
        this.startTime = Date.now();
        this.gameTime = 0;

        // Spawn all players
        this.playerManager.spawnAllPlayers();

        // Initialize zone
        this.zoneManager.init();

        this.broadcast({
            type: PacketType.ARENA_START,
            players: this.getPlayersData(),
            zone: this.zoneManager.getZoneData()
        });

        // Start game tick
        this.tickInterval = setInterval(() => this.update(), 1000 / 60);

        // Game timer
        this.gameTimer = setInterval(() => {
            this.gameTime++;

            if (this.gameTime >= ARENA_CONFIG.GAME_DURATION) {
                this.endGame();
            }
        }, 1000);
    }

    update() {
        if (this.state !== ARENA_STATE.PLAYING) return;

        const deltaTime = 16; // ~60fps

        // Update zone
        this.zoneManager.update(this.gameTime);

        // Apply zone damage
        this.playerManager.applyZoneDamage(this.zoneManager.getCurrentZone());

        // Check win condition
        this.checkWinCondition();
    }

    checkWinCondition() {
        if (this.alivePlayers <= 1 && this.players.size > 1) {
            this.endGame();
        }
    }

    eliminatePlayer(playerId, killerId) {
        const player = this.players.get(playerId);
        if (!player || !player.alive) return;

        player.alive = false;
        player.placement = this.alivePlayers;
        this.alivePlayers--;

        // Award kill
        if (killerId) {
            const killer = this.players.get(killerId);
            if (killer) {
                killer.kills++;
                killer.xp += ARENA_CONFIG.KILL_REWARD;
            }
        }

        this.broadcast({
            type: PacketType.ARENA_PLAYER_ELIMINATED,
            playerId,
            killerId,
            placement: player.placement,
            remaining: this.alivePlayers
        });

        this.checkWinCondition();
    }

    endGame() {
        this.state = ARENA_STATE.ENDING;

        // Stop timers
        if (this.tickInterval) clearInterval(this.tickInterval);
        if (this.gameTimer) clearInterval(this.gameTimer);

        // Calculate winner
        const winner = Array.from(this.players.values())
            .find(p => p.alive);

        // Award placement rewards
        this.awardPlacementRewards();

        this.broadcast({
            type: PacketType.ARENA_END,
            winnerId: winner?.id,
            winnerName: winner?.name,
            leaderboard: this.getLeaderboard()
        });

        // Reset room after delay
        setTimeout(() => this.reset(), 10000);
    }

    awardPlacementRewards() {
        const sorted = Array.from(this.players.values())
            .sort((a, b) => a.placement - b.placement);

        sorted.forEach((player, index) => {
            if (index < ARENA_CONFIG.PLACEMENT_REWARDS.length) {
                player.xp += ARENA_CONFIG.PLACEMENT_REWARDS[index];
            }
        });
    }

    getLeaderboard() {
        return Array.from(this.players.values())
            .sort((a, b) => {
                if (a.alive !== b.alive) return b.alive - a.alive;
                return a.placement - b.placement;
            })
            .map((p, i) => ({
                rank: i + 1,
                id: p.id,
                name: p.name,
                kills: p.kills || 0,
                alive: p.alive
            }));
    }

    reset() {
        this.state = ARENA_STATE.WAITING;
        this.players.clear();
        this.alivePlayers = 0;
        this.gameTime = 0;
        this.zoneManager.reset();
    }

    broadcast(data) {
        const message = JSON.stringify(data);
        this.players.forEach(player => {
            if (player.ws && player.ws.readyState === 1) {
                player.ws.send(message);
            }
        });
    }

    getPlayersData() {
        return Array.from(this.players.values()).map(p => p.toJSON());
    }
}
