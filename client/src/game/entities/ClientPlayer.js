import Phaser from 'phaser';
import { SHIP_RADIUS } from 'shared/constants';

export class ClientPlayer {
    constructor(scene, data, isLocal = false) {
        this.scene = scene;
        this.id = data.id;
        this.isLocal = isLocal;

        // Position & rotation
        this.x = data.x;
        this.y = data.y;
        this.rotation = data.rotation || 0;

        // Interpolation targets
        this.targetX = data.x;
        this.targetY = data.y;
        this.targetRotation = data.rotation || 0;

        // Player data
        this.name = data.name;
        this.lives = data.lives;

        // Create visuals
        this.createGraphics();
    }

    createGraphics() {
        const color = this.isLocal ? 0x00ff00 : 0xff0000;

        // Ship body (triangle)
        this.graphics = this.scene.add.graphics();
        this.drawShip(color);

        // Container for all elements
        this.container = this.scene.add.container(this.x, this.y, [this.graphics]);

        // Name text
        this.nameText = this.scene.add.text(0, -35, this.name, {
            fontSize: '14px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        this.container.add(this.nameText);

        // Health bar background
        this.healthBarBg = this.scene.add.rectangle(0, -25, 40, 6, 0x333333);
        this.container.add(this.healthBarBg);

        // Health bar
        this.healthBar = this.scene.add.rectangle(0, -25, 40, 6, 0x00ff00);
        this.container.add(this.healthBar);

        // Set initial rotation
        this.container.setRotation(this.rotation);
    }

    drawShip(color) {
        this.graphics.clear();
        this.graphics.fillStyle(color, 1);
        this.graphics.lineStyle(2, 0xffffff, 0.8);

        // Draw triangle ship
        this.graphics.beginPath();
        this.graphics.moveTo(SHIP_RADIUS, 0);           // Nose
        this.graphics.lineTo(-SHIP_RADIUS * 0.6, -SHIP_RADIUS * 0.7);  // Left wing
        this.graphics.lineTo(-SHIP_RADIUS * 0.3, 0);    // Back center
        this.graphics.lineTo(-SHIP_RADIUS * 0.6, SHIP_RADIUS * 0.7);   // Right wing
        this.graphics.closePath();
        this.graphics.fillPath();
        this.graphics.strokePath();

        // Engine glow
        this.graphics.fillStyle(0x00ffff, 0.8);
        this.graphics.fillCircle(-SHIP_RADIUS * 0.4, 0, 4);
    }

    update(data) {
        // Update targets for interpolation
        this.targetX = data.x;
        this.targetY = data.y;
        this.targetRotation = data.rotation;
        this.lives = data.lives;

        // Update health bar
        this.updateHealthBar();
    }

    interpolate(delta) {
        const lerpFactor = Math.min(1, delta * 12);

        // Smooth position interpolation
        this.x += (this.targetX - this.x) * lerpFactor;
        this.y += (this.targetY - this.y) * lerpFactor;

        // Smooth rotation interpolation
        let rotDiff = this.targetRotation - this.rotation;
        // Handle rotation wrapping
        if (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
        if (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
        this.rotation += rotDiff * lerpFactor;

        // Apply to container
        this.container.setPosition(this.x, this.y);
        this.container.setRotation(this.rotation);

        // Keep name and health bar upright
        this.nameText.setRotation(-this.rotation);
        this.healthBarBg.setRotation(-this.rotation);
        this.healthBar.setRotation(-this.rotation);
    }

    updateHealthBar() {
        const maxLives = 5;
        const healthPercent = this.lives / maxLives;
        this.healthBar.setScale(healthPercent, 1);

        // Color based on health
        if (healthPercent > 0.6) {
            this.healthBar.setFillStyle(0x00ff00);
        } else if (healthPercent > 0.3) {
            this.healthBar.setFillStyle(0xffff00);
        } else {
            this.healthBar.setFillStyle(0xff0000);
        }
    }

    destroy() {
        this.container.destroy();
    }

    getPosition() {
        return { x: this.x, y: this.y };
    }
}
