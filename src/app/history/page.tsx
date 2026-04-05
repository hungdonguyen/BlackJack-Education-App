'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/hooks/useGameStore';
import { ArrowLeft, ChevronLeft, ChevronRight, History } from 'lucide-react';
import { HandStatus, Suit } from '@/types/enums';
import { calculateMatchNetPnl, getRoomBadgeConfig, getMatchOverallStatus } from '@/utils/historyUtils';
import { useAudio } from '@/utils/audio';
import { useModalNavigation } from '@/hooks/useMenuNavigation';

const ITEMS_PER_PAGE = 10;

export default function HistoryPage() {
    const router = useRouter();
    const matchHistory = useGameStore(s => s.matchHistory);
    const [page, setPage] = useState(1);
    const { playSound } = useAudio();

    // Sort history by timestamp descending to show latest first reliably
    const sortedHistory = useMemo(() => {
        return [...matchHistory]
            .filter((match) => !match.simulator)
            .sort((a, b) => b.timestamp - a.timestamp);
    }, [matchHistory]);
    const totalPages = Math.ceil(sortedHistory.length / ITEMS_PER_PAGE) || 1;
    const currentPage = Math.min(Math.max(page, 1), totalPages);

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentMatches = sortedHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handleGoBack = useCallback(() => {
        playSound('click');
        router.back();
    }, [playSound, router]);

    useModalNavigation({
        onClose: handleGoBack,
        onPrev: () => setPage(p => Math.max(1, p - 1)),
        onNext: () => setPage(p => Math.min(totalPages, p + 1)),
    });

    return (
        <div className="min-h-full h-full bg-linear-to-br from-[#0a0604] to-[#140b08] text-white p-6 md:p-12 font-sans select-none overflow-y-auto">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => { playSound('click'); router.back(); }}
                        className="flex items-center gap-2 text-white/50 hover:text-white transition-colors cursor-pointer"
                    >
                        <ArrowLeft size={20} />
                        <span className="text-sm font-bold uppercase tracking-wider">Back</span>
                    </button>
                    <h1 className="text-2xl font-black text-amber-400 uppercase tracking-[0.2em] flex items-center gap-3">
                        <History /> Match History
                    </h1>
                    <div className="w-16" /> {/* Spacer */}
                </div>

                {sortedHistory.length === 0 ? (
                    <div className="text-center text-white/40 py-20 bg-white/5 rounded-2xl border border-white/5">
                        <History size={48} className="mx-auto mb-4 opacity-20" />
                        <p className="text-lg tracking-widest uppercase font-bold">No History Found</p>
                        <p className="text-sm mt-2 opacity-50">Play some rounds to see them here.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {currentMatches.map((match) => {
                            const date = new Date(match.timestamp);

                            return (
                                <div key={match.id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-3">
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs font-bold text-white/40 tracking-wider">
                                                {date.toLocaleDateString()} {date.toLocaleTimeString()}
                                            </span>
                                            <span
                                                className="text-xs font-black uppercase px-2 py-0.5 rounded border tracking-wider"
                                                style={{
                                                    color: getRoomBadgeConfig(match.roomId).color,
                                                    backgroundColor: `${getRoomBadgeConfig(match.roomId).color}1A`,
                                                    borderColor: `${getRoomBadgeConfig(match.roomId).color}33`
                                                }}
                                            >
                                                Room: {getRoomBadgeConfig(match.roomId).name}
                                            </span>
                                            {(() => {
                                                const netChange = calculateMatchNetPnl(match);
                                                const { isWin, isPush } = getMatchOverallStatus(match, netChange);

                                                return (
                                                    <span className={`text-xs font-black uppercase px-2 py-0.5 rounded border tracking-wider ${isPush ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : isWin ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                                        {isPush ? 'PUSH' : isWin ? 'WIN' : 'LOSE'} {!isPush && `${isWin ? '+' : ''}$${Math.abs(netChange).toLocaleString()}`}
                                                    </span>
                                                );
                                            })()}
                                        </div>
                                        <div className="text-xs font-bold tracking-wider text-white/50">
                                            Balance: ${match.bankrollBefore.toLocaleString()} → ${match.bankrollAfter.toLocaleString()}
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <h3 className="text-xs uppercase font-bold text-white/40 tracking-widest mb-2">Dealer Hand</h3>
                                        <div className="flex gap-2">
                                            {match.dealerCards.map((c, i) => (
                                                <span key={i} className={`text-sm font-bold bg-white/10 px-2 py-1 rounded ${c.suit === Suit.HEARTS || c.suit === Suit.DIAMONDS ? 'text-red-400' : 'text-white'}`}>
                                                    {c.rank}
                                                    {c.suit === Suit.SPADES && '♠'}
                                                    {c.suit === Suit.HEARTS && '♥'}
                                                    {c.suit === Suit.DIAMONDS && '♦'}
                                                    {c.suit === Suit.CLUBS && '♣'}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-xs uppercase font-bold text-white/40 tracking-widest mb-2">Your Hands</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {match.seats.map(seat => {
                                                return seat.hands.map((hand, hIdx) => {
                                                    const isWin = hand.payout > 0;
                                                    const isPush = hand.result === HandStatus.PUSH;
                                                    const isLoss = hand.payout < 0;

                                                    return (
                                                        <div key={`${seat.seatId}-${hIdx}`} className="bg-black/40 rounded p-3 border border-white/5">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className="text-xs font-black text-white/60 tracking-wider">
                                                                    SEAT {seat.seatId}
                                                                </span>
                                                                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${isPush ? 'bg-sky-500/20 text-sky-400' : isWin ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}
                                                                >
                                                                    {hand.result}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-1.5 mb-3">
                                                                {hand.cards.map((c, i) => (
                                                                    <span key={i} className={`text-xs font-bold bg-white/10 px-1.5 py-0.5 rounded ${c.suit === Suit.HEARTS || c.suit === Suit.DIAMONDS ? 'text-red-400' : 'text-white'}`}>
                                                                        {c.rank}
                                                                        {c.suit === Suit.SPADES && '♠'}
                                                                        {c.suit === Suit.HEARTS && '♥'}
                                                                        {c.suit === Suit.DIAMONDS && '♦'}
                                                                        {c.suit === Suit.CLUBS && '♣'}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                            <div className="flex justify-between items-center text-xs font-bold">
                                                                <span className="text-white/40">Bet: ${hand.betAmount}</span>
                                                                <span className={isWin ? 'text-emerald-400' : isLoss ? 'text-red-400' : 'text-sky-400'}>
                                                                    {isWin ? '+' : ''}{hand.payout}
                                                                </span>
                                                            </div>
                                                            {seat.insuranceCost ? (
                                                                <div className="mt-2 pt-2 border-t border-white/5 flex justify-between items-center text-[10px] font-bold">
                                                                    <span className="text-yellow-400/70">🛡 Insurance: ${seat.insuranceCost}</span>
                                                                    <span className={seat.insurancePayout ? 'text-yellow-400' : 'text-red-400/70'}>
                                                                        {seat.insurancePayout ? `+${seat.insurancePayout}` : `-${seat.insuranceCost}`}
                                                                    </span>
                                                                </div>
                                                            ) : null}
                                                            {seat.sideBetAmount ? (
                                                                <div className="mt-2 pt-2 border-t border-white/5 flex justify-between items-center text-[10px] font-bold">
                                                                    <span className="text-yellow-400/70">⚡ Bonus: ${seat.sideBetAmount}{seat.freeActionTokens ? ` · ${seat.freeActionTokens}✦` : ''}</span>
                                                                    <span className={seat.sideBetPayout ? 'text-yellow-400' : 'text-red-400/70'}>
                                                                        {seat.sideBetPayout ? `+${seat.sideBetPayout}` : `-${seat.sideBetAmount}`}
                                                                    </span>
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    );
                                                });
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-8 flex items-center justify-between bg-white/5 rounded-xl p-2 border border-white/5">
                                <button
                                    onClick={() => { playSound('click'); setPage(currentPage - 1); }}
                                    disabled={currentPage === 1}
                                    className="p-3 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors shadow-lg cursor-pointer"
                                    aria-label="Previous Page"
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <span className="text-sm font-bold tracking-widest text-white/50">
                                    PAGE <span className="text-amber-400 mx-1">{currentPage}</span> OF {totalPages}
                                </span>
                                <button
                                    onClick={() => { playSound('click'); setPage(currentPage + 1); }}
                                    disabled={currentPage === totalPages}
                                    className="p-3 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors shadow-lg cursor-pointer"
                                    aria-label="Next Page"
                                >
                                    <ChevronRight size={24} />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

