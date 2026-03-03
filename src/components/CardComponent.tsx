'use client';

// ============================================
// CardComponent — premium card with natural fanning & rotation
// ============================================

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Card } from '@/types/game';
import { getCardImagePath, getCardBackPath } from '@/utils/assets';

interface CardComponentProps {
    card: Card;
    index?: number;
    /** Total cards in hand — used for centering the fan */
    totalCards?: number;
    /** Whether to animate entry */
    animate?: boolean;
    /** Size variant */
    size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = {
    sm: { width: 64, height: 93 },   // 80% of 80x116
    md: { width: 86, height: 123 },  // 80% of 107x154
    lg: { width: 106, height: 153 }, // 80% of 132x191
};

// Natural rotation for fanned cards (subtle, like a real dealer)
const FAN_ROTATIONS = [0, 3, -2, 5, -3, 4, -1, 6];
const FAN_OFFSETS = { sm: 26, md: 30, lg: 34 }; // 80% of original

export default function CardComponent({
    card,
    index = 0,
    totalCards = 1,
    animate = true,
    size = 'md',
}: CardComponentProps) {
    const dimensions = SIZE_MAP[size];
    const imagePath = card.isHidden ? getCardBackPath() : getCardImagePath(card);
    const fanOffset = FAN_OFFSETS[size];
    const rotation = FAN_ROTATIONS[index % FAN_ROTATIONS.length] ?? 0;

    return (
        <motion.div
            className="absolute"
            style={{
                left: `${index * fanOffset}px`,
                zIndex: index + 1,
            }}
            initial={animate ? { y: -250, opacity: 0, rotateY: 180, rotate: 0 } : false}
            animate={{
                y: 0,
                opacity: 1,
                rotateY: 0,
                rotate: totalCards > 1 ? rotation : 0,
            }}
            transition={{
                type: 'spring',
                stiffness: 220,
                damping: 22,
                delay: index * 0.18,
            }}
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
