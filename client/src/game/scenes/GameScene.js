import Phaser from 'phaser';
import { MAP_SIZE } from 'shared/constants';
import { socketManager } from '../../network/SocketManager';
import { InputManager } from '../InputManager';
import { ClientPlayer } from '../entities/ClientPlayer';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.players = new Map();
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
        data.players.forEach(playerData => {
            const player = this.players.get(playerData.id);
            if (player) {
                player.update(playerData);
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
