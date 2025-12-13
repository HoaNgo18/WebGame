import React, { useEffect, useRef, useState } from 'react';

const BackgroundMusic = () => {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Function to calculate volume from settings
    const getVolume = () => {
        try {
            const settings = JSON.parse(localStorage.getItem('soundSettings') || '{}');
            const master = settings.masterVolume ?? 0.5;
            const music = settings.musicVolume ?? 0.5;
            const enabled = settings.enabled ?? true;
            // Volume = Master * Music
            return enabled ? master * music : 0;
        } catch (e) {
            return 0.25;
        }
    };

    const updateVolume = () => {
        if (audioRef.current) {
            audioRef.current.volume = getVolume();
        }
    };

    useEffect(() => {
        // Initial play attempt
        const audio = audioRef.current;
        if (!audio) return;

        audio.volume = getVolume();

        const playMusic = async () => {
            try {
                await audio.play();
                setIsPlaying(true);
            } catch (err) {
                console.log("Autoplay blocked, waiting for interaction");
                setIsPlaying(false);
            }
        };

        playMusic();

        // Unlock audio on first interaction if blocked
        const handleInteraction = () => {
            if (audio.paused) {
                playMusic();
            }
        };

        window.addEventListener('click', handleInteraction);
        window.addEventListener('keydown', handleInteraction);
        window.addEventListener('touchstart', handleInteraction);

        // Listen for volume changes from Settings
        // We override localStorage.setItem to dispatch events or use polling
        const interval = setInterval(updateVolume, 500); // Poll every 500ms for volume changes

        return () => {
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
            clearInterval(interval);
        };
    }, []);

    return (
        <audio
            ref={audioRef}
            src="/sounds/Blind Shift.mp3"
            loop
            preload="auto"
            style={{ display: 'none' }}
        />
    );
};

export default BackgroundMusic;
