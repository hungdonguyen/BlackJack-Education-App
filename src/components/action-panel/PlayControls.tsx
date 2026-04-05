import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/hooks/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { Zap, ArrowLeftRight, Flame, Flag, Sparkles } from 'lucide-react';
import { getRules } from '@/rules';
import { getRoomConfig } from '@/utils/rooms';
import { getExchange21Advice, SwitchAdviceEngine } from '@/utils/strategyAdvisor';
import { useAudio } from '@/utils/audio';
import { TurnTimer } from '../ActionTimers';
import { CircleButton, FreeCircleButton } from './ActionButtons';
import { HandStatus } from '@/types/enums';

export function PlayControls() {
    const { playSound } = useAudio();
    const seats = useGameStore(useShallow((s) => s.seats));
    const currentSeatIndex = useGameStore((s) => s.currentSeatIndex);
    const bankroll = useGameStore((s) => s.bankroll);
    const currentRoom = useGameStore((s) => s.currentRoom);
    const tutorialBalance = useGameStore((s) => s.tutorialBalance);
    
    const hit = useGameStore((s) => s.hit);
    const stand = useGameStore((s) => s.stand);
    const doubleDown = useGameStore((s) => s.doubleDown);
    const split = useGameStore((s) => s.split);
    const surrender = useGameStore((s) => s.surrender);
    const zap = useGameStore((s) => s.zap);
    const switchCards = useGameStore((s) => s.switchCards);
    const burn = useGameStore((s) => s.burn);
    
    const hoveredAction = useGameStore((s) => s.hoveredAction);
    const setHoveredAction = useGameStore((s) => s.setHoveredAction);
    
    const showSwitchAdvice = useGameStore((s) => s.showSwitchAdvice);
    const switchAdviceEngine = useGameStore((s) => s.switchAdviceEngine);
    const dealerHandCards = useGameStore(useShallow((s) => s.dealerHand.cards));

    const rules = getRules(currentRoom);
    const roomConfig = getRoomConfig(currentRoom);

    const currentBalance = (roomConfig.isTutorial ? tutorialBalance : bankroll) ?? 0;
    const currentSeat = seats[currentSeatIndex];
    const currentHand = currentSeat?.hands[currentSeat.currentHandIndex];
    
    const isPlaying = currentHand?.status === HandStatus.PLAYING;
    const isBJ = currentHand?.status === HandStatus.BLACKJACK;

    const isSingleCardStart = (roomConfig.gameRules.playerInitialCards ?? 2) === 1;
    const allowInfiniteDouble = !!roomConfig.gameRules.allowInfiniteDouble;

    const canHit = useMemo(() => {
        return isPlaying && (!currentHand?.isDoubleDown || allowInfiniteDouble);
    }, [isPlaying, currentHand?.isDoubleDown, allowInfiniteDouble]);

    const canSwitchHand = useMemo(() => {
        if (currentSeat && rules.canSwitch) {
            return rules.canSwitch(currentSeat).allowed;
        }
        return false;
    }, [currentSeat, rules]);

    const canStand = useMemo(() => {
        return (isPlaying || (isBJ && canSwitchHand)) && !(isSingleCardStart && currentHand?.cards.length === 1);
    }, [isPlaying, isBJ, canSwitchHand, isSingleCardStart, currentHand?.cards.length]);

    const { canDbl, isDblFree } = useMemo(() => {
        if (isPlaying && currentHand) {
            const result = rules.canDoubleDown(currentHand);
            return {
                isDblFree: result.isFree,
                canDbl: result.allowed && (result.isFree || currentBalance >= result.cost)
            };
        }
        return { canDbl: false, isDblFree: false };
    }, [isPlaying, currentHand, rules, currentBalance]);

    const { canSpl, isSplFree } = useMemo(() => {
        if (isPlaying && currentHand) {
            const result = rules.canSplit(currentHand, currentSeat?.hands.length || 0);
            return {
                isSplFree: result.isFree,
                canSpl: result.allowed && (result.isFree || currentBalance >= result.cost)
            };
        }
        return { canSpl: false, isSplFree: false };
    }, [isPlaying, currentHand, currentSeat?.hands.length, rules, currentBalance]);

    const canSur = useMemo(() => {
        if (isPlaying && currentHand) {
            return rules.canSurrender(currentHand).allowed;
        }
        return false;
    }, [isPlaying, currentHand, rules]);

    const canZapHand = useMemo(() => {
        if (isPlaying && currentHand && rules.canZap) {
            return rules.canZap(currentHand).allowed;
        }
        return false;
    }, [isPlaying, currentHand, rules]);

    const { canBurnHand, burnCost } = useMemo(() => {
        if (isPlaying && currentHand && rules.canBurn) {
            const result = rules.canBurn(currentHand);
            return {
                canBurnHand: result.allowed && currentBalance >= result.cost,
                burnCost: result.cost
            };
        }
        return { canBurnHand: false, burnCost: 0 };
    }, [isPlaying, currentHand, rules, currentBalance]);

    const isExchangeRoom = currentRoom === 'exchange_21' || currentRoom === 'tutorial_exchange';
    const effectiveSwitchAdviceEngine: SwitchAdviceEngine = currentRoom === 'tutorial_exchange' ? 'cindy_advanced' : switchAdviceEngine;

    const exchangeAdvice = useMemo(() => {
        if (canSwitchHand && currentSeat && showSwitchAdvice && isExchangeRoom && currentSeat.hands.length === 2) {
            return getExchange21Advice(
                currentSeat.hands[0].cards,
                currentSeat.hands[1].cards,
                dealerHandCards[0]?.rank || '2',
                effectiveSwitchAdviceEngine,
            );
        }
        return null;
    }, [canSwitchHand, currentSeat, showSwitchAdvice, isExchangeRoom, dealerHandCards, effectiveSwitchAdviceEngine]);

    return (
        <motion.div
            key="player-turn"
            className="flex flex-col items-center gap-3"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
            <TurnTimer />
            
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
                        onClick={() => { playSound('click'); doubleDown(); }} disabled={!canDbl} size={50} ariaLabel="Double Down (Free)"
                        isFocused={hoveredAction === 'double'} />
                ) : (
                    <CircleButton id="action-double" label={`DOUBLE DOWN ($${currentHand?.betAmount})`} icon="2x" color="#f39c12" hoverColor="#f1c40f"
                        onClick={() => { playSound('click'); doubleDown(); }} disabled={!canDbl} size={45} ariaLabel="Double Down (2x Bet)"
                        isFocused={hoveredAction === 'double'} />
                )}

                <CircleButton id="action-hit" label="HIT" icon="+" color="#2ecc71" hoverColor="#27ae60"
                    onClick={() => { playSound('click'); hit(); }} disabled={!canHit} size={53} ariaLabel="Hit (Draw Card)"
                    isFocused={hoveredAction === 'hit'} />
                
                <CircleButton id="action-stand" label="STAND" icon="−" color="#e74c3c" hoverColor="#c0392b"
                    onClick={() => { playSound('click'); stand(); }} disabled={!canStand} size={53} ariaLabel="Stand (End Turn)"
                    isFocused={hoveredAction === 'stand'} />

                {isSplFree ? (
                    <FreeCircleButton id="action-split" label="FREE ACTION SPLIT" icon={<Zap className="w-4 h-4" />}
                        onClick={() => { playSound('click'); split(); }} disabled={!canSpl} size={50} ariaLabel="Split Hand (Free)"
                        isFocused={hoveredAction === 'split'} />
                ) : (
                    <CircleButton id="action-split" label="SPLIT" icon="⟺" color="#3498db" hoverColor="#2980b9"
                        onClick={() => { playSound('click'); split(); }} disabled={!canSpl} size={45} ariaLabel="Split Hand"
                        isFocused={hoveredAction === 'split'} />
                )}

                {roomConfig.gameRules.allowSurrender && (
                    <CircleButton id="action-surrender" label="SURRENDER" icon={<Flag className="w-4 h-4" />} color="#9b59b6" hoverColor="#8e44ad"
                        onClick={() => { playSound('click'); surrender(); }} disabled={!canSur} size={45} ariaLabel="Surrender Hand"
                        isFocused={hoveredAction === 'surrender'} />
                )}

                {rules.canZap && (
                    <CircleButton id="action-zapout" label="ZAP OUT" icon={<Zap className="w-5 h-5 text-white animate-pulse" />} color="#3b82f6" hoverColor="#2563eb"
                        onClick={() => { playSound('card-slide'); setHoveredAction(null); zap(); }} disabled={!canZapHand} size={45} ariaLabel="Zap Out"
                        onMouseEnter={() => setHoveredAction('zap')} onMouseLeave={() => setHoveredAction(null)}
                        isFocused={hoveredAction === 'zap'} />
                )}

                {rules.canSwitch && (
                    showSwitchAdvice && exchangeAdvice?.shouldSwitch ? (
                        <FreeCircleButton id="action-switch" label="ADVISED" icon={<ArrowLeftRight className="w-5 h-5 text-black" />} 
                            onClick={() => { playSound('card-slide'); setHoveredAction(null); switchCards(); }} disabled={!canSwitchHand} size={50} ariaLabel="Switch Cards (Advised)"
                            onMouseEnter={() => setHoveredAction('switch')} onMouseLeave={() => setHoveredAction(null)}
                            isFocused={hoveredAction === 'switch'} />
                    ) : (
                        <CircleButton id="action-switch" label="SWITCH" icon={<ArrowLeftRight className="w-5 h-5 text-white" />} color="#64748b" hoverColor="#475569"
                            onClick={() => { playSound('card-slide'); setHoveredAction(null); switchCards(); }} disabled={!canSwitchHand} size={45} ariaLabel="Switch Cards"
                            onMouseEnter={() => setHoveredAction('switch')} onMouseLeave={() => setHoveredAction(null)}
                            isFocused={hoveredAction === 'switch'} />
                    )
                )}

                {rules.canBurn && (
                    <CircleButton id="action-burn" label={`BURN ($${burnCost})`} icon={<Flame className="w-5 h-5 text-white" />} color="#f97316" hoverColor="#ea580c"
                        onClick={() => { playSound('card-slide'); setHoveredAction(null); burn(); }} disabled={!canBurnHand} size={45} ariaLabel="Burn Card"
                        onMouseEnter={() => setHoveredAction('burn')} onMouseLeave={() => setHoveredAction(null)}
                        isFocused={hoveredAction === 'burn'} />
                )}
            </div>
        </motion.div>
    );
}
