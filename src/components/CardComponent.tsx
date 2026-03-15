'use client';

// ============================================
// CardComponent — premium card with natural fanning & rotation
// ============================================

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Card } from '@/types/game';
import { getCardImagePath, getCardBackPath } from '@/utils/assets';
import { useAudio } from '@/utils/audio';
import { useEffect } from 'react';

interface CardComponentProps {
    card: Card;
    index?: number;
    /** Total cards in hand — used for centering the fan */
    totalCards?: number;
    /** Whether to animate entry */
    animate?: boolean;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
    /** Whether the card was just switched */
    isSwitched?: boolean;
}

const SIZE_MAP = {
    sm: { width: 69, height: 101 },
    md: { width: 92, height: 133 },
    lg: { width: 116, height: 165 },
};

// Natural rotation for fanned cards (subtle, like a real dealer)
const FAN_ROTATIONS = [0, 3, -2, 5, -3, 4, -1, 6];
const FAN_OFFSETS = { sm: 28, md: 32, lg: 37 };

export default function CardComponent({
    card,
    index = 0,
    totalCards = 1,
    animate = true,
    size = 'md',
    isSwitched = false,
}: CardComponentProps) {
    const dimensions = SIZE_MAP[size];
    const imagePath = card.isHidden ? getCardBackPath() : getCardImagePath(card);
    const fanOffset = FAN_OFFSETS[size];
    const rotation = FAN_ROTATIONS[index % FAN_ROTATIONS.length] ?? 0;
    const { playSound } = useAudio();

    useEffect(() => {
        if (animate) {
            // Slight delay to sync with animation, or immediate
            const timer = setTimeout(() => {
                playSound('card-slide');
            }, index * 180); // matches the 0.18s delay in framer-motion
            return () => clearTimeout(timer);
        }
    }, [animate, index, playSound]);

    return (
        <motion.div
            className="absolute"
            style={{
                left: `${index * fanOffset}px`,
                zIndex: index + 1,
            }}
            initial={
                isSwitched
                    ? { x: index === 0 ? 100 : -100, y: -20, opacity: 0, scale: 1.1, rotateZ: index === 0 ? 15 : -15 }
                    : animate ? { y: -250, opacity: 0, rotateY: 180, rotate: 0 } : false
            }
            animate={{
                x: 0,
                y: 0,
                opacity: 1,
                rotateY: 0,
                scale: 1,
                rotateZ: totalCards > 1 ? rotation : 0,
            }}
            transition={
                isSwitched
                    ? { type: 'spring', stiffness: 200, damping: 20, mass: 0.8, delay: 0.1 }
                    : { type: 'spring', stiffness: 220, damping: 22, delay: index * 0.18 }
            }
        >
            <div
                className="relative rounded-lg overflow-hidden drop-shadow-xl"
                style={{
                    width: `${dimensions.width}px`,
                    height: `${dimensions.height}px`,
                    boxShadow: '3px 5px 15px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.4)',
                }}
            >
                <Image
                    src={imagePath}
                    alt={card.isHidden ? 'Card Back' : `${card.rank} of ${card.suit}`}
                    fill
                    className="object-contain"
                    sizes={`${dimensions.width}px`}
                    priority={index < 2}
                />
            </div>
        </motion.div>
    );
}
