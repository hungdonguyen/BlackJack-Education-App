import React, { useState } from 'react';
import Image from 'next/image';
import { 
    ArrowDown, 
    Zap, 
    BookOpen, 
    ThumbsUp, 
    ThumbsDown, 
    UserCircle, 
    TableProperties, 
    Lightbulb, 
    Target 
} from 'lucide-react';
import { RoomConfig } from '@/utils/rooms';
import { getCardImagePath } from '@/utils/assets';
import { Card } from '@/types/game';
import { Rank, Suit } from '@/types/enums';
import {
    SWITCH_SUB_TABS,
    type SwitchSubTabId,
    SWITCH_TAB_HEADER,
    SYSTEM_DETAILS,
    type SwitchExampleCase
} from './switchTabContent';

interface StrategySwitchTabProps {
    room: RoomConfig;
}

const RANK_MAP: Record<string, Rank> = {
    A: Rank.ACE,
    K: Rank.KING,
    Q: Rank.QUEEN,
    J: Rank.JACK,
    '10': Rank.TEN,
    '9': Rank.NINE,
    '8': Rank.EIGHT,
    '7': Rank.SEVEN,
    '6': Rank.SIX,
    '5': Rank.FIVE,
    '4': Rank.FOUR,
    '3': Rank.THREE,
    '2': Rank.TWO,
};

const SUIT_MAP: Record<string, Suit> = {
    S: Suit.SPADES,
    H: Suit.HEARTS,
    D: Suit.DIAMONDS,
    C: Suit.CLUBS,
};

function toCard(rank: string, suit: string): Card {
    return {
        rank: RANK_MAP[rank],
        suit: SUIT_MAP[suit],
        value: rank === 'A' ? 11 : ['K', 'Q', 'J'].includes(rank) ? 10 : Number(rank),
        isHidden: false,
    };
}

function getHandDescription(cards: Array<{ rank: string; suit: string }>): string {
    if (!cards || cards.length < 2) return '';
    const c1 = cards[0];
    const c2 = cards[1];
    
    const getValue = (rank: string) => {
        if (rank === 'A') return 11;
        if (['K', 'Q', 'J', '10'].includes(rank)) return 10;
        return parseInt(rank);
    }
    
    const v1 = getValue(c1.rank);
    const v2 = getValue(c2.rank);
    const total = v1 + v2;

    if (c1.rank === c2.rank) {
         return `Pair of ${c1.rank}s`;
    } else if (v1 === 10 && v2 === 10) {
         return `Hard 20`;
    }

    if (c1.rank === 'A' || c2.rank === 'A') {
        if (total === 21) return 'Blackjack';
        return `Soft ${total}`;
    }
    
    return `Hard ${total}`;
}

function CardRow({ title, cards, description }: { title: string; cards: Array<{ rank: string; suit: string }>, description?: string }) {
    return (
        <div className="rounded-md border border-white/8 bg-black/25 flex flex-col items-center p-3 h-full">
            <p className="text-[9px] uppercase tracking-[0.1em] text-white/50 font-bold mb-2">{title}</p>
            <div className="flex items-center justify-center gap-1.5 mb-2.5">
                {cards.map((c, idx) => {
                    const card = toCard(c.rank, c.suit);
                    return (
                        <div key={`${c.rank}-${c.suit}-${idx}`} className="relative w-[38px] h-[56px] rounded overflow-hidden border border-white/10 shadow-md">
                            <Image src={getCardImagePath(card)} alt={`${c.rank}${c.suit}`} fill sizes="38px" className="object-contain" />
                        </div>
                    );
                })}
            </div>
            {description && (
                <p className="text-[10px] font-black text-cyan-200/80 bg-white/5 border border-white/5 px-2 py-1 rounded w-full text-center mt-auto">
                    {description}
                </p>
            )}
        </div>
    );
}

const RichText: React.FC<{ text: string }> = ({ text }) => {
    let parsedText = text
        .replace(/{c}(.*?){w?\/c}/g, '<span class="text-cyan-300 font-bold">$1</span>')
        .replace(/{a}(.*?){w?\/a}/g, '<span class="text-amber-300 font-bold">$1</span>')
        .replace(/{e}(.*?){w?\/e}/g, '<span class="text-emerald-300 font-bold">$1</span>')
        .replace(/{r}(.*?){w?\/r}/g, '<span class="text-rose-400 font-bold">$1</span>');

    return <span dangerouslySetInnerHTML={{ __html: parsedText }} />;
};

