'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useGameStore } from '@/hooks/useGameStore';

export const PLAYLIST = [
    { name: 'Cool Vibes', path: '/sounds/bgm/CoolVibes.mp3', vol: 7 },
    { name: 'Airport Lounge', path: '/sounds/bgm/Airport Lounge.mp3', vol: 1.0 },
    { name: 'Funk Game Loop', path: '/sounds/bgm/Funk Game Loop.mp3', vol: 1.0 },
    { name: 'Faster Does It', path: '/sounds/bgm/Faster Does It.mp3', vol: 1.0 },
    { name: 'Whiskey on MS', path: '/sounds/bgm/Whiskey on the Mississippi.mp3', vol: 1.0 },
    { name: 'Bossa Antigua', path: '/sounds/bgm/Bossa Antigua.mp3', vol: 1.0 },
    { name: 'Spanish Summer', path: '/sounds/bgm/Spanish Summer- Audionautix.mp3', vol: 1.0 },
    { name: 'Backed Clean', path: '/sounds/bgm/Backed Clean.mp3', vol: 7 },
];

// BGM mapping: roomId → file path
const BGM_MAP: Record<string, string> = {
    lobby: '/sounds/bgm/CoolVibes.mp3',
    classic: '/sounds/bgm/Airport Lounge.mp3',
    vegas_strip: '/sounds/bgm/Funk Game Loop.mp3',
    vegas_downtown: '/sounds/bgm/Faster Does It.mp3',
    free_action: '/sounds/bgm/Whiskey on the Mississippi.mp3',
    atlantic_city: '/sounds/bgm/Bossa Antigua.mp3',
    iberian_21: '/sounds/bgm/Spanish Summer- Audionautix.mp3',
    european: '/sounds/bgm/Backed Clean.mp3',
    uk: '/sounds/bgm/Airport Lounge.mp3',
    zapout_21: '/sounds/bgm/Faster Does It.mp3',
    exchange_21: '/sounds/bgm/Bossa Antigua.mp3',
    firecard_21: '/sounds/bgm/Whiskey on the Mississippi.mp3',
    infinity_double_down: '/sounds/bgm/Funk Game Loop.mp3',
    tutorial_beginner: '/sounds/bgm/CoolVibes.mp3',
    tutorial_double: '/sounds/bgm/Airport Lounge.mp3',
    tutorial_strategy: '/sounds/bgm/Bossa Antigua.mp3',
    tutorial_counting: '/sounds/bgm/Backed Clean.mp3',
    tutorial_splitting: '/sounds/bgm/Faster Does It.mp3',
    tutorial_multihand: '/sounds/bgm/Funk Game Loop.mp3',
    tutorial_free_action: '/sounds/bgm/Whiskey on the Mississippi.mp3',
    tutorial_zapout: '/sounds/bgm/Faster Does It.mp3',
    tutorial_exchange: '/sounds/bgm/Bossa Antigua.mp3',
    tutorial_firecard: '/sounds/bgm/Whiskey on the Mississippi.mp3',
    tutorial_infinity_double_down: '/sounds/bgm/Funk Game Loop.mp3',
    tutorial_iberian: '/sounds/bgm/Spanish Summer- Audionautix.mp3',
    tutorial_european: '/sounds/bgm/Backed Clean.mp3',
    tutorial_uk: '/sounds/bgm/Airport Lounge.mp3',
};

const FADE_DURATION = 1500; // ms
const BASE_VOLUME = 0.3; // Increased to allow more range

// Singleton audio engine to prevent race conditions during Next.js navigation
class BGMEngine {
    private static instance: BGMEngine;
    private audio: HTMLAudioElement | null = null;
    public currentPath: string | null = null;
    private fadeInterval: ReturnType<typeof setInterval> | null = null;
    public hasInteracted = false;
    private playId = 0;

    private constructor() {
        if (typeof window !== 'undefined') {
            this.audio = new Audio();
            this.audio.loop = true;

            const unlock = () => {
                this.hasInteracted = true;
                if (this.audio && !this.currentPath) {
                    this.audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
                    this.audio.volume = 0;
                    this.audio.play().catch(() => {});
                }
                window.removeEventListener('click', unlock, { capture: true });
                window.removeEventListener('keydown', unlock, { capture: true });
                window.removeEventListener('pointerdown', unlock, { capture: true });
                window.dispatchEvent(new Event('bgm_audio_unlocked'));
            };

            window.addEventListener('click', unlock, { capture: true });
            window.addEventListener('keydown', unlock, { capture: true });
            window.addEventListener('pointerdown', unlock, { capture: true });
        }
    }

    public static getInstance() {
        if (!BGMEngine.instance) {
            BGMEngine.instance = new BGMEngine();
        }
        return BGMEngine.instance;
    }

