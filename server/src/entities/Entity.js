export class Entity {
    constructor(id, x = 0, y = 0) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.rotation = 0;
        this.active = true;
    }

    update(deltaTime) {
        // Override in subclass
    }

    toJSON() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            rotation: this.rotation
        };
    }
}