export const StrategySwitchTab: React.FC<StrategySwitchTabProps> = ({ room }) => {
    const [activeSubTab, setActiveSubTab] = useState<SwitchSubTabId>('cindy_basic');

    const activeSystem = SYSTEM_DETAILS[activeSubTab];

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border p-5" style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.28)' }}>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-300 mb-1">{SWITCH_TAB_HEADER.eyebrow}</p>
                <p className="text-xs text-cyan-100/90 font-semibold leading-relaxed">
                    {SWITCH_TAB_HEADER.leadTemplate.replace('{roomName}', room.name)}
                </p>
                <p className="text-[11px] text-cyan-100/60 mt-2 leading-relaxed">
                    {SWITCH_TAB_HEADER.subLead}
                </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2">
                <div className="grid grid-cols-3 gap-1.5">
                    {SWITCH_SUB_TABS.map((tab) => {
                        const active = activeSubTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveSubTab(tab.id as SwitchSubTabId)}
                                className={`px-3 py-2 rounded-lg text-[11px] font-black uppercase tracking-[0.15em] transition-all cursor-pointer ${active ? 'text-black' : 'text-white/60 hover:text-white/90 bg-white/[0.04] hover:bg-white/[0.08]'}`}
                                style={active ? { background: room.accentColor } : undefined}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                    <h2 className="text-lg font-bold text-white mb-2">{activeSystem.title}</h2>
                    <p className="text-xs text-white/70 leading-relaxed mb-4"><RichText text={activeSystem.philosophy} /></p>
                    
                    <div className="mb-6">
                        <h3 className="text-[11px] uppercase tracking-wider text-cyan-300 font-bold mb-3 flex items-center gap-2">
                            <Zap size={14} /> Core Principles
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {activeSystem.corePrinciples.map((principle, idx) => (
                                <div key={idx} className="bg-black/25 border border-white/10 rounded-xl p-4 flex flex-col justify-start relative overflow-hidden">
                                    <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                                        <Zap size={14} className="text-amber-400" />
                                    </div>
                                    <h4 className="text-xs font-bold text-white mb-2 leading-tight">
                                        <RichText text={principle.title} />
                                    </h4>
                                    <p className="text-[11px] text-white/70 leading-relaxed">
                                        <RichText text={principle.content} />
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mb-6 space-y-4">
                        <h3 className="text-[11px] uppercase tracking-wider text-amber-300 font-bold mb-3 flex items-center gap-2">
                            <BookOpen size={14} /> Detailed Rules
                        </h3>
                        {activeSystem.detailedRules.map((ruleCategory, idx) => (
                            <div key={idx} className="bg-black/20 rounded-lg p-4 border border-white/5">
                                <h4 className="text-xs font-semibold text-white/90 mb-2 flex items-center gap-2">
                                    {ruleCategory.category}
                                </h4>
                                <ul className="space-y-2 flex flex-col mt-3">
                                    {ruleCategory.rules.map((rule, rIdx) => (
                                        <li key={rIdx} className="flex gap-2.5 text-xs text-white/70 leading-relaxed">
                                            <span className="text-cyan-400/60 mt-0.5">-</span>
                                            <span><RichText text={rule} /></span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-emerald-900/10 border border-emerald-500/20 rounded-lg p-4">
                            <h3 className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold mb-3 flex items-center gap-2">
                                <ThumbsUp size={14} /> Advantages
                            </h3>
                            <ul className="space-y-2">
                                {activeSystem.advantages.map((adv, idx) => (
                                    <li key={idx} className="flex gap-2 text-xs text-emerald-100/70">
                                        <span className="text-emerald-400">✓</span>
                                        <span><RichText text={adv} /></span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-red-900/10 border border-red-500/20 rounded-lg p-4">
                            <h3 className="text-[11px] uppercase tracking-wider text-red-400 font-bold mb-3 flex items-center gap-2">
                                <ThumbsDown size={14} /> Disadvantages
                            </h3>
                            <ul className="space-y-2">
                                {activeSystem.disadvantages.map((dis, idx) => (
                                    <li key={idx} className="flex gap-2 text-xs text-red-100/70">
                                        <span className="text-red-400">✗</span>
                                        <span><RichText text={dis} /></span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-[11px] uppercase tracking-wider text-purple-300 font-bold mb-2 flex items-center gap-2">
                            <UserCircle size={14} /> Ideal Player Profile
                        </h3>
                        <p className="text-xs text-white/80 bg-purple-900/10 border border-purple-500/20 rounded-lg p-4 flex gap-3 items-start">
                            <span><RichText text={activeSystem.idealPlayerProfile} /></span>
                        </p>
                    </div>

                    {activeSystem.evTable && activeSystem.evTable.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold mb-3 flex items-center gap-2">
                                <TableProperties size={14} /> Expected Value (EV) Approximations
                            </h3>
                            <div className="bg-black/30 rounded-xl overflow-hidden border border-white/10">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-white/5 border-b border-white/10">
                                        <tr>
                                            <th className="p-3 font-semibold text-white/80 w-1/3">Hand Structure</th>
                                            <th className="p-3 font-semibold text-white/80 w-1/4">Est. EV</th>
                                            <th className="p-3 font-semibold text-white/80">Strategy Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {activeSystem.evTable.map((row, i) => (
                                            <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="p-3 font-medium text-cyan-200"><RichText text={row.hand} /></td>
                                                <td className="p-3 text-emerald-400 font-mono text-xs"><RichText text={row.ev} /></td>
                                                <td className="p-3 text-white/60 text-xs leading-relaxed"><RichText text={row.notes} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {activeSystem.evSource && (
                                <p className="mt-2 text-right text-[10px] text-white/40 italic">
                                    {activeSystem.evSource}
                                </p>
                            )}
                        </div>
                    )}

                    <div>
                        <h3 className="text-[11px] uppercase tracking-wider text-cyan-300 font-bold mb-3 flex items-center gap-2">
                            <Lightbulb size={14} /> Example Scenarios
                        </h3>
                        <ScenarioTabs scenarios={activeSystem.exampleScenarios} />
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper component to manage local state for the example scenario tabs
const ScenarioTabs: React.FC<{ scenarios: SwitchExampleCase[] }> = ({ scenarios }) => {
    const [activeIdx, setActiveIdx] = useState(0);

    // Reset when scenarios change (i.e. changing the main Basic/Advanced tabs)
    React.useEffect(() => {
        setActiveIdx(0);
    }, [scenarios]);

    return (
        <div className="flex flex-col gap-4">
             {/* Sub-tabs Navigation */}
             <div className="flex flex-wrap gap-2 mb-2">
                {scenarios.map((ex, idx) => (
                    <button
                        key={idx}
                        onClick={() => setActiveIdx(idx)}
                        className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all ${
                            activeIdx === idx 
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                            : 'bg-white/5 text-white/50 border border-white/5 hover:bg-white/10 hover:text-white/80'
                        }`}
                    >
                        {ex.title.split(' (')[0]}
                    </button>
                ))}
            </div>

            {/* Active Content */}
            <div className="rounded-xl border border-white/8 bg-black/40 p-4 animate-in fade-in duration-200">
                {scenarios[activeIdx] && (
                    <>
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex gap-2 items-start">
                                <div>
                                    <p className="text-[13px] font-bold text-white mb-1">{scenarios[activeIdx].title}</p>
                                    <p className="text-[11px] font-semibold text-cyan-200/80">Dealer Upcard: {scenarios[activeIdx].dealerUpcard}</p>
                                </div>
                            </div>
                            <span className={`text-[11px] font-black px-2 py-1 rounded border ${scenarios[activeIdx].action === 'SWITCH' ? 'text-emerald-300 border-emerald-400/35 bg-emerald-500/10' : 'text-zinc-300 border-zinc-500/35 bg-zinc-700/20'}`}>
                                {scenarios[activeIdx].action}
                            </span>
                        </div>

                        <div className="flex flex-col gap-2 mb-4 mt-2">
                            <div className="flex items-stretch justify-center gap-3">
                                <div className="flex-1">
                                    <CardRow title="Dealt - Hand A" cards={scenarios[activeIdx].handA} description={getHandDescription(scenarios[activeIdx].handA)} />
                                </div>
                                <div className="flex-1">
                                    <CardRow title="Dealt - Hand B" cards={scenarios[activeIdx].handB} description={getHandDescription(scenarios[activeIdx].handB)} />
                                </div>
                            </div>
                            
                            <div className="flex justify-center -my-3 relative z-10">
                                <div className="bg-[#1f2328] border border-white/20 rounded-full p-1.5 text-cyan-400 shadow-xl">
                                    <ArrowDown size={14} strokeWidth={3} />
                                </div>
                            </div>

                            <div className="flex items-stretch justify-center gap-3">
                                <div className="flex-1">
                                    <CardRow title="Switched - Hand A" cards={scenarios[activeIdx].switchedA} description={getHandDescription(scenarios[activeIdx].switchedA)} />
                                </div>
                                <div className="flex-1">
                                    <CardRow title="Switched - Hand B" cards={scenarios[activeIdx].switchedB} description={getHandDescription(scenarios[activeIdx].switchedB)} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 rounded p-3 border border-white/10">
                            <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1 font-semibold">Insight & Rationale</p>
                            <p className="text-xs text-white/70 leading-relaxed"><RichText text={scenarios[activeIdx].insight} /></p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
