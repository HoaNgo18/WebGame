export class EntityManager {
    constructor(scene) {
        this.scene = scene;
        this.players = new Map();
        this.localPlayerId = null;
    }

    setLocalPlayerId(id) {
        this.localPlayerId = id;
    }

    updatePlayers(playersData) {
        // Track which players are in the update
        const updatedIds = new Set();

        playersData.forEach(data => {
            updatedIds.add(data.id);

            if (this.players.has(data.id)) {
                // Update existing player
                this.updatePlayer(data);
            } else {
                // Create new player
                this.createPlayer(data);
            }
        });

        // Remove players that are no longer in the game
        this.players.forEach((player, id) => {
            if (!updatedIds.has(id)) {
                this.removePlayer(id);
            }
        });
    }

    createPlayer(data) {
        const isLocal = data.id === this.localPlayerId;
        const color = isLocal ? 0x00ff00 : 0xff0000;

        // Create ship graphics
        const graphics = this.scene.add.graphics();
        graphics.fillStyle(color, 1);
        graphics.beginPath();
        graphics.moveTo(20, 0);
        graphics.lineTo(-10, -12);
        graphics.lineTo(-10, 12);
        graphics.closePath();
        graphics.fillPath();

        const container = this.scene.add.container(data.x, data.y, [graphics]);
        container.setRotation(data.rotation);

        // Add name text
        const nameText = this.scene.add.text(0, -30, data.name, {
            fontSize: '12px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        container.add(nameText);

        this.players.set(data.id, {
            container,
            graphics,
            nameText,
            data,
            targetX: data.x,
            targetY: data.y,
            targetRotation: data.rotation
        });

        // Follow local player with camera
        if (isLocal) {
            this.scene.cameras.main.startFollow(container, true, 0.1, 0.1);
        }
    }

    updatePlayer(data) {
        const player = this.players.get(data.id);
        if (!player) return;

        // Set interpolation targets
        player.targetX = data.x;
        player.targetY = data.y;
        player.targetRotation = data.rotation;
        player.data = data;
    }

    interpolate(delta) {
        const lerpFactor = Math.min(1, delta * 10);

        this.players.forEach(player => {
            // Smooth interpolation
            player.container.x += (player.targetX - player.container.x) * lerpFactor;
            player.container.y += (player.targetY - player.container.y) * lerpFactor;
            player.container.rotation += (player.targetRotation - player.container.rotation) * lerpFactor;
        });
    }

    removePlayer(id) {
        const player = this.players.get(id);
        if (player) {
            player.container.destroy();
            this.players.delete(id);
        }
    }

    getLocalPlayer() {
        return this.players.get(this.localPlayerId);
    }

    clear() {
        this.players.forEach(player => player.container.destroy());
        this.players.clear();
    }
}
