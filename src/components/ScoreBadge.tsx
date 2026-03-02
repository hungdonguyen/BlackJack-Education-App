'use client';

// ============================================
// ScoreBadge — Compact Evolution Gaming style score pill
// ============================================

import { motion } from 'framer-motion';
import { HandStatus } from '@/types/enums';

interface ScoreBadgeProps {
    value: string;
    status: HandStatus;
    delay?: number;
}

const STATUS_CONFIG: Record<HandStatus, { bg: string; glow: string; text: string; label?: string }> = {
    [HandStatus.PLAYING]: { bg: 'bg-black/70 border-white/15', glow: '', text: 'text-white/90' },
    [HandStatus.STAND]: { bg: 'bg-black/70 border-amber-500/30', glow: '', text: 'text-amber-400' },
    [HandStatus.BUST]: { bg: 'bg-red-950/80 border-red-500/40', glow: 'shadow-[0_0_10px_rgba(239,68,68,0.3)]', text: 'text-red-400', label: 'BUST' },
    [HandStatus.WON]: { bg: 'bg-emerald-950/80 border-emerald-500/50', glow: 'shadow-[0_0_15px_rgba(52,211,153,0.4)]', text: 'text-emerald-400', label: 'WIN' },
    [HandStatus.LOST]: { bg: 'bg-red-950/70 border-red-500/30', glow: '', text: 'text-red-400', label: 'LOSE' },
    [HandStatus.PUSH]: { bg: 'bg-gray-900/80 border-gray-400/30', glow: '', text: 'text-gray-300', label: 'PUSH' },
    [HandStatus.BLACKJACK]: { bg: 'bg-amber-950/80 border-amber-400/60', glow: 'shadow-[0_0_20px_rgba(245,158,11,0.5)]', text: 'text-amber-300', label: 'BJ!' },
};

export default function ScoreBadge({ value, status, delay = 0 }: ScoreBadgeProps) {
    const cfg = STATUS_CONFIG[status];

    return (
        <motion.div
            className={`
                inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                backdrop-blur-sm border font-bold text-sm
                ${cfg.bg} ${cfg.text} ${cfg.glow}
            `}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20, delay }}
            key={`${value}-${status}-${delay}`}
        >
            <span className="tabular-nums">{value}</span>
            {cfg.label && (
                <motion.span
                    className="text-[8px] uppercase tracking-wider font-extrabold"
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 }}
                >
                    {cfg.label}
                </motion.span>
            )}
        </motion.div>
    );
}
