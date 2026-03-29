'use client';

// ============================================
// HandAdvisor — real-time strategy + count deviations
// ============================================

import { useId, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, TrendingUp, FlaskConical } from 'lucide-react';
import { useGameStore } from '@/hooks/useGameStore';
import { getRules } from '@/rules';
import { GamePhase } from '@/types/enums';
import { calculateHandValue } from '@/utils/hand';
import { getRoomConfig } from '@/utils/rooms';
import { calculateTrueCountFromShoe, TrueCountResult } from '@/utils/cardCounting';
import {
    Deviation,
    getDeviation,
    getInsuranceIndex,
    shouldTakeInsurance,
} from '@/utils/countingDeviations';
import {
    ACTION_META,
    getCompositionDependentOverride,
    computeBustStats,
    getStrategyAction,
    normRank,
    type AdviceAction as Action,
} from '@/utils/strategyAdvisor';
import { getActiveCountingSystem } from '@/utils/countingAnalysis';

function RingGauge({ pct, color, size = 56 }: { pct: number; color: string; size?: number }) {
    const id = useId();
    const radius = (size - 10) / 2;
    const circumference = 2 * Math.PI * radius;
    const dash = (pct / 100) * circumference;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
            <defs>
                <filter id={`glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference}`}
                filter={`url(#glow-${id})`}
            />
        </svg>
    );
}

interface HandAdvisorProps {
    roomId: string;
    accentColor?: string;
    borderColor?: string;
    onOpenStrategy?: () => void;
}

