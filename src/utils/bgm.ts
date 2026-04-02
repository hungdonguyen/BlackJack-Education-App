'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/hooks/useGameStore';

export const PLAYLIST = [
    { name: 'Cool Vibes', path: '/sounds/bgm/CoolVibes.mp3', vol: 7 },
    { name: 'Airport Lounge', path: '/sounds/bgm/Airport Lounge.mp3', vol: 1.0 },
    { name: 'Funk Game Loop', path: '/sounds/bgm/Funk Game Loop.mp3', vol: 1.0 },
    { name: 'Faster Does It', path: '/sounds/bgm/Faster Does It.mp3', vol: 1.0 },
    { name: 'Whiskey on MS', path: '/sounds/bgm/Whiskey on the Mississippi.mp3', vol: 1.0 },
    { name: 'Bossa Antigua', path: '/sounds/bgm/Bossa Antigua.mp3', vol: 1.0 },
    { name: 'Spanish Summer', path: '/sounds/bgm/Spanish Summer- Audionautix.mp3', vol: 1.0 },
    { name: 'Backed Clean', path: '/sounds/bgm/Backed Clean.mp3', vol: 1.3 },
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
    madness_21: '/sounds/bgm/Funk Game Loop.mp3',
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
    tutorial_madness: '/sounds/bgm/Funk Game Loop.mp3',
    tutorial_iberian: '/sounds/bgm/Spanish Summer- Audionautix.mp3',
    tutorial_european: '/sounds/bgm/Backed Clean.mp3',
    tutorial_uk: '/sounds/bgm/Airport Lounge.mp3',
};

const FADE_DURATION = 1500; // ms
const BASE_VOLUME = 0.3; // Increased from 0.15 to allow more range in settings

// Singleton audio element to prevent multiple tracks playing
let currentAudio: HTMLAudioElement | null = null;
let currentTrackPath: string | null = null;
let fadeInterval: ReturnType<typeof setInterval> | null = null;
let playbackToken = 0;

function resolveTrackPath(roomId: string, musicTrackOverride: string | null): string {
    if (musicTrackOverride) return musicTrackOverride;
    if (BGM_MAP[roomId]) return BGM_MAP[roomId];
    // Keep current track when entering rooms without dedicated BGM.
    if (currentTrackPath) return currentTrackPath;
    return BGM_MAP.lobby;
}

function fadeOut(audio: HTMLAudioElement, duration: number): Promise<void> {
    return new Promise((resolve) => {
        if (fadeInterval) clearInterval(fadeInterval);
        const startVolume = audio.volume;
        const step = startVolume / (duration / 50);
        fadeInterval = setInterval(() => {
            if (audio.volume - step <= 0) {
                audio.volume = 0;
                audio.pause();
                if (fadeInterval) clearInterval(fadeInterval);
                fadeInterval = null;
                resolve();
            } else {
                audio.volume -= step;
            }
        }, 50);
    });
}

function fadeIn(audio: HTMLAudioElement, targetVolume: number, duration: number) {
    if (fadeInterval) clearInterval(fadeInterval);
    audio.volume = 0;
    const step = targetVolume / (duration / 50);
    fadeInterval = setInterval(() => {
        if (audio.volume + step >= targetVolume) {
            audio.volume = targetVolume;
            if (fadeInterval) clearInterval(fadeInterval);
            fadeInterval = null;
        } else {
            audio.volume += step;
        }
    }, 50);
}

export function useBGM(roomId: string) {
    const musicEnabled = useGameStore((state) => state.musicEnabled);
    const musicVolume = useGameStore((state) => state.musicVolume);
    const musicTrackOverride = useGameStore((state) => state.musicTrackOverride);
    const setMusicTrackOverride = useGameStore((state) => state.setMusicTrackOverride);
    const hasInteracted = useRef(false);

    // When changing rooms, clear manual overrides so each room's default track can take over.
    useEffect(() => {
        if (musicTrackOverride) {
            setMusicTrackOverride(null);
        }
    }, [roomId, musicTrackOverride, setMusicTrackOverride]);

    // Handle user interaction to unlock autoplay
    useEffect(() => {
        const unlock = () => {
            hasInteracted.current = true;
            window.removeEventListener('click', unlock);
            window.removeEventListener('keydown', unlock);
        };
        window.addEventListener('click', unlock);
        window.addEventListener('keydown', unlock);
        return () => {
            window.removeEventListener('click', unlock);
            window.removeEventListener('keydown', unlock);
        };
    }, []);

    // Main BGM effect
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const token = ++playbackToken;

        // Use override if set, otherwise use room default
        const trackPath = resolveTrackPath(roomId, musicTrackOverride);
        const trackInfo = PLAYLIST.find(t => t.path === trackPath);
        const trackMultiplier = trackInfo?.vol ?? 1.0;
        const targetVol = Math.min(BASE_VOLUME * musicVolume * trackMultiplier, 1.0);

        if (!musicEnabled) {
            if (currentAudio && !currentAudio.paused) {
                fadeOut(currentAudio, 500);
            }
            currentTrackPath = null;
            return;
        }

        // Same track already playing?
        if (currentTrackPath === trackPath && currentAudio && !currentAudio.paused) {
            currentAudio.volume = targetVol;
            return;
        }

        const startNewTrack = async () => {
            // Fade out old track
            if (currentAudio && !currentAudio.paused) {
                await fadeOut(currentAudio, FADE_DURATION);
            }

            if (token !== playbackToken) return;

            const audio = new Audio(trackPath);
            audio.loop = true;
            audio.volume = 0;

            if (token !== playbackToken) {
                audio.pause();
                return;
            }

            currentAudio = audio;
            currentTrackPath = trackPath;

            try {
                await audio.play();
                if (token !== playbackToken) {
                    audio.pause();
                    return;
                }
                fadeIn(audio, targetVol, FADE_DURATION);
            } catch (err) {
                const e = err as Error;
                if (e.name !== 'NotAllowedError') {
                    console.warn('BGM play failed:', e);
                }
            }
        };

        startNewTrack();
    }, [roomId, musicEnabled, musicVolume, musicTrackOverride]);

    // Volume change effect
    useEffect(() => {
        if (currentAudio && !currentAudio.paused && musicEnabled) {
            const trackPath = resolveTrackPath(roomId, musicTrackOverride);
            const trackInfo = PLAYLIST.find(t => t.path === trackPath);
            const trackMultiplier = trackInfo?.vol ?? 1.0;
            currentAudio.volume = Math.min(BASE_VOLUME * musicVolume * trackMultiplier, 1.0);
        }
    }, [musicVolume, musicEnabled, roomId, musicTrackOverride]);


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
