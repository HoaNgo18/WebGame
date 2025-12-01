import Phaser from 'phaser';
import { MAP_SIZE, PROJECTILE_RADIUS } from 'shared/constants';
import { PacketType } from 'shared/packetTypes';
import { socketManager } from '../../network/SocketManager';
import { InputManager } from '../InputManager';
import { ClientPlayer } from '../entities/ClientPlayer';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.players = new Map();
        this.projectiles = new Map();
        this.localPlayerId = null;
        this.inputManager = null;
        this.connected = false;
    }

    create() {
        // Set world bounds
        this.physics.world.setBounds(0, 0, MAP_SIZE, MAP_SIZE);

        // Camera setup
        this.cameras.main.setBounds(0, 0, MAP_SIZE, MAP_SIZE);
        this.cameras.main.setBackgroundColor('#0a0a1a');

        // Draw grid background
        this.drawGrid();

        // Setup input
        this.inputManager = new InputManager(this);
        this.inputManager.setup();

        // Setup mouse click for shooting
        this.input.on('pointerdown', () => {
            if (this.connected) {
                socketManager.send(PacketType.ATTACK);
            }
        });

        // Connect to server
        this.connectToServer();
    }

    async connectToServer() {
        try {
            await socketManager.connect('ws://localhost:3000');
            this.connected = true;

            // Setup event listeners
            socketManager.on('init', (data) => this.onInit(data));
            socketManager.on('update', (data) => this.onUpdate(data));
            socketManager.on('playerJoin', (player) => this.onPlayerJoin(player));
            socketManager.on('playerLeave', (playerId) => this.onPlayerLeave(playerId));

            // Join game
            socketManager.join('Player');
        } catch (err) {
            console.error('Failed to connect:', err);
            this.add.text(400, 300, 'Failed to connect to server', {
                fontSize: '24px',
                fill: '#ff0000'
            }).setOrigin(0.5).setScrollFactor(0);
        }
    }

    onInit(data) {
        this.localPlayerId = data.playerId;
        console.log('Joined as player', this.localPlayerId);

        // Create existing players
        data.players.forEach(playerData => {
            this.createPlayer(playerData);
        });
    }

    onUpdate(data) {
        // Update players
        data.players.forEach(playerData => {
            const player = this.players.get(playerData.id);
            if (player) {
                player.update(playerData);
            } else {
                this.createPlayer(playerData);
            }
        });

        // Update projectiles
        this.updateProjectiles(data.projectiles || []);
    }

    updateProjectiles(projectilesData) {
        const activeIds = new Set();

        projectilesData.forEach(data => {
            activeIds.add(data.id);

            if (this.projectiles.has(data.id)) {
                // Update existing projectile
                const proj = this.projectiles.get(data.id);
                proj.x = data.x;
                proj.y = data.y;
            } else {
                // Create new projectile
                const color = data.color || 0x00E5FF;
                const proj = this.add.circle(data.x, data.y, PROJECTILE_RADIUS, color);
                proj.setDepth(5);
                this.projectiles.set(data.id, proj);
            }
        });

        // Remove old projectiles
        this.projectiles.forEach((proj, id) => {
            if (!activeIds.has(id)) {
                proj.destroy();
                this.projectiles.delete(id);
            }
        });
    }

    onPlayerJoin(playerData) {
        if (!this.players.has(playerData.id)) {
            this.createPlayer(playerData);
        }
    }

    onPlayerLeave(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            player.destroy();
            this.players.delete(playerId);
        }
    }

    createPlayer(data) {
        const isLocal = data.id === this.localPlayerId;
        const player = new ClientPlayer(this, data, isLocal);
        this.players.set(data.id, player);

        if (isLocal) {
            this.cameras.main.startFollow(player.container, true, 0.1, 0.1);
        }
    }

    drawGrid() {
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x333333, 0.5);

        const gridSize = 100;

        for (let x = 0; x <= MAP_SIZE; x += gridSize) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, MAP_SIZE);
        }

        for (let y = 0; y <= MAP_SIZE; y += gridSize) {
            graphics.moveTo(0, y);
            graphics.lineTo(MAP_SIZE, y);
        }

        graphics.strokePath();
    }

    update(time, delta) {
        if (!this.connected) return;

        // Handle input
        this.inputManager.update();

        // Interpolate all players
        const dt = delta / 1000;
        this.players.forEach(player => {
            player.interpolate(dt);
        });
    }
}
