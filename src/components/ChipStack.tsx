'use client';

// ============================================
// ChipStack — Premium 3D chip stack component
// ============================================

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { getChipImagePath } from '@/utils/assets';
import { calculateMinimalChips } from '@/utils/chips';

interface ChipStackProps {
    amount: number;
    maxDisplay?: number;
}

export default function ChipStack({ amount, maxDisplay = 15 }: ChipStackProps) {
    if (amount <= 0) return null;

    // 1. Calculate minimal chips needed
    const chipValues = calculateMinimalChips(amount);

    // 2. Limit the number of chips displayed to prevent huge towering stacks
    const displayChips = chipValues.slice(-maxDisplay);

    return (
        <div className="relative w-[40px] h-[40px] flex items-center justify-center pointer-events-none">
            <AnimatePresence>
                {displayChips.map((val, idx) => {
                    // Dynamic Y-offset: each chip moves slightly higher than the last
                    const yOffset = -(idx * 4);

                    return (
                        <motion.div
                            key={`${val}-${idx}-${amount}`}
                            initial={{ opacity: 0, y: -50, scale: 0.8 }}
                            animate={{ opacity: 1, y: yOffset, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25, delay: idx * 0.05 }}
                            className="absolute w-[40px] h-[40px] drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                            style={{
                                zIndex: idx + 10,
                                transformOrigin: 'bottom center',
                            }}
                        >
                            <div className="relative w-full h-full rounded-full overflow-hidden">
                                <Image
                                    src={getChipImagePath(val)}
                                    alt={`$${val} chip`}
                                    fill
                                    className="object-cover scale-[1.15]"
                                    sizes="40px"
                                />
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}

