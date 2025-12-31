/**
 * GameActions.js
 * Centralized action dispatcher - abstracts game actions from input sources.
 * Both keyboard (PC) and touch (Mobile) inputs call these methods.
 */
import { socket } from '../network/socket';
import { PacketType } from 'shared/packetTypes';

class GameActionsManager {
    constructor() {
        // Touch movement state (used by touch controls)
        this.touchMovement = {
            up: false,
            down: false,
            left: false,
            right: false
        };

        // Touch aim position
        this.touchAimX = 0;
        this.touchAimY = 0;
        this.useTouchAim = false;
    }

    // === ACTION METHODS ===

    /**
     * Fire weapon / Attack
     */
    attack() {
        socket.send({ type: PacketType.ATTACK });
    }

    /**
     * Use the currently selected inventory item
     */
    useItem() {
        socket.send({ type: PacketType.USE_ITEM });
    }

    /**
     * Select an inventory slot (0-4)
     * @param {number} slotIndex - Slot index from 0 to 4
     */
    selectSlot(slotIndex) {
        if (slotIndex >= 0 && slotIndex <= 4) {
            socket.send({ type: PacketType.SELECT_SLOT, slotIndex });
        }
    }

    // === TOUCH MOVEMENT METHODS ===

    /**
     * Set movement direction from touch joystick
     * @param {Object} direction - { up, down, left, right }
     */
    setTouchMovement(direction) {
        this.touchMovement = {
            up: !!direction.up,
            down: !!direction.down,
            left: !!direction.left,
            right: !!direction.right
        };
    }

    /**
     * Get current touch movement state
     * @returns {Object} - { up, down, left, right }
     */
    getTouchMovement() {
        return this.touchMovement;
    }

    /**
     * Reset touch movement (when joystick released)
     */
    resetTouchMovement() {
        this.touchMovement = {
            up: false,
            down: false,
            left: false,
            right: false
        };
    }

    // === TOUCH AIM METHODS ===

    /**
     * Set aim position from touch
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     */
    setTouchAim(x, y) {
        this.touchAimX = x;
        this.touchAimY = y;
        this.useTouchAim = true;
    }

    /**
     * Get touch aim position
     * @returns {Object} - { x, y, active }
     */
    getTouchAim() {
        return {
            x: this.touchAimX,
            y: this.touchAimY,
            active: this.useTouchAim
        };
    }

    /**
     * Disable touch aim (use mouse position instead)
     */
    resetTouchAim() {
        this.useTouchAim = false;
    }
}

// Singleton instance
export const GameActions = new GameActionsManager();
