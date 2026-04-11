'use client';

// ============================================
// MatchDetailModal — Full detail view for a completed round
// Shows dealer cards, per-hand results, totals
// No bonuses · No side bets · No game IDs · English only
// ============================================

import { motion, AnimatePresence } from 'framer-motion';
import React, { Fragment } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, ArrowLeft, Shield, Flame } from 'lucide-react';
import { MatchRecord } from '@/types/game';
import { HandStatus, Rank, Suit } from '@/types/enums';
import { getCardImage } from '@/utils/cardImages';
import { calculateMatchStats, getRoomBadgeConfig, getMatchOverallStatus } from '@/utils/historyUtils';
import { useAudio } from '@/utils/audio';
import { useModalNavigation } from '@/hooks/useMenuNavigation';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RANK_VALUE: Record<Rank, number> = {
    [Rank.ACE]: 11,
    [Rank.TWO]: 2, [Rank.THREE]: 3, [Rank.FOUR]: 4,
    [Rank.FIVE]: 5, [Rank.SIX]: 6, [Rank.SEVEN]: 7,
    [Rank.EIGHT]: 8, [Rank.NINE]: 9, [Rank.TEN]: 10,
    [Rank.JACK]: 10, [Rank.QUEEN]: 10, [Rank.KING]: 10,
};

function calcScore(cards: { suit: Suit; rank: Rank }[]): number {
    let total = 0;
    let aces = 0;
    for (const c of cards) {
        total += RANK_VALUE[c.rank];
        if (c.rank === Rank.ACE) aces++;
    }
    while (total > 21 && aces > 0) { total -= 10; aces--; }
    return total;
}

