'use client';

// ============================================
// Seat — fixed chip visibility, hand highlighting
// ============================================

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame } from 'lucide-react';
import { useGameStore } from '@/hooks/useGameStore';
import { GamePhase, HandStatus } from '@/types/enums';
import { getHandDisplayValue } from '@/utils/hand';
import CardComponent from './CardComponent';
import ChipStack from './ChipStack';
import { getRoomConfig } from '@/utils/rooms';
import { useAudio } from '@/utils/audio';

interface SeatProps {
    seatId: number;
    style?: React.CSSProperties;
}

export default function Seat({ seatId, style }: SeatProps) {
    const seat = useGameStore((s) => s.seats[seatId - 1]);
    const gamePhase = useGameStore((s) => s.gamePhase);
    const currentSeatIndex = useGameStore((s) => s.currentSeatIndex);
    const insuranceBet = useGameStore((s) => s.insuranceBets[seatId] ?? 0);
    const selectedChipValue = useGameStore((s) => s.selectedChipValue);
    const placeBet = useGameStore((s) => s.placeBet);
    const clearBet = useGameStore((s) => s.clearBet);
    const toggleSeat = useGameStore((s) => s.toggleSeat);
    const currentRoom = useGameStore((s) => s.currentRoom);
    const placeSideBet = useGameStore((s) => s.placeSideBet);
    const clearSideBet = useGameStore((s) => s.clearSideBet);
    const sideBets = useGameStore((s) => s.sideBets);
    const hoveredAction = useGameStore((s) => s.hoveredAction);
    const focusedSeatId = useGameStore((s) => s.focusedSeatId);
    const roomConfig = getRoomConfig(currentRoom);
    const { playSound } = useAudio();

    if (!seat) return null;

    // In tutorial mode, only seat 3 is shown EXCEPT for tutorial_multihand
    if (roomConfig.isTutorial && seatId !== 3 && currentRoom !== 'tutorial_multihand') return null;

    const isBetting = gamePhase === GamePhase.BETTING;
    const isCurrentTurn = gamePhase === GamePhase.PLAYER_TURN && currentSeatIndex === seatId - 1;
    const isInsuranceTurn = gamePhase === GamePhase.INSURANCE && currentSeatIndex === seatId - 1;
    const sideBetAmount = sideBets[seatId] || 0;
    const mainBet = seat.hands.reduce((sum, h) => sum + h.betAmount, 0);
    const totalBet = mainBet + insuranceBet;
    const hasCards = seat.isActive && seat.hands.some(h => h.cards.length > 0);
    const isFocusedSeat = isBetting && !hoveredAction && focusedSeatId === seatId;

    const handleClick = () => {
        if (!isBetting) return;
        if (!seat.isActive) {
            playSound('click');
            toggleSeat(seatId);
            return;
        }
        playSound('chip-lay');
        placeBet(seatId, selectedChipValue);
    };

    const handleRightClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!isBetting || !seat.isActive) return;
        if (totalBet > 0) {
            playSound('chip-lay');
            clearBet(seatId);
        } else {
            playSound('click');
            toggleSeat(seatId);
        }
    };

    return (
        <div id={`seat-${seatId}`} className="relative flex flex-col items-center" style={style}>
            {/* ─── Side Bet Toggle (Free Action room only) ─── */}
            {roomConfig.hasSideBet && seat.isActive && isBetting && (
                <div className="absolute -left-[92px] top-1/2 -translate-y-1/2 flex flex-col items-center" style={{ zIndex: 12 }}>
                    <div className="relative">
                        <motion.button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (mainBet > 0) {
                                    placeSideBet(seatId, selectedChipValue);
                                    playSound('chip-lay');
                                }
                            }}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (sideBetAmount > 0) {
                                    clearSideBet(seatId);
                                    playSound('chip-lay');
                                }
                            }}
                            disabled={sideBetAmount === 0 && mainBet === 0}
                            aria-label={`Place side bet on Seat ${seatId}. Current side bet: ${sideBetAmount}`}
                            title={sideBetAmount === 0 && mainBet === 0 ? 'Place a main bet first' : undefined}
                            className={`w-[44px] h-[44px] rounded-full flex items-center justify-center transition-all border-2 overflow-hidden
                                ${sideBetAmount === 0 && mainBet === 0
                                    ? 'border-white/8 opacity-35 cursor-not-allowed'
                                    : sideBetAmount > 0
                                        ? 'border-yellow-400/60 shadow-[0_0_16px_rgba(250,204,21,0.4)] cursor-pointer'
                                        : 'border-white/15 hover:border-yellow-400/40 cursor-pointer'
                                }`}
                            style={{
                                background: sideBetAmount > 0
                                    ? 'radial-gradient(circle at 35% 35%, #fcd34d, #d97706)'
                                    : 'rgba(255,255,255,0.05)',
                            }}
                            whileHover={sideBetAmount > 0 || mainBet > 0 ? { scale: 1.12 } : {}}
                            whileTap={sideBetAmount > 0 || mainBet > 0 ? { scale: 0.9 } : {}}
                        >
                            <Image
                                src={roomConfig.sideBetType === 'push_22' ? "/images/logo/bonus/push22.png" : "/images/logo/bonus/multiaction.png"}
                                alt={roomConfig.sideBetType === 'push_22' ? "Push 22 Bonus" : "Multi Action Bonus"}
                                width={32}
                                height={32}
                                className={`object-contain ${sideBetAmount > 0 ? 'drop-shadow-lg' : 'opacity-40'}`}
                                unoptimized
                            />
                        </motion.button>
                        {/* Chip stack overlaying the bonus bet circle */}
                        {sideBetAmount > 0 && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 13 }}>
                                <ChipStack amount={sideBetAmount} />
                            </div>
                        )}
                    </div>
                    {sideBetAmount > 0 && (
                        <span className="block text-center text-[7px] font-black text-yellow-400 mt-0.5 tabular-nums">
                            ${sideBetAmount}
                        </span>
                    )}
                    <span className="text-[6px] font-extrabold uppercase tracking-[0.1em] text-yellow-500/60 mt-0.5 whitespace-nowrap">
                        {roomConfig.sideBetType === 'push_22' ? "Push 22 Bonus" : "Multi Action Bonus"}
                    </span>
                </div>
            )}

            {/* Side bet indicator during play */}
            {roomConfig.hasSideBet && sideBetAmount > 0 && !isBetting && (
                <div className="mb-1" style={{ zIndex: 12 }}>
                    <span className="px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-wider
                        bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-400/30 text-yellow-300">
                        ⚡ BONUS ${sideBetAmount}
                        {seat.freeActionTokens ? ` · ${seat.freeActionTokens}✦` : ''}
                    </span>
                </div>
            )}
            {/* ─── Cards Area (above circle, higher z-index) ─── */}
            {hasCards && (
                <div className="relative min-w-[69px] flex items-end justify-center mb-4"
                    style={{ zIndex: 10, minHeight: '116px', paddingTop: '38px' }}
                >
                    {seat.hands.map((hand, handIdx) => {
                        // Is this the currently active hand?
                        const isActiveHand = isCurrentTurn && seat.currentHandIndex === handIdx;
                        // Is this hand still in PLAYING status?
                        const isPlaying = hand.status === HandStatus.PLAYING;

                        return (
                            <div key={hand.id}
                                className={`relative ${handIdx > 0 ? 'ml-8' : ''}`}
                                style={{ minWidth: `${69 + (hand.cards.length - 1) * 25}px`, height: '92px' }}
                            >
                                {/* Hand Score (Above Cards) */}
                                {hand.cards.length > 0 && (
                                    <div className={`absolute -top-8 left-1/2 -translate-x-1/2 z-20 flex justify-center transition-all ${isActiveHand ? 'scale-100' : 'scale-[0.73] opacity-80'}`}>
                                        <motion.div
                                            key={`hand-${hand.id}-${hand.cards.length}`}
                                            className={`flex items-center justify-center rounded-full border-2 
                                                ${isActiveHand ? 'border-amber-400 bg-black/90 text-amber-400' : 'border-white/20 bg-black/80 text-white'} 
                                                backdrop-blur-sm shadow-lg px-1 min-w-[26px] h-[26px]`}
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 400,
                                                damping: 20,
                                                delay: Math.max(0, (hand.cards.length - 1) * 0.18 + 0.4)
                                            }}
                                        >
                                            <span className="text-[10px] font-black tabular-nums whitespace-nowrap">
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

                                {hand.cards.map((card, cardIdx) => {
                                    let isHighlighted = false;
                                    let highlightColor = '#ffffff';

                                    if (hoveredAction) {
                                        if (hoveredAction === 'switch' && isCurrentTurn && (handIdx === 0 || handIdx === 1) && cardIdx === 1) {
                                            isHighlighted = true;
                                            highlightColor = '#64748b'; // Match SWITCH button color
                                        } else if (hoveredAction === 'burn' && isActiveHand && cardIdx === 1) {
                                            isHighlighted = true;
                                            highlightColor = '#f97316'; // Match BURN button color
                                        } else if (hoveredAction === 'zap' && isActiveHand && (cardIdx === 0 || cardIdx === 1)) {
                                            isHighlighted = true;
                                            highlightColor = '#3b82f6'; // Match ZAP button color
                                        }
                                    }

                                    return (
                                        <CardComponent
                                            key={`${hand.id}-${cardIdx}-${hand.isSwitched ? 'switched' : 'normal'}`}
                                            card={card}
                                            index={cardIdx}
                                            totalCards={hand.cards.length}
                                            size="sm"
                                            isSwitched={hand.isSwitched && cardIdx === 1} // Only animate the swapped card
                                            isHighlighted={isHighlighted}
                                            highlightColor={highlightColor}
                                        />
                                    );
                                })}

                                {/* Bust overlay */}
                                <AnimatePresence>
                                    {hand.status === HandStatus.BUST && (
                                        <motion.div
                                            className="absolute inset-0 rounded-lg flex flex-col items-center justify-center"
                                            style={{ zIndex: 30 }}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.25 }}
                                        >
                                            {/* Dim layer over cards */}
                                            <div
                                                className="absolute inset-0 rounded-lg"
                                                style={{ background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(0.5px)' }}
                                            />
                                            {/* BUST label */}
                                            <motion.div
                                                className="relative z-10 flex flex-col items-center gap-0.5"
                                                initial={{ scale: 0.5, y: 4 }}
                                                animate={{ scale: 1, y: 0 }}
                                                transition={{ type: 'spring', stiffness: 500, damping: 18, delay: 0.05 }}
                                            >
                                                <Flame
                                                    size={18}
                                                    className="text-orange-400"
                                                    style={{ filter: 'drop-shadow(0 0 6px rgba(251,146,60,0.9))' }}
                                                />
                                                <span
                                                    className="text-[9px] font-black uppercase tracking-[0.18em] text-red-300"
                                                    style={{ textShadow: '0 0 8px rgba(239,68,68,0.8)' }}
                                                >
                                                    Bust
                                                </span>
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ─── Betting Circle (below cards) ─── */}
            <motion.div
                layout
                role="button"
                tabIndex={isBetting ? 0 : -1}
                aria-label={
                    !seat.isActive 
                        ? `Seat ${seatId}: Currently inactive. Activate to play.` 
                        : `Seat ${seatId}: ${totalBet > 0 ? `Current bet $${totalBet}` : 'Place bet'}`
                }
                onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && isBetting) {
                        e.preventDefault();
                        handleClick();
                    }
                }}
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
                                {(hand.isFreeActionSplit || hand.isFreeActionDouble) && (
                                    <span className="text-emerald-400 text-[5px] font-black uppercase mb-0.5 tracking-wider bg-emerald-900/50 px-1 rounded-sm border border-emerald-500/30">
                                        {hand.isFreeActionDouble ? 'FA DBL' : 'FA SPL'}
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

                {/* Glow ring for insurance decision */}
                {isInsuranceTurn && (
                    <motion.div className="absolute inset-[-4px] rounded-full border-2 border-yellow-400/60"
                        style={{ boxShadow: '0 0 20px rgba(250,204,21,0.3)' }}
                        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                    />
                )}

                {/* Keyboard/Gamepad Focus Ring */}
                {isFocusedSeat && (
                    <motion.div className="absolute inset-[-4px] rounded-full border-[3px] border-white/70 border-dashed"
                        style={{ boxShadow: '0 0 15px rgba(255,255,255,0.2)' }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
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
