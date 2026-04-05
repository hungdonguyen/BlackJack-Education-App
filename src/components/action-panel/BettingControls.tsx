import React from 'react';
import { motion } from 'framer-motion';
import { Undo2, X, Spade } from 'lucide-react';
import { useGameStore } from '@/hooks/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { getRoomConfig } from '@/utils/rooms';
import { useAudio } from '@/utils/audio';
import { SmallButton } from './ActionButtons';

export function BettingControls() {
    const { playSound } = useAudio();
    const currentRoom = useGameStore((s) => s.currentRoom);
    const seats = useGameStore(useShallow((s) => s.seats));
    const betHistory = useGameStore(useShallow((s) => s.betHistory));
    const previousBets = useGameStore((s) => s.previousBets);
    
    const undoBet = useGameStore((s) => s.undoBet);
    const clearAllBets = useGameStore((s) => s.clearAllBets);
    const rebet = useGameStore((s) => s.rebet);
    const startDeal = useGameStore((s) => s.startDeal);
    const hoveredAction = useGameStore((s) => s.hoveredAction);

    const roomConfig = getRoomConfig(currentRoom);
    const minBet = roomConfig.betRange[0];

    const activeSeatsList = seats.filter(s => s.isActive);
    const hasBets = activeSeatsList.some(s => {
        const totalSeatBet = s.hands.reduce((sum, h) => sum + h.betAmount, 0);
        return totalSeatBet >= minBet;
    });

    const hasUndo = betHistory.length > 0;
    const hasPreviousBets = previousBets && previousBets.length > 0;

    return (
        <motion.div
            key="betting"
            className="flex items-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
        >
            {hasBets ? (
                <>
                    <SmallButton id="action-undo" label="UNDO" icon={<Undo2 className="w-3.5 h-3.5" />} onClick={() => { playSound('chip-lay'); undoBet(); }} disabled={!hasUndo} variant="ghost" isFocused={hoveredAction === 'undo'} />
                    <SmallButton id="action-clear" label="CLEAR" icon={<X className="w-3.5 h-3.5" />} onClick={() => { playSound('chip-lay'); clearAllBets(); }} disabled={!hasBets} variant="danger" isFocused={hoveredAction === 'clear'} />
                    { !roomConfig.isTutorial && <SmallButton id="action-rebet-x2" label="x2" icon={<span className="text-sm">2x</span>} onClick={() => { playSound('chip-lay'); rebet(); }} disabled={false} variant="ghost" isFocused={hoveredAction === 'rebet'} /> }
                    <motion.button
                        id="action-deal"
                        onClick={() => { playSound('card-slide'); startDeal(); }}
                        disabled={!hasBets}
                        className={`px-8 py-3 rounded-full font-extrabold text-sm uppercase tracking-[0.2em] transition-all duration-300
                            ${!hasBets 
                                ? 'bg-zinc-800/50 text-zinc-600 border border-zinc-700/50 cursor-not-allowed' 
                                : 'bg-linear-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:from-emerald-400 hover:to-emerald-500 cursor-pointer'
                            }`}
                        style={{
                            boxShadow: hoveredAction === 'deal' && hasBets ? '0 0 25px white' : '',
                            scale: hoveredAction === 'deal' && hasBets ? 1.05 : 1,
                            border: hoveredAction === 'deal' && hasBets ? '2px solid white' : ''
                        }}
                        whileHover={hasBets ? { scale: 1.05 } : {}}
                        whileTap={hasBets ? { scale: 0.95 } : {}}
                    >
                        <div className="flex items-center justify-center"><Spade className="w-4 h-4 fill-current mr-1.5" /> DEAL</div>
                    </motion.button>
                </>
            ) : (
                <div className="flex items-center" style={{ minHeight: '48px', marginTop: '10px' }}>
                    { !roomConfig.isTutorial && <SmallButton id="action-rebet" label="REBET" icon={<Undo2 className="w-3.5 h-3.5" />} onClick={() => { playSound('chip-lay'); rebet(); }} disabled={!hasPreviousBets} variant="ghost" isFocused={hoveredAction === 'rebet'} /> }
                </div>
            )}
        </motion.div>
    );
}
