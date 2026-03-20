import React from 'react';
import { motion } from 'framer-motion';
import { StrategyAction } from '@/utils/strategyAdvisor';

export type Action = StrategyAction | 'SW';

export const ACTION_STYLES: Record<Action, { bg: string; text: string; label: string; desc: string }> = {
    H: { bg: 'linear-gradient(135deg, #43a047 0%, #2e7d32 100%)', text: '#ffffff', label: 'H', desc: 'Hit' },
    S: { bg: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)', text: '#ffffff', label: 'S', desc: 'Stand' },
    DS: { bg: 'linear-gradient(135deg, #1a7a7a 0%, #115e5e 100%)', text: '#ccfbf1', label: 'DS', desc: 'Double if allowed, else Stand' },
    S4: { bg: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)', text: '#ffffff', label: 'S4', desc: 'Stand, but hit if you have 4 or more cards' },
    S5: { bg: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)', text: '#ffffff', label: 'S5', desc: 'Stand, but hit if you have 5 or more cards' },
    S6: { bg: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)', text: '#ffffff', label: 'S6', desc: 'Stand, but hit if you have 6 or more cards' },
    SP: { bg: 'linear-gradient(135deg, #039be5 0%, #0277bd 100%)', text: '#ffffff', label: 'P', desc: 'Split' },
    PS: { bg: 'linear-gradient(135deg, #039be5 0%, #0277bd 100%)', text: '#ffffff', label: 'PS', desc: 'Split, but HIT if you have suited sevens' },
    D: { bg: 'linear-gradient(135deg, #fdd835 0%, #fbc02d 100%)', text: '#1a1206', label: 'D', desc: 'Double' },
    D3: { bg: 'linear-gradient(135deg, #fdd835 0%, #fbc02d 100%)', text: '#1a1206', label: 'D3', desc: 'Double, but hit if you have 3 or more cards' },
    D4: { bg: 'linear-gradient(135deg, #fdd835 0%, #fbc02d 100%)', text: '#1a1206', label: 'D4', desc: 'Double, but hit if you have 4 or more cards' },
    D5: { bg: 'linear-gradient(135deg, #fdd835 0%, #fbc02d 100%)', text: '#1a1206', label: 'D5', desc: 'Double, but hit if you have 5 or more cards' },
    D6: { bg: 'linear-gradient(135deg, #fdd835 0%, #fbc02d 100%)', text: '#1a1206', label: 'D6', desc: 'Double, but hit if you have 6 or more cards' },
    R: { bg: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', text: '#ffffff', label: 'R', desc: 'Surrender' },
    RH: { bg: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', text: '#ffffff', label: 'RH', desc: 'Surrender if allowed, otherwise Hit' },
    SU: { bg: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', text: '#ede9fe', label: 'SU', desc: 'Surrender / rescue when the room allows it' },
    RS: { bg: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', text: '#ede9fe', label: 'RS', desc: 'Surrender if possible, otherwise Stand' },
    FD: { bg: 'linear-gradient(135deg, #d4a843 0%, #b8922e 100%)', text: '#1a1206', label: 'FD', desc: 'Free Action Double' },
    FSP: { bg: 'linear-gradient(135deg, #e8c547 0%, #ccad3a 100%)', text: '#1a1206', label: 'FSP', desc: 'Free Action Split' },
    Z: { bg: 'linear-gradient(135deg, #d946ef 0%, #c122d3 100%)', text: '#ffffff', label: 'Z', desc: 'Zap Out' },
    B: { bg: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', text: '#ffffff', label: 'B', desc: 'Burn Card' },
    SW: { bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', text: '#ffffff', label: 'SW', desc: 'Swap / Exchange card' },
};

export type HighlightTone = 'accent' | 'good' | 'warn';

export interface RuleHighlight {
    eyebrow: string;
    title: string;
    detail: string;
    tone?: HighlightTone;
}

export function RuleSection({ title, content, children }: { title: string; content?: string; children?: React.ReactNode }) {
    return (
        <div>
            <h3 className="text-xs font-bold text-white/80 uppercase tracking-[0.15em] mb-1.5">{title}</h3>
            {content && <p className="text-xs text-white/50 leading-relaxed">{content}</p>}
            {children}
        </div>
    );
}

export function RuleHighlightCard({ accentColor, highlight }: { accentColor: string; highlight: RuleHighlight }) {
    const toneStyles: Record<HighlightTone, { bg: string; border: string; title: string }> = {
        accent: {
            bg: `${accentColor}10`,
            border: `${accentColor}28`,
            title: accentColor,
        },
        good: {
            bg: 'rgba(34,197,94,0.08)',
            border: 'rgba(34,197,94,0.2)',
            title: '#86efac',
        },
        warn: {
            bg: 'rgba(245,158,11,0.08)',
            border: 'rgba(245,158,11,0.22)',
            title: '#fcd34d',
        },
    };

    const tone = toneStyles[highlight.tone ?? 'accent'];

    return (
        <div className="rounded-xl border p-3" style={{ background: tone.bg, borderColor: tone.border }}>
            <p className="text-[9px] font-black uppercase tracking-[0.24em] text-white/35 mb-1">{highlight.eyebrow}</p>
            <p className="text-[13px] font-black leading-snug mb-1.5" style={{ color: tone.title }}>{highlight.title}</p>
            <p className="text-[11px] leading-relaxed text-white/60">{highlight.detail}</p>
        </div>
    );
}

export function RuleBulletSection({ title, items, accentColor }: { title: string; items: string[]; accentColor: string }) {
    return (
        <div className="rounded-xl border p-3" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
            <h4 className="text-[11px] font-black uppercase tracking-[0.18em] mb-2" style={{ color: `${accentColor}cc` }}>{title}</h4>
            <ul className="space-y-2">
                {items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[11px] leading-relaxed text-white/58">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: accentColor }} />
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export function Ornament({ color }: { color: string }) {
    return (
        <div className="flex items-center justify-center gap-4 py-2 opacity-20">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-current" style={{ color }} />
            <div className="w-1 h-1 rounded-full rotate-45 border border-current" style={{ color }} />
            <div className="w-1.5 h-1.5 rounded-full rotate-45 bg-current" style={{ color }} />
            <div className="w-1 h-1 rounded-full rotate-45 border border-current" style={{ color }} />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-current" style={{ color }} />
        </div>
    );
}
