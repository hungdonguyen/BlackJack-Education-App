'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/hooks/useGameStore';
import { GamePhase } from '@/types/enums';
import { getRoomConfig } from '@/utils/rooms';
import { useEffect, useState, useMemo } from 'react';
import { AlertCircle } from 'lucide-react';

import { createPortal } from 'react-dom';
import { TutorialStep, GameState } from '@/types/game';
import { BEGINNER_TUTORIAL_LESSONS } from '@/utils/tutorialData';
import { useAudio } from '@/utils/audio';

export default function TutorialGuide({ show = true }: { show?: boolean }) {
    const currentRoom = useGameStore((s) => s.currentRoom);
    const roomCfg = getRoomConfig(currentRoom);
    const state = useGameStore((s) => s);
    const tutorialRound = useGameStore((s) => s.tutorialRound);
    const tutorialWarning = useGameStore((s) => s.tutorialWarning);
    const hideTutorialWarning = useGameStore((s) => s.hideTutorialWarning);
    const [stepIndex, setStepIndex] = useState(0);
    const { playSound } = useAudio();

    // Auto-hide warning after 3 seconds
    useEffect(() => {
        if (tutorialWarning) {
            playSound('click');
            const timer = setTimeout(() => {
                hideTutorialWarning();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [tutorialWarning, hideTutorialWarning, playSound]);

    const steps = useMemo(() => {
        if (currentRoom === 'tutorial_beginner') {
            const lesson = BEGINNER_TUTORIAL_LESSONS[tutorialRound];
            return lesson ? lesson.steps : [];
        }
        return [];
    }, [currentRoom, tutorialRound]);

    // Reset step index when round changes
    useEffect(() => {
        setStepIndex(0);
    }, [tutorialRound]);

    useEffect(() => {
        if (!roomCfg.isTutorial) return;

        const currentStep = steps[stepIndex];
        const nextStep = steps[stepIndex + 1];

        if (nextStep && nextStep.condition(state) && !currentStep?.requiresClick) {
            playSound('click'); // Sound for step progression
            setStepIndex(stepIndex + 1);
        }
    }, [state, stepIndex, steps, roomCfg.isTutorial, playSound]);

    if (!roomCfg.isTutorial || stepIndex >= steps.length) return null;

    const currentStep = steps[stepIndex];

    const getPositionClasses = (pos?: string) => {
        switch (pos) {
            case 'center': return "absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2";
            case 'bottom': return "absolute left-[15%] bottom-[20%]";
            case 'dealer': return "absolute right-[15%] top-[25%]";
            case 'player': return "absolute left-[15%] bottom-[40%]";
            case 'top':
            default: return "absolute left-[15%] top-[25%]";
        }
    };

    return (
        <AnimatePresence>
            {show && (
                <>
                    <motion.div
                        key={stepIndex} // Re-animate when step changes
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className={`${getPositionClasses(currentStep.position)} z-[100] max-w-[280px]`}
                    >
                        <div 
                            className={`relative bg-black/85 backdrop-blur-xl border ${currentStep.requiresClick ? 'border-yellow-500/60 shadow-[0_0_40px_rgba(234,179,8,0.4)] cursor-pointer hover:bg-black/95 transition-colors' : 'border-indigo-500/60 shadow-[0_0_40px_rgba(99,102,241,0.4)]'} rounded-2xl p-4`}
                            onClick={() => {
                                if (currentStep.requiresClick && stepIndex + 1 < steps.length) {
                                    playSound('click');
                                    setStepIndex(stepIndex + 1);
                                }
                            }}
                        >
                            {/* Speech Bubble Arrow - only show if not centered */}
                            {(currentStep.position !== 'center') && (
                                <div className={`absolute right-[-8px] top-4 w-4 h-4 bg-black/80 border-r border-t ${currentStep.requiresClick ? 'border-yellow-500/50' : 'border-indigo-500/50'} rotate-45`} />
                            )}
                            
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full animate-pulse ${currentStep.requiresClick ? 'bg-yellow-400' : 'bg-indigo-400'}`} />
                                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${currentStep.requiresClick ? 'text-yellow-300' : 'text-indigo-300'}`}>Guide</span>
                                </div>
                                <p className="text-xs font-medium leading-relaxed text-white/90">
                                    {currentStep.message}
                                </p>
                                {currentStep.requiresClick && (
                                    <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-yellow-400/80 uppercase tracking-widest animate-pulse">
                                        <span>Tap to continue</span>
                                        <div className="w-1 h-1 bg-yellow-400 rounded-full" />
                                        <div className="w-1 h-1 bg-yellow-400 rounded-full animation-delay-200" />
                                        <div className="w-1 h-1 bg-yellow-400 rounded-full animation-delay-400" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {currentStep.targetElementId && (
                        <TutorialPointer targetId={currentStep.targetElementId} />
                    )}

                    {/* Warning Toast */}
                    <AnimatePresence>
                        {tutorialWarning && (
                            <motion.div
                                initial={{ opacity: 0, y: -20, scale: 0.9, x: '-50%' }}
                                animate={{ opacity: 1, y: 0, scale: 1, x: '-50%', 
                                    transition: { type: 'spring', damping: 15, stiffness: 200 }
                                }}
                                exit={{ opacity: 0, y: -20, scale: 0.9, x: '-50%' }}
                                className="fixed top-12 left-1/2 z-[9999] pointer-events-none"
                            >
                                <motion.div 
                                    animate={{ x: [-5, 5, -5, 5, 0] }}
                                    transition={{ duration: 0.4 }}
                                    className="px-6 py-3 rounded-xl bg-red-950/90 border border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.4)] backdrop-blur-md flex items-center gap-3"
                                >
                                    <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" />
                                    <span className="text-sm font-bold text-red-100 uppercase tracking-wide">
                                        {tutorialWarning}
                                    </span>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </AnimatePresence>
    );
}

function TutorialPointer({ targetId }: { targetId: string }) {
    const [position, setPosition] = useState<{ x: number, y: number } | null>(null);

    useEffect(() => {
        const updatePosition = () => {
            const el = document.getElementById(targetId);
            if (el) {
                const rect = el.getBoundingClientRect();
                setPosition({
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2
                });
            } else {
                setPosition(null);
            }
        };

        updatePosition();
        const interval = setInterval(updatePosition, 100);
        window.addEventListener('resize', updatePosition);
        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', updatePosition);
        };
    }, [targetId]);

    if (!position) return null;

    return createPortal(
        <motion.div
            className="fixed z-[9999] pointer-events-none"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ left: position.x, top: position.y }}
        >
            <div className="relative">
                {/* Circular pulsing ring */}
                <motion.div
                    className="absolute -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-indigo-400 rounded-full"
                    animate={{ scale: [1, 1.5], opacity: [0.8, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                />
                {/* Arrow pointing down */}
                <motion.div
                    className="absolute -translate-x-1/2 -top-12"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <div className="w-6 h-6 border-l-4 border-b-4 border-indigo-400 rotate-[-45deg]" />
                </motion.div>
            </div>
        </motion.div>,
        document.body
    );
}
