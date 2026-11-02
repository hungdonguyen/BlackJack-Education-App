import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShinyText, CountUp } from '@/components/reactbits';

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
                    <div className={`px-8 py-5 rounded-2xl backdrop-blur-md border ${winNotification.isPush
                            ? 'bg-gradient-to-r from-slate-500/15 to-gray-500/15 border-slate-400/30'
                            : winNotification.isWin
                                ? 'bg-gradient-to-r from-amber-500/25 to-yellow-500/25 border-yellow-400/50'
                                : 'bg-gradient-to-r from-red-500/20 to-red-700/20 border-red-400/30'
                        }`}
                        style={{
                            boxShadow: winNotification.isPush
                                ? '0 0 40px rgba(148, 163, 184, 0.2)'
                                : winNotification.isWin
                                    ? '0 0 60px rgba(250, 204, 21, 0.4), 0 0 120px rgba(250, 204, 21, 0.2)'
                                    : '0 0 40px rgba(220, 50, 50, 0.2)'
                        }}
                    >
                        <div className="text-center mb-1">
                            {winNotification.isWin ? (
                                <ShinyText
                                    text="YOU WIN"
                                    shineColor="#ffffff"
                                    color="#fef08a"
                                    speed={2}
                                    glow={0.3}
                                    className="text-center text-base font-black uppercase tracking-[0.3em]"
                                />
                            ) : (
                                <p className={`text-center text-sm font-bold uppercase tracking-[0.3em] ${winNotification.isPush ? 'text-slate-300' : 'text-red-300'}`}>
                                    {winNotification.isPush ? 'TIE' : 'YOU LOSE'}
                                </p>
                            )}
                        </div>

                        {!winNotification.isPush && (
                            <div className="flex items-center justify-center">
                                <CountUp
                                    to={winNotification.amount}
                                    prefix={winNotification.isWin ? '+$' : '-$'}
                                    duration={0.7}
                                    className={`text-center text-3xl md:text-4xl font-black tabular-nums ${winNotification.isWin ? 'text-yellow-400' : 'text-red-400'}`}
                                    style={{
                                        textShadow: winNotification.isWin
                                            ? '0 0 20px rgba(250, 204, 21, 0.6)'
                                            : '0 0 20px rgba(239, 68, 68, 0.4)'
                                    }}
                                />
                            </div>
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
