/**
 * Utility functions for game logic
 */

/**
 * Calculate distance between two points
 * @param {number} x1 - First point X coordinate
 * @param {number} y1 - First point Y coordinate
 * @param {number} x2 - Second point X coordinate
 * @param {number} y2 - Second point Y coordinate
 * @returns {number} Distance between the two points
 */
export function getDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if two circles collide
 * @param {number} x1 - First circle X coordinate
 * @param {number} y1 - First circle Y coordinate
 * @param {number} r1 - First circle radius
 * @param {number} x2 - Second circle X coordinate
 * @param {number} y2 - Second circle Y coordinate
 * @param {number} r2 - Second circle radius
 * @returns {boolean} True if circles collide
 */
export function checkCircleCollision(x1, y1, r1, x2, y2, r2) {
    const distance = getDistance(x1, y1, x2, y2);
    return distance < r1 + r2;
}

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Normalize an angle to be within 0-360 degrees
 * @param {number} angle - Angle in degrees
 * @returns {number} Normalized angle
 */
export function normalizeAngle(angle) {
    return ((angle % 360) + 360) % 360;
}

/**
 * Get random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
export function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Check if a point is within bounds
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} width - Bounds width
 * @param {number} height - Bounds height
 * @returns {boolean} True if point is within bounds
 */
export function isPointInBounds(x, y, width, height) {
    return x >= 0 && x <= width && y >= 0 && y <= height;
}
