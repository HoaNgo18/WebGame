import Phaser from 'phaser';
import { GameActions } from './GameActions';

export class InputManager {
    constructor(scene) {
        this.scene = scene;
        this.keys = scene.input.keyboard.addKeys({
            W: Phaser.Input.Keyboard.KeyCodes.W,
            A: Phaser.Input.Keyboard.KeyCodes.A,
            S: Phaser.Input.Keyboard.KeyCodes.S,
            D: Phaser.Input.Keyboard.KeyCodes.D,
            UP: Phaser.Input.Keyboard.KeyCodes.UP,
            DOWN: Phaser.Input.Keyboard.KeyCodes.DOWN,
            LEFT: Phaser.Input.Keyboard.KeyCodes.LEFT,
            RIGHT: Phaser.Input.Keyboard.KeyCodes.RIGHT,
            SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
            ONE: Phaser.Input.Keyboard.KeyCodes.ONE,
            TWO: Phaser.Input.Keyboard.KeyCodes.TWO,
            THREE: Phaser.Input.Keyboard.KeyCodes.THREE,
            FOUR: Phaser.Input.Keyboard.KeyCodes.FOUR,
            FIVE: Phaser.Input.Keyboard.KeyCodes.FIVE
        });

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Mouse click -> Attack (via GameActions)
        this.scene.input.on('pointerdown', () => {
            GameActions.attack();
        });

        // Space -> Use Item (via GameActions)
        this.scene.input.keyboard.on('keydown-SPACE', () => {
            GameActions.useItem();
        });

        // Slot selection (via GameActions)
        const slotKeys = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE'];
        slotKeys.forEach((key, index) => {
            this.scene.input.keyboard.on(`keydown-${key}`, () => {
                GameActions.selectSlot(index);
            });
        });
    }

    getInputData() {
        const pointer = this.scene.input.activePointer;
        const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);

        // Get touch movement state (from mobile joystick)
        const touchMovement = GameActions.getTouchMovement();

        // Combine keyboard and touch movement
        const movement = {
            up: this.keys.W.isDown || this.keys.UP.isDown || touchMovement.up,
            down: this.keys.S.isDown || this.keys.DOWN.isDown || touchMovement.down,
            left: this.keys.A.isDown || this.keys.LEFT.isDown || touchMovement.left,
            right: this.keys.D.isDown || this.keys.RIGHT.isDown || touchMovement.right,
            space: this.keys.SPACE.isDown,
        };

        // Get aim position (touch or mouse)
        const touchAim = GameActions.getTouchAim();
        const mouseX = touchAim.active ? touchAim.x : worldPoint.x;
        const mouseY = touchAim.active ? touchAim.y : worldPoint.y;

        return {
            movement,
            mouseX,
            mouseY
        };
    }
}
