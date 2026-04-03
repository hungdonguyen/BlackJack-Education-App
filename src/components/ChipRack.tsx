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
import { getRoomConfig } from '@/utils/rooms';

export default function ChipRack() {
    const bankroll = useGameStore((s) => s.bankroll);
    const tutorialBalance = useGameStore((s) => s.tutorialBalance);
    const currentRoom = useGameStore((s) => s.currentRoom);
    const selectedChipValue = useGameStore((s) => s.selectedChipValue);
    const selectChip = useGameStore((s) => s.selectChip);
    const gamePhase = useGameStore((s) => s.gamePhase);

    const isBettingPhase = gamePhase === GamePhase.BETTING;
    const roomConfig = getRoomConfig(currentRoom);
    const currentBalance = (roomConfig.isTutorial ? tutorialBalance : bankroll) ?? 0;
    const visibleChipValues = roomConfig.isTutorial
        ? [100]
        : CHIP_VALUES.filter((value) => value >= 1);

    return (
        <div className="flex items-end gap-1.5">
            {visibleChipValues.map((value) => {
                const isSelected = selectedChipValue === value;
                const canAfford = currentBalance >= value;
                const isDisabled = !isBettingPhase || !canAfford;
                const handleSelect = () => {
                    if (!isDisabled) selectChip(value);
                };

                return (
                    <motion.button
                        key={value}
                        id={`chip-${value}`}
                        layout
                        initial={false}
                        onPointerDown={handleSelect}
                        onClick={(event) => {
                            if (event.detail === 0) handleSelect();
                        }}
                        disabled={isDisabled}
                        aria-label={`Select ${CHIP_LABELS[value]} chip defined value ${value}`}
                        className={`
                            relative flex flex-col items-center group
                            ${isDisabled ? 'opacity-15 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                        animate={{
                            y: isSelected && !isDisabled ? -7 : 0,
                            scale: isSelected && !isDisabled ? 1.08 : 1,
                            opacity: isDisabled ? 0.15 : 1,
                        }}
                        whileHover={isDisabled ? {} : { y: isSelected ? -8 : -4, scale: isSelected ? 1.1 : 1.04 }}
                        whileTap={isDisabled ? {} : { scale: 0.96, y: isSelected ? -5 : -2 }}
                        transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {/* Chip Image */}
                        <motion.div
                            layout
                            className={`
                                relative w-[42px] h-[42px] rounded-full overflow-hidden
                                ${isSelected && !isDisabled
                                    ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-transparent drop-shadow-[0_4px_12px_rgba(251,191,36,0.5)]'
                                    : 'drop-shadow-md'
                                }
                            `}
                            animate={{
                                filter: isSelected && !isDisabled
                                    ? 'drop-shadow(0 6px 14px rgba(251,191,36,0.45))'
                                    : 'drop-shadow(0 4px 8px rgba(0,0,0,0.28))',
                            }}
                            transition={{ duration: 0.12, ease: 'easeOut' }}
                        >
                            {isSelected && !isDisabled && (
                                <motion.div
                                    layoutId="chip-selected-glow"
                                    className="absolute inset-[-4px] rounded-full border border-amber-300/70 bg-amber-300/10"
                                    transition={{ duration: 0.12, ease: 'easeOut' }}
                                />
                            )}
                            <Image
                                src={getChipImagePath(value)}
                                alt={`${CHIP_LABELS[value]} chip`}
                                fill
                                className="object-cover scale-[1.15]"
                                sizes="42px"
                            />
                        </motion.div>

                        {/* Label */}
                        <span
                            className={`
                                text-[8px] font-extrabold mt-0.5 tabular-nums transition-colors duration-100
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