export default function HandAdvisor({
    roomId,
    accentColor = '#d4a843',
    borderColor,
    onOpenStrategy,
}: HandAdvisorProps) {
    const gamePhase = useGameStore((state) => state.gamePhase);
    const seats = useGameStore((state) => state.seats);
    const dealerHand = useGameStore((state) => state.dealerHand);
    const currentSeatIndex = useGameStore((state) => state.currentSeatIndex);
    const shoe = useGameStore((state) => state.shoe);
    const showCardCounting = useGameStore((state) => state.showCardCounting);
    const userSystem = useGameStore((state) => state.countSystem);
    const showSpecialCases = useGameStore((state) => state.showSpecialCases);

    const activeSystem = getActiveCountingSystem(roomId, userSystem);
    const omitTens = roomId === 'iberian_21';
    const room = getRoomConfig(roomId);
    const isBeta = room.isBeta ?? false;
    const rules = getRules(roomId);
    const isVisible = (gamePhase === GamePhase.PLAYER_TURN || gamePhase === GamePhase.INSURANCE) &&
        (!room.isTutorial || roomId === 'tutorial_strategy' || roomId === 'tutorial_counting' || roomId === 'tutorial_multihand');

    const currentSeat = seats[currentSeatIndex];
    const currentHand = gamePhase === GamePhase.INSURANCE
        ? currentSeat?.hands.find((hand) => hand.betAmount > 0)
        : currentSeat?.hands[currentSeat.currentHandIndex];
    const dealerUpCard = dealerHand.cards.find((card) => !card.isHidden);
    const currentSeatHandsLength = currentSeat?.hands.length ?? 0;

    const [countAnalysis, setCountAnalysis] = useState<TrueCountResult>({ trueCount: 0, trueCountRaw: 0, runningCount: 0, decksRemaining: 0 });

    useEffect(() => {
        let isMounted = true;
        if (showCardCounting) {
            calculateTrueCountFromShoe(
                shoe,
                dealerHand.cards,
                seats,
                room.gameRules.numberOfDecks,
                activeSystem,
                omitTens
            ).then(res => {
                if (isMounted) setCountAnalysis(res);
            }).catch(console.error);
        }
        return () => { isMounted = false; };
    }, [showCardCounting, shoe, dealerHand.cards, seats, room.gameRules.numberOfDecks, activeSystem, omitTens]);

    const analysis = (() => {
        if (!currentHand || !dealerUpCard) return null;

        const cards = currentHand.cards;
        const { total, isSoft } = calculateHandValue(cards);

        if (gamePhase === GamePhase.INSURANCE) {
            const insuranceIndex = getInsuranceIndex(roomId, activeSystem);
            const action: Action = shouldTakeInsurance(countAnalysis.trueCount, roomId, activeSystem) ? 'INS' : 'NINS';

            return {
                total,
                isSoft,
                cards,
                bust: null,
                action,
                meta: ACTION_META[action],
                dealerNorm: normRank(dealerUpCard.rank),
                showBustRisk: false,
                cardCount: cards.length,
                deviation: null,
                basicAction: 'NINS' as Action,
                trueCount: countAnalysis.trueCount,
                isInsuranceAdvice: true,
                insuranceIndex,
            };
        }

        if (total >= 21) return null;

        const showBustRisk = total > 11;
        const bust = showBustRisk ? computeBustStats(cards, shoe) : null;
        const canSplitHand = rules.canSplit(currentHand, currentSeatHandsLength).allowed;
        const canSurrenderNow = rules.canSurrender(currentHand).allowed;
        const canDoubleNow = rules.canDoubleDown(currentHand).allowed;
        const canZapNow = rules.canZap ? rules.canZap(currentHand).allowed : false;
        const canBurnNow = rules.canBurn ? rules.canBurn(currentHand).allowed : false;

        const tableAction = getStrategyAction(
            cards,
            total,
            isSoft,
            dealerUpCard.rank,
            roomId,
            canDoubleNow,
            canSplitHand,
            canSurrenderNow,
            { resolveConditions: roomId !== 'iberian_21', canZap: canZapNow, canBurn: canBurnNow }
        );
        let compositionOverride = showSpecialCases
            ? getCompositionDependentOverride(
                cards,
                total,
                isSoft,
                dealerUpCard.rank,
                roomId,
            )
            : null;
        let topOverride = compositionOverride?.isTopOverride ? compositionOverride : null;
        const dealerNorm = normRank(dealerUpCard.rank);

        const basicAction = tableAction;
        let action: Action = basicAction;
        let deviation: Deviation | null = null;
        const trueCount = countAnalysis.trueCount;

        if (!topOverride && showCardCounting) {
            deviation = getDeviation(
                total,
                isSoft,
                canSplitHand,
                dealerNorm,
                trueCount,
                room.gameRules.dealerHitsSoft17,
                room.gameRules.allowSurrender,
                roomId,
                activeSystem,
            );

            if (deviation) {
                action = deviation.deviationAction as Action;

                if ((action === 'D' || action === 'FD') && !canDoubleNow) action = 'H';
                if (action === 'DS' && !canDoubleNow) action = 'S';
                if ((action === 'SP' || action === 'FSP') && !canSplitHand) action = basicAction;
                if (action === 'SU' && !canSurrenderNow) action = basicAction;

                if (action === basicAction) {
                    deviation = null;
                }
            }
        }

        if (topOverride) {
            action = topOverride.action;

            if ((action === 'D' || action === 'FD') && !canDoubleNow) action = basicAction;
            if (action === 'DS' && !canDoubleNow) action = basicAction;
            if ((action === 'SP' || action === 'FSP') && !canSplitHand) action = basicAction;
            if (action === 'SU' && !canSurrenderNow) action = basicAction;
        }

        if (currentHand?.isDoubleDown && roomId !== 'madness_21') {
            // Double Down Rescue semantics: 
            // We only want to rescue a doubled hand if we caught a bad card and are forced to stand with terrible expectation.
            // A good approximation of mathematically correct rescue spots in Spanish/Iberian 21:
            // Rescue hard/soft 12-16 vs dealer 8, 9, 10, A. Rescue 17 vs A.
            const isStrongDealer = ['8', '9', '10', 'A'].includes(dealerNorm);
            const isWorstStiff = total >= 12 && total <= 16 && isStrongDealer;
            const is17vsAce = total === 17 && dealerNorm === 'A';

            if ((isWorstStiff || is17vsAce) && canSurrenderNow) {
                action = 'RS';
            } else {
                action = 'S';
            }
            deviation = null;
            topOverride = null;
            compositionOverride = null;
        }

        return {
            total,
            isSoft,
            cards,
            bust,
            action,
            meta: ACTION_META[action],
            dealerNorm,
            showBustRisk,
            cardCount: cards.length,
            specialCaseChangesAdvice: Boolean(compositionOverride) && action !== tableAction,
            deviation,
            basicAction,
            tableAction,
            compositionOverride,
            topOverride,
            trueCount,
            isInsuranceAdvice: false,
            insuranceIndex: null,
        };
    })();

    const border = borderColor ?? `${accentColor}30`;
    const sectionTitle = analysis?.isInsuranceAdvice
        ? 'Insurance Advice'
        : analysis?.topOverride && analysis?.specialCaseChangesAdvice
            ? 'Special Case'
            : analysis?.deviation
                ? 'Count Deviation'
                : 'Strategy Advice';
    const actionBadgeLabel = analysis?.meta.shortLabel ?? '';
    const isLongActionBadge = actionBadgeLabel.length > 3;

    return (
        <AnimatePresence>
            {isVisible && analysis && (
                <motion.div
                    key="hand-advisor"
                    className="w-60 rounded-2xl overflow-hidden flex flex-col"
                    style={{
                        background: 'linear-gradient(180deg, rgba(12,7,4,0.97) 0%, rgba(8,5,3,0.97) 100%)',
                        backdropFilter: 'blur(14px)',
                        border: `1px solid ${border}`,
                        boxShadow: `0 0 40px ${accentColor}18, 0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)`,
                    }}
                    initial={{ opacity: 0, y: -12, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                >
                    <div
                        className="flex items-center justify-between px-3.5 py-2"
                        style={{ background: `linear-gradient(90deg, ${accentColor}18, transparent)`, borderBottom: `1px solid ${accentColor}15` }}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black uppercase tracking-[0.22em] font-sans" style={{ color: 'rgba(220,200,170,0.8)' }}>
                                Hand Advisor
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accentColor }} />
                            <span className="text-[10px] font-bold uppercase tracking-[0.18em] font-sans" style={{ color: `${accentColor}90` }}>LIVE</span>
                        </div>
                    </div>

                    {analysis.showBustRisk && analysis.bust && (
                        <>
                            <div className="px-3.5 pt-3 pb-2.5">
                                <div className="flex items-center gap-1.5 mb-2.5">
                                    <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${accentColor}40, transparent)` }} />
                                    <span className="text-[9px] font-black uppercase tracking-[0.28em] text-white/30 font-sans">Bust Risk</span>
                                    <div className="h-px flex-1" style={{ background: `linear-gradient(270deg, ${accentColor}40, transparent)` }} />
                                </div>

                                <div className="flex items-center justify-around">
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="relative flex items-center justify-center" style={{ width: 56, height: 56 }}>
                                            <RingGauge pct={analysis.bust.bustPct} color="#ef4444" size={56} />
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-[13px] font-black tabular-nums leading-none font-sans" style={{ color: '#fca5a5' }}>
                                                    {Math.round(analysis.bust.bustPct)}
                                                    <span className="text-[9px]">%</span>
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-400/70 font-sans">Bust</span>
                                    </div>

                                    <div className="flex flex-col items-center gap-0.5 opacity-30 mt-2">
                                        <span className="text-white/40 text-[9px]">♦</span>
                                        <div className="w-px h-6 bg-white/10" />
                                        <span className="text-white/40 text-[9px]">♦</span>
                                    </div>

                                    <div className="flex flex-col items-center gap-1">
                                        <div className="relative flex items-center justify-center" style={{ width: 56, height: 56 }}>
                                            <RingGauge pct={analysis.bust.improvePct} color="#22c55e" size={56} />
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-[13px] font-black tabular-nums leading-none font-sans" style={{ color: '#86efac' }}>
                                                    {Math.round(analysis.bust.improvePct)}
                                                    <span className="text-[9px]">%</span>
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-green-400/70 font-sans">Safe</span>
                                    </div>
                                </div>

                                <p className="text-center mt-3 text-[9px] font-bold tracking-[0.08em] font-sans" style={{ color: 'rgba(180,155,110,0.6)' }}>
                                    Based on {analysis.bust.total} cards remaining in shoe
                                    {analysis.cardCount >= 3 && ` · ${analysis.cardCount} cards in hand`}
                                </p>

                                <div className="mt-2">
                                    <div className="flex justify-between text-[7px] text-white/25 font-bold uppercase tracking-widest mb-1">
                                        <span>{analysis.bust.bustCount} bust</span>
                                        <span>{analysis.bust.safeCount} safe</span>
                                    </div>
                                    <div className="h-1.5 rounded-full overflow-hidden bg-white/5">
                                        <motion.div
                                            className="h-full rounded-full"
                                            style={{ background: 'linear-gradient(90deg, #ef4444, #f97316)' }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${analysis.bust.bustPct}%` }}
                                            transition={{ duration: 0.6, ease: 'easeOut' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 px-3.5 py-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                <div className="h-px flex-1 bg-white/5" />
                                <span className="text-[8px] opacity-20">♣</span>
                                <span className="text-[6px] opacity-10">♥</span>
                                <span className="text-[8px] opacity-20">♣</span>
                                <div className="h-px flex-1 bg-white/5" />
                            </div>
                        </>
                    )}

                    <div className="px-3.5 pt-2 pb-3.5">
                        <div className="flex items-center gap-1.5 mb-2.5">
                            <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${accentColor}40, transparent)` }} />
                            <span className="max-w-[6.8rem] text-center text-[9px] leading-tight font-black uppercase tracking-[0.22em] text-white/30 font-sans whitespace-normal wrap-break-word">
                                {sectionTitle}
                            </span>
                            <div className="h-px flex-1" style={{ background: `linear-gradient(270deg, ${accentColor}40, transparent)` }} />
                        </div>

                        {analysis.deviation && (
                            <motion.div
                                className="rounded-lg px-2.5 py-2 mb-2.5 flex flex-col gap-1.5"
                                style={{
                                    background: 'rgba(245,158,11,0.12)',
                                    border: '1px solid rgba(245,158,11,0.35)',
                                    boxShadow: '0 0 16px rgba(245,158,11,0.15)',
                                }}
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="flex items-center gap-1.5">
                                    <TrendingUp size={12} className="text-amber-400 shrink-0" />
                                    <span className="text-[8px] font-black uppercase tracking-[0.15em] text-amber-400">
                                        {analysis.deviation.id.startsWith('I18') ? 'Illustrious 18' : analysis.deviation.id.startsWith('F4') ? 'Fab 4' : 'Deviation'}
                                        {' — Rule #'}{analysis.deviation.id.split('-')[1]}
                                    </span>
                                </div>
                                <p className="text-[8.5px] font-bold text-amber-200/80 leading-snug">
                                    {analysis.deviation.description}
                                </p>
                                <div className="flex items-center gap-1 text-[8px] font-bold text-amber-300/60">
                                    <span>TC {analysis.trueCount > 0 ? '+' : ''}{analysis.trueCount % 1 === 0 ? analysis.trueCount : analysis.trueCount.toFixed(1)}</span>
                                    <span className="text-amber-400/40">•</span>
                                    <span>Index {analysis.deviation.direction === 'gte' ? '≥' : '<'} {analysis.deviation.index > 0 ? '+' : ''}{analysis.deviation.index}</span>
                                    <span className="text-amber-400/40">•</span>
                                    <span className="line-through opacity-50">{ACTION_META[analysis.basicAction as Action]?.shortLabel ?? analysis.basicAction}</span>
                                    <span>→</span>
                                    <span className="text-amber-300 font-black">{analysis.meta.shortLabel}</span>
                                </div>
                            </motion.div>
                        )}

                        {analysis.topOverride && analysis.specialCaseChangesAdvice && !analysis.deviation && (
                            <motion.div
                                className="rounded-lg px-2.5 py-2 mb-2.5 flex flex-col gap-1.5"
                                style={{
                                    background: 'rgba(59,130,246,0.12)',
                                    border: '1px solid rgba(96,165,250,0.35)',
                                    boxShadow: '0 0 16px rgba(59,130,246,0.14)',
                                }}
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="flex items-center gap-1.5">
                                    <Info size={12} className="text-sky-300 shrink-0" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-sky-300">
                                        Walker Special Case
                                    </span>
                                </div>
                                <p className="text-[10px] font-bold text-sky-100/85 leading-snug">
                                    {analysis.topOverride.title}
                                </p>
                                <p className="text-[9px] font-bold text-sky-200/75 leading-snug">
                                    {analysis.topOverride.trigger}
                                </p>
                                <div className="flex items-center gap-1 text-[9px] font-bold text-sky-200/70">
                                    <span>{analysis.cardCount} cards</span>
                                    <span className="text-sky-300/40">•</span>
                                    <span className="line-through opacity-50">{ACTION_META[analysis.tableAction as Action]?.shortLabel ?? analysis.tableAction}</span>
                                    <span>→</span>
                                    <span className="text-sky-200 font-black">{analysis.meta.shortLabel}</span>
                                </div>
                                <p className="text-[8.5px] font-semibold text-sky-200/55 leading-snug">
                                    Walker reference
                                </p>
                            </motion.div>
                        )}

                        {analysis.compositionOverride && (!analysis.topOverride || !analysis.specialCaseChangesAdvice) && (
                            <motion.div
                                className="rounded-lg px-2.5 py-2 mb-2.5"
                                style={{
                                    background: 'rgba(59,130,246,0.09)',
                                    border: '1px solid rgba(96,165,250,0.22)',
                                    boxShadow: '0 0 12px rgba(59,130,246,0.08)',
                                }}
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <p className="flex items-center gap-1.5 text-[9px] font-semibold leading-snug text-sky-200/80">
                                    <Info size={12} className="text-sky-300 shrink-0" />
                                    Walker also recommends {ACTION_META[analysis.compositionOverride.action]?.label.toLowerCase() ?? analysis.compositionOverride.action.toLowerCase()}.
                                </p>
                            </motion.div>
                        )}

                        {analysis.isInsuranceAdvice && showCardCounting && (
                            <motion.div
                                className="rounded-lg px-2.5 py-2 mb-2.5 flex flex-col gap-1.5"
                                style={{
                                    background: 'rgba(245,158,11,0.12)',
                                    border: '1px solid rgba(245,158,11,0.35)',
                                    boxShadow: '0 0 16px rgba(245,158,11,0.15)',
                                }}
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="flex items-center gap-1.5">
                                    <TrendingUp size={12} className="text-amber-400 shrink-0" />
                                    <span className="text-[8px] font-black uppercase tracking-[0.15em] text-amber-400">
                                        Insurance Index
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 text-[8px] font-bold text-amber-300/70">
                                    <span>TC {analysis.trueCount > 0 ? '+' : ''}{analysis.trueCount}</span>
                                    <span className="text-amber-400/40">•</span>
                                    <span>Index ≥ {analysis.insuranceIndex !== null && analysis.insuranceIndex > 0 ? '+' : ''}{analysis.insuranceIndex ?? 0}</span>
                                </div>
                            </motion.div>
                        )}

                        <motion.div
                            key={analysis.action}
                            className="rounded-xl px-3 py-2.5 flex items-center gap-3"
                            style={{
                                background: analysis.deviation ? 'rgba(245,158,11,0.15)' : analysis.meta.bg,
                                border: `1px solid ${analysis.deviation ? 'rgba(245,158,11,0.45)' : analysis.meta.border}`,
                                boxShadow: `0 0 20px ${analysis.deviation ? 'rgba(245,158,11,0.25)' : analysis.meta.glow}`,
                            }}
                            initial={{ scale: 0.92, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                        >
                            <div
                                className={`shrink-0 h-10 rounded-lg flex items-center justify-center font-black leading-none text-center ${isLongActionBadge ? 'min-w-[3.9rem] px-1.5' : 'w-10'}`}
                                style={{
                                    background: analysis.deviation ? 'rgba(245,158,11,0.25)' : `${analysis.meta.glow}`,
                                    border: `2px solid ${analysis.deviation ? 'rgba(245,158,11,0.5)' : analysis.meta.border}`,
                                    color: analysis.deviation ? '#fcd34d' : analysis.meta.color,
                                    textShadow: `0 0 12px ${analysis.deviation ? 'rgba(245,158,11,0.4)' : analysis.meta.glow}`,
                                    fontSize: isLongActionBadge ? '9px' : actionBadgeLabel.length > 1 ? '10px' : '16px',
                                    letterSpacing: '0.02em',
                                }}
                            >
                                {actionBadgeLabel}
                            </div>

                            <div className="flex flex-col gap-0.5 min-w-0">
                                <span className="font-black uppercase tracking-[0.12em] text-[13px] leading-tight whitespace-normal wrap-break-word font-sans" style={{ color: analysis.deviation ? '#fcd34d' : analysis.meta.color }}>
                                    {analysis.meta.label}
                                </span>
                                <span className="text-[10.5px] font-bold leading-tight font-sans" style={{ color: 'rgba(200,180,150,0.8)' }}>
                                    {analysis.meta.desc}
                                </span>
                            </div>
                        </motion.div>

                        <p
                            className="mt-3 px-1 font-sans leading-[1.55] font-semibold"
                            style={{
                                color: analysis.deviation
                                    ? 'rgba(245,185,100,0.8)'
                                    : analysis.compositionOverride
                                        ? 'rgba(186,216,255,0.82)'
                                        : 'rgba(180,155,110,0.7)',
                                fontSize: analysis.compositionOverride ? '11px' : '10px',
                            }}
                        >
                            {analysis.deviation
                                ? analysis.deviation.description
                                : analysis.compositionOverride
                                    ? analysis.topOverride
                                        ? analysis.specialCaseChangesAdvice
                                            ? 'Top Walker override applied for this exact hand pattern.'
                                            : analysis.meta.reasoning(analysis.total, analysis.isSoft, analysis.dealerNorm)
                                        : analysis.meta.reasoning(analysis.total, analysis.isSoft, analysis.dealerNorm)
                                    : analysis.meta.reasoning(analysis.total, analysis.isSoft, analysis.dealerNorm)
                            }
                        </p>

                        <div className="flex items-center justify-between mt-2.5 px-1">
                            <div className="flex items-center gap-1">
                                <span className="text-[7px] uppercase tracking-[0.12em] text-white/20 font-bold">Your Hand</span>
                                <span className="text-[9px] font-black tabular-nums" style={{ color: accentColor }}>
                                    {analysis.isSoft && analysis.total <= 20
                                        ? `${analysis.total - 10}/${analysis.total}`
                                        : analysis.total}
                                    {analysis.isSoft ? ' ♞' : ''}
                                </span>
                            </div>
                            <span className="text-white/20 text-[8px]">vs</span>
                            <div className="flex items-center gap-1">
                                <span className="text-[8px] uppercase tracking-[0.12em] text-white/30 font-bold font-sans">Dealer</span>
                                <span className="text-[11px] font-black tabular-nums text-white/70">{analysis.dealerNorm}</span>
                            </div>
                        </div>

                        {/* Under Development Banner for Beta Rooms */}
                        {isBeta && (
                            <motion.div
                                className="rounded-xl px-3 py-2.5 mb-2.5 flex items-start gap-2.5"
                                style={{
                                    background: 'rgba(251,146,60,0.1)',
                                    border: '1px solid rgba(251,146,60,0.3)',
                                }}
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <FlaskConical size={13} className="text-orange-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-400">Under Development</p>
                                    <p className="text-[8px] text-orange-300/60 font-semibold mt-0.5 leading-snug">Strategy for this variant is still being calibrated</p>
                                </div>
                            </motion.div>
                        )}

                        <div id="strategy-module" className="flex items-center justify-center mt-2 pt-3 border-t border-white/5 font-sans" onClick={onOpenStrategy}>
                            <span className="text-[9px] uppercase tracking-wider text-white/40 font-bold flex items-center gap-1.5 cursor-pointer hover:text-white/70 transition-colors">
                                <Info size={11} /> Find out more details in Strategy
                            </span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}