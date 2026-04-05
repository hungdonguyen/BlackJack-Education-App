import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface InsufficientFundsWarningProps {
    show: boolean;
}

export function InsufficientFundsWarning({ show }: InsufficientFundsWarningProps) {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className="absolute top-[15%] left-1/2 -translate-x-1/2 z-[100]"
                    initial={{ opacity: 0, scale: 0.8, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -10 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                    <div className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-900/90 to-rose-900/90 border border-red-500/50 flex items-center gap-3 backdrop-blur-md shadow-[0_0_40px_rgba(220,38,38,0.3)]">
                        <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                            <span className="text-red-400 font-extrabold text-lg">!</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-red-100 font-bold uppercase tracking-widest text-sm">Insufficient Funds</span>
                            <span className="text-red-400/80 text-[10px] uppercase font-semibold">Please wait claim daily to continue</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
