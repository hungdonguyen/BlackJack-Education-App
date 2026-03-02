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

export default function PayoutPanel({ roomConfig }: PayoutPanelProps) {
    const isFreeBet = roomConfig?.id === 'freebet';

    const payouts = [
        { label: 'Blackjack', value: '3 : 2' },
        { label: 'Insurance', value: '2 : 1' },
        { label: 'Regular Win', value: '1 : 1' },
        { label: 'Push', value: 'Tie' },
    ];

    if (isFreeBet) {
        payouts.push(
            { label: 'Free Double', value: 'Hard 9-11' },
            { label: 'Free Split', value: 'Non-10 pairs' },
            { label: 'Dealer 22', value: 'Push' },
        );
    }

    return (
        <motion.div
            className="w-[210px] rounded-xl overflow-hidden"
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
                            ${p.label.startsWith('Free') ? 'text-emerald-400' : p.label === 'Dealer 22' ? 'text-amber-400' : 'text-white/60'}`}
                        >{p.label}</span>
                        <span className={`text-[10px] font-bold tabular-nums
                            ${p.label.startsWith('Free') ? 'text-emerald-300' : p.label === 'Dealer 22' ? 'text-amber-300' : 'text-white/90'}`}
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
        </motion.div>
    );
}
