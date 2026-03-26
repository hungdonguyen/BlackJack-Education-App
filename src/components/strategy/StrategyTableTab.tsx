import React from 'react';
import { motion } from 'framer-motion';
import { FlaskConical } from 'lucide-react';
import { RoomConfig } from '@/utils/rooms';
import { StrategyAction } from '@/utils/strategyAdvisor';
import { Ornament, ACTION_STYLES, Action } from './Common';

const DEALER_UPCARDS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];

interface StrategyTableContent {
    title: string;
    summary: string;
    bullets: string[];
}

interface StrategyTableTabProps {
    room: RoomConfig;
    tab: 'hard' | 'soft' | 'pairs' | 'free_hand';
    activeRows: string[];
    data: Action[][];
    strategyTables: any; // Simplified for now
}

function getStrategyTableContent(room: RoomConfig, tab: 'hard' | 'soft' | 'pairs'): StrategyTableContent {
    return room.strategyTableManual?.[tab] || {
        title: tab.charAt(0).toUpperCase() + tab.slice(1) + ' Totals Guide',
        summary: tab === 'hard' ? 'Hard totals are your highest-risk hands because any hit can bust immediately.' : tab === 'soft' ? 'Soft totals are flexible because the ace can collapse from 11 to 1 when needed.' : 'Pairs Guide',
        bullets: [],
    };
}

export const StrategyTableTab: React.FC<StrategyTableTabProps> = ({ room, tab, activeRows, data, strategyTables }) => {
    const strategyTableContent = tab === 'hard' || tab === 'soft' || tab === 'pairs' || tab === 'free_hand'
        ? getStrategyTableContent(room, tab === 'free_hand' ? 'hard' : tab)
        : null;

    return (
        <>
            {room.isBeta && (
                <div
                    className="mb-4 px-4 py-3 rounded-2xl flex items-start gap-3.5"
                    style={{
                        background: 'rgba(251,146,60,0.1)',
                        border: '1px solid rgba(251,146,60,0.3)',
                    }}
                >
                    <FlaskConical size={16} className="text-orange-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-400">Under Development</p>
                        <p className="text-[10px] text-orange-300/60 font-semibold mt-0.5 leading-relaxed">
                            The basic strategy matrix for this variant is currently under review and may be subject to changes.
                        </p>
                    </div>
                </div>
            )}

            {strategyTableContent && (
                <div className="mb-4 rounded-2xl border p-4" style={{ background: `linear-gradient(135deg, ${room.accentColor}0f 0%, rgba(255,255,255,0.02) 100%)`, borderColor: `${room.accentColor}26` }}>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] mb-1" style={{ color: `${room.accentColor}cc` }}>{strategyTableContent.title}</p>
                    <p className="text-[12px] leading-relaxed text-white/70">{strategyTableContent.summary}</p>
                    <div className="grid grid-cols-1 gap-2 mt-3 md:grid-cols-3">
                        {strategyTableContent.bullets.map((bullet) => (
                            <div key={bullet} className="rounded-xl border px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
                                <p className="text-[11px] leading-relaxed text-white/58">{bullet}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="w-full overflow-x-auto">
                <table className="w-full border-separate" style={{ borderSpacing: '3px' }}>
                    <thead>
                        <tr>
                            <th className="text-[10px] font-bold uppercase tracking-[0.15em] text-center align-bottom pb-1" style={{ color: 'rgba(255,255,255,0.30)', width: 64, minWidth: 64, fontFamily: "'Georgia', serif" }}>
                                {tab === 'pairs' ? 'Pair' : 'Hand'}
                            </th>
                            <th colSpan={10} className="text-[10px] font-bold uppercase tracking-[0.2em] text-center pb-1" style={{ color: `${room.accentColor}80`, fontFamily: "'Georgia', serif" }}>
                                {'\u2500\u2500'} Dealer&apos;s Upcard {'\u2500\u2500'}
                            </th>
                        </tr>
                        <tr>
                            <th style={{ width: 64, minWidth: 64 }} />
                            {DEALER_UPCARDS.map((u) => (
                                <th key={u} className="text-center text-[13px] font-extrabold py-2 rounded" style={{ color: 'rgba(240,230,214,0.90)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.05)', minWidth: 52, fontFamily: "'Georgia', serif" }}>
                                    {u}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td colSpan={11} style={{ height: 4 }} /></tr>
                        {activeRows.map((row, rowIdx) => (
                            <tr key={row}>
                                <td className="text-center text-[13px] font-extrabold rounded" style={{ color: 'rgba(240,230,214,0.80)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.05)', padding: '8px 6px', width: 64, minWidth: 64, fontFamily: "'Georgia', serif" }}>
                                    {row === '10,10' && room.id === 'iberian_21' ? 'J/Q/K' : row}
                                </td>
                                {(data[rowIdx] as Action[]).map((action: Action, colIdx: number) => {
                                    const st = ACTION_STYLES[action];
                                    return (
                                        <motion.td
                                            key={colIdx}
                                            className="text-center text-[13px] font-extrabold rounded select-none cursor-default"
                                            style={{ background: st.bg, color: st.text, padding: '8px 4px', minWidth: 52, textShadow: '0 1px 2px rgba(0,0,0,0.35)' }}
                                            whileHover={{ scale: 1.12, zIndex: 10 }}
                                            title={st.desc}
                                        >
                                            {st.label}
                                        </motion.td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 px-1 flex flex-col gap-1.5 opacity-30 hover:opacity-100 transition-opacity duration-300">
                {room.strategySource && (
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white/60">Source:</span>
                        <span className="text-[10px] font-bold italic tracking-wide text-white/50">{room.strategySource}</span>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-white/60">House RTP:</span>
                    <span className="text-[10px] font-bold tracking-wide text-white/70">{room.baseGameRtp || room.rtp}</span>
                    {room.sideBetRtp && (
                        <>
                            <span className="text-white/20">•</span>
                            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-yellow-500/50">Side Bet RTP:</span>
                            <span className="text-[10px] font-bold tracking-wide text-yellow-500/70">{room.sideBetRtp}</span>
                        </>
                    )}
                </div>
            </div>

            <Ornament color={room.accentColor} />

            <div className="mt-5 px-0.5">
                <p className="text-[11px] uppercase tracking-[0.2em] mb-3 font-bold" style={{ color: `${room.accentColor}80`, fontFamily: "'Georgia', serif" }}>Legend</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    {(() => {
                        const usedActions = new Set<Action>();
                        data.forEach(r => r.forEach(a => usedActions.add(a as Action)));
                        return (Object.entries(ACTION_STYLES) as [Action, typeof ACTION_STYLES[Action]][])
                            .filter(([key]) => usedActions.has(key))
                            .map(([, st]) => (
                                <div key={st.label} className="flex items-center gap-3">
                                    <div className="shrink-0 rounded text-center text-[13px] font-extrabold" style={{ background: st.bg, color: st.text, textShadow: '0 1px 2px rgba(0,0,0,0.35)', boxShadow: '0 2px 6px rgba(0,0,0,0.35)', minWidth: 44, padding: '6px 8px' }}>
                                        {st.label}
                                    </div>
                                    <span className="text-[12px] font-medium leading-snug" style={{ color: 'rgba(240,230,214,0.65)' }}>
                                        {st.label === 'SU' && !room.gameRules.allowDoubleDownRescue ? 'Surrender' : st.desc}
                                    </span>
                                </div>
                            ));
                    })()}
                </div>
            </div>
        </>
    );
};
