import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/hooks/useGameStore';
import { getLessons } from '@/store/tutorialSlice';
import { toAppHref } from '@/utils/platform';

export function PayoutControls() {
    const router = useRouter();
    const currentRoom = useGameStore((s) => s.currentRoom);
    const tutorialRound = useGameStore((s) => s.tutorialRound);
    const resetRound = useGameStore((s) => s.resetRound);
    const resetTutorialProgress = useGameStore((s) => s.resetTutorialProgress);
    const markTutorialCompleted = useGameStore((s) => s.markTutorialCompleted);
    const hoveredAction = useGameStore((s) => s.hoveredAction);

    const lessons = getLessons(currentRoom);
    const isLastTutorialLesson = tutorialRound >= lessons.length - 1;

    return isLastTutorialLesson ? (
        <motion.button
            key="payout"
            id="finish-tutorial-button"
            onClick={() => { markTutorialCompleted(currentRoom); resetTutorialProgress(); router.push(toAppHref('/tutorial-lobby')); }}
            className={`px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-[0.25em] cursor-pointer
                bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 text-white
                shadow-[0_0_30px_rgba(139,92,246,0.4),0_8px_20px_rgba(0,0,0,0.3)]
                hover:shadow-[0_0_50px_rgba(139,92,246,0.6),0_12px_30px_rgba(0,0,0,0.4)]
                hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400
                border-2 border-indigo-300/30
                transition-all duration-300 relative overflow-hidden`}
            style={{
                boxShadow: hoveredAction === 'finish-tutorial' ? '0 0 25px white' : '',
                scale: hoveredAction === 'finish-tutorial' ? 1.05 : 1,
                borderColor: hoveredAction === 'finish-tutorial' ? 'white' : ''
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
        >
            <motion.span
                className="absolute inset-0 bg-linear-to-r from-white/0 via-white/30 to-white/0"
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
            <span className="relative flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                FINISH TUTORIAL
                <Sparkles className="w-5 h-5" />
            </span>
        </motion.button>
    ) : (
        <motion.button
            key="payout"
            id="new-round-button"
            onClick={resetRound}
            className={`px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-[0.25em] cursor-pointer
                bg-linear-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white
                shadow-[0_0_30px_rgba(16,185,129,0.4),0_8px_20px_rgba(0,0,0,0.3)]
                hover:shadow-[0_0_50px_rgba(16,185,129,0.6),0_12px_30px_rgba(0,0,0,0.4)]
                hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400
                border-2 border-emerald-300/30
                transition-all duration-300 relative overflow-hidden`}
            style={{
                boxShadow: hoveredAction === 'new-round' ? '0 0 25px white' : '',
                scale: hoveredAction === 'new-round' ? 1.05 : 1,
                borderColor: hoveredAction === 'new-round' ? 'white' : ''
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
        >
            <motion.span
                className="absolute inset-0 bg-linear-to-r from-white/0 via-white/30 to-white/0"
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
            <span className="relative flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                NEW ROUND
                <Sparkles className="w-5 h-5" />
            </span>
        </motion.button>
    );
}
