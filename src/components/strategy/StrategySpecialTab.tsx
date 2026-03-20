import React from 'react';
import { RoomConfig } from '@/utils/rooms';
import { RuleSection, RuleHighlightCard, Ornament, ACTION_STYLES, Action } from './Common';
import { COMPOSITION_DEPENDENT_OVERRIDES, CompositionDependentOverride } from '@/utils/strategyAdvisor';

interface StrategySpecialTabProps {
    room: RoomConfig;
}

const SPECIAL_CASE_GROUP_LABELS: Record<string, string> = {
    hard: 'Hard Totals',
    soft: 'Soft Totals',
    pairs: 'Pairs',
};

function formatSpecialCaseRank(rank: string) {
    if (rank === '*') return 'Any';
    if (rank === '10') return 'J/Q/K';
    return rank;
}

function formatSpecialCaseAction(action: Action) {
    return ACTION_STYLES[action].desc;
}

function renderSpecialCaseCards(pattern: string[]) {
    return pattern.map((rank, index) => ({
        key: `${rank}-${index}`,
        label: formatSpecialCaseRank(rank),
    }));
}

function getSpecialCaseAccent(isTopOverride?: boolean) {
    return isTopOverride
        ? {
            borderColor: 'rgba(250,204,21,0.35)',
            background: 'linear-gradient(135deg, rgba(250,204,21,0.12) 0%, rgba(255,255,255,0.03) 100%)',
            badge: 'Top Override',
            badgeColor: '#facc15',
        }
        : {
            borderColor: 'rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.03)',
            badge: 'Walker Note',
            badgeColor: 'rgba(255,255,255,0.45)',
        };
}

export const StrategySpecialTab: React.FC<StrategySpecialTabProps> = ({ room }) => {
    const roomCompositionOverrides = COMPOSITION_DEPENDENT_OVERRIDES.filter(
        (override: CompositionDependentOverride) => override.strategyType === room.strategyType
    );
    
    const topCompositionOverrides = roomCompositionOverrides.filter(
        (override: CompositionDependentOverride) => override.isTopOverride
    );
    
    const specialCaseGroups = (['hard', 'soft', 'pairs'] as const).map((group) => ({
        group,
        items: roomCompositionOverrides.filter(
            (override: CompositionDependentOverride) => override.tab === group && !override.isTopOverride
        ),
    })).filter((entry) => entry.items.length > 0);

    return (
        <div className="space-y-8">
            <div className="rounded-2xl border p-5" style={{ background: `linear-gradient(135deg, ${room.accentColor}0f 0%, rgba(255,255,255,0.02) 100%)`, borderColor: `${room.accentColor}26` }}>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] mb-1" style={{ color: `${room.accentColor}cc` }}>Composition & Special Totals</p>
                <p className="text-[12px] leading-relaxed text-white/70">
                    Basic strategy usually only considers the total value, but certain rooms reward you for the specific cards that make up that total.
                </p>
            </div>

            {topCompositionOverrides.length > 0 && (
                <RuleSection title="Critical Composition Overrides">
                    <div className="grid grid-cols-1 gap-4 mt-3">
                        {topCompositionOverrides.map((override) => {
                            const accent = getSpecialCaseAccent(true);
                            return (
                                <div key={override.id} className="rounded-2xl border p-4 relative overflow-hidden" style={{ background: accent.background, borderColor: accent.borderColor }}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex flex-wrap gap-1.5">
                                            {override.handPattern && renderSpecialCaseCards(override.handPattern).map((c) => (
                                                <div key={c.key} className="px-2 py-1 rounded bg-white/10 border border-white/10 text-[10px] font-black text-white/80">
                                                    {c.label}
                                                </div>
                                            ))}
                                            {override.minCardCount && (
                                                <div className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] font-bold text-white/40">
                                                    {override.minCardCount}+ Cards
                                                </div>
                                            )}
                                        </div>
                                        <div className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest" style={{ background: `${accent.badgeColor}20`, color: accent.badgeColor, border: `1px solid ${accent.badgeColor}30` }}>
                                            {accent.badge}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 shrink-0 rounded-lg flex items-center justify-center text-sm font-black" style={{ background: ACTION_STYLES[override.action as Action].bg, color: ACTION_STYLES[override.action as Action].text }}>
                                            {ACTION_STYLES[override.action as Action].label}
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-bold text-white/90">
                                                {override.playerTotal} vs {formatSpecialCaseRank(override.dealerUpcard)} &rarr; {formatSpecialCaseAction(override.action as Action)}
                                            </p>
                                            <p className="text-[11px] text-white/40 mt-0.5">{override.summary}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </RuleSection>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <RuleHighlightCard
                    accentColor={room.accentColor}
                    highlight={{
                        eyebrow: 'Bonus Payouts',
                        title: 'Suited 6-7-8 / 7-7-7',
                        detail: 'In Iberian 21, these specific combinations pay bonus odds (up to 40:1). Never double these hands if it would void the bonus eligibility.',
                        tone: 'good'
                    }}
                />
                <RuleHighlightCard
                    accentColor={room.accentColor}
                    highlight={{
                        eyebrow: 'Composition',
                        title: '5-Card Charlie',
                        detail: 'Some rooms (like Iberian 21) automatically win if you collect 5 cards without busting. Prioritize small-card hits when you have 4 cards.',
                        tone: 'accent'
                    }}
                />
            </div>

            <Ornament color={room.accentColor} />

            {specialCaseGroups.map((entry) => (
                <RuleSection key={entry.group} title={`${SPECIAL_CASE_GROUP_LABELS[entry.group]} Adjustments`}>
                    <div className="space-y-3 mt-3">
                        {entry.items.map((override) => {
                            const accent = getSpecialCaseAccent(false);
                            return (
                                <div key={override.id} className="p-4 rounded-xl border flex items-center gap-4" style={{ background: accent.background, borderColor: accent.borderColor }}>
                                    <div className="flex flex-wrap gap-1 w-24 shrink-0">
                                        {override.handPattern && renderSpecialCaseCards(override.handPattern).map((c) => (
                                            <div key={c.key} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[9px] font-bold text-white/60">
                                                {c.label}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[12px] font-bold text-white/85">
                                            {override.playerTotal} vs {formatSpecialCaseRank(override.dealerUpcard)} &rarr; <span style={{ color: room.accentColor }}>{formatSpecialCaseAction(override.action as Action)}</span>
                                        </p>
                                        <p className="text-[11px] text-white/40 mt-0.5 leading-relaxed">{override.summary}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </RuleSection>
            ))}
        </div>
    );
};
