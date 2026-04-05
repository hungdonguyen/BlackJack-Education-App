import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react';
import { useGameStore } from '@/hooks/useGameStore';
import { useShallow } from 'zustand/react/shallow';
import { useAudio } from '@/utils/audio';
import { calculateMatchNetPnl, getRoomBadgeConfig, getMatchOverallStatus } from '@/utils/historyUtils';

interface HistoryPanelProps {
    onMatchClick: (index: number) => void;
}

export function HistoryPanel({ onMatchClick }: HistoryPanelProps) {
    const { playSound } = useAudio();
    const [page, setPage] = useState(1);
    const matchHistory = useGameStore(useShallow((s) => s.matchHistory));
    const totalLen = matchHistory.length;
    const ITEMS_PER_PAGE = 8;
    const totalPages = Math.max(1, Math.ceil(totalLen / ITEMS_PER_PAGE));

    const currentPage = Math.min(Math.max(1, page), totalPages);

    const sortedHistory = useMemo(() => {
        return [...matchHistory].sort((a, b) => b.timestamp - a.timestamp);
    }, [matchHistory]);

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentMatches = sortedHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    if (totalLen === 0) return null;

    return (
        <motion.div className="w-[200px] rounded-xl overflow-hidden flex flex-col"
            style={{ background: 'rgba(10, 6, 4, 0.8)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)', maxHeight: '310px' }}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
        >
            <div className="px-3 py-2 border-b border-white/5 flex items-center shrink-0">
                <ClipboardList size={12} className="mr-1.5 text-white/40" />
                <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-white/40">History</span>
            </div>
            <div className="p-2 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
                {currentMatches.map((match, displayIdx) => {
                    const result = match.seats[0]?.hands[0];
                    if (!result) return null;

                    const realIdx = totalLen - 1 - (startIndex + displayIdx);
                    const diff = calculateMatchNetPnl(match);
                    const { shortLabel, color: accentColor } = getRoomBadgeConfig(match.roomId);
                    const hadInsurance = match.seats.some(s => s.insuranceCost && s.insuranceCost > 0);
                    const { labelStr, colorClass } = getMatchOverallStatus(match, diff);

                    return (
                        <div key={match.id} onClick={() => { playSound('click'); onMatchClick(realIdx); }}
                            className="flex items-center justify-between px-1.5 py-1 rounded bg-white/2 hover:bg-white/5 cursor-pointer transition-colors border border-white/0 hover:border-white/5">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[7px] font-bold px-1 py-0.5 rounded tracking-wider border"
                                    style={{
                                        backgroundColor: `${accentColor}1A`,
                                        color: accentColor,
                                        borderColor: `${accentColor}33`
                                    }}
                                >
                                    {shortLabel}
                                </span>
                                <span className={`text-[9px] font-bold uppercase tracking-wider ${colorClass}`}>
                                    {labelStr}
                                </span>
                                {hadInsurance && (
                                    <span className="text-[7px] px-1 py-0.5 rounded bg-amber-500/15 text-amber-500 border border-amber-500/20 font-bold" title="Insurance purchased">🛡</span>
                                )}
                            </div>
                            <span className={`text-[9px] font-bold tabular-nums tracking-widest ${diff > 0 ? 'text-emerald-400/90' : diff < 0 ? 'text-red-400/90' : 'text-slate-400/80'}`}>
                                {diff >= 0 ? '+' : ''}{diff}
                            </span>
                        </div>
                    );
                })}
            </div>
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-2 py-1.5 border-t border-white/5 bg-white/5 shrink-0">
                    <button
                        onClick={() => { playSound('click'); setPage(p => Math.max(1, p - 1)); }}
                        disabled={currentPage === 1}
                        className="p-1 text-white/40 hover:text-white disabled:opacity-20 cursor-pointer transition-colors hover:bg-white/10 rounded"
                    >
                        <ChevronLeft size={14} />
                    </button>
                    <span className="text-[9px] font-bold text-white/30 tracking-widest">
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        onClick={() => { playSound('click'); setPage(p => Math.min(totalPages, p + 1)); }}
                        disabled={currentPage === totalPages}
                        className="p-1 text-white/40 hover:text-white disabled:opacity-20 cursor-pointer transition-colors hover:bg-white/10 rounded"
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            )}
        </motion.div>
    );
}
