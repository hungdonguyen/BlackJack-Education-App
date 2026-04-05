import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag } from 'lucide-react';
import { useAudio } from '@/utils/audio';

interface ExitConfirmationModalProps {
    showExitConfirmation: { target: 'lobby' | 'home' | null };
    setShowExitConfirmation: (state: { target: 'lobby' | 'home' | null }) => void;
    confirmExit: () => void;
}

export function ExitConfirmationModal({ showExitConfirmation, setShowExitConfirmation, confirmExit }: ExitConfirmationModalProps) {
    const { playSound } = useAudio();

    return (
        <AnimatePresence>
            {showExitConfirmation.target && (
                <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <motion.div
                        className="relative w-full max-w-sm rounded-2xl p-8 border border-white/10 shadow-2xl text-center"
                        style={{ background: 'rgba(15, 10, 8, 0.98)' }}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    >
                        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
                            <Flag size={28} className="text-red-500" />
                        </div>

                        <h3 className="text-2xl font-black text-white/95 mb-2">Leave Tutorial?</h3>
                        <p className="text-white/50 text-sm leading-relaxed mb-8">
                            Are you sure you want to exit? Your tutorial progress will be lost and you'll have to start over next time.
                        </p>

                        <div className="flex flex-col gap-3">
                            <motion.button
                                onClick={() => { playSound('click'); confirmExit(); }}
                                className="w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-wider shadow-lg shadow-red-600/20 transition-colors cursor-pointer"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Confirm Exit
                            </motion.button>
                            <motion.button
                                onClick={() => { playSound('click'); setShowExitConfirmation({ target: null }); }}
                                className="w-full py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white font-bold uppercase tracking-widest transition-colors mb-2 cursor-pointer"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Keep Learning
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
