import Phaser from 'phaser';
import { GameActions } from './GameActions';
import { socket } from '../network/socket';

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
            const myPlayer = this.scene.players[socket.myId];

            // Validate ability to shoot: must have player, not dead, and have ammo
            const hasAmmo = myPlayer?.currentAmmo === undefined || myPlayer?.currentAmmo > 0;
            const weaponType = myPlayer?.weaponType || 'BLUE';

            // RED weapon requires standing still to shoot
            const isMoving = myPlayer?.isMoving;
            const requireStill = weaponType === 'RED';
            const canShootRed = !requireStill || !isMoving;

            const canShoot = myPlayer && !myPlayer.dead && hasAmmo && canShootRed;

            if (canShoot) {
                // Play shoot sound only when actually can shoot
                if (this.scene.soundManager) {
                    this.scene.soundManager.playShoot(weaponType);
                }
            }

            GameActions.attack();
        });

        // Space -> Use Item (via GameActions)
        this.keys.SPACE.on('down', () => {
            GameActions.useItem();
        });

        // Slot selection (via GameActions)
        // Ensure keys are captured correctly
        this.keys.ONE.on('down', () => GameActions.selectSlot(0));
        this.keys.TWO.on('down', () => GameActions.selectSlot(1));
        this.keys.THREE.on('down', () => GameActions.selectSlot(2));
        this.keys.FOUR.on('down', () => GameActions.selectSlot(3));
        this.keys.FIVE.on('down', () => GameActions.selectSlot(4));
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
