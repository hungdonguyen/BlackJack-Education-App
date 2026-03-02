'use client';

// ============================================
// PortraitOverlay — "Rotate to landscape" overlay for mobile
// ============================================

import { motion } from 'framer-motion';

export default function PortraitOverlay() {
    return (
        <div className="portrait-overlay fixed inset-0 z-[200] bg-black flex items-center justify-center p-8">
            <motion.div
                className="flex flex-col items-center gap-6 text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                {/* Rotating phone icon */}
                <motion.div
                    className="text-6xl"
                    animate={{ rotate: [0, -90, -90, 0] }}
                    transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        repeatDelay: 1,
                        ease: 'easeInOut',
                    }}
                >
                    📱
                </motion.div>

                <div>
                    <h2 className="text-white text-xl font-bold mb-2">
                        Rotate Your Device
                    </h2>
                    <p className="text-white/60 text-sm max-w-[260px]">
                        Please rotate your device to landscape mode for the best
                        Blackjack experience.
                    </p>
                </div>

                {/* Landscape hint illustration */}
                <div className="flex items-center gap-2 text-white/20">
                    <div className="w-20 h-12 border-2 border-current rounded-lg flex items-center justify-center">
                        <span className="text-xs">▶</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
