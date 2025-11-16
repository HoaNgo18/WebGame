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
            rightArrow: Phaser.Input.Keyboard.KeyCodes.RIGHT
        });
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
        if (this.keys) {
            this.scene.input.keyboard.removeKey(this.keys.up);
            this.scene.input.keyboard.removeKey(this.keys.down);
            this.scene.input.keyboard.removeKey(this.keys.left);
            this.scene.input.keyboard.removeKey(this.keys.right);
        }
    }
}
