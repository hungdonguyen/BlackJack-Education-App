'use client';

// ============================================
// ActionPanel — hide buttons until bet placed, circular action buttons
// ============================================

import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/hooks/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { GamePhase, HandStatus } from '@/types/enums';
import { Shield, Check, X, Undo2, Spade, Home, Sparkles, Flag, Zap, ArrowLeftRight, Flame } from 'lucide-react';
import { getRules } from '@/rules';
import { getRoomConfig } from '@/utils/rooms';
import { TurnTimer, InsuranceTimer } from './ActionTimers';
import React, { useMemo } from 'react';
import { useAudio } from '@/utils/audio';
import { getExchange21Advice, ExchangeAdvice } from '@/utils/strategyAdvisor';
import { useRouter } from 'next/navigation';
import { BEGINNER_TUTORIAL_LESSONS, DOUBLE_TUTORIAL_LESSONS, STRATEGY_TUTORIAL_LESSONS } from '@/utils/tutorialData';

const ActionPanel = React.memo(function ActionPanel({ currentInsuranceSeat }: { currentInsuranceSeat?: number }) {
    const router = useRouter();
    const gamePhase = useGameStore((s) => s.gamePhase);
    const seats = useGameStore(useShallow((s) => s.seats));
    const currentSeatIndex = useGameStore((s) => s.currentSeatIndex);
    const bankroll = useGameStore((s) => s.bankroll);
    const currentRoom = useGameStore((s) => s.currentRoom);
    const tutorialBalance = useGameStore((s) => s.tutorialBalance);
    const betHistory = useGameStore(useShallow((s) => s.betHistory));
    const hit = useGameStore((s) => s.hit);
    const stand = useGameStore((s) => s.stand);
    const doubleDown = useGameStore((s) => s.doubleDown);
    const split = useGameStore((s) => s.split);
    const surrender = useGameStore((s) => s.surrender);
    const zap = useGameStore((s) => s.zap);
    const switchCards = useGameStore((s) => s.switchCards);
    const burn = useGameStore((s) => s.burn);
    const setHoveredAction = useGameStore((s) => s.setHoveredAction);
    const startDeal = useGameStore((s) => s.startDeal);
    const resetRound = useGameStore((s) => s.resetRound);
    const undoBet = useGameStore((s) => s.undoBet);
    const clearAllBets = useGameStore((s) => s.clearAllBets);
    const rebet = useGameStore((s) => s.rebet);
    const acceptInsurance = useGameStore((s) => s.acceptInsurance);
    const declineInsurance = useGameStore((s) => s.declineInsurance);
    const tutorialRound = useGameStore((s) => s.tutorialRound);
    
    let lessons = BEGINNER_TUTORIAL_LESSONS;
    if (currentRoom === 'tutorial_double') lessons = DOUBLE_TUTORIAL_LESSONS;
    else if (currentRoom === 'tutorial_strategy') lessons = STRATEGY_TUTORIAL_LESSONS;

    const isLastTutorialLesson = tutorialRound >= lessons.length - 1;
    
    const resetTutorialProgress = useGameStore((s) => s.resetTutorialProgress);
    const setTutorialStep = useGameStore((s) => s.setTutorialStep);
    const { playSound } = useAudio();

    const isPlayerTurn = gamePhase === GamePhase.PLAYER_TURN;
    const isBetting = gamePhase === GamePhase.BETTING;
    const isPayout = gamePhase === GamePhase.PAYOUT;
    const isDealing = gamePhase === GamePhase.DEALING;
    const isDealerTurn = gamePhase === GamePhase.DEALER_TURN;
    const isInsurance = gamePhase === GamePhase.INSURANCE;

    const currentSeat = seats[currentSeatIndex];
    const currentHand = currentSeat?.hands[currentSeat.currentHandIndex];
    const isPlaying = currentHand?.status === HandStatus.PLAYING;
    const isBJ = currentHand?.status === HandStatus.BLACKJACK;

    const showSwitchAdvice = useGameStore((s) => s.showSwitchAdvice);
    const switchAdviceEngine = useGameStore((s) => s.switchAdviceEngine);
    const rules = getRules(currentRoom);
    const roomConfig = getRoomConfig(currentRoom);
    const minBet = roomConfig.betRange[0];

    const currentBalance = (roomConfig.isTutorial ? tutorialBalance : bankroll) ?? 0;

    const isMadness = currentRoom === 'madness_21';


    const canHit = useMemo(() => {
        return isPlayerTurn && isPlaying && (!currentHand?.isDoubleDown || isMadness);
    }, [isPlayerTurn, isPlaying, currentHand?.isDoubleDown, isMadness]);

    const canSwitchHand = useMemo(() => {
        if (isPlayerTurn && currentSeat && rules.canSwitch) {
            return rules.canSwitch(currentSeat).allowed;
        }
        return false;
    }, [isPlayerTurn, currentSeat, rules]);

    const canStand = useMemo(() => {
        return isPlayerTurn && (isPlaying || (isBJ && canSwitchHand)) && !(isMadness && currentHand?.cards.length === 1);
    }, [isPlayerTurn, isPlaying, isBJ, canSwitchHand, isMadness, currentHand?.cards.length]);

    const { canDbl, isDblFree } = useMemo(() => {
        if (isPlayerTurn && isPlaying && currentHand) {
            const result = rules.canDoubleDown(currentHand);
            return {
                isDblFree: result.isFree,
                canDbl: result.allowed && (result.isFree || currentBalance >= result.cost)
            };
        }
        return { canDbl: false, isDblFree: false };
    }, [isPlayerTurn, isPlaying, currentHand, rules, currentBalance]);

    const { canSpl, isSplFree } = useMemo(() => {
        if (isPlayerTurn && isPlaying && currentHand) {
            const result = rules.canSplit(currentHand, currentSeat?.hands.length || 0);
            return {
                isSplFree: result.isFree,
                canSpl: result.allowed && (result.isFree || currentBalance >= result.cost)
            };
        }
        return { canSpl: false, isSplFree: false };
    }, [isPlayerTurn, isPlaying, currentHand, currentSeat?.hands.length, rules, currentBalance]);

    const canSur = useMemo(() => {
        if (isPlayerTurn && isPlaying && currentHand) {
            return rules.canSurrender(currentHand).allowed;
        }
        return false;
    }, [isPlayerTurn, isPlaying, currentHand, rules]);

    const canZapHand = useMemo(() => {
        if (isPlayerTurn && isPlaying && currentHand && rules.canZap) {
            return rules.canZap(currentHand).allowed;
        }
        return false;
    }, [isPlayerTurn, isPlaying, currentHand, rules]);

    const dealerHandCards = useGameStore(useShallow((s) => s.dealerHand.cards));

    const exchangeAdvice = useMemo(() => {
        if (canSwitchHand && currentSeat && showSwitchAdvice && currentRoom === 'exchange_21' && currentSeat.hands.length === 2) {
            return getExchange21Advice(
                currentSeat.hands[0].cards,
                currentSeat.hands[1].cards,
                dealerHandCards[0]?.rank || '2',
                switchAdviceEngine,
            );
        }
        return null;
    }, [canSwitchHand, currentSeat, showSwitchAdvice, currentRoom, dealerHandCards, switchAdviceEngine]);

    const { canBurnHand, burnCost } = useMemo(() => {
        if (isPlayerTurn && isPlaying && currentHand && rules.canBurn) {
            const result = rules.canBurn(currentHand);
            return {
                canBurnHand: result.allowed && currentBalance >= result.cost,
                burnCost: result.cost
            };
        }
        return { canBurnHand: false, burnCost: 0 };
    }, [isPlayerTurn, isPlaying, currentHand, rules, currentBalance]);


    // The game can start if at least one active seat places a minimum bet.
    // Empty seats will simply be skipped by startDeal().
    const activeSeatsList = seats.filter(s => s.isActive);
    const hasBets = activeSeatsList.some(s => {
        const totalSeatBet = s.hands.reduce((sum, h) => sum + h.betAmount, 0);
        return totalSeatBet >= minBet;
    });

    const hasUndo = betHistory.length > 0;
    const previousBets = useGameStore((s) => s.previousBets);
    const hasPreviousBets = previousBets && previousBets.length > 0;

    // Calculate total insurance cost for display
    // Calculate total insurance cost for display (per seat)
    const totalInsuranceCost = isInsurance && currentSeat
        ? (currentSeat.hands[0]?.betAmount ?? 0) / 2
        : 0;
    const canInsurance = currentBalance >= totalInsuranceCost;

    return (
        <div className="flex flex-col items-center" style={{ minHeight: '80px', justifyContent: 'center' }}>
            <AnimatePresence mode="wait">
                {/* ── Player Turn: Circular Action Buttons ── */}
                {isPlayerTurn && (
                    <motion.div
                        key="player-turn"
                        className="flex flex-col items-center gap-3"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    >
                        <TurnTimer />
                        
                        
                        {/* Switch Advisor Tip */}
                        {showSwitchAdvice && exchangeAdvice && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`px-4 py-2 rounded-xl border text-xs font-bold shadow-lg backdrop-blur-md mb-1 max-w-sm text-center
                                    ${exchangeAdvice.shouldSwitch 
                                        ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/50 shadow-emerald-500/20' 
                                        : 'bg-zinc-800/80 text-zinc-300 border-zinc-600'}`}
                            >
                                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span className="uppercase tracking-wider">{exchangeAdvice.shouldSwitch ? 'Switch Advised' : 'Stand Pat'}</span>
                                </div>
                                <div className="text-[9px] uppercase tracking-[0.14em] opacity-70 mb-0.5">{exchangeAdvice.engineLabel}</div>
                                <span className="opacity-80 ">{exchangeAdvice.reasoning}</span>
                            </motion.div>
                        )}

                        <div className="flex items-center gap-3">
                            {isDblFree ? (
                                <FreeCircleButton id="action-double" label="FREE ACTION DOUBLE" icon={<Zap className="w-4 h-4" />}
                                    onClick={() => { playSound('click'); doubleDown(); }} disabled={!canDbl} size={50} ariaLabel="Double Down (Free)" />
                            ) : (
                                <CircleButton id="action-double" label={`DOUBLE DOWN ($${currentHand?.betAmount})`} icon="2x" color="#f39c12" hoverColor="#f1c40f"
                                    onClick={() => { playSound('click'); doubleDown(); }} disabled={!canDbl} size={45} ariaLabel="Double Down (2x Bet)" />
                            )}

                            <CircleButton id="action-hit" label="HIT" icon="+" color="#2ecc71" hoverColor="#27ae60"
                                onClick={() => { playSound('click'); hit(); }} disabled={!canHit} size={53} ariaLabel="Hit (Draw Card)" />
                            <CircleButton id="action-stand" label="STAND" icon="−" color="#e74c3c" hoverColor="#c0392b"
                                onClick={() => { playSound('click'); stand(); }} disabled={!canStand} size={53} ariaLabel="Stand (End Turn)" />

                            {isSplFree ? (
                                <FreeCircleButton id="action-split" label="FREE ACTION SPLIT" icon={<Zap className="w-4 h-4" />}
                                    onClick={() => { playSound('click'); split(); }} disabled={!canSpl} size={50} ariaLabel="Split Hand (Free)" />
                            ) : (
                                <CircleButton id="action-split" label="SPLIT" icon="⟺" color="#3498db" hoverColor="#2980b9"
                                    onClick={() => { playSound('click'); split(); }} disabled={!canSpl} size={45} ariaLabel="Split Hand" />
                            )}

                            {roomConfig.gameRules.allowSurrender && (
                                <CircleButton label="SURRENDER" icon={<Flag className="w-4 h-4" />} color="#9b59b6" hoverColor="#8e44ad"
                                    onClick={() => { playSound('click'); surrender(); }} disabled={!canSur} size={45} ariaLabel="Surrender Hand" />
                            )}

                            {rules.canZap && (
                                <CircleButton label="ZAP OUT" icon={<Zap className="w-5 h-5 text-white animate-pulse" />} color="#3b82f6" hoverColor="#2563eb"
                                    onClick={() => { playSound('card-slide'); zap(); }} disabled={!canZapHand} size={45} ariaLabel="Zap Out"
                                    onMouseEnter={() => setHoveredAction('zap')} onMouseLeave={() => setHoveredAction(null)} />
                            )}

                            {rules.canSwitch && (
                                showSwitchAdvice && exchangeAdvice?.shouldSwitch ? (
                                    <FreeCircleButton label="ADVISED" icon={<ArrowLeftRight className="w-5 h-5 text-black" />} 
                                        onClick={() => { playSound('card-slide'); switchCards(); }} disabled={!canSwitchHand} size={50} ariaLabel="Switch Cards (Advised)"
                                        onMouseEnter={() => setHoveredAction('switch')} onMouseLeave={() => setHoveredAction(null)} />
                                ) : (
                                    <CircleButton label="SWITCH" icon={<ArrowLeftRight className="w-5 h-5 text-white" />} color="#64748b" hoverColor="#475569"
                                        onClick={() => { playSound('card-slide'); switchCards(); }} disabled={!canSwitchHand} size={45} ariaLabel="Switch Cards"
                                        onMouseEnter={() => setHoveredAction('switch')} onMouseLeave={() => setHoveredAction(null)} />
                                )
                            )}

                            {rules.canBurn && (
                                <CircleButton label={`BURN ($${burnCost})`} icon={<Flame className="w-5 h-5 text-white" />} color="#f97316" hoverColor="#ea580c"
                                    onClick={() => { playSound('card-slide'); burn(); }} disabled={!canBurnHand} size={45} ariaLabel="Burn Card"
                                    onMouseEnter={() => setHoveredAction('burn')} onMouseLeave={() => setHoveredAction(null)} />
                            )}
                        </div>
                    </motion.div>
                )}

                {/* ── Insurance Choice ── */}
                {isInsurance && (
                    <motion.div
                        key="insurance"
                        className="flex flex-col items-center gap-3"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    >
                        {/* Insurance timer */}
                        <InsuranceTimer />
                        

                        <div className="px-6 py-3 rounded-xl bg-black/60 backdrop-blur-md border border-yellow-400/20 text-center"
                            style={{ boxShadow: '0 0 30px rgba(250, 204, 21, 0.15)' }}
                        >
                            <p className="text-yellow-400 text-sm flex items-center justify-center font-extrabold uppercase tracking-[0.2em] mb-1">
                                <Shield className="w-4 h-4 mr-1.5" /> Insurance?
                            </p>
                            {currentInsuranceSeat && (
                                <p className="text-amber-300/80 text-[11px] font-bold uppercase tracking-wider mb-1">
                                    🎯 Seat {currentInsuranceSeat}
                                </p>
                            )}
                            <p className="text-white/40 text-[10px] mb-3">
                                Dealer shows Ace · Pays 2:1 if dealer has Blackjack
                            </p>
                            <p className="text-amber-300 text-xs font-bold mb-3 tabular-nums">
                                Cost: ${totalInsuranceCost} (half your bet)
                            </p>
                            <div className="flex items-center gap-3 justify-center">
                                <motion.button
                                    id="insurance-accept"
                                    onClick={() => { playSound('click'); acceptInsurance(); }}
                                    disabled={!canInsurance}
                                    className={`px-6 py-2.5 rounded-full font-extrabold text-xs uppercase tracking-wider transition-all
                                        ${canInsurance
                                            ? 'bg-linear-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 cursor-pointer'
                                            : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                                        }`}
                                    whileHover={canInsurance ? { scale: 1.05 } : {}}
                                    whileTap={canInsurance ? { scale: 0.95 } : {}}
                                >
                                    <Check className="w-3.5 h-3.5 mr-1" /> Accept
                                </motion.button>
                                <motion.button
                                    id="insurance-decline"
                                    onClick={() => { playSound('click'); declineInsurance(); }}
                                    className="px-6 py-2.5 rounded-full font-extrabold text-xs uppercase tracking-wider cursor-pointer
                                        bg-white/5 border border-white/15 text-white/60 hover:bg-white/10 hover:text-white/80 transition-all"
                                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                >
                                    <X className="w-3.5 h-3.5 mr-1" /> No Thanks
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── Betting Phase: Betting controls ── */}
                {isBetting && (
                    <motion.div
                        key="betting"
                        className="flex items-center gap-3"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                    >
                        {hasBets ? (
                            <>
                                <SmallButton id="action-undo" label="UNDO" icon={<Undo2 className="w-3.5 h-3.5" />} onClick={() => { playSound('chip-lay'); undoBet(); }} disabled={!hasUndo} variant="ghost" />
                                <SmallButton id="action-clear" label="CLEAR" icon={<X className="w-3.5 h-3.5" />} onClick={() => { playSound('chip-lay'); clearAllBets(); }} disabled={!hasBets} variant="danger" />
                                <SmallButton id="action-rebet-x2" label="x2" icon={<span className="text-sm">2x</span>} onClick={() => { playSound('chip-lay'); rebet(); }} disabled={false} variant="ghost" />
                                <motion.button
                                    id="deal-button"
                                    onClick={() => { playSound('card-slide'); startDeal(); }}
                                    disabled={!hasBets}
                                    className="px-8 py-3 rounded-full font-extrabold text-sm uppercase tracking-[0.2em] cursor-pointer
                                        bg-linear-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/30
                                        hover:shadow-emerald-500/50 hover:from-emerald-400 hover:to-emerald-500
                                        transition-all duration-300"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <div className="flex items-center justify-center"><Spade className="w-4 h-4 fill-current mr-1.5" /> DEAL</div>
                                </motion.button>
                            </>
                        ) : (
                            <div className="flex items-center" style={{ minHeight: '48px', marginTop: '10px' }}>
                                <SmallButton id="action-rebet" label="REBET" icon={<Undo2 className="w-3.5 h-3.5" />} onClick={() => { playSound('chip-lay'); rebet(); }} disabled={!hasPreviousBets} variant="ghost" />
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ── Dealing / Dealer Turn ── */}
                {(isDealing || isDealerTurn) && (
                    <motion.div
                        key="waiting"
                        className="px-6 py-3 rounded-full bg-black/50 backdrop-blur-sm border border-white/10"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                    >
                        <motion.span
                            className="text-sm font-bold uppercase tracking-[0.2em] text-amber-400/80"
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        >
                            {isDealing ? <div className="flex items-center"><Spade className="w-4 h-4 fill-current mr-2 animate-pulse" /> Dealing...</div> : <div className="flex items-center"><Home className="w-4 h-4 fill-current mr-2" /> Dealer Playing...</div>}
                        </motion.span>
                    </motion.div>
                )}

                {/* ── Payout ── */}
                {isPayout && (
                    isLastTutorialLesson ? (
                        <motion.button
                            key="payout"
                            id="finish-tutorial-button"
                            onClick={() => { resetTutorialProgress(); router.push('/tutorial-lobby'); }}
                            className="px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-[0.25em] cursor-pointer
                                bg-linear-to-br from-indigo-500 via-purple-500 to-pink-500 text-white
                                shadow-[0_0_30px_rgba(139,92,246,0.4),0_8px_20px_rgba(0,0,0,0.3)]
                                hover:shadow-[0_0_50px_rgba(139,92,246,0.6),0_12px_30px_rgba(0,0,0,0.4)]
                                hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400
                                border-2 border-indigo-300/30
                                transition-all duration-300 relative overflow-hidden"
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
                            className="px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-[0.25em] cursor-pointer
                                bg-linear-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white
                                shadow-[0_0_30px_rgba(16,185,129,0.4),0_8px_20px_rgba(0,0,0,0.3)]
                                hover:shadow-[0_0_50px_rgba(16,185,129,0.6),0_12px_30px_rgba(0,0,0,0.4)]
                                hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400
                                border-2 border-emerald-300/30
                                transition-all duration-300 relative overflow-hidden"
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
                    )
                )}
            </AnimatePresence>
        </div>
    );
});

export default ActionPanel;

interface CircleButtonProps {
    id?: string;
    label: string; icon: React.ReactNode; color: string; hoverColor: string;
    onClick: () => void; disabled: boolean; size: number;
    ariaLabel?: string;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

function CircleButton({ id, label, icon, color, hoverColor, onClick, disabled, size, ariaLabel, onMouseEnter, onMouseLeave }: CircleButtonProps) {
    return (
        <motion.button
            id={id}
            aria-label={ariaLabel || label}
            onClick={onClick} disabled={disabled}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className="flex flex-col items-center gap-1.5 cursor-pointer"
            style={{ opacity: disabled ? 0.2 : 1 }}
            whileHover={disabled ? {} : { scale: 1.12, y: -4 }}
            whileTap={disabled ? {} : { scale: 0.9 }}
        >
            <motion.div
                className="rounded-full flex items-center justify-center shadow-xl transition-shadow duration-300"
                style={{
                    width: size, height: size,
                    background: disabled ? 'rgba(100,100,100,0.3)' : `radial-gradient(circle at 35% 35%, ${hoverColor}, ${color})`,
                    boxShadow: disabled ? 'none' : `0 4px 20px ${color}66, 0 0 40px ${color}22, inset 0 1px 0 rgba(255,255,255,0.3)`,
                    border: `2px solid ${disabled ? 'rgba(100,100,100,0.2)' : color}`,
                }}
            >
                <span className="text-white font-black drop-shadow-md" style={{ fontSize: size * 0.35 }}>{icon}</span>
            </motion.div>
            <span className="text-[8px] font-bold text-white/50 uppercase tracking-wider whitespace-nowrap">{label}</span>
        </motion.button>
    );
}

// ── SmallButton ──
function SmallButton({ id, label, icon, onClick, disabled, variant }: {
    id?: string; label: string; icon: React.ReactNode; onClick: () => void; disabled: boolean; variant: 'ghost' | 'danger';
}) {
    const styles = variant === 'danger'
        ? 'border-red-500/30 text-red-400/70 hover:bg-red-500/10 hover:text-red-400'
        : 'border-white/10 text-white/40 hover:bg-white/10 hover:text-white/60';

    return (
        <motion.button
            id={id}
            onClick={onClick} disabled={disabled}
            className={`px-4 py-2 rounded-full border text-[11px] font-bold uppercase tracking-wider
                transition-all duration-200 cursor-pointer
                ${disabled ? 'opacity-20 cursor-not-allowed' : styles}`}
            whileHover={disabled ? {} : { scale: 1.05 }}
            whileTap={disabled ? {} : { scale: 0.95 }}
        >
            <span className="mr-1 flex items-center justify-center">{icon}</span>{label}
        </motion.button>
    );
}

// ── FreeCircleButton — Golden shimmer for FREE actions ──
interface FreeCircleButtonProps {
    id?: string;
    label: string; icon: React.ReactNode;
    onClick: () => void; disabled: boolean; size: number;
    ariaLabel?: string;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

function FreeCircleButton({ id, label, icon, onClick, disabled, size, ariaLabel, onMouseEnter, onMouseLeave }: FreeCircleButtonProps) {
    return (
        <motion.button
            id={id}
            onClick={onClick} disabled={disabled}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            aria-label={ariaLabel || label}
            className="flex flex-col items-center gap-1.5 cursor-pointer"
            style={{ opacity: disabled ? 0.2 : 1 }}
            whileHover={disabled ? {} : { scale: 1.15, y: -5 }}
            whileTap={disabled ? {} : { scale: 0.88 }}
        >
            <motion.div
                className="rounded-full flex items-center justify-center shadow-xl relative overflow-hidden"
                style={{
                    width: size, height: size,
                    background: disabled
                        ? 'rgba(100,100,100,0.3)'
                        : 'linear-gradient(135deg, #fcd34d 0%, #f59e0b 30%, #d97706 60%, #fbbf24 100%)',
                    boxShadow: disabled
                        ? 'none'
                        : '0 4px 25px rgba(251, 191, 36, 0.6), 0 0 50px rgba(234, 179, 8, 0.3), inset 0 1px 0 rgba(255,255,255,0.5)',
                    border: `2px solid ${disabled ? 'rgba(100,100,100,0.2)' : '#fcd34d'}`,
                }}
                animate={disabled ? {} : {
                    boxShadow: [
                        '0 4px 25px rgba(251, 191, 36, 0.6), 0 0 50px rgba(234, 179, 8, 0.3)',
                        '0 4px 35px rgba(251, 191, 36, 0.9), 0 0 70px rgba(234, 179, 8, 0.5)',
                        '0 4px 25px rgba(251, 191, 36, 0.6), 0 0 50px rgba(234, 179, 8, 0.3)',
                    ],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
            >
                {/* Shimmer sweep */}
                {!disabled && (
                    <motion.div
                        className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent"
                        initial={{ x: '-100%' }}
                        animate={{ x: '200%' }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    />
                )}
                <span className="text-black font-black drop-shadow-sm relative z-10" style={{ fontSize: size * 0.35 }}>{icon}</span>
            </motion.div>
            <span className="text-[8px] font-black text-yellow-400 uppercase tracking-wider whitespace-nowrap drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]">
                ✦ {label}
            </span>
        </motion.button>
    );
}

