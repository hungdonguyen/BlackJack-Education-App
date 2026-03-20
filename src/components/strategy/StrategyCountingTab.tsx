import React from 'react';
import { motion } from 'framer-motion';
import { RoomConfig } from '@/utils/rooms';
import { Ornament } from './Common';

interface StrategyCountingTabProps {
    room: RoomConfig;
    strategyType: string;
    isIberianWalker: boolean;
    isIberianHiLo: boolean;
    countTab: 'hilo' | 'kw';
    visibleDeviations: any[];
}

export const StrategyCountingTab: React.FC<StrategyCountingTabProps> = ({
    room,
    strategyType,
    isIberianWalker,
    isIberianHiLo,
    countTab,
    visibleDeviations
}) => {
    return (
        <div className="space-y-6">
            {isIberianWalker ? (
                <>
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] mb-2 font-bold" style={{ color: `${room.accentColor}80`, fontFamily: "'Georgia', serif" }}>
                            Katarina Walker System — Iberian 21
                        </p>
                        <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(240,230,214,0.55)' }}>
                            The <span style={{ color: 'rgba(240,230,214,0.8)', fontWeight: 700 }}>Katarina Walker</span> index is the definitive counting system for Spanish 21 and Iberian variants. It weights low cards more heavily to reflect their importance in building bonus hands.
                        </p>
                    </div>

                    <div className="w-full overflow-x-auto">
                        <table className="w-full border-separate" style={{ borderSpacing: '3px' }}>
                            <thead>
                                <tr>
                                    {['Card', 'Value', 'Why'].map(h => (
                                        <th key={h} className="text-[10px] font-bold uppercase tracking-wider text-center py-2 rounded" style={{ color: 'rgba(240,230,214,0.6)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.05)', fontFamily: "'Georgia', serif" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { cards: '2, 3, 4, 5, 6', val: '+1', color: '#86efac', bg: 'linear-gradient(135deg, #1b7a3e 0%, #14532d 100%)', desc: 'Critical for 21-bonuses' },
                                    { cards: '7, 8', val: '0', color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.06)', desc: 'Neutral' },
                                    { cards: '9, J, Q, K, A', val: '−1', color: '#fca5a5', bg: 'linear-gradient(135deg, #a8322c 0%, #8b1a1a 100%)', desc: 'Unfavorable when removed' }
                                ].map((row, i) => (
                                    <React.Fragment key={row.cards}>
                                        <tr>
                                            <td className="text-[13px] font-extrabold text-center py-2.5 rounded" style={{ background: row.bg, color: i === 1 ? 'rgba(240,230,214,0.7)' : (i === 0 ? '#d1fae5' : '#fde8e8') }}>{row.cards}</td>
                                            <td className="text-[15px] font-black text-center py-2.5 rounded" style={{ background: i === 1 ? 'rgba(255,255,255,0.05)' : (i === 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'), color: row.color }}>{row.val}</td>
                                            <td className="text-[10px] text-center py-2.5 rounded" style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(240,230,214,0.5)' }}>{row.desc}</td>
                                        </tr>
                                        {i < 2 && <tr><td colSpan={3} style={{ height: 2 }} /></tr>}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <Ornament color={room.accentColor} />

                    <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] mb-2 font-bold" style={{ color: `${room.accentColor}80`, fontFamily: "'Georgia', serif" }}>
                            Step 1: Running Count (RC)
                        </p>
                        <p className="text-[12px] leading-relaxed mb-2" style={{ color: 'rgba(240,230,214,0.55)' }}>
                            Unlike balanced systems, Katarina Walker for Iberian 21 is an unbalanced system (+8 per deck). The counting engine offsets that baseline automatically so a fresh shoe still displays from a practical zero point.
                            For every card you see dealt, add or subtract its Walker value.
                        </p>
                    </div>

                    <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] mb-2 font-bold mt-4" style={{ color: `${room.accentColor}80`, fontFamily: "'Georgia', serif" }}>
                            Step 2: True Count (TC)
                        </p>
                        <p className="text-[12px] leading-relaxed mb-2" style={{ color: 'rgba(240,230,214,0.55)' }}>
                            Divide the Running Count by the estimated number of decks remaining in the shoe to get the True Count.
                            Bet sizing and deviations in Iberian 21 are heavily linked to this True Count. Because of the sheer number of bonus payouts (7-7-7, 6-7-8) and player advantages, a positive True Count is extremely lucrative here.
                        </p>
                    </div>
                </>
            ) : (
                <>
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] mb-2 font-bold" style={{ color: `${room.accentColor}80`, fontFamily: "'Georgia', serif" }}>
                            {strategyType === 'iberian_21' ? 'Hi-Lo System — Iberian 21 Version' : 'Hi-Lo System — Standard Blackjack'}
                        </p>
                        <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(240,230,214,0.55)' }}>
                            {strategyType === 'iberian_21' ? (
                                <>
                                    Card counting using Hi-Lo in Iberian 21 is an <span style={{ color: 'rgba(240,230,214,0.8)', fontWeight: 700 }}>unbalanced system</span> because all 10s are removed. In a 6-deck Iberian shoe, the running count naturally starts around <span style={{ color: '#fca5a5', fontWeight: 700 }}>−24</span>.
                                    <br /><br />The <span style={{ color: 'rgba(240,230,214,0.8)', fontWeight: 700 }}>Bet Advice</span> panel compensates for that baseline automatically, while strategy deviations still use the real Iberian Hi-Lo thresholds.
                                </>
                            ) : (
                                <>
                                    Standard blackjack uses the <span style={{ color: 'rgba(240,230,214,0.8)', fontWeight: 700 }}>balanced Hi-Lo system</span>: 2 through 6 are +1, 7 through 9 are 0, and 10 through Ace are −1.
                                </>
                            )}
                        </p>
                    </div>

                    <Ornament color={room.accentColor} />

                    <div className="w-full overflow-x-auto">
                        <table className="w-full border-separate" style={{ borderSpacing: '3px' }}>
                            <thead>
                                <tr>
                                    {['Card', 'Value', 'Why'].map(h => (
                                        <th key={h} className="text-[10px] font-bold uppercase tracking-wider text-center py-2 rounded" style={{ color: 'rgba(240,230,214,0.6)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.05)', fontFamily: "'Georgia', serif" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { cards: '2, 3, 4, 5, 6', val: '+1', color: '#86efac', bg: 'linear-gradient(135deg, #1b7a3e 0%, #14532d 100%)', desc: 'Low cards removed = favorable' },
                                    { cards: '7, 8, 9', val: '0', color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.06)', desc: 'Neutral — no impact' },
                                    { cards: '10, J, Q, K, A', val: '−1', color: '#fca5a5', bg: 'linear-gradient(135deg, #a8322c 0%, #8b1a1a 100%)', desc: 'High cards removed = unfavorable' }
                                ].map((row, i) => (
                                    <React.Fragment key={row.cards}>
                                        <tr>
                                            <td className="text-[13px] font-extrabold text-center py-2.5 rounded" style={{ background: row.bg, color: i === 1 ? 'rgba(240,230,214,0.7)' : (i === 0 ? '#d1fae5' : '#fde8e8') }}>{row.cards}</td>
                                            <td className="text-[15px] font-black text-center py-2.5 rounded" style={{ background: i === 1 ? 'rgba(255,255,255,0.05)' : (i === 0 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)'), color: row.color }}>{row.val}</td>
                                            <td className="text-[10px] text-center py-2.5 rounded" style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(240,230,214,0.5)' }}>{row.desc}</td>
                                        </tr>
                                        {i < 2 && <tr><td colSpan={3} style={{ height: 2 }} /></tr>}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <Ornament color={room.accentColor} />

                    <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] mb-2 font-bold" style={{ color: `${room.accentColor}80`, fontFamily: "'Georgia', serif" }}>
                            Step 1: Running Count (RC)
                        </p>
                        <p className="text-[12px] leading-relaxed mb-2" style={{ color: 'rgba(240,230,214,0.55)' }}>
                            Start at <span className="font-bold" style={{ color: 'rgba(240,230,214,0.8)' }}>0</span> after the shuffle.
                            For every card you see dealt, add or subtract its Hi-Lo value.
                        </p>
                    </div>

                    <div>
                        <p className="text-[11px] uppercase tracking-[0.2em] mb-2 font-bold" style={{ color: `${room.accentColor}80`, fontFamily: "'Georgia', serif" }}>
                            Step 2: True Count (TC)
                        </p>
                        <p className="text-[12px] leading-relaxed mb-2" style={{ color: 'rgba(240,230,214,0.55)' }}>
                            Divide the Running Count by the estimated number of decks remaining in the shoe.
                        </p>
                    </div>
                </>
            )}

            <Ornament color={room.accentColor} />

            <div>
                <p className="text-[11px] uppercase tracking-[0.2em] mb-3 font-bold" style={{ color: `${room.accentColor}80`, fontFamily: "'Georgia', serif" }}>
                    Step 3: Betting Strategy
                </p>
                <div className="space-y-2">
                    {[
                        { tc: isIberianHiLo ? 'TC ≤ −7' : 'TC ≤ −3', label: 'Sit Out', color: '#f87171', bg: 'rgba(239,68,68,0.12)', desc: 'Very unfavorable.' },
                        { tc: isIberianHiLo ? 'TC −7 to −5' : 'TC −3 to −1', label: 'Min Bet', color: '#fca5a5', bg: 'rgba(239,68,68,0.08)', desc: 'Unfavorable.' },
                        { tc: isIberianHiLo ? 'TC −5 to −3' : 'TC −1 to +1', label: 'Flat Bet', color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.04)', desc: 'Neutral.' },
                        { tc: isIberianHiLo ? 'TC −3 to −1' : 'TC +1 to +3', label: 'Raise', color: '#93c5fd', bg: 'rgba(59,130,246,0.1)', desc: 'Slightly favorable.' },
                        { tc: isIberianHiLo ? 'TC −1 to +1' : 'TC +3 to +5', label: 'High Bet', color: '#86efac', bg: 'rgba(34,197,94,0.12)', desc: 'Very favorable.' },
                        { tc: isIberianHiLo ? 'TC ≥ +1' : 'TC ≥ +5', label: 'Max Bet', color: '#fcd34d', bg: 'rgba(234,179,8,0.12)', desc: 'Extremely favorable.' },
                    ].map((row) => (
                        <div key={row.tc} className="flex items-center gap-3 rounded-lg px-3 py-2" style={{ background: row.bg, border: `1px solid ${row.color}25` }}>
                            <span className="text-[10px] font-black tracking-wider shrink-0 w-22.5" style={{ color: row.color }}>{row.tc}</span>
                            <span className="text-[10px] font-black uppercase tracking-wider shrink-0 w-15" style={{ color: row.color }}>{row.label}</span>
                            <span className="text-[10px]" style={{ color: 'rgba(240,230,214,0.5)' }}>{row.desc}</span>
                        </div>
                    ))}
                </div>
            </div>

            <Ornament color={room.accentColor} />

            <div>
                <p className="text-[11px] uppercase tracking-[0.2em] mb-2 font-bold" style={{ color: `${room.accentColor}80`, fontFamily: "'Georgia', serif" }}>
                    Advanced: Strategy Deviations
                </p>
                <div className="w-full overflow-x-auto">
                    <table className="w-full border-separate" style={{ borderSpacing: '2px' }}>
                        <thead>
                            <tr>
                                {['ID', 'Hand', 'Dealer', 'TC', 'Action / Description'].map((h) => (
                                    <th key={h} className="text-[9px] font-bold uppercase tracking-wider text-center py-1.5 rounded" style={{ color: `${room.accentColor}80`, background: 'rgba(255,255,255,0.06)', fontFamily: "'Georgia', serif" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {visibleDeviations.map((dev: any, i: number) => (
                                <tr key={i}>
                                    <td className="text-[10px] font-bold text-center py-1.5 rounded whitespace-nowrap px-2" style={{ color: 'rgba(245,158,11,0.8)', background: 'rgba(245,158,11,0.08)' }}>{dev.id}</td>
                                    <td className="text-[11px] font-bold text-center py-1.5 rounded whitespace-nowrap px-2" style={{ color: 'rgba(240,230,214,0.7)', background: 'rgba(255,255,255,0.04)' }}>
                                        {dev.playerTotal === 0 ? 'Ins' : (dev.isPair ? `${dev.playerTotal / 2},${dev.playerTotal / 2}` : (dev.isSoft ? `A,${dev.playerTotal - 11}` : dev.playerTotal))}
                                    </td>
                                    <td className="text-[11px] font-bold text-center py-1.5 rounded" style={{ color: 'rgba(240,230,214,0.7)', background: 'rgba(255,255,255,0.04)' }}>{dev.dealerUpcard}</td>
                                    <td className="text-[11px] font-black text-center py-1.5 rounded whitespace-nowrap px-2" style={{ color: dev.direction === 'gte' ? '#86efac' : '#fca5a5', background: dev.direction === 'gte' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)' }}>
                                        {dev.direction === 'gte' ? '≥ ' : '< '}
                                        {dev.index > 0 ? '+' : ''}{dev.index}
                                    </td>
                                    <td className="text-[10px] font-medium text-left py-1.5 px-3 rounded" style={{ color: 'rgba(240,230,214,0.6)', background: 'rgba(255,255,255,0.04)' }}>{dev.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
