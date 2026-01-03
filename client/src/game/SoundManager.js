// client/src/game/SoundManager.js
export class SoundManager {
    constructor(scene) {
        this.scene = scene;
        this.masterVolume = 0.5;
        this.sfxVolume = 0.7;
        this.enabled = true;
        this.engineSound = null;
        this.bgm = null;

        // Load settings from localStorage
        this.loadSettings();
    }

    loadSettings() {
        const settings = localStorage.getItem('soundSettings');
        if (settings) {
            const parsed = JSON.parse(settings);
            this.masterVolume = parsed.masterVolume ?? 0.5;
            this.sfxVolume = parsed.sfxVolume ?? 0.7;
            this.enabled = parsed.enabled ?? true;
        }
        this.updateVolumes();
    }

    saveSettings() {
        localStorage.setItem('soundSettings', JSON.stringify({
            masterVolume: this.masterVolume,
            sfxVolume: this.sfxVolume,
            enabled: this.enabled
        }));
        this.updateVolumes();
    }

    setMasterVolume(value) {
        this.masterVolume = Math.max(0, Math.min(1, value));
        this.saveSettings();
    }

    setSFXVolume(value) {
        this.sfxVolume = Math.max(0, Math.min(1, value));
        this.saveSettings();
    }

    toggleEnabled() {
        this.enabled = !this.enabled;

        if (!this.enabled) {
            this.scene.sound.stopAll();
        } else {
            // Restart music/engine if needed
            if (this.bgm && !this.bgm.isPlaying) this.bgm.play();
        }

        this.saveSettings();
    }

    getVolume() {
        return this.enabled ? this.masterVolume * this.sfxVolume : 0;
    }

    updateVolumes() {
        if (!this.scene) return;

        // Update BGM volume
        if (this.bgm) {
            this.bgm.setVolume(this.enabled ? this.masterVolume * 0.5 : 0); // BGM usually quieter
        }

        // Update Engine volume
        if (this.engineSound) {
            this.engineSound.setVolume(this.getVolume() * 0.5); // Engine quieter
        }
    }

    // Play a one-shot sound effect
    playSound(key, config = {}) {
        if (!this.enabled || !this.scene) return;

        const volume = this.getVolume() * (config.volume || 1.0);
        this.scene.sound.play(key, {
            ...config,
            volume: volume
        });
    }

    // --- Specific Sound Methods ---

    playShoot(weaponType = 'BLUE') {
        const pitch = 0.9 + Math.random() * 0.2; // Random pitch 0.9-1.1
        this.playSound('laser', { detune: (pitch - 1) * 1000, volume: 0.4 });
    }

    playHit() {
        // User requested louder hit sound
        this.playSound('laser', { rate: 3.0, volume: 0.5 });
    }

    playExplosion() {
        this.playSound('bomb', { volume: 0.8 });
    }

    playPickup() {
        this.playSound('pickup', { volume: 0.6 });
    }

    // New method for applying items (powerups)
    playItemApply(itemType) {
        // Use pickup sound but with different pitch/rate to distinguish
        // OR reuse other sounds if available. "win" is too long.
        // Let's use 'pickup' with lower rate for "activation" feel
        // or 'shield' procedural if I had it.
        // Let's try 'pickup' with a pitch down for "consumption" effect.
        this.playSound('pickup', { rate: 0.8, volume: 0.7 });
    }

    playDeath() {
        this.playSound('death', { volume: 0.8 });
    }

    playVictory() {
        this.playSound('win', { volume: 0.8 });
    }

    playDash() {
        if (!this.enabled) return;
        this.scene.sound.play('engine', {
            rate: 2.0,
            volume: this.getVolume(),
            duration: 0.5
        });
    }

    playAlert() {
        // No file provided
    }

    // --- Persistent Sounds (Engine, Music) ---

    playMusic() {
        if (this.bgm && this.bgm.isPlaying) return;

        // Stop any existing bgm to be exact
        if (this.bgm) this.bgm.stop();

        this.bgm = this.scene.sound.add('bgm', {
            loop: true,
            volume: this.enabled ? this.masterVolume * 0.5 : 0
        });
        this.bgm.play();
    }

    startEngine() {
        if (this.engineSound) return;

        this.engineSound = this.scene.sound.add('engine', {
            loop: true,
            volume: 0 // Start silent
        });
        this.engineSound.play();
    }

    updateEngine(isMoving) {
        if (!this.engineSound || !this.enabled) {
            if (this.engineSound && !this.enabled) {
                this.engineSound.setVolume(0);
            }
            return;
        }

        const targetVolume = isMoving ? (this.getVolume() * 0.5) : 0;

        // Simple lerp for smooth fade
        const current = this.engineSound.volume;
        if (Math.abs(current - targetVolume) > 0.01) {
            this.engineSound.setVolume(current + (targetVolume - current) * 0.1);
        } else {
            this.engineSound.setVolume(targetVolume);
        }
    }
}
