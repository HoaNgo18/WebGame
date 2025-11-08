import Phaser from 'phaser';
import { MAP_SIZE } from 'shared/constants';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Set world bounds
        this.physics.world.setBounds(0, 0, MAP_SIZE, MAP_SIZE);

        // Camera setup
        this.cameras.main.setBounds(0, 0, MAP_SIZE, MAP_SIZE);
        this.cameras.main.setBackgroundColor('#0a0a1a');

        // Draw grid background
        this.drawGrid();

        // Placeholder text
        this.add.text(MAP_SIZE / 2, MAP_SIZE / 2, 'GameScene Ready', {
            fontSize: '32px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.add.text(MAP_SIZE / 2, MAP_SIZE / 2 + 50, 'Player movement coming in Phase 4', {
            fontSize: '18px',
            fill: '#888888'
        }).setOrigin(0.5);

        // Center camera for now
        this.cameras.main.centerOn(MAP_SIZE / 2, MAP_SIZE / 2);
    }

    drawGrid() {
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x333333, 0.5);

        const gridSize = 100;

        // Vertical lines
        for (let x = 0; x <= MAP_SIZE; x += gridSize) {
            graphics.moveTo(x, 0);
            graphics.lineTo(x, MAP_SIZE);
        }

        // Horizontal lines
        for (let y = 0; y <= MAP_SIZE; y += gridSize) {
            graphics.moveTo(0, y);
            graphics.lineTo(MAP_SIZE, y);
        }

        graphics.strokePath();
    }

    update(time, delta) {
        // Game loop - will be implemented in Phase 4
    }
}
