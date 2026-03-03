'use client';

// ============================================
// StrategyModal - Basic Strategy Chart
// Premium casino-style presentation
// ============================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, BookOpen } from 'lucide-react';
import { RoomConfig } from '@/utils/rooms';

interface StrategyModalProps {
    room: RoomConfig;
    onClose: () => void;
}

type Action = 'H' | 'S' | 'D' | 'DS' | 'SP' | 'SU';
type Tab = 'hard' | 'soft' | 'pairs';

// Refined color palette matching casino aesthetic - gradient backgrounds
const ACTION_STYLES: Record<Action, { bg: string; text: string; label: string; desc: string }> = {
    H:  { bg: 'linear-gradient(135deg, #a8322c 0%, #8b1a1a 100%)', text: '#fde8e8', label: 'H',  desc: 'Hit' },
    S:  { bg: 'linear-gradient(135deg, #1b7a3e 0%, #14532d 100%)', text: '#d1fae5', label: 'S',  desc: 'Stand' },
    D:  { bg: 'linear-gradient(135deg, #c9983a 0%, #a67c2e 100%)', text: '#1a1206', label: 'D',  desc: 'Double Down' },
    DS: { bg: 'linear-gradient(135deg, #1a7a7a 0%, #115e5e 100%)', text: '#ccfbf1', label: 'DS', desc: 'Double if allowed, else Stand' },
    SP: { bg: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', text: '#dbeafe', label: 'SP', desc: 'Split' },
    SU: { bg: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', text: '#ede9fe', label: 'SU', desc: 'Surrender if allowed, else Hit' },
};

const DEALER_UPCARDS = ['2','3','4','5','6','7','8','9','10','A'];

// Strategy Data
const HARD_ROWS  = ['5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20'];
const SOFT_ROWS  = ['A,2','A,3','A,4','A,5','A,6','A,7','A,8','A,9'];
const PAIR_ROWS  = ['2,2','3,3','4,4','5,5','6,6','7,7','8,8','9,9','10,10','A,A'];

// Classic: 6 decks, H17, DAS
const HARD_CLASSIC: Action[][] = [
    ['H','H','H','H','H','H','H','H','H','H'],
    ['H','H','H','H','H','H','H','H','H','H'],
    ['H','H','H','H','H','H','H','H','H','H'],
    ['H','H','H','H','H','H','H','H','H','H'],
    ['H','D','D','D','D','H','H','H','H','H'],
    ['D','D','D','D','D','D','D','D','H','H'],
    ['D','D','D','D','D','D','D','D','D','H'],
    ['H','H','S','S','S','H','H','H','H','H'],
    ['S','S','S','S','S','H','H','H','H','H'],
    ['S','S','S','S','S','H','H','H','H','H'],
    ['S','S','S','S','S','H','H','H','H','H'],
    ['S','S','S','S','S','H','H','H','H','H'],
    ['S','S','S','S','S','S','S','S','S','S'],
    ['S','S','S','S','S','S','S','S','S','S'], // 18
    ['S','S','S','S','S','S','S','S','S','S'], // 19
    ['S','S','S','S','S','S','S','S','S','S'], // 20
];
const SOFT_CLASSIC: Action[][] = [
    ['H','H','H','D','D','H','H','H','H','H'],
    ['H','H','H','D','D','H','H','H','H','H'],
    ['H','H','D','D','D','H','H','H','H','H'],
    ['H','H','D','D','D','H','H','H','H','H'],
    ['H','D','D','D','D','H','H','H','H','H'],
    ['S','DS','DS','DS','DS','S','S','H','H','H'],
    ['S','S','S','S','S','S','S','S','S','S'],
    ['S','S','S','S','S','S','S','S','S','S'],
];
const PAIRS_CLASSIC: Action[][] = [
    ['SP','SP','SP','SP','SP','SP','H','H','H','H'],
    ['SP','SP','SP','SP','SP','SP','H','H','H','H'],
    ['H','H','H','SP','SP','H','H','H','H','H'],
    ['D','D','D','D','D','D','D','D','H','H'],
    ['SP','SP','SP','SP','SP','H','H','H','H','H'],
    ['SP','SP','SP','SP','SP','SP','H','H','H','H'],
    ['SP','SP','SP','SP','SP','SP','SP','SP','SP','SP'],
    ['SP','SP','SP','SP','SP','S','SP','SP','S','S'],
    ['S','S','S','S','S','S','S','S','S','S'],
    ['SP','SP','SP','SP','SP','SP','SP','SP','SP','SP'],
];

// Vegas Strip: 4 decks, S17, DAS
const HARD_VEGAS: Action[][] = [
    ['H','H','H','H','H','H','H','H','H','H'],
    ['H','H','H','H','H','H','H','H','H','H'],
    ['H','H','H','H','H','H','H','H','H','H'],
    ['H','H','H','H','H','H','H','H','H','H'],
    ['H','D','D','D','D','H','H','H','H','H'],
    ['D','D','D','D','D','D','D','D','H','H'],
    ['D','D','D','D','D','D','D','D','D','D'],
    ['H','H','S','S','S','H','H','H','H','H'],
    ['S','S','S','S','S','H','H','H','H','H'],
    ['S','S','S','S','S','H','H','H','H','H'],
    ['S','S','S','S','S','H','H','H','H','H'],
    ['S','S','S','S','S','H','H','H','H','H'],
    ['S','S','S','S','S','S','S','S','S','S'],
    ['S','S','S','S','S','S','S','S','S','S'], // 18
    ['S','S','S','S','S','S','S','S','S','S'], // 19
    ['S','S','S','S','S','S','S','S','S','S'], // 20
];
const SOFT_VEGAS: Action[][] = [
    ['H','H','H','D','D','H','H','H','H','H'],
    ['H','H','H','D','D','H','H','H','H','H'],
    ['H','H','D','D','D','H','H','H','H','H'],
    ['H','H','D','D','D','H','H','H','H','H'],
    ['H','D','D','D','D','H','H','H','H','H'],
    ['DS','DS','DS','DS','DS','S','S','H','H','H'],
    ['S','S','S','S','DS','S','S','S','S','S'],
    ['S','S','S','S','S','S','S','S','S','S'],
];
const PAIRS_VEGAS: Action[][] = PAIRS_CLASSIC;

// Ornament divider
function Ornament({ color }: { color: string }) {
    return (
        <div className="flex items-center justify-center gap-3 my-1 select-none" aria-hidden>
            <div className="h-px flex-1 max-w-16" style={{ background: `linear-gradient(90deg, transparent, ${color}40)` }} />
            <span className="text-[10px]" style={{ color: `${color}50` }}>{'\u2660'}</span>
            <span className="text-[8px]" style={{ color: `${color}35` }}>{'\u2666'}</span>
            <span className="text-[10px]" style={{ color: `${color}50` }}>{'\u2663'}</span>
            <div className="h-px flex-1 max-w-16" style={{ background: `linear-gradient(270deg, transparent, ${color}40)` }} />
        </div>
    );
}

export default function StrategyModal({ room, onClose }: StrategyModalProps) {
    const [tab, setTab] = useState<Tab>('hard');
    const isVegas = room.id === 'vegas_strip';

    const rows = tab === 'hard' ? HARD_ROWS : tab === 'soft' ? SOFT_ROWS : PAIR_ROWS;
    const data = tab === 'hard'
        ? (isVegas ? HARD_VEGAS : HARD_CLASSIC)
        : tab === 'soft'
            ? (isVegas ? SOFT_VEGAS : SOFT_CLASSIC)
            : (isVegas ? PAIRS_VEGAS : PAIRS_CLASSIC);

    const tabConfig: Record<Tab, { label: string; rowTitle: string }> = {
        hard:  { label: 'Hard Totals', rowTitle: 'Hand' },
        soft:  { label: 'Soft Totals', rowTitle: 'Hand' },
        pairs: { label: 'Pairs',       rowTitle: 'Pair' },
    };

    return (
        <motion.div
            className="absolute inset-0 z-[200] flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(6px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="relative flex flex-col overflow-hidden"
                style={{
                    background: 'linear-gradient(180deg, rgba(18,12,8,0.99) 0%, rgba(10,6,3,0.99) 100%)',
                    border: `1px solid ${room.borderColor}`,
                    borderRadius: 16,
                    boxShadow: `0 0 80px ${room.accentColor}20, 0 24px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)`,
                    maxHeight: '92vh',
                    width: 'min(820px, 94vw)',
                }}
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-6 py-4"
                    style={{
                        background: `linear-gradient(135deg, ${room.accentColor}15 0%, transparent 60%)`,
                        borderBottom: `1px solid ${room.accentColor}18`,
                    }}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center"
                            style={{ background: `${room.accentColor}15`, border: `1px solid ${room.accentColor}25` }}
                        >
                            <BookOpen size={18} style={{ color: room.accentColor }} />
                        </div>
                        <div>
                            <h2
                                className="text-[15px] font-black uppercase tracking-[0.18em] leading-tight"
                                style={{ color: 'rgba(240,230,214,0.92)', fontFamily: "'Georgia', 'Times New Roman', serif" }}
                            >
                                Basic Strategy
                            </h2>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] mt-0.5" style={{ color: `${room.accentColor}cc` }}>
                                {room.name} {'\u2014'} {isVegas ? '4 Decks \u00b7 S17 \u00b7 Double After Split' : '6 Decks \u00b7 H17 \u00b7 Double After Split'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white/70 transition-all cursor-pointer"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                        <X size={15} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex px-6 pt-1" style={{ background: 'rgba(0,0,0,0.15)' }}>
                    {(['hard','soft','pairs'] as Tab[]).map((t) => {
                        const active = tab === t;
                        return (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className="relative flex-1 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] transition-all cursor-pointer text-center"
                                style={{ color: active ? room.accentColor : 'rgba(255,255,255,0.3)' }}
                            >
                                {tabConfig[t].label}
                                {active && (
                                    <motion.div
                                        layoutId="strategy-tab-indicator"
                                        className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
                                        style={{ background: room.accentColor }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Chart Body */}
                <div className="overflow-y-auto flex-1 px-6 pt-5 pb-6">

                    {/* Proper HTML table for perfect alignment */}
                    <div className="w-full overflow-x-auto">
                        <table
                            className="w-full border-separate"
                            style={{ borderSpacing: '3px' }}
                        >
                            <thead>
                                {/* Row 1: Player label + spanning Dealer label */}
                                <tr>
                                    <th
                                        className="text-[10px] font-bold uppercase tracking-[0.15em] text-center align-bottom pb-1"
                                        style={{
                                            color: 'rgba(255,255,255,0.30)',
                                            width: 64,
                                            minWidth: 64,
                                            fontFamily: "'Georgia', serif",
                                        }}
                                    >
                                        {tabConfig[tab].rowTitle}
                                    </th>
                                    <th
                                        colSpan={10}
                                        className="text-[10px] font-bold uppercase tracking-[0.2em] text-center pb-1"
                                        style={{
                                            color: `${room.accentColor}80`,
                                            fontFamily: "'Georgia', serif",
                                        }}
                                    >
                                        {'\u2500\u2500'} Dealer&apos;s Upcard {'\u2500\u2500'}
                                    </th>
                                </tr>
                                {/* Row 2: Empty + upcard values */}
                                <tr>
                                    <th style={{ width: 64, minWidth: 64 }} />
                                    {DEALER_UPCARDS.map((u) => (
                                        <th
                                            key={u}
                                            className="text-center text-[13px] font-extrabold py-2 rounded"
                                            style={{
                                                color: 'rgba(240,230,214,0.90)',
                                                background: 'rgba(255,255,255,0.06)',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                minWidth: 52,
                                                fontFamily: "'Georgia', serif",
                                            }}
                                        >
                                            {u}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {/* Spacer row */}
                                <tr><td colSpan={11} style={{ height: 4 }} /></tr>

                                {rows.map((row, rowIdx) => (
                                    <tr key={row}>
                                        {/* Row label */}
                                        <td
                                            className="text-center text-[13px] font-extrabold rounded"
                                            style={{
                                                color: 'rgba(240,230,214,0.80)',
                                                background: 'rgba(255,255,255,0.06)',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                padding: '8px 6px',
                                                width: 64,
                                                minWidth: 64,
                                                fontFamily: "'Georgia', serif",
                                            }}
                                        >
                                            {row}
                                        </td>
                                        {/* Action cells */}
                                        {data[rowIdx].map((action, colIdx) => {
                                            const st = ACTION_STYLES[action];
                                            return (
                                                <motion.td
                                                    key={colIdx}
                                                    className="text-center text-[13px] font-extrabold rounded select-none cursor-default"
                                                        style={{
                                                            background: st.bg,
                                                            color: st.text,
                                                            padding: '8px 4px',
                                                            minWidth: 52,
                                                            textShadow: '0 1px 2px rgba(0,0,0,0.35)',
                                                    }}
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

                    {/* Ornament separator */}
                    <Ornament color={room.accentColor} />

                    {/* Legend */}
                    <div className="mt-5 px-0.5">
                        <p
                            className="text-[11px] uppercase tracking-[0.2em] mb-3 font-bold"
                            style={{ color: `${room.accentColor}80`, fontFamily: "'Georgia', serif" }}
                        >
                            Legend
                        </p>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                            {(Object.entries(ACTION_STYLES) as [Action, typeof ACTION_STYLES[Action]][]).map(([, st]) => (
                                <div key={st.label} className="flex items-center gap-3">
                                    <div
                                        className="shrink-0 rounded text-center text-[13px] font-extrabold"
                                        style={{
                                            background: st.bg,
                                            color: st.text,
                                            textShadow: '0 1px 2px rgba(0,0,0,0.35)',
                                            boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
                                            minWidth: 44,
                                            padding: '6px 8px',
                                        }}
                                    >
                                        {st.label}
                                    </div>
                                    <span
                                        className="text-[12px] font-medium leading-snug"
                                        style={{ color: 'rgba(240,230,214,0.65)' }}
                                    >
                                        {st.desc}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footnote */}
                    <div
                        className="mt-5 px-4 py-3.5 rounded-lg"
                        style={{
                            background: `linear-gradient(135deg, ${room.accentColor}08 0%, transparent 100%)`,
                            border: `1px solid ${room.accentColor}18`,
                        }}
                    >
                        <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(240,230,214,0.45)' }}>
                            <span className="font-bold" style={{ color: 'rgba(240,230,214,0.65)', fontFamily: "'Georgia', serif" }}>Note:</span>{' '}
                            Mathematically optimal basic strategy derived from statistical probability.
                            Apply consistently over many hands for best results.{' '}
                            Theoretical RTP:{' '}
                            <span className="font-black" style={{ color: room.accentColor }}>{room.rtp}</span>
                        </p>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
