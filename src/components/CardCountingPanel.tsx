'use client';

// ============================================
// CardCountingPanel — Hi-Lo Card Counting System
// Real-time running count, true count, and betting advice
// ============================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/hooks/useGameStore';
import { GamePhase } from '@/types/enums';
import { Info, FlaskConical } from 'lucide-react';
import { getCardCountingAnalysis, CardCountingAnalysis } from '@/utils/countingAnalysis';
import { getRoomConfig } from '@/utils/rooms';

// ─── Props ────────────────────────────────────────────────────────────────────

interface CardCountingPanelProps {
    roomId: string; // Added to check for Iberian 21
    numDecks: number;
    accentColor?: string;
    borderColor?: string;
    onOpenSettings?: () => void;
    onOpenStrategy?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CardCountingPanel({
    roomId,
    numDecks,
    accentColor = '#d4a843',
    borderColor,
    onOpenSettings,
    onOpenStrategy,
}: CardCountingPanelProps) {
    const gamePhase = useGameStore((s) => s.gamePhase);
    const seats = useGameStore((s) => s.seats);
    const dealerHand = useGameStore((s) => s.dealerHand);
    const shoe = useGameStore((s) => s.shoe);
    const userSystem = useGameStore((s) => s.countSystem);

    const isVisible =
        gamePhase === GamePhase.PLAYER_TURN ||
        gamePhase === GamePhase.INSURANCE ||
        gamePhase === GamePhase.DEALER_TURN ||
        gamePhase === GamePhase.PAYOUT ||
        gamePhase === GamePhase.BETTING;

    const [analysis, setAnalysis] = useState<CardCountingAnalysis | null>(null);

    useEffect(() => {
        let isMounted = true;
        getCardCountingAnalysis({
            roomId,
            numDecks,
            seats,
            dealerCards: dealerHand.cards,
            shoe,
            userSystem,
        }).then(res => {
            if (isMounted) setAnalysis(res);
        }).catch(err => console.error(err));
        return () => { isMounted = false; };
    }, [roomId, numDecks, seats, dealerHand.cards, shoe, userSystem]);

    const bdr = borderColor ?? `${accentColor}30`;
    const isBeta = getRoomConfig(roomId).isBeta ?? false;

    if (!analysis) return null;

    // Gauge for true count: map -10..+10 to 0..100
    const tcPct = Math.min(Math.max((analysis.trueCount + 10) / 20, 0), 1) * 100;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    key="card-counting"
                    className="w-56 rounded-2xl overflow-hidden flex flex-col"
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
                            <span
                                className="text-[11px] font-black uppercase tracking-[0.22em] font-sans"
                                style={{ color: 'rgba(220,200,170,0.8)' }}
                            >
                                Card Count
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
                            <span className="text-[10px] font-bold uppercase tracking-[0.12em] font-sans whitespace-nowrap" style={{ color: '#22c55e90' }}>
                                {analysis.activeSystem === 'Katarina Walker' ? 'WALKER' : 'HI-LO'}
                            </span>
                        </div>
                    </div>

                    {/* ── Under Development Banner for Beta Rooms ── */}
                    {isBeta && (
                        <div
                            className="mx-3.5 mt-3 mb-2 px-3 py-2 rounded-xl flex items-center gap-2.5"
                            style={{
                                background: 'rgba(251,146,60,0.1)',
                                border: '1px solid rgba(251,146,60,0.3)',
                            }}
                        >
                            <FlaskConical size={13} className="text-orange-400 shrink-0" />
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-400">Under Development</p>
                                <p className="text-[8px] text-orange-300/60 font-semibold mt-0.5 leading-snug">Count values may be inaccurate for this variant</p>
                            </div>
                        </div>
                    )}

                    {/* ── Running Count & True Count ── */}
                    <div className="px-3.5 pt-3 pb-2.5">
                        <div className="flex items-center gap-1.5 mb-2.5">
                            <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${accentColor}40, transparent)` }} />
                            <span className="text-[9px] font-black uppercase tracking-[0.28em] text-white/30 font-sans">Count</span>
                            <div className="h-px flex-1" style={{ background: `linear-gradient(270deg, ${accentColor}40, transparent)` }} />
                        </div>

                        <div className="flex items-center justify-around">
                            {/* Running Count */}
                            <div className="flex flex-col items-center flex-1">
                                <span
                                    className="text-[26px] font-black tabular-nums leading-none font-sans"
                                    style={{
                                        color: analysis.runningCount > 0 ? '#86efac' : analysis.runningCount < 0 ? '#fca5a5' : '#e5e5e5',
                                        textShadow: `0 0 20px ${analysis.runningCount > 0 ? 'rgba(34,197,94,0.3)' : analysis.runningCount < 0 ? 'rgba(239,68,68,0.3)' : 'transparent'}`
                                    }}
                                >
                                    {analysis.runningCount > 0 ? '+' : ''}{analysis.runningCount}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40 mt-1 font-sans">Running</span>
                            </div>

                            {/* Divider line */}
                            <div className="flex flex-col items-center gap-0.5 opacity-30">
                                <span className="text-white/40 text-[9px]">♦</span>
                                <div className="w-px h-8 bg-white/10" />
                                <span className="text-white/40 text-[9px]">♦</span>
                            </div>

                            {/* True Count */}
                            <div className="flex flex-col items-center flex-1">
                                <span
                                    className="text-[26px] font-black tabular-nums leading-none font-sans"
                                    style={{
                                        color: analysis.trueCount > 0 ? '#86efac' : analysis.trueCount < 0 ? '#fca5a5' : '#e5e5e5',
                                        textShadow: `0 0 20px ${analysis.trueCount > 0 ? 'rgba(34,197,94,0.3)' : analysis.trueCount < 0 ? 'rgba(239,68,68,0.3)' : 'transparent'}`
                                    }}
                                >
                                    {analysis.trueCount > 0 ? '+' : ''}{analysis.trueCount % 1 === 0 ? analysis.trueCount : analysis.trueCount.toFixed(1)}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40 mt-1 font-sans">True</span>
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
                            <div className="flex justify-between text-[8px] text-white/25 mt-1 font-bold font-sans">
                                <span>-10</span>
                                <span className="text-white/40">0</span>
                                <span>+10</span>
                            </div>

                            {/* Decks remaining info */}
                            <p className="text-center mt-3 text-[9px] font-bold tracking-[0.08em] font-sans" style={{ color: 'rgba(180,155,110,0.6)' }}>
                                {analysis.decksRemaining.toFixed(1)} decks remaining · {analysis.cardsRemaining} cards
                            </p>
                        </div>
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
                    {gamePhase === GamePhase.BETTING && (
                        <div className="px-3.5 pt-2 pb-3.5">
                            <div className="flex items-center gap-1.5 mb-2.5">
                                <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${accentColor}40, transparent)` }} />
                                <span className="text-[9px] font-black uppercase tracking-[0.28em] text-white/30 font-sans">Bet Advice</span>
                                <div className="h-px flex-1" style={{ background: `linear-gradient(270deg, ${accentColor}40, transparent)` }} />
                            </div>

                            {/* Advice Badge */}
                            <div
                                className="rounded-xl px-3 py-2.5 flex items-center gap-3"
                                style={{
                                    background: analysis.advice.bgColor,
                                    border: `1px solid ${analysis.advice.color}40`,
                                }}
                            >
                                <div className="font-black uppercase tracking-[0.12em] text-[12px] leading-tight font-sans text-center px-1" style={{ color: analysis.advice.color }}>
                                    {analysis.advice.label}
                                </div>
                                <div className="text-[10.5px] font-bold leading-tight font-sans border-l pl-2" style={{ borderColor: `${analysis.advice.color}30`, color: 'rgba(200,180,150,0.8)' }}>
                                    {analysis.advice.desc}
                                </div>
                            </div>


                            {/* Player edge */}
                            <div className="mt-4 flex flex-col items-center gap-1.5 px-1 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                    <span className="text-[8px] uppercase tracking-[0.12em] text-white/30 font-bold font-sans">Player Edge</span>
                                    <span className="text-[11px] font-black tabular-nums" style={{ color: analysis.playerEdge > 0 ? '#86efac' : analysis.playerEdge < 0 ? '#fca5a5' : '#e5e5e5' }}>
                                        {analysis.playerEdge > 0 ? '+' : ''}{analysis.playerEdge.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="flex items-center justify-center gap-1.5">
                                    <span className="text-[8px] uppercase tracking-[0.12em] text-white/30 font-bold font-sans">System</span>
                                    <span className="text-[11px] font-black uppercase text-emerald-400 whitespace-nowrap">{analysis.activeSystem === 'Katarina Walker' ? 'Walker' : 'Hi-Lo'}</span>
                                </div>
                            </div>

                            {/* More Details Link */}
                            <div className="flex items-center justify-center mt-4 pt-3 border-t border-white/5 font-sans" onClick={roomId.includes('iberian') ? onOpenSettings : onOpenStrategy}>
                                <span className="text-[9px] uppercase tracking-wider text-white/40 font-bold flex items-center gap-1.5 cursor-pointer hover:text-white/70 transition-colors">
                                    <Info size={11} />
                                    {roomId.includes('iberian') ? 'Change counting system in Settings' : 'Find out more details in Strategy'}
                                </span>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}
