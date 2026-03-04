'use client';

// ============================================
// CardCountingPanel — Hi-Lo Card Counting System
// Real-time running count, true count, and betting advice
// ============================================

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/hooks/useGameStore';
import { GamePhase, Rank } from '@/types/enums';
import { Card } from '@/types/game';

// ─── Hi-Lo Card Counting Values ───────────────────────────────────────────────
// 2-6: +1 (low cards, favorable when removed)
// 7-9:  0 (neutral)
// 10-A: -1 (high cards, favorable when in shoe)

function getHiLoValue(rank: Rank): number {
    switch (rank) {
        case Rank.TWO:
        case Rank.THREE:
        case Rank.FOUR:
        case Rank.FIVE:
        case Rank.SIX:
            return +1;
        case Rank.SEVEN:
        case Rank.EIGHT:
        case Rank.NINE:
            return 0;
        case Rank.TEN:
        case Rank.JACK:
        case Rank.QUEEN:
        case Rank.KING:
        case Rank.ACE:
            return -1;
        default:
            return 0;
    }
}

/** Collect all face-up (visible) cards from the current round */
function getAllVisibleCards(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    seats: any[],
    dealerCards: Card[],
): Card[] {
    const visible: Card[] = [];
    // Player cards
    for (const seat of seats) {
        if (seat.bet <= 0) continue;
        for (const hand of seat.hands) {
            for (const card of hand.cards) {
                if (!card.isHidden) visible.push(card);
            }
        }
    }
    // Dealer cards
    for (const card of dealerCards) {
        if (!card.isHidden) visible.push(card);
    }
    return visible;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CardCountingPanelProps {
    numDecks: number;
    accentColor?: string;
    borderColor?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CardCountingPanel({
    numDecks,
    accentColor = '#d4a843',
    borderColor,
}: CardCountingPanelProps) {
    const gamePhase = useGameStore((s) => s.gamePhase);
    const seats = useGameStore((s) => s.seats);
    const dealerHand = useGameStore((s) => s.dealerHand);
    const shoe = useGameStore((s) => s.shoe);

    const isVisible =
        gamePhase === GamePhase.PLAYER_TURN ||
        gamePhase === GamePhase.DEALER_TURN ||
        gamePhase === GamePhase.PAYOUT ||
        gamePhase === GamePhase.BETTING;

    const analysis = useMemo(() => {
        const totalCards = numDecks * 52;
        const cardsRemaining = shoe.length;
        const cardsDealt = totalCards - cardsRemaining;
        const decksRemaining = Math.max(cardsRemaining / 52, 0.5);

        // Compute running count from all visible cards this round
        const visibleCards = getAllVisibleCards(seats, dealerHand.cards);
        let runningCount = 0;

        // The running count should be based on ALL cards that have left the shoe
        // Since we know the shoe composition, we can compute:
        // Count = sum of Hi-Lo values of all dealt cards
        // dealt cards = original shoe - remaining shoe
        // But we don't have the original shoe saved — so instead, we compute
        // from the remaining shoe: RC = -(sum of Hi-Lo of remaining cards)
        // because a balanced shoe sums to 0.
        let shoeSum = 0;
        for (const card of shoe) {
            shoeSum += getHiLoValue(card.rank);
        }
        runningCount = -shoeSum; // balanced deck: total sum = 0, so dealt = -remaining

        const trueCount = runningCount / decksRemaining;

        // Betting advice based on true count
        let advice: { label: string; desc: string; color: string; bgColor: string };
        if (trueCount >= 5) {
            advice = {
                label: 'MAX BET',
                desc: 'Extremely favorable deck — Huge player edge. Increase bet 5-8× minimum',
                color: '#fcd34d',
                bgColor: 'rgba(234,179,8,0.15)',
            };
        } else if (trueCount >= 3) {
            advice = {
                label: 'HIGH BET',
                desc: 'Very favorable — Strong player advantage. Increase bet 3-5× minimum',
                color: '#86efac',
                bgColor: 'rgba(34,197,94,0.15)',
            };
        } else if (trueCount >= 1) {
            advice = {
                label: 'RAISE BET',
                desc: 'Slightly favorable — Increase bet 2-3× minimum',
                color: '#93c5fd',
                bgColor: 'rgba(59,130,246,0.15)',
            };
        } else if (trueCount >= -1) {
            advice = {
                label: 'FLAT BET',
                desc: 'Neutral deck — Bet minimum. No significant edge for either side',
                color: 'rgba(255,255,255,0.5)',
                bgColor: 'rgba(255,255,255,0.05)',
            };
        } else if (trueCount >= -3) {
            advice = {
                label: 'MIN BET',
                desc: 'Unfavorable — House edge is higher. Bet minimum or sit out',
                color: '#fca5a5',
                bgColor: 'rgba(239,68,68,0.12)',
            };
        } else {
            advice = {
                label: 'SIT OUT',
                desc: 'Very unfavorable deck — Strong house advantage. Bet minimum and wait for reshuffle',
                color: '#f87171',
                bgColor: 'rgba(239,68,68,0.18)',
            };
        }

        // Player edge estimate (rough): 0.5% per true count point above 0, base house edge ~0.5%
        const playerEdge = (trueCount * 0.5) - 0.5;

        return {
            runningCount,
            trueCount,
            decksRemaining,
            cardsDealt,
            cardsRemaining,
            advice,
            playerEdge,
            visibleThisRound: visibleCards.length,
        };
    }, [seats, dealerHand, shoe, numDecks]);

    const bdr = borderColor ?? `${accentColor}30`;

    // Gauge for true count: map -10..+10 to 0..100
    const tcPct = Math.min(Math.max((analysis.trueCount + 10) / 20, 0), 1) * 100;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    key="card-counting"
                    className="w-64 rounded-2xl overflow-hidden flex flex-col"
                    style={{
                        background: 'linear-gradient(180deg, rgba(12,7,4,0.97) 0%, rgba(8,5,3,0.97) 100%)',
                        backdropFilter: 'blur(14px)',
                        border: `1px solid ${bdr}`,
                        boxShadow: `0 0 40px ${accentColor}18, 0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)`,
                    }}
                    initial={{ opacity: 0, y: -12, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                >
                    {/* ── Header ── */}
                    <div
                        className="flex items-center justify-between px-3.5 py-2"
                        style={{
                            background: `linear-gradient(270deg, ${accentColor}18, transparent)`,
                            borderBottom: `1px solid ${accentColor}15`,
                        }}
                    >
                        <div className="flex items-center gap-2">
                            <div
                                className="w-5 h-5 rounded-md flex items-center justify-center"
                                style={{ background: `${accentColor}20`, border: `1px solid ${accentColor}35` }}
                            >
                                <span style={{ color: accentColor, fontSize: 11, fontWeight: 900 }}>🃏</span>
                            </div>
                            <span
                                className="text-[9.5px] font-black uppercase tracking-[0.22em]"
                                style={{ color: 'rgba(220,200,170,0.8)' }}
                            >
                                Card Count
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
                            <span className="text-[8px] font-bold uppercase tracking-[0.18em]" style={{ color: '#22c55e90' }}>
                                HI-LO
                            </span>
                        </div>
                    </div>

                    {/* ── Running Count & True Count ── */}
                    <div className="px-3.5 pt-3 pb-2.5">
                        <div className="flex items-center gap-1.5 mb-2.5">
                            <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${accentColor}40, transparent)` }} />
                            <span className="text-[7.5px] font-black uppercase tracking-[0.28em] text-white/30">Count</span>
                            <div className="h-px flex-1" style={{ background: `linear-gradient(270deg, ${accentColor}40, transparent)` }} />
                        </div>

                        <div className="flex items-center justify-around">
                            {/* Running Count */}
                            <div className="flex flex-col items-center gap-1">
                                <motion.span
                                    key={analysis.runningCount}
                                    className="text-2xl font-black tabular-nums leading-none"
                                    style={{
                                        color: analysis.runningCount > 0 ? '#86efac' : analysis.runningCount < 0 ? '#fca5a5' : 'rgba(255,255,255,0.5)',
                                    }}
                                    initial={{ scale: 1.2 }}
                                    animate={{ scale: 1 }}
                                >
                                    {analysis.runningCount > 0 ? '+' : ''}{analysis.runningCount}
                                </motion.span>
                                <span className="text-[7.5px] font-bold uppercase tracking-[0.18em] text-white/30">Running</span>
                            </div>

                            {/* Divider */}
                            <div className="flex flex-col items-center gap-0.5 opacity-30">
                                <span className="text-white/40 text-[9px]">♦</span>
                                <div className="w-px h-8 bg-white/10" />
                                <span className="text-white/40 text-[9px]">♦</span>
                            </div>

                            {/* True Count */}
                            <div className="flex flex-col items-center gap-1">
                                <motion.span
                                    key={Math.round(analysis.trueCount * 10)}
                                    className="text-2xl font-black tabular-nums leading-none"
                                    style={{
                                        color: analysis.trueCount > 0 ? '#86efac' : analysis.trueCount < 0 ? '#fca5a5' : 'rgba(255,255,255,0.5)',
                                    }}
                                    initial={{ scale: 1.2 }}
                                    animate={{ scale: 1 }}
                                >
                                    {analysis.trueCount > 0 ? '+' : ''}{analysis.trueCount.toFixed(1)}
                                </motion.span>
                                <span className="text-[7.5px] font-bold uppercase tracking-[0.18em] text-white/30">True</span>
                            </div>
                        </div>

                        {/* True Count Gauge */}
                        <div className="mt-3">
                            <div className="h-1.5 rounded-full overflow-hidden bg-white/5 relative">
                                {/* Center marker */}
                                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/20 z-10" />
                                <motion.div
                                    className="h-full rounded-full absolute top-0"
                                    style={{
                                        background: analysis.trueCount > 0
                                            ? 'linear-gradient(90deg, rgba(34,197,94,0.3), #22c55e)'
                                            : analysis.trueCount < 0
                                                ? 'linear-gradient(270deg, rgba(239,68,68,0.3), #ef4444)'
                                                : 'rgba(255,255,255,0.2)',
                                        left: analysis.trueCount >= 0 ? '50%' : undefined,
                                        right: analysis.trueCount < 0 ? '50%' : undefined,
                                        width: `${Math.abs(tcPct - 50)}%`,
                                    }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(Math.abs(tcPct - 50), 50)}%` }}
                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                />
                            </div>
                            <div className="flex justify-between text-[6px] text-white/15 font-bold uppercase tracking-wider mt-0.5">
                                <span>−10</span>
                                <span>0</span>
                                <span>+10</span>
                            </div>
                        </div>

                        {/* Deck info */}
                        <p className="text-center mt-1.5 text-[7px] font-semibold tracking-[0.08em]" style={{ color: 'rgba(180,155,110,0.5)' }}>
                            {analysis.decksRemaining.toFixed(1)} decks remaining · {analysis.cardsRemaining} cards
                        </p>
                    </div>

                    {/* Separator */}
                    <div className="flex items-center gap-1.5 px-3.5 py-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                        <div className="h-px flex-1 bg-white/5" />
                        <span className="text-[8px] opacity-20">♣</span>
                        <span className="text-[6px] opacity-10">♥</span>
                        <span className="text-[8px] opacity-20">♣</span>
                        <div className="h-px flex-1 bg-white/5" />
                    </div>

                    {/* ── Betting Advice ── */}
                    <div className="px-3.5 pt-2 pb-3">
                        <div className="flex items-center gap-1.5 mb-2.5">
                            <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${accentColor}40, transparent)` }} />
                            <span className="text-[7.5px] font-black uppercase tracking-[0.28em] text-white/30">Bet Advice</span>
                            <div className="h-px flex-1" style={{ background: `linear-gradient(270deg, ${accentColor}40, transparent)` }} />
                        </div>

                        <motion.div
                            key={analysis.advice.label}
                            className="rounded-xl px-3 py-2.5 flex items-center gap-3"
                            style={{
                                background: analysis.advice.bgColor,
                                border: `1px solid ${analysis.advice.color}40`,
                                boxShadow: `0 0 15px ${analysis.advice.color}15`,
                            }}
                            initial={{ scale: 0.92, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                        >
                            <div
                                className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-black text-[9px] leading-none uppercase tracking-wider"
                                style={{
                                    background: `${analysis.advice.color}20`,
                                    border: `2px solid ${analysis.advice.color}50`,
                                    color: analysis.advice.color,
                                }}
                            >
                                {analysis.advice.label.split(' ')[0]}
                            </div>
                            <div className="flex flex-col gap-0.5 min-w-0">
                                <span className="font-black uppercase tracking-[0.12em] text-[10px] leading-tight truncate" style={{ color: analysis.advice.color }}>
                                    {analysis.advice.label}
                                </span>
                                <span className="text-[7.5px] font-medium leading-tight" style={{ color: 'rgba(200,180,150,0.6)' }}>
                                    {analysis.advice.desc}
                                </span>
                            </div>
                        </motion.div>

                        {/* Player edge */}
                        <div className="flex items-center justify-between mt-2.5 px-1">
                            <div className="flex items-center gap-1">
                                <span className="text-[7px] uppercase tracking-[0.12em] text-white/20 font-bold">Player Edge</span>
                                <span
                                    className="text-[9px] font-black tabular-nums"
                                    style={{
                                        color: analysis.playerEdge > 0 ? '#86efac' : analysis.playerEdge < -1 ? '#fca5a5' : 'rgba(255,255,255,0.4)',
                                    }}
                                >
                                    {analysis.playerEdge > 0 ? '+' : ''}{analysis.playerEdge.toFixed(1)}%
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-[7px] uppercase tracking-[0.12em] text-white/20 font-bold">System</span>
                                <span className="text-[9px] font-black tabular-nums" style={{ color: accentColor }}>Hi-Lo</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
