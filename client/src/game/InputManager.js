import Phaser from 'phaser';
import { socketManager } from '../network/SocketManager';

export class InputManager {
    constructor(scene) {
        this.scene = scene;
        this.keys = null;
        this.lastInput = null;
    }

    setup() {
        // Setup WASD + Arrow keys
        this.keys = this.scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            upArrow: Phaser.Input.Keyboard.KeyCodes.UP,
            downArrow: Phaser.Input.Keyboard.KeyCodes.DOWN,
            leftArrow: Phaser.Input.Keyboard.KeyCodes.LEFT,
            rightArrow: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            // Inventory slots
            slot1: Phaser.Input.Keyboard.KeyCodes.ONE,
            slot2: Phaser.Input.Keyboard.KeyCodes.TWO,
            slot3: Phaser.Input.Keyboard.KeyCodes.THREE,
            slot4: Phaser.Input.Keyboard.KeyCodes.FOUR,
            // Use item
            useItem: Phaser.Input.Keyboard.KeyCodes.E
        });

        // Inventory slot selection
        this.keys.slot1.on('down', () => socketManager.selectSlot(0));
        this.keys.slot2.on('down', () => socketManager.selectSlot(1));
        this.keys.slot3.on('down', () => socketManager.selectSlot(2));
        this.keys.slot4.on('down', () => socketManager.selectSlot(3));

        // Use item with E key
        this.keys.useItem.on('down', () => socketManager.useItem());
    }

    update() {
        const input = {
            up: this.keys.up.isDown || this.keys.upArrow.isDown,
            down: this.keys.down.isDown || this.keys.downArrow.isDown,
            left: this.keys.left.isDown || this.keys.leftArrow.isDown,
            right: this.keys.right.isDown || this.keys.rightArrow.isDown
        };

        // Only send if input changed
        if (this.hasInputChanged(input)) {
            this.lastInput = { ...input };
            socketManager.sendInput(input);
        }
    }

    hasInputChanged(input) {
        if (!this.lastInput) return true;
        return (
            input.up !== this.lastInput.up ||
            input.down !== this.lastInput.down ||
            input.left !== this.lastInput.left ||
            input.right !== this.lastInput.right
        );
    }

    destroy() {
        // Clean up
    }
}