function formatDate(ts: number) {
    const d = new Date(ts);
    const date = d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' });
    const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${date}  ${time}`;
}

// ─── Mini Card ────────────────────────────────────────────────────────────────

function MiniCard({ suit, rank }: { suit: Suit; rank: Rank }) {
    return (
        <div className="relative inline-block rounded shadow-md overflow-hidden shrink-0"
            style={{ width: 40, height: 58 }}>
            <Image src={getCardImage(suit, rank)} alt={`${rank} ${suit}`}
                fill sizes="40px" className="object-contain" />
        </div>
    );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
    [HandStatus.WON]: { label: 'WIN', className: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' },
    [HandStatus.BLACKJACK]: { label: 'BLACKJACK', className: 'bg-amber-500/20  text-amber-300  border border-amber-500/30' },
    [HandStatus.LOST]: { label: 'LOSE', className: 'bg-red-500/20    text-red-300    border border-red-500/30' },
    [HandStatus.BUST]: { label: 'BUST', className: 'bg-red-600/20    text-red-400    border border-red-600/30' },
    [HandStatus.SURRENDERED]: { label: 'SURRENDER', className: 'bg-orange-500/20 text-orange-400 border border-orange-500/30' },
    [HandStatus.PUSH]: { label: 'TIE', className: 'bg-slate-500/15  text-slate-300  border border-slate-400/25' },
    [HandStatus.STAND]: { label: 'STAND', className: 'bg-white/10      text-white/60   border border-white/20' },
    [HandStatus.PLAYING]: { label: '—', className: 'bg-white/10      text-white/40   border border-white/10' },
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface MatchDetailModalProps {
    match: MatchRecord;
    allMatches: MatchRecord[];
    currentIndex: number;                          // index in allMatches
    onNavigate: (newIndex: number) => void;
    onClose: () => void;
}

export default function MatchDetailModal({
    match,
    allMatches,
    currentIndex,
    onNavigate,
    onClose,
}: MatchDetailModalProps) {
    const { name: roomLabel } = getRoomBadgeConfig(match.roomId);
    const { playSound } = useAudio();

    // Net P&L for the round (including insurance)
    const {
        totalBet,
        totalWin,
        totalInsuranceCost,
        totalInsurancePayout,
        totalSideBetCost,
        totalSideBetPayout,
        netPnl
    } = calculateMatchStats(match);

    const dealerScore = calcScore(match.dealerCards);

    const canPrev = currentIndex > 0;
    const canNext = currentIndex < allMatches.length - 1;

    useModalNavigation({
        onClose,
        onPrev: () => { if (canPrev) { playSound('click'); onNavigate(currentIndex - 1); } },
        onNext: () => { if (canNext) { playSound('click'); onNavigate(currentIndex + 1); } },
    });

    return (
        <motion.div
            className="absolute inset-0 z-300 flex items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

            {/* Panel */}
            <motion.div
                className="relative w-[680px] max-h-[918px] rounded-2xl flex flex-col overflow-hidden"
                style={{ background: 'rgba(15, 9, 6, 0.97)', border: '1px solid rgba(255,210,90,0.15)', backdropFilter: 'blur(20px)' }}
                initial={{ scale: 0.92, y: 24 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 24 }}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            >
                {/* ─── Header ─────────────────────────────────────────── */}
                <div className="px-5 py-3 flex items-center justify-between shrink-0"
                    style={{ background: 'rgba(30, 18, 8, 0.9)', borderBottom: '1px solid rgba(255,210,90,0.1)' }}>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400/70">Game History</p>
                        <p className="text-[13px] font-extrabold text-white uppercase tracking-wide">
                            Blackjack · {roomLabel}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[11px] text-white/40 tabular-nums">{formatDate(match.timestamp)}</span>
                        <button onClick={() => { playSound('click'); onClose(); }}
                            className="w-7 h-7 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer">
                            <X size={14} />
                        </button>
                    </div>
                </div>

                {/* ─── Scrollable body ────────────────────────────────── */}
                <div className="flex-1 overflow-y-auto">
                    {/* Dealer Section */}
                    <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40 mb-2">Dealer</p>
                                <div className="flex gap-1.5">
                                    {match.dealerCards.map((c, i) => (
                                        <MiniCard key={i} suit={c.suit} rank={c.rank} />
                                    ))}
                                </div>
                                {match.dealerPush22 && (
                                    <div className="mt-2.5 inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                                        <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.15em]">Dealer Push 22</span>
                                    </div>
                                )}
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-white/40 uppercase tracking-widest">Total</p>
                                <p className="text-3xl font-black text-white tabular-nums">{dealerScore}</p>
                            </div>
                        </div>
                    </div>

                    {/* Hands Table */}
                    <div className="px-5 py-3">
                        {/* Table header */}
                        <div className="grid gap-x-1 text-[9px] font-bold uppercase tracking-[0.15em] text-white/30 mb-2 px-2"
                            style={{ gridTemplateColumns: '80px 1fr 56px 90px 100px' }}>
                            <span>Seat</span>
                            <span>Cards</span>
                            <span className="text-center">Score</span>
                            <span className="text-right">Bet</span>
                            <span className="text-right">Net P&L</span>
                        </div>

                        {/* Rows */}
                        <div className="space-y-2">
                            {match.seats.map((seat) => {
                                const seatBet = seat.hands.reduce((s, h) => s + h.betAmount + (h.burnWagerAmount ?? 0), 0)
                                    + (seat.insuranceCost ?? 0)
                                    + (seat.sideBetAmount ?? 0);
                                const seatPnl = seat.hands.reduce((s, h) => s + h.payout - (h.burnWagerAmount ?? 0) + (h.burnWagerPayout ?? 0), 0)
                                    - (seat.insuranceCost ?? 0) + (seat.insurancePayout ?? 0)
                                    - (seat.sideBetAmount ?? 0) + (seat.sideBetPayout ?? 0);
                                const hasExtras = seat.hands.length > 1
                                    || seat.hands.some(h => h.isBurned)
                                    || !!(seat.insuranceCost && seat.insuranceCost > 0)
                                    || !!(seat.sideBetAmount && seat.sideBetAmount > 0);

                                return (
                                    <div key={seat.seatId} className="rounded-lg overflow-hidden"
                                        style={{ border: '1px solid rgba(255,255,255,0.06)' }}>

                                        {/* Hand rows */}
                                        {seat.hands.map((hand, hIdx) => {
                                            const score = calcScore(hand.cards);
                                            const statusInfo = STATUS_STYLES[hand.result] ?? STATUS_STYLES[HandStatus.PUSH];
                                            const pnl = hand.payout;
                                            const label = seat.hands.length > 1
                                                ? `Seat ${seat.seatId} · Hand ${hIdx + 1}`
                                                : `Seat ${seat.seatId}`;
                                            const isLastHand = hIdx === seat.hands.length - 1;

                                            return (
                                                <Fragment key={`${seat.seatId}-${hIdx}`}>
                                                    <div className="grid items-center gap-x-1 px-2 py-2"
                                                    style={{
                                                        gridTemplateColumns: '80px 1fr 56px 90px 100px',
                                                        background: 'rgba(255,255,255,0.025)',
                                                        borderBottom: (!isLastHand || hasExtras) ? '1px solid rgba(255,255,255,0.04)' : undefined,
                                                    }}>
                                                    {/* Seat label + status */}
                                                    <div>
                                                        <p className="text-[10px] font-bold text-white/70">{label}</p>
                                                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full inline-block ${statusInfo.className}`}>
                                                                {statusInfo.label}
                                                            </span>
                                                            {hand.isFreeActionSplit ? (
                                                                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                                                                    FREE ACTION SPLIT
                                                                </span>
                                                            ) : hand.isSplit && (
                                                                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                                                    SPLIT
                                                                </span>
                                                            )}
                                                            {hand.isFreeActionDouble ? (
                                                                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                                                    FREE ACTION DOUBLE
                                                                </span>
                                                            ) : hand.isDoubleDown && (
                                                                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                                                    {hand.doubleCount && hand.doubleCount > 1 ? `${hand.doubleCount}X DOUBLE` : 'DOUBLE'}
                                                                </span>
                                                            )}
                                                            {hand.isSwitched && (
                                                                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                                                                    SWITCHED
                                                                </span>
                                                            )}
                                                            {hand.isBurned && (
                                                                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-orange-600/20 text-orange-400 border border-orange-500/30">
                                                                    BURNED
                                                                </span>
                                                            )}
                                                            {hand.isSuitedBJ && (
                                                                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400/40 to-pink-500/40 text-amber-100 border border-amber-400/30 shadow-[0_0_8px_rgba(251,191,36,0.2)]">
                                                                    SUITED BLACKJACK
                                                                </span>
                                                            )}
                                                            {match.roomId === 'iberian_21' && hand.result === HandStatus.WON && pnl > hand.betAmount && !hand.isDoubleDown && (
                                                                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                                                                    21 BONUS ({(pnl / hand.betAmount).toFixed(1)}x)
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Cards */}
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex gap-1 flex-wrap">
                                                            {hand.cards.map((c, ci) => (
                                                                <MiniCard key={ci} suit={c.suit as Suit} rank={c.rank as Rank} />
                                                            ))}
                                                        </div>
                                                        {hand.zappedCards && hand.zappedCards.length > 0 && (
                                                            <div className="flex items-center gap-2 mt-0.5 opacity-60">
                                                                <span className="text-[7px] font-black text-amber-500/80 uppercase tracking-wider border border-amber-500/20 px-1 rounded-sm bg-amber-500/5">Zap out:</span>
                                                                <div className="flex gap-1 flex-wrap scale-[0.85] origin-left">
                                                                    {hand.zappedCards.map((c, ci) => (
                                                                        <MiniCard key={ci} suit={c.suit as Suit} rank={c.rank as Rank} />
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {hand.isBurned && hand.burnedCard && (
                                                            <div className="flex items-center gap-2 mt-0.5 opacity-60">
                                                                <span className="text-[7px] font-black text-orange-500/80 uppercase tracking-wider border border-orange-500/20 px-1 rounded-sm bg-orange-500/5">Burned:</span>
                                                                <div className="flex gap-1 flex-wrap scale-[0.85] origin-left">
                                                                    <MiniCard suit={hand.burnedCard.suit as Suit} rank={hand.burnedCard.rank as Rank} />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Score */}
                                                    <div className="text-center">
                                                        <span className="text-[15px] font-black text-white tabular-nums">{score}</span>
                                                    </div>

                                                    {/* Bet */}
                                                    <div className="text-right">
                                                        <span className="text-[11px] font-bold text-white/70 tabular-nums">
                                                            {hand.betAmount.toLocaleString()}
                                                        </span>
                                                    </div>

                                                    {/* Win/Loss */}
                                                    <div className="text-right">
                                                        <span className={`text-[13px] font-black tabular-nums ${pnl > 0 ? 'text-emerald-400' : pnl < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                                            {pnl > 0 ? '+' : ''}{pnl.toLocaleString()}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Burn Bonus row — per hand */}
                                                {hand.isBurned && (
                                                    <div className="grid items-center gap-x-1 px-2 py-1.5"
                                                        style={{
                                                            gridTemplateColumns: '80px 1fr 56px 90px 100px',
                                                            background: 'rgba(249,115,22,0.03)',
                                                            borderBottom: (!isLastHand || hasExtras) ? '1px solid rgba(255,255,255,0.04)' : undefined,
                                                        }}>
                                                        <div className="flex items-center gap-1">
                                                            <Flame size={11} className="text-orange-400" />
                                                            <span className="text-[9px] font-bold text-orange-400/80 uppercase">
                                                                {hand.burnWagerPayout && hand.burnWagerPayout > 0 ? 'Burn Bonus' : 'Burn Cost'}
                                                            </span>
                                                        </div>
                                                        <div className="text-[9px] text-orange-300/60 font-bold">
                                                            {hand.burnWagerPayout && hand.burnWagerPayout > 0 
                                                                ? `✓ Discarded ${hand.burnedCard?.rank} of ${hand.burnedCard?.suit} — Bonus Paid`
                                                                : `✗ Discarded ${hand.burnedCard?.rank} of ${hand.burnedCard?.suit}`
                                                            }
                                                        </div>
                                                        <div />
                                                        <div className="text-right">
                                                            <span className="text-[10px] font-bold text-orange-400/90 tabular-nums">
                                                                -{hand.burnWagerAmount?.toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <div className="text-right">
                                                            {hand.burnWagerPayout && hand.burnWagerPayout > 0 ? (
                                                                <span className="text-[12px] font-black text-emerald-400 tabular-nums">
                                                                    +{(hand.burnWagerPayout - (hand.burnWagerAmount ?? 0)).toLocaleString()}
                                                                </span>
                                                            ) : (
                                                                <span className="text-[12px] font-black text-red-400 tabular-nums">
                                                                    -{(hand.burnWagerAmount ?? 0).toLocaleString()}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </Fragment>
                                            );
                                        })}

                                        {/* Insurance row */}
                                        {seat.insuranceCost && seat.insuranceCost > 0 && (
                                            <div className="grid items-center gap-x-1 px-2 py-1.5"
                                                style={{
                                                    gridTemplateColumns: '80px 1fr 56px 90px 100px',
                                                    background: 'rgba(250,204,21,0.03)',
                                                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                                                }}>
                                                <div className="flex items-center gap-1">
                                                    <Shield size={11} className="text-yellow-400" />
                                                    <span className="text-[9px] font-bold text-yellow-400/80 uppercase">Insurance</span>
                                                </div>
                                                <div className="text-[9px] text-yellow-300/60 font-bold">
                                                    {seat.insurancePayout && seat.insurancePayout > 0
                                                        ? '✓ Dealer had Blackjack — Insurance paid 2:1'
                                                        : '✗ Dealer did not have Blackjack'
                                                    }
                                                </div>
                                                <div />
                                                <div className="text-right">
                                                    <span className="text-[10px] font-bold text-yellow-400/60 tabular-nums">
                                                        -{seat.insuranceCost.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    {seat.insurancePayout && seat.insurancePayout > 0 ? (
                                                        <span className="text-[12px] font-black text-emerald-400 tabular-nums">
                                                            +{(seat.insurancePayout - seat.insuranceCost).toLocaleString()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[12px] font-black text-red-400 tabular-nums">
                                                            -{seat.insuranceCost.toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Side Bet row */}
                                        {seat.sideBetAmount && seat.sideBetAmount > 0 && (
                                            <div className="grid items-center gap-x-1 px-2 py-1.5"
                                                style={{
                                                    gridTemplateColumns: '80px 1fr 56px 90px 100px',
                                                    background: 'rgba(234,179,8,0.03)',
                                                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                                                }}>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[9px] font-extrabold text-yellow-500 uppercase tracking-wider">
                                                        {match.roomId === 'madness_21' ? '⚡ Push 22' : '⚡ Bonus'}
                                                    </span>
                                                </div>
                                                <div className="text-[9px] text-yellow-300/70 font-bold">
                                                    {match.roomId === 'madness_21'
                                                        ? (seat.sideBetPayout && seat.sideBetPayout > 0
                                                            ? '✓ Dealer busted with 22 — Payout 11:1'
                                                            : '✗ Dealer did not have 22')
                                                        : (seat.freeActionTokens && seat.freeActionTokens > 0
                                                            ? `✓ Collected ${seat.freeActionTokens} Free Action Token${seat.freeActionTokens > 1 ? 's' : ''}`
                                                            : '✗ No Free Actions taken')
                                                    }
                                                </div>
                                                <div />
                                                <div className="text-right">
                                                    <span className="text-[10px] font-bold text-yellow-500/80 tabular-nums">
                                                        {seat.sideBetAmount.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    {seat.sideBetPayout && seat.sideBetPayout > 0 ? (
                                                        <span className="text-[12px] font-black text-emerald-400 tabular-nums">
                                                            +{(seat.sideBetPayout - seat.sideBetAmount).toLocaleString()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[12px] font-black text-red-400 tabular-nums">
                                                            -{seat.sideBetAmount.toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Per-seat total — only when extras exist */}
                                        {hasExtras && (
                                            <div className="grid items-center gap-x-1 px-2 py-1.5"
                                                style={{
                                                    gridTemplateColumns: '80px 1fr 56px 90px 100px',
                                                    background: 'rgba(255,255,255,0.04)',
                                                }}>
                                                <span className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-white/50">Seat {seat.seatId} Total</span>
                                                <div />
                                                <div />
                                                <div className="text-right">
                                                    <span className="text-[10px] font-bold text-white/50 tabular-nums">
                                                        {seatBet.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`text-[12px] font-black tabular-nums ${seatPnl > 0 ? 'text-emerald-400' : seatPnl < 0 ? 'text-red-400' : 'text-white/40'}`}>
                                                        {seatPnl > 0 ? '+' : ''}{seatPnl.toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Total Row */}
                        <div className="mt-3 rounded-lg px-3 py-2.5 flex items-center justify-between"
                            style={{ background: 'rgba(255,210,90,0.05)', border: '1px solid rgba(255,210,90,0.12)' }}>
                            <span className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-amber-400/80">Total</span>
                            <div className="flex items-center gap-8">
                                <div className="text-right">
                                    <p className="text-[9px] text-white/30 uppercase tracking-wider">Wagered</p>
                                    <p className="text-[13px] font-bold text-white/70 tabular-nums">{totalBet.toLocaleString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] text-white/30 uppercase tracking-wider">Net P&amp;L</p>
                                    <p className={`text-[15px] font-black tabular-nums ${netPnl > 0 ? 'text-emerald-400' : netPnl < 0 ? 'text-red-400' : 'text-white/50'}`}>
                                        {netPnl > 0 ? '+' : ''}{netPnl.toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] text-white/30 uppercase tracking-wider">Bankroll After</p>
                                    <p className="text-[13px] font-bold text-white/50 tabular-nums">{match.bankrollAfter.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── Navigation Footer ──────────────────────────────── */}
                <div className="shrink-0 px-5 py-3 flex items-center justify-between"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(10,6,4,0.8)' }}>
                    <button
                        disabled={!canPrev}
                        onClick={() => { if (canPrev) { playSound('click'); onNavigate(currentIndex - 1); } }}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-white/50 hover:text-white/80 disabled:text-white/20 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                        <ChevronLeft size={15} />
                        Previous Match
                    </button>

                    <button
                        onClick={() => { playSound('click'); onClose(); }}
                        className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                        style={{ background: 'rgba(255,210,90,0.1)', border: '1px solid rgba(255,210,90,0.2)', color: 'rgba(255,210,90,0.8)' }}
                    >
                        <ArrowLeft size={13} />
                        Back to History
                    </button>

                    <button
                        disabled={!canNext}
                        onClick={() => { if (canNext) { playSound('click'); onNavigate(currentIndex + 1); } }}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-white/50 hover:text-white/80 disabled:text-white/20 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                        Next Match
                        <ChevronRight size={15} />
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
