import React from 'react';
import { Info, Plus, Minus, ChevronsUp, ArrowLeftRight, Shield, Flag, Zap } from 'lucide-react';
import { RoomConfig } from '@/utils/rooms';
import { RuleHighlightCard, RuleBulletSection, RuleSection, RuleHighlight } from './Common';

interface RuleSectionData {
    title: string;
    items: string[];
}

interface RoomRulesContent {
    overview: string;
    highlights: RuleHighlight[];
    playerOptions: RuleSectionData;
    payouts: RuleSectionData;
    dealerFlow: RuleSectionData;
    strategyNotes: RuleSectionData;
}

interface StrategyRulesTabProps {
    room: RoomConfig;
}

function getRoomRulesContent(room: RoomConfig): RoomRulesContent {
    return room.strategyModalContent || {
        overview: room.description,
        highlights: [],
        playerOptions: { title: 'Player Actions', items: [] },
        payouts: { title: 'Payouts & Settlement', items: [] },
        dealerFlow: { title: 'Dealer Protocol', items: [] },
        strategyNotes: { title: 'Strategy Notes', items: [] },
    };
}

export const StrategyRulesTab: React.FC<StrategyRulesTabProps> = ({ room }) => {
    const roomRulesContent = getRoomRulesContent(room);

    return (
        <div className="space-y-5 text-sm text-white/60">
            <div
                className="rounded-2xl border p-4"
                style={{
                    background: `linear-gradient(135deg, ${room.accentColor}10 0%, rgba(255,255,255,0.02) 100%)`,
                    borderColor: `${room.accentColor}2f`,
                    boxShadow: `0 10px 24px ${room.accentColor}10`
                }}
            >
                <div className="flex items-start gap-3">
                    <div
                        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                        style={{ background: `${room.accentColor}20` }}
                    >
                        <Info size={17} style={{ color: room.accentColor }} />
                    </div>
                    <div className="space-y-1">
                        <span className="block text-[10px] uppercase font-black tracking-[0.24em] opacity-65">Table Brief</span>
                        <p className="text-[13px] leading-relaxed text-white/85">{roomRulesContent.overview}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {roomRulesContent.highlights.map((highlight) => (
                    <RuleHighlightCard
                        key={`${highlight.eyebrow}-${highlight.title}`}
                        accentColor={room.accentColor}
                        highlight={highlight}
                    />
                ))}
            </div>

            <RuleSection title="Core Actions">
                <div className="grid grid-cols-1 gap-2 mt-1">
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                        <strong className="text-white/80 block mb-0.5 text-xs"><Plus size={12} className="inline text-emerald-400 mr-1" />Hit</strong>
                        <p className="text-[10px] text-white/40 leading-snug">Take another card to improve your total. Use it whenever the EV of drawing is better than standing, even if the hand already feels uncomfortable.</p>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                        <strong className="text-white/80 block mb-0.5 text-xs"><Minus size={12} className="inline text-amber-400 mr-1" />Stand</strong>
                        <p className="text-[10px] text-white/40 leading-snug">Lock your current total and pass action to the dealer. In special rooms like Free Action or Iberian 21, passive stands become less automatic than in standard blackjack.</p>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                        <strong className="text-white/80 block mb-0.5 text-xs"><ChevronsUp size={12} className="inline text-blue-400 mr-1" />Double Down</strong>
                        <p className="text-[10px] text-white/40 leading-snug">Increase commitment when one more card has higher value than continuing normally. The exact timing changes sharply in Free Action and Iberian 21.</p>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                        <strong className="text-white/80 block mb-0.5 text-xs"><ArrowLeftRight size={12} className="inline text-purple-400 mr-1" />Split</strong>
                        <p className="text-[10px] text-white/40 leading-snug">Turn one starting hand into two when the room rule and EV justify it. Split permissions vary meaningfully by room, especially around mixed 10-value cards and ace branches.</p>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                        <strong className="text-white/80 block mb-0.5 text-xs"><Shield size={12} className="inline text-yellow-400 mr-1" />Insurance</strong>
                        <p className="text-[10px] text-white/40 leading-snug">A side wager offered when the dealer shows an ace. It is usually correct only in high-count situations, not as a default protection play.</p>
                    </div>
                    {(room.gameRules.allowSurrender || room.id === 'iberian_21') && (
                        <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                            <strong className="text-white/80 block mb-0.5 text-xs"><Flag size={12} className="inline text-orange-400 mr-1" />{room.gameRules.allowDoubleDownRescue ? 'Surrender / Rescue' : 'Surrender'}</strong>
                            <p className="text-[10px] text-white/40 leading-snug">
                                {room.id === 'iberian_21'
                                    ? 'This room uses surrender as a live rescue mechanic, including after a double. It is a tactical escape valve, not just a pre-decision concession.'
                                    : 'Give up the hand and lose half the stake when the starting position is too weak to continue profitably.'}
                            </p>
                        </div>
                    )}
                </div>
            </RuleSection>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <RuleBulletSection title={roomRulesContent.playerOptions.title} items={roomRulesContent.playerOptions.items} accentColor={room.accentColor} />
                <RuleBulletSection title={roomRulesContent.payouts.title} items={roomRulesContent.payouts.items} accentColor={room.accentColor} />
                <RuleBulletSection title={roomRulesContent.dealerFlow.title} items={roomRulesContent.dealerFlow.items} accentColor={room.accentColor} />
                <RuleBulletSection title={roomRulesContent.strategyNotes.title} items={roomRulesContent.strategyNotes.items} accentColor={room.accentColor} />
            </div>

            {room.sideBetType === 'push_22' && (
                <div className="mt-2 overflow-hidden rounded-xl border" style={{ borderColor: 'rgba(234, 179, 8, 0.25)' }}>
                    <div className="px-3 py-2 border-b border-yellow-500/20" style={{ background: 'linear-gradient(90deg, rgba(234, 179, 8, 0.15) 0%, transparent 100%)' }}>
                        <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] flex items-center text-yellow-500">
                             <Zap size={10} className="mr-1.5 fill-yellow-500/20" /> Push 22 Bonus Payouts
                        </span>
                    </div>
                    <div className="p-3 bg-black/20">
                         <div className="flex items-center justify-between px-1">
                            <span className="text-[11px] font-medium text-yellow-100/70 uppercase tracking-wide">Dealer Busts on Exactly 22</span>
                            <span className="text-[13px] font-black tabular-nums text-yellow-500" style={{ textShadow: '0 0 10px rgba(234,179,8,0.3)' }}>11 : 1</span>
                        </div>
                    </div>
                </div>
            )}

            {room.sideBetType === 'multi_action' && (
                <div className="mt-2 overflow-hidden rounded-xl border" style={{ borderColor: 'rgba(234, 179, 8, 0.25)' }}>
                    <div className="px-3 py-2 border-b border-yellow-500/20" style={{ background: 'linear-gradient(90deg, rgba(234, 179, 8, 0.15) 0%, transparent 100%)' }}>
                        <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] flex items-center text-yellow-500">
                             <Zap size={10} className="mr-1.5 fill-yellow-500/20" /> Multi Action Bonus Payouts
                        </span>
                    </div>
                    <div className="p-3 grid grid-cols-2 gap-x-6 gap-y-2 bg-black/20 font-sans">
                         {[
                            { label: '6-8 Actions', value: '250 : 1' },
                            { label: '5 Actions', value: '150 : 1' },
                            { label: '4 Actions', value: '100 : 1' },
                            { label: '3 Actions', value: '40 : 1' },
                            { label: '2 Actions', value: '10 : 1' },
                            { label: '1 Action', value: '3 : 1' },
                         ].map((p, i) => (
                             <div key={i} className="flex items-center justify-between border-b border-white/5 pb-1 last:border-0 last:pb-0">
                                <span className="text-[10px] font-medium text-yellow-100/50 uppercase tracking-tight">{p.label}</span>
                                <span className="text-[11px] font-black tabular-nums text-yellow-500">{p.value}</span>
                            </div>
                         ))}
                    </div>
                    <div className="px-3 py-1.5 bg-yellow-500/5 border-t border-yellow-500/10">
                        <p className="text-[9px] text-yellow-500/60 leading-tight italic text-center">Wins based on the total Free Actions collected in a single hand.</p>
                    </div>
                </div>
            )}

            <div className="rounded-xl border px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/40">
                    <span className="font-black">Quick Reference</span>
                    <span>•</span>
                    <span>{room.gameRules.numberOfDecks} decks</span>
                    <span>•</span>
                    <span>{room.gameRules.dealerHitsSoft17 ? 'Dealer hits soft 17' : 'Dealer stands on soft 17'}</span>
                    <span>•</span>
                    <span>{room.gameRules.allowSurrender || room.id === 'iberian_21' ? 'Surrender available' : 'No surrender'}</span>
                    <span>•</span>
                    <span className="text-white/70">House RTP: {room.baseGameRtp || room.rtp}</span>
                    {room.sideBetRtp && (
                        <>
                            <span>•</span>
                            <span className="text-yellow-500/80 font-black">Side Bet RTP: {room.sideBetRtp}</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
