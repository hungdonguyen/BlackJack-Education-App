import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WinNotificationProps {
    winNotification: { amount: number; isWin: boolean; isPush?: boolean } | null;
}

export function WinNotificationOverlay({ winNotification }: WinNotificationProps) {
    return (
        <AnimatePresence>
            {winNotification && (
                <motion.div
                    className="absolute left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                    style={{ top: '25%' }}
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: -20 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                    <div className={`px-8 py-4 rounded-xl backdrop-blur-md border ${winNotification.isPush
                            ? 'bg-gradient-to-r from-slate-500/15 to-gray-500/15 border-slate-400/30'
                            : winNotification.isWin
                                ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-yellow-400/40'
                                : 'bg-gradient-to-r from-red-500/20 to-red-700/20 border-red-400/30'
                        }`}
                        style={{
                            boxShadow: winNotification.isPush
                                ? '0 0 40px rgba(148, 163, 184, 0.2)'
                                : winNotification.isWin
                                    ? '0 0 60px rgba(250, 204, 21, 0.3), 0 0 120px rgba(250, 204, 21, 0.1)'
                                    : '0 0 40px rgba(220, 50, 50, 0.2)'
                        }}
                    >

                        <p className={`text-center text-sm font-bold uppercase tracking-[0.3em] mb-1 ${winNotification.isPush
                                ? 'text-slate-300'
                                : winNotification.isWin ? 'text-yellow-300' : 'text-red-300'
                            }`}>
                            {winNotification.isPush ? 'TIE' : winNotification.isWin ? 'YOU WIN' : 'YOU LOSE'}
                        </p>
                        {!winNotification.isPush && (
                            <p className={`text-center text-3xl font-black tabular-nums
                        ${winNotification.isWin ? 'text-yellow-400' : 'text-red-400'}`}>
                                {winNotification.isWin ? '+' : '-'}${winNotification.amount.toLocaleString()}
                            </p>
                        )}
                        {winNotification.isPush && (
                            <p className="text-center text-xl font-bold text-slate-400/80">
                                Bet returned
                            </p>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
