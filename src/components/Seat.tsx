'use client';

// ============================================
// Seat — fixed chip visibility, hand highlighting
// ============================================

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useGameStore } from '@/hooks/useGameStore';
import { GamePhase, HandStatus } from '@/types/enums';
import { getChipImagePath } from '@/utils/assets';
import { getHandDisplayValue } from '@/utils/hand';
import CardComponent from './CardComponent';
import ScoreBadge from './ScoreBadge';
import ChipStack from './ChipStack';

interface SeatProps {
    seatId: number;
    style?: React.CSSProperties;
}

export default function Seat({ seatId, style }: SeatProps) {
    const seat = useGameStore((s) => s.seats[seatId - 1]);
    const gamePhase = useGameStore((s) => s.gamePhase);
    const currentSeatIndex = useGameStore((s) => s.currentSeatIndex);
    const selectedChipValue = useGameStore((s) => s.selectedChipValue);
    const placeBet = useGameStore((s) => s.placeBet);
    const clearBet = useGameStore((s) => s.clearBet);
    const toggleSeat = useGameStore((s) => s.toggleSeat);

    if (!seat) return null;

    const isBetting = gamePhase === GamePhase.BETTING;
    const isCurrentTurn = gamePhase === GamePhase.PLAYER_TURN && currentSeatIndex === seatId - 1;
    const insuranceBet = useGameStore((s) => s.insuranceBets[seatId] ?? 0);
    const totalBet = seat.hands.reduce((sum, h) => sum + h.betAmount, 0) + insuranceBet;
    const hasCards = seat.isActive && seat.hands.some(h => h.cards.length > 0);

    const handleClick = () => {
        if (!isBetting) return;
        if (!seat.isActive) {
            toggleSeat(seatId);
            return;
        }
        placeBet(seatId, selectedChipValue);
    };

    const handleRightClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!isBetting || !seat.isActive) return;
        if (totalBet > 0) {
            clearBet(seatId);
        } else {
            toggleSeat(seatId);
        }
    };

    return (
        <div className="flex flex-col items-center" style={style}>
            {/* ─── Cards Area (above circle, higher z-index) ─── */}
            {hasCards && (
                <div className="relative min-h-[105px] min-w-[75px] flex items-end justify-center mb-6"
                    style={{ zIndex: 10 }}
                >
                    {seat.hands.map((hand, handIdx) => {
                        // Is this the currently active hand?
                        const isActiveHand = isCurrentTurn && seat.currentHandIndex === handIdx;
                        // Is this hand still in PLAYING status?
                        const isPlaying = hand.status === HandStatus.PLAYING;

                        return (
                            <div key={hand.id}
                                className={`relative ${handIdx > 0 ? 'ml-5' : ''}`}
                                style={{ minWidth: `${70 + (hand.cards.length - 1) * 28}px`, height: '101px' }}
                            >
                                {/* Hand Score (Above Cards) */}
                                {hand.cards.length > 0 && (
                                    <div className={`absolute -top-10 left-1/2 -translate-x-1/2 z-20 flex justify-center transition-all ${isActiveHand ? 'scale-110' : 'scale-90 opacity-80'}`}>
                                        <motion.div
                                            key={`hand-${hand.id}-${hand.cards.length}`}
                                            className={`flex items-center justify-center rounded-full border-2 
                                                ${isActiveHand ? 'border-amber-400 bg-black/90 text-amber-400' : 'border-white/20 bg-black/80 text-white'} 
                                                backdrop-blur-sm shadow-lg px-2 min-w-[40px] h-[40px]`}
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 400,
                                                damping: 20,
                                                delay: Math.max(0, (hand.cards.length - 1) * 0.18 + 0.4)
                                            }}
                                        >
                                            <span className="text-base font-black tabular-nums whitespace-nowrap">
                                                {getHandDisplayValue(hand.cards)}
                                            </span>
                                        </motion.div>
                                    </div>
                                )}

                                {/* Active hand highlight ring */}
                                {isActiveHand && isPlaying && (
                                    <motion.div
                                        className="absolute -inset-2 rounded-xl border-2 border-amber-400/40"
                                        style={{ boxShadow: '0 0 15px rgba(251,191,36,0.2)' }}
                                        animate={{ opacity: [0.4, 1, 0.4] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                    />
                                )}

                                {hand.cards.map((card, cardIdx) => (
                                    <CardComponent
                                        key={`${hand.id}-${cardIdx}`}
                                        card={card}
                                        index={cardIdx}
                                        totalCards={hand.cards.length}
                                        size="sm"
                                    />
                                ))}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ─── Betting Circle (below cards) ─── */}
            <motion.div
                layout
                onClick={handleClick}
                onContextMenu={handleRightClick}
                className={`
                    relative rounded-full flex items-center justify-center transition-all duration-300
                    ${!seat.isActive
                        ? 'w-[73px] h-[73px] border border-dashed border-white/[0.08] bg-transparent hover:border-amber-400/25'
                        : isCurrentTurn
                            ? 'w-[78px] h-[78px] border-2 border-amber-400 bg-amber-400/[0.08] shadow-[0_0_25px_rgba(251,191,36,0.3)]'
                            : totalBet > 0
                                ? 'w-[75px] h-[75px] border border-amber-500/30 bg-amber-500/[0.04] shadow-[0_0_12px_rgba(251,191,36,0.1)]'
                                : 'w-[73px] h-[73px] border border-dashed border-white/15 bg-white/[0.02] hover:border-amber-400/30'
                    }
                    ${isBetting ? 'cursor-pointer' : 'cursor-default'}
                `}
                style={{ zIndex: 5 }}
                whileHover={isBetting ? { scale: 1.08 } : {}}
                whileTap={isBetting ? { scale: 0.92 } : {}}
            >
                {!seat.isActive ? (
                    <span className="text-white/15 text-lg font-light">+</span>
                ) : totalBet > 0 ? (
                    <motion.div layout className="flex items-end justify-center gap-2">
                        {seat.hands.map((hand) => hand.betAmount > 0 && (
                            <motion.div layout key={hand.id} className="flex flex-col items-center"
                                initial={{ opacity: 0, scale: 0.5, x: -10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            >
                                {(hand.isFreeSplit || hand.isFreeDouble) && (
                                    <span className="text-emerald-400 text-[6px] font-black uppercase mb-0.5 tracking-wider bg-emerald-900/50 px-1 rounded-sm border border-emerald-500/30">
                                        FREE
                                    </span>
                                )}
                                <ChipStack amount={hand.betAmount} />
                                <span className="text-amber-300 text-[8px] flex font-extrabold mt-0.5 tabular-nums drop-shadow-[0_0_4px_rgba(251,191,36,0.5)]">
                                    ${hand.betAmount.toLocaleString()}
                                </span>
                            </motion.div>
                        ))}
                        {insuranceBet > 0 && (
                            <motion.div layout key="insurance" className="flex flex-col items-center opacity-90"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <span className="text-yellow-400 text-[5px] uppercase font-bold mb-0.5 drop-shadow-md border border-yellow-400/30 bg-yellow-900/40 px-1 rounded-sm">
                                    INSURE
                                </span>
                                <ChipStack amount={insuranceBet} />
                                <span className="text-yellow-400 text-[7px] font-extrabold mt-0.5 tabular-nums drop-shadow-[0_0_4px_rgba(250,204,21,0.5)]">
                                    ${insuranceBet.toLocaleString()}
                                </span>
                            </motion.div>
                        )}
                    </motion.div>
                ) : (
                    <div className="flex flex-col items-center gap-0.5">
                        <div className="w-3 h-3 rounded-full border border-dashed border-white/10" />
                        <span className="text-white/15 text-[6px] font-medium uppercase tracking-wider">Bet</span>
                    </div>
                )}

                {/* Glow ring for current turn */}
                {isCurrentTurn && (
                    <motion.div className="absolute inset-[-3px] rounded-full border-2 border-amber-400/50"
                        animate={{ scale: [1, 1.08, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                )}
            </motion.div>

            {/* Seat label */}
            <div className="mt-1 flex flex-col items-center gap-0.5">
                <span className={`text-[9px] font-black uppercase tracking-[0.2em] mt-1
                    ${isCurrentTurn ? 'text-amber-400' : 'text-white/30'}`}>
                    Seat {seatId}
                </span>

                {isBetting && seat.isActive && totalBet === 0 && (
                    <span className="text-[7px] font-bold text-white/30 uppercase tracking-wider">Right-click remove</span>
                )}
            </div>
        </div>
    );
}
