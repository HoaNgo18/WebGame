export class Physics {
    static distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    static circleCollision(obj1, obj2) {
        const dist = this.distance(obj1.x, obj1.y, obj2.x, obj2.y);
        return dist < (obj1.radius + obj2.radius);
    }

    static pointInCircle(px, py, cx, cy, radius) {
        return this.distance(px, py, cx, cy) < radius;
    }

    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    static normalizeAngle(angle) {
        while (angle < 0) angle += Math.PI * 2;
        while (angle >= Math.PI * 2) angle -= Math.PI * 2;
        return angle;
    }

    static angleBetween(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }
}
