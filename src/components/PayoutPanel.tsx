'use client';

// ============================================
// PayoutPanel — with full freebet rules
// ============================================

import { motion } from 'framer-motion';
import { RoomConfig } from '@/utils/rooms';
import { CreditCard } from 'lucide-react';

interface PayoutPanelProps {
    roomConfig?: RoomConfig;
}

function formatBlackjackMultiplier(multiplier?: number): string {
    if (typeof multiplier !== 'number' || Number.isNaN(multiplier)) {
        return '3 : 2';
    }
    if (Math.abs(multiplier - 1) < 0.001) return '1 : 1';
    if (Math.abs(multiplier - 1.5) < 0.001) return '3 : 2';
    if (Math.abs(multiplier - 2) < 0.001) return '2 : 1';
    return `${multiplier.toFixed(2)} : 1`;
}

export default function PayoutPanel({ roomConfig }: PayoutPanelProps) {
    const isInfinityDoubleDown = roomConfig?.id === 'infinity_double_down' || roomConfig?.id === 'tutorial_infinity_double_down';
    const isZapout = roomConfig?.id === 'zapout_21' || roomConfig?.id === 'tutorial_zapout';

    const blackjackPayoutRows = isInfinityDoubleDown
        ? [
            { label: 'Suited Blackjack', value: '2 : 1' },
            { label: 'Unsuited Blackjack', value: '3 : 2' },
        ]
        : isZapout
            ? [
                { label: 'Natural Blackjack', value: '3 : 2' },
                { label: 'Zapped Blackjack', value: '1 : 1' },
            ]
            : [{ label: 'Blackjack', value: formatBlackjackMultiplier(roomConfig?.blackjackMultiplier) }];

    const payouts = [
        ...blackjackPayoutRows,
        { label: 'Insurance', value: '2 : 1' },
        { label: 'Regular Win', value: '1 : 1' },
        { label: 'Push', value: 'Tie' },
    ];

    const isFreeAction = roomConfig?.id === 'free_action';
    const iberianBonusPayouts = [
        { label: '5-Card 21 / ♠♥♦♣ 6-7-8, 7-7-7', value: '3 : 2' },
        { label: '6-Card 21 / ♠♠ 6-7-8, 7-7-7', value: '2 : 1' },
        { label: '7+ Card 21 / ♠♠♠ 6-7-8, 7-7-7', value: '3 : 1' },
    ];
    
    const isIberian = roomConfig?.id === 'iberian_21' || roomConfig?.id === 'tutorial_iberian';
    const isFireCard = roomConfig?.id === 'firecard_21' || roomConfig?.id === 'tutorial_firecard';
    const fireCardBonusPayouts = [
        { label: 'Burned Spades Ace', value: '7 : 1' },
        { label: 'Burned Other Ace', value: '2 : 1' },
    ];

    if (isFreeAction) {
        payouts.push(
            { label: 'Free Action Double', value: 'Hard 9-11' },
            { label: 'Free Action Split', value: 'Non-10 pairs' },
            { label: 'Dealer 22', value: 'Push' },
        );
    }

    const hasDealer22PushRule =
        roomConfig?.id === 'infinity_double_down' ||
        roomConfig?.id === 'tutorial_infinity_double_down' ||
        roomConfig?.id === 'exchange_21' ||
        roomConfig?.id === 'tutorial_exchange' ||
        roomConfig?.id === 'zapout_21' ||
        roomConfig?.id === 'tutorial_zapout' ||
        roomConfig?.sideBetType === 'push_22';

    if (!isFreeAction && hasDealer22PushRule) {
        payouts.push({ label: 'Dealer 22', value: 'Push' });
    }

    return (
        <div className="flex w-full flex-col gap-2">
            <motion.div
                className="w-full rounded-xl overflow-hidden"
                style={{
                    background: 'rgba(10, 6, 4, 0.8)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.05)',
                }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
            >
                {/* Header */}
                <div className="px-3 py-2 border-b border-white/5">
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] flex items-center"
                        style={{ color: roomConfig?.accentColor ?? '#d4a843' }}
                    >
                        <CreditCard size={12} className="mr-1.5" /> Payout Table
                    </span>
                </div>

                {/* Payout Rows */}
                <div className="p-2.5 space-y-1.5">
                    {payouts.map((p) => (
                        <div key={p.label} className="flex items-center justify-between px-1">
                            <span className={`text-[10px] font-medium
                            ${p.label.startsWith('Free Action') ? 'text-emerald-400' : p.label === 'Dealer 22' ? 'text-amber-400' : 'text-white/60'}`}
                            >{p.label}</span>
                            <span className={`text-[10px] font-bold tabular-nums
                            ${p.label.startsWith('Free Action') ? 'text-emerald-300' : p.label === 'Dealer 22' ? 'text-amber-300' : 'text-white/90'}`}
                            >{p.value}</span>
                        </div>
                    ))}
                </div>

                {/* Dealer Rule */}
                <div className="px-3 py-2 border-t border-white/5">
                    <span className="text-[7px] text-amber-400/60 uppercase tracking-[0.15em] font-bold">
                        {roomConfig?.rules.dealerStands ?? 'Dealer must stand on 17'}
                    </span>
                </div>

                {/* Multi Action Bonus — integrated into payout panel */}
                {isFreeAction && (
                    <>
                        <div className="px-3 py-2 border-t border-yellow-500/20 bg-yellow-500/10">
                            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] flex items-center text-yellow-500">
                                <CreditCard size={12} className="mr-1.5" /> Multi Action Bonus
                            </span>
                        </div>
                        <div className="p-2.5 space-y-1.5">
                            {[
                                { label: '6-8 Free Actions', value: '250 : 1' },
                                { label: '5 Free Actions', value: '150 : 1' },
                                { label: '4 Free Actions', value: '100 : 1' },
                                { label: '3 Free Actions', value: '40 : 1' },
                                { label: '2 Free Actions', value: '10 : 1' },
                                { label: '1 Free Action', value: '3 : 1' },
                            ].map((p) => (
                                <div key={p.label} className="flex items-center justify-between px-1">
                                    <span className="text-[10px] font-medium text-yellow-200/80">{p.label}</span>
                                    <span className="text-[10px] font-bold tabular-nums text-yellow-400">{p.value}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {isIberian && (
                    <>
                        <div className="px-3 py-2 border-t border-red-500/20 bg-red-500/10">
                            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] flex items-center text-red-500">
                                <CreditCard size={12} className="mr-1.5" /> 21 Bonus Payouts
                            </span>
                        </div>
                        <div className="p-2.5 space-y-1.5">
                            {iberianBonusPayouts.map((p) => (
                                <div key={p.label} className="flex items-center justify-between px-1">
                                    <span className="text-[10px] font-medium text-red-200/80">{p.label}</span>
                                    <span className="text-[10px] font-bold tabular-nums text-red-400">{p.value}</span>
                                </div>
                            ))}
                            <div className="rounded-lg border border-red-500/20 bg-red-500/6 px-2 py-2">
                                <div className="flex items-center justify-between gap-3">
                                    <span className="text-[10px] font-medium text-red-200/85">Suited 7-7-7 vs dealer 7</span>
                                </div>
                                <div className="mt-1.5 flex items-center justify-between gap-3 px-0.5">
                                    <span className="text-[9px] font-medium text-red-200/60">Bet under $25</span>
                                    <span className="text-[10px] font-bold tabular-nums text-red-400">$1000</span>
                                </div>
                                <div className="mt-1 flex items-center justify-between gap-3 px-0.5">
                                    <span className="text-[9px] font-medium text-red-200/60">Bet $25 or more</span>
                                    <span className="text-[10px] font-bold tabular-nums text-red-400">$5000</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
                {isFireCard && (
                    <>
                        <div className="px-3 py-2 border-t border-orange-500/20 bg-orange-500/10">
                            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] flex items-center text-orange-500">
                                <CreditCard size={12} className="mr-1.5" /> Burn Bonus Payouts
                            </span>
                        </div>
                        <div className="p-2.5 space-y-1.5">
                            {fireCardBonusPayouts.map((p) => (
                                <div key={p.label} className="flex items-center justify-between px-1">
                                    <span className="text-[10px] font-medium text-orange-200/80">{p.label}</span>
                                    <span className="text-[10px] font-bold tabular-nums text-orange-400">{p.value}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
                {roomConfig?.sideBetType === 'push_22' && !roomConfig?.isTutorial && (
                    <>
                        <div className="px-3 py-2 border-t border-purple-500/20 bg-purple-500/10">
                            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] flex items-center text-purple-400">
                                <CreditCard size={12} className="mr-1.5" /> Push 22 Bonus
                            </span>
                        </div>
                        <div className="p-2.5 space-y-1.5">
                            <div className="flex items-center justify-between px-1">
                                <span className="text-[10px] font-medium text-purple-200/80">Dealer busts with 22</span>
                                <span className="text-[10px] font-bold tabular-nums text-purple-400">11 : 1</span>
                            </div>
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );
}
