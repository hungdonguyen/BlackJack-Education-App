'use client';

// ============================================
// MatchDetailModal — Full detail view for a completed round
// Shows dealer cards, per-hand results, totals
// No bonuses · No side bets · No game IDs · English only
// ============================================

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X, ArrowLeft, Shield } from 'lucide-react';
import { MatchRecord } from '@/types/game';
import { HandStatus, Rank, Suit } from '@/types/enums';
import { calculateMatchStats, getRoomBadgeConfig, getMatchOverallStatus } from '@/utils/historyUtils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RANK_VALUE: Record<Rank, number> = {
    [Rank.ACE]: 11,
    [Rank.TWO]: 2, [Rank.THREE]: 3, [Rank.FOUR]: 4,
    [Rank.FIVE]: 5, [Rank.SIX]: 6, [Rank.SEVEN]: 7,
    [Rank.EIGHT]: 8, [Rank.NINE]: 9, [Rank.TEN]: 10,
    [Rank.JACK]: 10, [Rank.QUEEN]: 10, [Rank.KING]: 10,
};

const SUIT_PREFIX: Record<Suit, string> = {
    [Suit.HEARTS]: 'H', [Suit.DIAMONDS]: 'D',
    [Suit.CLUBS]: 'C', [Suit.SPADES]: 'S',
};

const RANK_SUFFIX: Record<Rank, string> = {
    [Rank.ACE]: 'A', [Rank.TWO]: '2', [Rank.THREE]: '3',
    [Rank.FOUR]: '4', [Rank.FIVE]: '5', [Rank.SIX]: '6',
    [Rank.SEVEN]: '7', [Rank.EIGHT]: '8', [Rank.NINE]: '9',
    [Rank.TEN]: '10', [Rank.JACK]: 'J', [Rank.QUEEN]: 'Q', [Rank.KING]: 'K',
};

function cardPath(suit: Suit, rank: Rank) {
    return `/images/cards/${SUIT_PREFIX[suit]}-${RANK_SUFFIX[rank]}.png`;
}

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
    const date = d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${date}  ${time}`;
}

// ─── Mini Card ────────────────────────────────────────────────────────────────

function MiniCard({ suit, rank }: { suit: Suit; rank: Rank }) {
    return (
        <div className="relative inline-block rounded shadow-md overflow-hidden shrink-0"
            style={{ width: 40, height: 58 }}>
            <Image src={cardPath(suit, rank)} alt={`${rank} ${suit}`}
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

    return (
        <motion.div
            className="absolute inset-0 z-300 flex items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

            {/* Panel */}
            <motion.div
                className="relative w-130 max-h-[85vh] rounded-2xl flex flex-col overflow-hidden"
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
                        <button onClick={onClose}
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
                        <div className="grid text-[9px] font-bold uppercase tracking-[0.15em] text-white/30 mb-2 px-1"
                            style={{ gridTemplateColumns: '80px 1fr 56px 64px 72px' }}>
                            <span>Seat</span>
                            <span>Cards</span>
                            <span className="text-center">Score</span>
                            <span className="text-right">Bet</span>
                            <span className="text-right">Win / Loss</span>
                        </div>

                        {/* Rows */}
                        <div className="space-y-2">
                            {match.seats.map((seat) => {
                                const seatBet = seat.hands.reduce((s, h) => s + h.betAmount, 0)
                                    + (seat.insuranceCost ?? 0)
                                    + (seat.sideBetAmount ?? 0);
                                const seatPnl = seat.hands.reduce((s, h) => s + h.payout, 0)
                                    - (seat.insuranceCost ?? 0) + (seat.insurancePayout ?? 0)
                                    - (seat.sideBetAmount ?? 0) + (seat.sideBetPayout ?? 0);
                                const hasExtras = seat.hands.length > 1
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
                                                <div key={`${seat.seatId}-${hIdx}`}
                                                    className="grid items-center gap-x-1 px-2 py-2"
                                                    style={{
                                                        gridTemplateColumns: '80px 1fr 56px 64px 72px',
                                                        background: 'rgba(255,255,255,0.025)',
                                                        borderBottom: (!isLastHand || hasExtras) ? '1px solid rgba(255,255,255,0.04)' : undefined,
                                                    }}>
                                                    {/* Seat label + status */}
                                                    <div>
                                                        <p className="text-[10px] font-bold text-white/70">{label}</p>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
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
                                                                    DOUBLE
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Cards */}
                                                    <div className="flex gap-1 flex-wrap">
                                                        {hand.cards.map((c, ci) => (
                                                            <MiniCard key={ci} suit={c.suit as Suit} rank={c.rank as Rank} />
                                                        ))}
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
                                            );
                                        })}

                                        {/* Insurance row */}
                                        {seat.insuranceCost && seat.insuranceCost > 0 && (
                                            <div className="grid items-center gap-x-1 px-2 py-1.5"
                                                style={{
                                                    gridTemplateColumns: '80px 1fr 56px 64px 72px',
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
                                                    gridTemplateColumns: '80px 1fr 56px 64px 72px',
                                                    background: 'rgba(234,179,8,0.03)',
                                                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                                                }}>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[9px] font-extrabold text-yellow-500 uppercase tracking-wider">⚡ Bonus</span>
                                                </div>
                                                <div className="text-[9px] text-yellow-300/70 font-bold">
                                                    {seat.freeActionTokens && seat.freeActionTokens > 0
                                                        ? `✓ Collected ${seat.freeActionTokens} Free Action Token${seat.freeActionTokens > 1 ? 's' : ''}`
                                                        : '✗ No Free Actions taken'
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
                                                    gridTemplateColumns: '80px 1fr 56px 64px 72px',
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
                            <div className="flex items-center gap-6">
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
                        onClick={() => canPrev && onNavigate(currentIndex - 1)}
                        className="flex items-center gap-1.5 text-[11px] font-bold text-white/50 hover:text-white/80 disabled:text-white/20 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                        <ChevronLeft size={15} />
                        Previous Match
                    </button>

                    <button
                        onClick={onClose}
                        className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                        style={{ background: 'rgba(255,210,90,0.1)', border: '1px solid rgba(255,210,90,0.2)', color: 'rgba(255,210,90,0.8)' }}
                    >
                        <ArrowLeft size={13} />
                        Back to History
                    </button>

                    <button
                        disabled={!canNext}
                        onClick={() => canNext && onNavigate(currentIndex + 1)}
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
