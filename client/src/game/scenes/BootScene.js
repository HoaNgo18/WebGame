import Phaser from 'phaser';
import { AssetLoader } from '../AssetLoader';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Load game assets
        AssetLoader.preload(this);
    }

    create() {
        // Read target scene from registry, default to GameScene
        const targetScene = this.registry.get('targetScene') || 'GameScene';
        this.scene.start(targetScene);
    }
}
