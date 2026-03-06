'use client';

// ============================================
// ChipRack — Compact horizontal chip strip for bottom bar
// ============================================

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useGameStore } from '@/hooks/useGameStore';
import { getChipImagePath } from '@/utils/assets';
import { CHIP_VALUES, CHIP_LABELS } from '@/utils/constants';
import { GamePhase } from '@/types/enums';

export default function ChipRack() {
    const bankroll = useGameStore((s) => s.bankroll);
    const selectedChipValue = useGameStore((s) => s.selectedChipValue);
    const selectChip = useGameStore((s) => s.selectChip);
    const gamePhase = useGameStore((s) => s.gamePhase);

    const isBettingPhase = gamePhase === GamePhase.BETTING;

    return (
        <div className="flex items-end gap-1">
            {CHIP_VALUES.filter(v => v >= 1).map((value) => {
                const isSelected = selectedChipValue === value;
                const canAfford = bankroll >= value;
                const isDisabled = !isBettingPhase || !canAfford;

                return (
                    <motion.button
                        key={value}
                        onClick={() => !isDisabled && selectChip(value)}
                        disabled={isDisabled}
                        className={`
                            relative flex flex-col items-center group
                            transition-all duration-200
                            ${isDisabled ? 'opacity-15 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                        animate={{
                            y: isSelected && !isDisabled ? -10 : 0,
                            scale: isSelected && !isDisabled ? 1.2 : 1,
                        }}
                        whileHover={isDisabled ? {} : { y: -6, scale: 1.1 }}
                        whileTap={isDisabled ? {} : { scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                        {/* Chip Image */}
                        <div
                            className={`
                                relative w-[42px] h-[42px] rounded-full overflow-hidden
                                ${isSelected && !isDisabled
                                    ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-transparent drop-shadow-[0_4px_12px_rgba(251,191,36,0.5)]'
                                    : 'drop-shadow-md'
                                }
                            `}
                        >
                            <Image
                                src={getChipImagePath(value)}
                                alt={`${CHIP_LABELS[value]} chip`}
                                fill
                                className="object-cover scale-[1.15]"
                                sizes="42px"
                            />
                        </div>

                        {/* Label */}
                        <span
                            className={`
                                text-[8px] font-extrabold mt-0.5 tabular-nums transition-colors duration-200
                                ${isSelected && !isDisabled
                                    ? 'text-amber-400 drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]'
                                    : 'text-white/25 group-hover:text-white/50'
                                }
                            `}
                        >
                            {CHIP_LABELS[value]}
                        </span>
                    </motion.button>
                );
            })}
        </div>
    );
}
