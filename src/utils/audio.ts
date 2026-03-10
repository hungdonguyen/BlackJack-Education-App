'use client';

import { useGameStore } from '@/hooks/useGameStore';
import { useCallback, useRef } from 'react';

type SoundVariant =
    | 'card-slide'
    | 'card-place'
    | 'chip-lay'
    | 'chips-collide'
    | 'shuffle'
    | 'dice-throw'
    | 'click'
    | 'switch'
    | 'win'
    | 'lose';

// Mapping categories to specific files
const SOUND_MAP: Record<SoundVariant, string[]> = {
    'card-slide': ['/sounds/game/card-slide.ogg'],
    'card-place': ['/sounds/game/card-place.ogg'],
    'chip-lay': ['/sounds/game/chip-lay.ogg'],
    'chips-collide': ['/sounds/game/chips-collide.ogg'],
    'shuffle': ['/sounds/game/card-shuffle.ogg'],
    'dice-throw': ['/sounds/ui/click.ogg'], // Not used, map to a fallback
    'click': ['/sounds/ui/click.ogg'],
    'switch': ['/sounds/ui/switch.ogg'],
    'win': ['/sounds/outcomes/win.wav'],
    'lose': ['/sounds/outcomes/lose.wav']
};

export function useAudio() {
    const soundEnabled = useGameStore((state) => state.soundEnabled);
    const soundVolume = useGameStore((state) => state.soundVolume);
    
    // Cache audio objects to reuse and avoid re-downloading/re-parsing
    const audioCache = useRef<Record<string, HTMLAudioElement>>({});
    const activeOutcomeAudio = useRef<HTMLAudioElement | null>(null);

    const playSound = useCallback((variant: SoundVariant, volume: number = 0.5, options?: { shortShuffle?: boolean }) => {
        if (!soundEnabled) return;
        if (typeof window === 'undefined') return;

        const files = SOUND_MAP[variant];
        if (!files || files.length === 0) return;

        // Pick a random sound from the variant list for variety
        const randomIndex = Math.floor(Math.random() * files.length);
        const file = files[randomIndex];

        try {
            let audioNode = audioCache.current[file];
            if (!audioNode) {
                audioNode = new Audio(file);
                audioCache.current[file] = audioNode;
            }

            const isOutcomeSound = variant === 'win' || variant === 'lose';

            if (isOutcomeSound && activeOutcomeAudio.current) {
                activeOutcomeAudio.current.pause();
                activeOutcomeAudio.current.currentTime = 0;
                activeOutcomeAudio.current = null;
            }

            // Clone node if we want overlapping sounds (e.g. multiple cards dealt fast)
            // Native Audio has issues playing the same object overlappingly.
            const playNode = audioNode.cloneNode() as HTMLAudioElement;
            if (isOutcomeSound) {
                activeOutcomeAudio.current = playNode;
            }
            playNode.volume = volume * soundVolume;
            playNode.play().then(() => {
                if (variant === 'shuffle' && options?.shortShuffle) {
                    setTimeout(() => {
                        playNode.pause();
                        playNode.currentTime = 0;
                    }, 1500); // Reduce shuffle sound to 1.5s
                }
            }).catch(e => {
                // Ignore DOMException regarding user gesture interaction
                if (e.name !== 'NotAllowedError') {
                    console.warn('Audio play failed:', e);
                }
            });

            if (isOutcomeSound) {
                playNode.onended = () => {
                    if (activeOutcomeAudio.current === playNode) {
                        activeOutcomeAudio.current = null;
                    }
                };
            }
        } catch (e) {
            console.warn('Audio initialization failed:', e);
        }
    }, [soundEnabled, soundVolume]);

    return { playSound };
}