    private clearFade() {
        if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
        }
    }

    private fadeToVolume(targetVol: number, duration: number): Promise<void> {
        return new Promise((resolve) => {
            this.clearFade();
            if (!this.audio) return resolve();
            
            const startVol = this.audio.volume;
            const diff = targetVol - startVol;
            const steps = duration / 50;
            const step = diff / steps;
            
            if (Math.abs(diff) < 0.01) {
                this.audio.volume = targetVol;
                return resolve();
            }

            this.fadeInterval = setInterval(() => {
                if (!this.audio) {
                    this.clearFade();
                    return resolve();
                }
                
                const newVol = this.audio.volume + step;
                if ((step > 0 && newVol >= targetVol) || (step < 0 && newVol <= targetVol)) {
                    this.audio.volume = Math.max(0, Math.min(1, targetVol));
                    this.clearFade();
                    resolve();
                } else {
                    this.audio.volume = Math.max(0, Math.min(1, newVol));
                }
            }, 50);
        });
    }

    public async stop(duration = FADE_DURATION) {
        this.playId++; // Cancel pending plays
        if (!this.audio || this.audio.paused || this.audio.volume === 0) {
            this.currentPath = null;
            return;
        }
        await this.fadeToVolume(0, duration);
        this.audio.pause();
        this.currentPath = null;
    }

    public async playTrack(path: string, targetVolume: number) {
        if (!this.audio || !this.hasInteracted) return;

        const currentToken = ++this.playId;

        // If playing the same track, just match volume
        if (this.currentPath === path && !this.audio.paused) {
            this.clearFade();
            this.audio.volume = targetVolume;
            return;
        }

        // Fade out current track if something else is playing
        if (!this.audio.paused && this.currentPath !== path) {
            await this.fadeToVolume(0, FADE_DURATION / 2);
            if (currentToken !== this.playId) return; // Abort if another play was requested
            this.audio.pause();
        }

        // Setup new track
        if (this.currentPath !== path || this.audio.src.indexOf(path) === -1) {
            this.audio.src = path;
        }
        
        this.audio.volume = 0;
        this.currentPath = path;

        try {
            await this.audio.play();
            if (currentToken !== this.playId) {
                this.audio.pause();
                return;
            }
            this.fadeToVolume(targetVolume, FADE_DURATION / 2);
        } catch (err) {
            const e = err as Error;
            if (e.name !== 'NotAllowedError' && e.name !== 'AbortError') {
                console.warn('BGM play failed:', e);
            }
        }
    }

    public setLiveVolume(volume: number) {
        if (!this.audio || this.audio.paused || this.fadeInterval) return;
        this.audio.volume = Math.max(0, Math.min(1, volume));
    }
}


let globalLastRoomId: string | null = null;

function resolveTrackPath(roomId: string, musicTrackOverride: string | null): string {
    if (musicTrackOverride) return musicTrackOverride;
    if (BGM_MAP[roomId]) return BGM_MAP[roomId];
    const engine = BGMEngine.getInstance();
    if (engine.currentPath) return engine.currentPath;
    return BGM_MAP.lobby;
}

export function useBGM(roomId: string) {
    const musicEnabled = useGameStore((state) => state.musicEnabled);
    const musicVolume = useGameStore((state) => state.musicVolume);
    const musicTrackOverride = useGameStore((state) => state.musicTrackOverride);
    const setMusicTrackOverride = useGameStore((state) => state.setMusicTrackOverride);
    
    const engine = BGMEngine.getInstance();
    const [activationTick, setActivationTick] = useState(0);

    // Clear override when leaving a room to allow default BGM
    useEffect(() => {
        if (globalLastRoomId !== roomId) {
            if (musicTrackOverride) {
                setMusicTrackOverride(null);
            }
            globalLastRoomId = roomId;
        }
    }, [roomId, musicTrackOverride, setMusicTrackOverride]);

    // Force hook to evaluate when audio unlocks
    useEffect(() => {
        const handleUnlock = () => setActivationTick((t) => t + 1);
        window.addEventListener('bgm_audio_unlocked', handleUnlock);
        
        // Ensure browser gives us early manual check, occasionally useful
        if (typeof navigator !== 'undefined' && (navigator as any).userActivation?.hasBeenActive) {
            engine.hasInteracted = true;
            handleUnlock();
        }

        return () => window.removeEventListener('bgm_audio_unlocked', handleUnlock);
    }, [engine]);

    // Handle BGM Playback Logic
    useEffect(() => {
        if (typeof window === 'undefined') return;
        
        if (!musicEnabled) {
            engine.stop(500);
            return;
        }

        if (!engine.hasInteracted) return;

        const trackPath = resolveTrackPath(roomId, musicTrackOverride);
        const trackInfo = PLAYLIST.find(t => t.path === trackPath);
        const trackMultiplier = trackInfo?.vol ?? 1.0;
        const targetVol = Math.min(BASE_VOLUME * musicVolume * trackMultiplier, 1.0);

        engine.playTrack(trackPath, targetVol);
    }, [roomId, musicEnabled, musicVolume, musicTrackOverride, activationTick, engine]);

    // Live volume adjustments
    useEffect(() => {
        if (musicEnabled) {
            const trackPath = resolveTrackPath(roomId, musicTrackOverride);
            const trackInfo = PLAYLIST.find(t => t.path === trackPath);
            const trackMultiplier = trackInfo?.vol ?? 1.0;
            engine.setLiveVolume(Math.min(BASE_VOLUME * musicVolume * trackMultiplier, 1.0));
        }
    }, [musicVolume, musicEnabled, roomId, musicTrackOverride, engine]);


    const changeTrack = useCallback((offset: number) => {
        const currentPath = resolveTrackPath(roomId, musicTrackOverride);
        const currentIndex = PLAYLIST.findIndex(t => t.path === currentPath);
        let nextIndex = (currentIndex + offset) % PLAYLIST.length;
        if (nextIndex < 0) nextIndex = PLAYLIST.length - 1;
        setMusicTrackOverride(PLAYLIST[nextIndex].path);
    }, [roomId, musicTrackOverride, setMusicTrackOverride]);

    const currentTrackName = PLAYLIST.find(t => t.path === resolveTrackPath(roomId, musicTrackOverride))?.name || 'Unknown';

    return { changeTrack, currentTrackName, playlist: PLAYLIST };
}
