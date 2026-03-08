'use client';

// ============================================
// HandAdvisor — Real-time bust risk + strategy
// Shows bust probability & optimal move
// ============================================

import { useMemo, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/hooks/useGameStore';
import { GamePhase, Rank } from '@/types/enums';
import { calculateHandValue } from '@/utils/hand';
import { Card } from '@/types/game';
import { Info, TrendingUp } from 'lucide-react';
import { getDeviation, Deviation } from '@/utils/countingDeviations';
import { getRoomConfig } from '@/utils/rooms';
import { getCardValue, getInitialDeckSum, CountingSystem } from '@/utils/cardCounting';

// ─── Strategy tables (mirrors StrategyModal) ──────────────────────────────────

type Action = 'H' | 'S' | 'D' | 'DS' | 'SP' | 'SU' | 'FD' | 'FSP';

const DEALER_UPCARDS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'] as const;
const PAIR_ROWS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'] as const;

// Hard (row index = total − 5, totals 5-20)
const HARD_CLASSIC: Action[][] = [
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 5
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 6
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 7
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 8
    ['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // 9
    ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'], // 10
    ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H'], // 11
    ['H', 'H', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'], // 12
    ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'], // 13
    ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'], // 14
    ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'], // 15
    ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'], // 16
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 17
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 18
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 19
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 20
];
const HARD_VEGAS: Action[][] = [
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'],
    ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D'],
    ['H', 'H', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
    ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
    ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
    ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
    ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
];
const HARD_FA: Action[][] = [
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD'], // 9
    ['FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD'], // 10
    ['FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD'], // 11
    ['H', 'H', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
    ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
    ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
    ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
    ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
];

// Soft (row index = total − 13, totals 13-20)
const SOFT_CLASSIC: Action[][] = [
    ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // A,2
    ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // A,3
    ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // A,4
    ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // A,5
    ['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // A,6
    ['S', 'DS', 'DS', 'DS', 'DS', 'S', 'S', 'H', 'H', 'H'], // A,7
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // A,8
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // A,9
];
const SOFT_VEGAS: Action[][] = [
    ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['DS', 'DS', 'DS', 'DS', 'DS', 'S', 'S', 'H', 'H', 'H'],
    ['S', 'S', 'S', 'S', 'DS', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
];
const SOFT_FA: Action[][] = [
    ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['S', 'DS', 'DS', 'DS', 'DS', 'S', 'S', 'H', 'H', 'H'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
];

// Atlantic City: 8 decks, S17, DAS, Late Surrender
const HARD_AC: Action[][] = [
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 5
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 6
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 7
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 8
    ['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // 9
    ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'], // 10
    ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D'], // 11 — Double vs A in AC
    ['H', 'H', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'], // 12
    ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'], // 13
    ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'], // 14
    ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'SU', 'H'], // 15 — SU vs 10
    ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'SU', 'SU', 'SU'], // 16 — SU vs 9, 10, A
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 17
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 18
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 19
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 20
];
const SOFT_AC: Action[][] = [
    ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // A,2
    ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // A,3
    ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // A,4
    ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // A,5
    ['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // A,6
    ['S', 'DS', 'DS', 'DS', 'DS', 'S', 'S', 'H', 'H', 'H'], // A,7
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // A,8
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // A,9
];

// Pairs
const PAIRS_TABLE: Action[][] = [
    ['SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'H', 'H', 'H', 'H'], // 2,2
    ['SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'H', 'H', 'H', 'H'], // 3,3
    ['H', 'H', 'H', 'SP', 'SP', 'H', 'H', 'H', 'H', 'H'],     // 4,4
    ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'],       // 5,5
    ['SP', 'SP', 'SP', 'SP', 'SP', 'H', 'H', 'H', 'H', 'H'],  // 6,6
    ['SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'H', 'H', 'H', 'H'], // 7,7
    ['SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP'], // 8,8
    ['SP', 'SP', 'SP', 'SP', 'SP', 'S', 'SP', 'SP', 'S', 'S'], // 9,9
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],       // 10,10
    ['SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP'], // A,A
];

const PAIRS_FA: Action[][] = [
    ['FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP'], // 2,2
    ['FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP'], // 3,3
    ['FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP'], // 4,4
    ['FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD'],         // 5,5 is Hard 10 -> Free Double
    ['FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP'], // 6,6
    ['FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP'], // 7,7
    ['FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP'], // 8,8
    ['FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP'], // 9,9
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],                   // 10,10 (Regular rules, stand)
    ['FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP'], // A,A
];

// ─── Action metadata ──────────────────────────────────────────────────────────

const ACTION_META: Record<Action, {
    label: string;
    shortLabel: string;
    color: string;
    glow: string;
    border: string;
    bg: string;
    desc: string;
    reasoning: (total: number, isSoft: boolean, dealerUp: string) => string;
}> = {
    H: {
        label: 'HIT',
        shortLabel: 'H',
        color: '#86efac',
        glow: 'rgba(34,197,94,0.35)',
        border: 'rgba(34,197,94,0.4)',
        bg: 'rgba(21,128,61,0.2)',
        desc: 'Draw another card',
        reasoning: (t, soft, d) => soft
            ? `Soft ${t} — Current hand is weak, draw to improve`
            : d === 'A' || ['7', '8', '9', '10'].includes(d)
                ? `Dealer is strong (${d}) — Cannot stand on ${t}`
                : `Total of ${t} is not competitive enough`,
    },
    S: {
        label: 'STAND',
        shortLabel: 'S',
        color: '#fca5a5',
        glow: 'rgba(239,68,68,0.35)',
        border: 'rgba(239,68,68,0.4)',
        bg: 'rgba(185,28,28,0.2)',
        desc: 'Keep your hand',
        reasoning: (t, soft, d) =>
            t >= 17
                ? `${t}${soft ? ' soft' : ''} — Strong hand, no need to risk drawing more`
                : ['2', '3', '4', '5', '6'].includes(d)
                    ? `Dealer is weak (${d}) — Let the dealer bust, that's the optimal play`
                    : `High bust risk if you continue drawing`,
    },
    D: {
        label: 'DOUBLE DOWN',
        shortLabel: 'D',
        color: '#fcd34d',
        glow: 'rgba(234,179,8,0.35)',
        border: 'rgba(234,179,8,0.45)',
        bg: 'rgba(161,98,7,0.2)',
        desc: 'Double bet, draw 1 card',
        reasoning: (t, _s, d) =>
            t >= 10 && t <= 11
                ? `${t} — Ideal position to maximise profit`
                : `Dealer is weak (${d}) and you hold the advantage`,
    },
    DS: {
        label: 'DOUBLE / STAND',
        shortLabel: 'DS',
        color: '#67e8f9',
        glow: 'rgba(6,182,212,0.35)',
        border: 'rgba(6,182,212,0.4)',
        bg: 'rgba(14,116,144,0.2)',
        desc: 'Double if allowed, otherwise Stand',
        reasoning: (_t, _s, _d) => `Take the Double if you have enough chips; otherwise Standing is still the optimal choice`,
    },
    SP: {
        label: 'SPLIT',
        shortLabel: 'SP',
        color: '#93c5fd',
        glow: 'rgba(59,130,246,0.35)',
        border: 'rgba(59,130,246,0.4)',
        bg: 'rgba(29,78,216,0.2)',
        desc: 'Split into 2 independent hands',
        reasoning: (t, _s, d) =>
            t === 22 /* A,A */
                ? `Pair of Aces — Always split, chance at two Blackjacks`
                : t === 16 /* 8,8 */
                    ? `Pair of 8s — 16 is the worst hand, split to recover`
                    : `Dealer is weak (${d}) — Split to double your advantage`,
    },
    SU: {
        label: 'SURRENDER',
        shortLabel: 'SU',
        color: '#d8b4fe',
        glow: 'rgba(139,92,246,0.35)',
        border: 'rgba(139,92,246,0.4)',
        bg: 'rgba(109,40,217,0.2)',
        desc: 'Forfeit hand, recover 50% of bet',
        reasoning: (t, _s, d) =>
            `Total ${t} vs Dealer (${d}) — Win rate < 25%, Surrendering is optimal to minimise losses`,
    },
    FD: {
        label: 'FREE ACTION DOUBLE',
        shortLabel: 'FD',
        color: '#facc15',
        glow: 'rgba(250,204,21,0.5)',
        border: 'rgba(250,204,21,0.6)',
        bg: 'rgba(161,98,7,0.3)',
        desc: 'Double with free chips',
        reasoning: (t, _s, _d) => `Hard ${t} — Always take the Free Action Double, it's risk-free profit!`,
    },
    FSP: {
        label: 'FREE ACTION SPLIT',
        shortLabel: 'FSP',
        color: '#facc15',
        glow: 'rgba(250,204,21,0.5)',
        border: 'rgba(250,204,21,0.6)',
        bg: 'rgba(161,98,7,0.3)',
        desc: 'Split hand with free chips',
        reasoning: (_t, _s, _d) => `Non-10 pair — Always take the Free Action Split, double your chances for free!`,
    },
};

// ─── Utility helpers ──────────────────────────────────────────────────────────

function normRank(rank: string): string {
    if (rank === 'ACE') return 'A';
    if (['JACK', 'QUEEN', 'KING'].includes(rank)) return '10';
    return rank;
}

function getDealerIdx(rank: string): number {
    return DEALER_UPCARDS.indexOf(normRank(rank) as (typeof DEALER_UPCARDS)[number]);
}

function getPairRowIdx(cards: Card[]): number {
    if (cards.length !== 2) return -1;
    if (cards[0].value !== cards[1].value) return -1;
    const r = normRank(cards[0].rank);
    return PAIR_ROWS.indexOf(r as (typeof PAIR_ROWS)[number]);
}

function getStrategyAction(
    cards: Card[],
    total: number,
    isSoft: boolean,
    dealerUpRank: string,
    strategyType: string,
    canSplit: boolean,
    canSurrender: boolean,
): Action {
    const dIdx = getDealerIdx(dealerUpRank);
    if (dIdx < 0) return 'H';

    let action: Action;

    const pairIdx = getPairRowIdx(cards);
    if (pairIdx >= 0) {
        action = strategyType === 'free_action' ? PAIRS_FA[pairIdx][dIdx] : PAIRS_TABLE[pairIdx][dIdx];
        if ((action === 'SP' || action === 'FSP') && !canSplit) {
            const clampedTotal = Math.min(Math.max(total, 5), 20);
            const tbl = strategyType === 'free_action' ? HARD_FA : strategyType === 'ac' ? HARD_AC : strategyType === 'vegas' ? HARD_VEGAS : HARD_CLASSIC;
            action = tbl[clampedTotal - 5]?.[dIdx] ?? 'H';
        }
    } else if (isSoft && total >= 13 && total <= 20) {
        const tbl = strategyType === 'free_action' ? SOFT_FA : strategyType === 'ac' ? SOFT_AC : strategyType === 'vegas' ? SOFT_VEGAS : SOFT_CLASSIC;
        action = tbl[total - 13]?.[dIdx] ?? 'H';
    } else {
        const clampedTotal = Math.min(Math.max(total, 5), 20);
        const tbl = strategyType === 'free_action' ? HARD_FA : strategyType === 'ac' ? HARD_AC : strategyType === 'vegas' ? HARD_VEGAS : HARD_CLASSIC;
        action = tbl[clampedTotal - 5]?.[dIdx] ?? (total >= 17 ? 'S' : 'H');
    }

    // Downgrade actions that are only allowed on the initial 2 cards or specific contexts
    if (cards.length > 2) {
        if (action === 'D' || action === 'FD') action = 'H';
        else if (action === 'DS') action = 'S';
    }

    // Explicitly fallback if Surrender is mathematically recommended but contextually impossible
    if (action === 'SU' && !canSurrender) {
        action = total >= 17 ? 'S' : 'H';
    }

    return action;
}

function computeBustStats(cards: Card[], shoe: Card[]) {
    if (!shoe.length) return { bustPct: 0, improvePct: 100, bustCount: 0, safeCount: 0, total: 0 };
    let bustCount = 0;
    for (const card of shoe) {
        if (calculateHandValue([...cards, card]).total > 21) bustCount++;
    }
    const safeCount = shoe.length - bustCount;
    return {
        bustPct: (bustCount / shoe.length) * 100,
        improvePct: (safeCount / shoe.length) * 100,
        bustCount,
        safeCount,
        total: shoe.length,
    };
}

// ─── Card Counting helpers (shared logic) ──────────────────

function computeTrueCount(
    shoe: Card[],
    dealerCards: Card[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    seats: any[],
    numDecks: number,
    activeSystem: CountingSystem,
    omitTens: boolean
): number {
    let shoeSum = 0;
    for (const card of shoe) shoeSum += getCardValue(card.rank, activeSystem);

    const initialDeckSum = getInitialDeckSum(activeSystem, omitTens);
    const initialShoeSum = numDecks * initialDeckSum;
    let runningCount = initialShoeSum - shoeSum;

    // Subtract hidden (unseen) cards from running count
    for (const card of dealerCards) {
        if (card.isHidden) runningCount -= getCardValue(card.rank, activeSystem);
    }
    for (const seat of seats) {
        for (const hand of seat.hands) {
            for (const card of hand.cards) {
                if (card.isHidden) runningCount -= getCardValue(card.rank, activeSystem);
            }
        }
    }

    const decksRemaining = Math.max(shoe.length / 52, 0.5);
    return runningCount / decksRemaining;
}

// Circular ring SVG
function RingGauge({ pct, color, size = 56 }: { pct: number; color: string; size?: number }) {
    const id = useId();
    const r = (size - 10) / 2;
    const circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
            <defs>
                <filter id={`glow-${id}`} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
            </defs>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
            <circle
                cx={size / 2} cy={size / 2} r={r}
                fill="none"
                stroke={color}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circ}`}
                filter={`url(#glow-${id})`}
            />
        </svg>
    );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface HandAdvisorProps {
    roomId: string;
    accentColor?: string;
    borderColor?: string;
    onOpenStrategy?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HandAdvisor({ roomId, accentColor = '#d4a843', borderColor, onOpenStrategy }: HandAdvisorProps) {
    const gamePhase = useGameStore((s) => s.gamePhase);
    const seats = useGameStore((s) => s.seats);
    const dealerHand = useGameStore((s) => s.dealerHand);
    const currentSeatIndex = useGameStore((s) => s.currentSeatIndex);
    const shoe = useGameStore((s) => s.shoe);
    const showCardCounting = useGameStore((s) => s.showCardCounting);
    const userSystem = useGameStore((s) => s.countSystem);

    const activeSystem: CountingSystem = (roomId === 'iberian_21' && userSystem === 'Katarina Walker') ? 'Katarina Walker' : 'Hi-Lo';
    const omitTens = roomId === 'iberian_21';

    const room = getRoomConfig(roomId);
    const strategyType = roomId === 'free_action' ? 'free_action' : roomId === 'iberian_21' ? 'iberian_21' : roomId === 'atlantic_city' ? 'ac' : (roomId === 'vegas_strip' || roomId === 'vegas_downtown') ? 'vegas' : 'classic';
    const isVisible = gamePhase === GamePhase.PLAYER_TURN;

    // Gather current hand & dealer upcard
    const currentSeat = seats[currentSeatIndex];
    const currentHand = currentSeat?.hands[currentSeat.currentHandIndex];
    const dealerUpCard = dealerHand.cards.find((c) => !c.isHidden);

    const analysis = useMemo(() => {
        if (!currentHand || !dealerUpCard) return null;
        const cards = currentHand.cards;
        const { total, isSoft } = calculateHandValue(cards);
        if (total >= 21) return null; // Blackjack / already done

        const showBustRisk = total > 11;
        const bust = showBustRisk ? computeBustStats(cards, shoe) : null;
        const canSplitHand = currentSeat.hands.length < 4;

        // True late surrender is only valid on the original first 2 cards (not split hands)
        const canSurrenderNow = cards.length === 2 && currentSeat.hands.length === 1 && room.gameRules.allowSurrender;

        const basicAction = getStrategyAction(cards, total, isSoft, dealerUpCard.rank, strategyType, canSplitHand, canSurrenderNow);
        const dealerNorm = normRank(dealerUpCard.rank);

        // ── Card counting deviation check ──
        let action: Action = basicAction;
        let deviation: Deviation | null = null;
        let trueCount = 0;

        if (showCardCounting) {
            trueCount = computeTrueCount(shoe, dealerHand.cards, seats, room.gameRules.numberOfDecks, activeSystem, omitTens);

            // Check if current hand is a pair (for split deviations)
            const isPairHand = cards.length === 2 && cards[0].value === cards[1].value;

            deviation = getDeviation(
                total,
                isSoft,
                isPairHand,
                dealerNorm,
                trueCount,
                room.gameRules.dealerHitsSoft17,
                room.gameRules.allowSurrender,
                roomId,
                activeSystem
            );

            if (deviation) {
                action = deviation.deviationAction as Action;
                // Downgrade double/split if not on initial 2 cards
                if (cards.length > 2) {
                    if (action === 'D') action = 'H';
                    if (action === 'SP') action = basicAction; // can't split after initial
                }
                if (action === 'SU' && !canSurrenderNow) {
                    action = total >= 17 ? 'S' : 'H';
                }

                // If downgraded action equals basic, no real deviation
                if (action === basicAction) deviation = null;
            }
        }

        const meta = ACTION_META[action];

        return {
            total, isSoft, cards, bust, action, meta, dealerNorm,
            showBustRisk, cardCount: cards.length,
            deviation, basicAction, trueCount,
        };
    }, [currentHand, dealerUpCard, shoe, strategyType, showCardCounting, seats, dealerHand, room]);

    const bdr = borderColor ?? `${accentColor}30`;

    return (
        <AnimatePresence>
            {isVisible && analysis && (
                <motion.div
                    key="hand-advisor"
                    className="w-56 rounded-2xl overflow-hidden flex flex-col"
                    style={{
                        background: 'linear-gradient(180deg, rgba(12,7,4,0.97) 0%, rgba(8,5,3,0.97) 100%)',
                        backdropFilter: 'blur(14px)',
                        border: `1px solid ${bdr}`,
                        boxShadow: `0 0 40px ${accentColor}18, 0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)`,
                    }}
                    initial={{ opacity: 0, y: -12, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                >
                    {/* ── Header ── */}
                    <div
                        className="flex items-center justify-between px-3.5 py-2"
                        style={{ background: `linear-gradient(90deg, ${accentColor}18, transparent)`, borderBottom: `1px solid ${accentColor}15` }}
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black uppercase tracking-[0.22em] font-sans" style={{ color: 'rgba(220,200,170,0.8)' }}>
                                Hand Advisor
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accentColor }} />
                            <span className="text-[10px] font-bold uppercase tracking-[0.18em] font-sans" style={{ color: `${accentColor}90` }}>LIVE</span>
                        </div>
                    </div>

                    {/* ── Section 1: Bust Risk ── */}
                    {analysis.showBustRisk && analysis.bust && (
                        <>
                            <div className="px-3.5 pt-3 pb-2.5">
                                {/* Section label */}
                                <div className="flex items-center gap-1.5 mb-2.5">
                                    <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${accentColor}40, transparent)` }} />
                                    <span className="text-[9px] font-black uppercase tracking-[0.28em] text-white/30 font-sans">Bust Risk</span>
                                    <div className="h-px flex-1" style={{ background: `linear-gradient(270deg, ${accentColor}40, transparent)` }} />
                                </div>

                                {/* Two rings side-by-side */}
                                <div className="flex items-center justify-around">
                                    {/* Bust */}
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="relative flex items-center justify-center" style={{ width: 56, height: 56 }}>
                                            <RingGauge pct={analysis.bust.bustPct} color="#ef4444" size={56} />
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-[13px] font-black tabular-nums leading-none font-sans" style={{ color: '#fca5a5' }}>
                                                    {Math.round(analysis.bust.bustPct)}
                                                    <span className="text-[9px]">%</span>
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-400/70 font-sans">Bust</span>
                                    </div>

                                    {/* Divider */}
                                    <div className="flex flex-col items-center gap-0.5 opacity-30 mt-2">
                                        <span className="text-white/40 text-[9px]">♦</span>
                                        <div className="w-px h-6 bg-white/10" />
                                        <span className="text-white/40 text-[9px]">♦</span>
                                    </div>

                                    {/* Safe */}
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="relative flex items-center justify-center" style={{ width: 56, height: 56 }}>
                                            <RingGauge pct={analysis.bust.improvePct} color="#22c55e" size={56} />
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-[13px] font-black tabular-nums leading-none font-sans" style={{ color: '#86efac' }}>
                                                    {Math.round(analysis.bust.improvePct)}
                                                    <span className="text-[9px]">%</span>
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-green-400/70 font-sans">Safe</span>
                                    </div>
                                </div>

                                {/* Note with card count */}
                                <p className="text-center mt-3 text-[9px] font-bold tracking-[0.08em] font-sans" style={{ color: 'rgba(180,155,110,0.6)' }}>
                                    Based on {analysis.bust.total} cards remaining in shoe
                                    {analysis.cardCount >= 3 && ` · ${analysis.cardCount} cards in hand`}
                                </p>

                                {/* Bust count bar */}
                                <div className="mt-2">
                                    <div className="flex justify-between text-[7px] text-white/25 font-bold uppercase tracking-widest mb-1">
                                        <span>{analysis.bust.bustCount} bust</span>
                                        <span>{analysis.bust.safeCount} safe</span>
                                    </div>
                                    <div className="h-1.5 rounded-full overflow-hidden bg-white/5">
                                        <motion.div
                                            className="h-full rounded-full"
                                            style={{ background: 'linear-gradient(90deg, #ef4444, #f97316)' }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${analysis.bust.bustPct}%` }}
                                            transition={{ duration: 0.6, ease: 'easeOut' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Separator ornament */}
                            <div className="flex items-center gap-1.5 px-3.5 py-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                                <div className="h-px flex-1 bg-white/5" />
                                <span className="text-[8px] opacity-20">♣</span>
                                <span className="text-[6px] opacity-10">♥</span>
                                <span className="text-[8px] opacity-20">♣</span>
                                <div className="h-px flex-1 bg-white/5" />
                            </div>
                        </>
                    )}

                    {/* ── Section 2: Strategy Recommendation ── */}
                    <div className="px-3.5 pt-2 pb-3.5">
                        {/* Section label */}
                        <div className="flex items-center gap-1.5 mb-2.5">
                            <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${accentColor}40, transparent)` }} />
                            <span className="text-[9px] font-black uppercase tracking-[0.28em] text-white/30 font-sans">
                                {analysis.deviation ? 'Count Deviation' : 'Strategy Advice'}
                            </span>
                            <div className="h-px flex-1" style={{ background: `linear-gradient(270deg, ${accentColor}40, transparent)` }} />
                        </div>

                        {/* Deviation indicator badge */}
                        {analysis.deviation && (
                            <motion.div
                                className="rounded-lg px-2.5 py-2 mb-2.5 flex flex-col gap-1.5"
                                style={{
                                    background: 'rgba(245,158,11,0.12)',
                                    border: '1px solid rgba(245,158,11,0.35)',
                                    boxShadow: '0 0 16px rgba(245,158,11,0.15)',
                                }}
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="flex items-center gap-1.5">
                                    <TrendingUp size={12} className="text-amber-400 flex-shrink-0" />
                                    <span className="text-[8px] font-black uppercase tracking-[0.15em] text-amber-400">
                                        {analysis.deviation.id.startsWith('I18') ? 'Illustrious 18' : analysis.deviation.id.startsWith('F4') ? 'Fab 4' : 'Deviation'}
                                        {' — Rule #'}{analysis.deviation.id.split('-')[1]}
                                    </span>
                                </div>
                                <p className="text-[8.5px] font-bold text-amber-200/80 leading-snug">
                                    {analysis.deviation.description}
                                </p>
                                <div className="flex items-center gap-1 text-[8px] font-bold text-amber-300/60">
                                    <span>TC {analysis.trueCount > 0 ? '+' : ''}{analysis.trueCount % 1 === 0 ? analysis.trueCount : analysis.trueCount.toFixed(1)}</span>
                                    <span className="text-amber-400/40">•</span>
                                    <span>Index {analysis.deviation.direction === 'gte' ? '≥' : '<'} {analysis.deviation.index > 0 ? '+' : ''}{analysis.deviation.index}</span>
                                    <span className="text-amber-400/40">•</span>
                                    <span className="line-through opacity-50">{ACTION_META[analysis.basicAction as Action]?.shortLabel ?? analysis.basicAction}</span>
                                    <span>→</span>
                                    <span className="text-amber-300 font-black">{analysis.meta.shortLabel}</span>
                                </div>
                            </motion.div>
                        )}

                        {/* Action badge */}
                        <motion.div
                            key={analysis.action}
                            className="rounded-xl px-3 py-2.5 flex items-center gap-3"
                            style={{
                                background: analysis.deviation ? 'rgba(245,158,11,0.15)' : analysis.meta.bg,
                                border: `1px solid ${analysis.deviation ? 'rgba(245,158,11,0.45)' : analysis.meta.border}`,
                                boxShadow: `0 0 20px ${analysis.deviation ? 'rgba(245,158,11,0.25)' : analysis.meta.glow}`,
                            }}
                            initial={{ scale: 0.92, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                        >
                            {/* Action letter badge */}
                            <div
                                className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-black text-base leading-none"
                                style={{
                                    background: analysis.deviation ? 'rgba(245,158,11,0.25)' : `${analysis.meta.glow}`,
                                    border: `2px solid ${analysis.deviation ? 'rgba(245,158,11,0.5)' : analysis.meta.border}`,
                                    color: analysis.deviation ? '#fcd34d' : analysis.meta.color,
                                    textShadow: `0 0 12px ${analysis.deviation ? 'rgba(245,158,11,0.4)' : analysis.meta.glow}`,
                                    fontSize: analysis.action.length > 1 ? '10px' : '16px',
                                    letterSpacing: '0.02em',
                                }}
                            >
                                {analysis.action}
                            </div>

                            {/* Text */}
                            <div className="flex flex-col gap-0.5 min-w-0">
                                <span className="font-black uppercase tracking-[0.12em] text-[13px] leading-tight truncate font-sans" style={{ color: analysis.deviation ? '#fcd34d' : analysis.meta.color }}>
                                    {analysis.meta.label}
                                </span>
                                <span className="text-[10.5px] font-bold leading-tight font-sans" style={{ color: 'rgba(200,180,150,0.8)' }}>
                                    {analysis.meta.desc}
                                </span>
                            </div>
                        </motion.div>

                        {/* Reasoning */}
                        <p
                            className="mt-3 text-[10px] leading-[1.55] font-semibold px-1 font-sans"
                            style={{ color: analysis.deviation ? 'rgba(245,185,100,0.8)' : 'rgba(180,155,110,0.7)' }}
                        >
                            {analysis.deviation
                                ? analysis.deviation.description
                                : analysis.meta.reasoning(analysis.total, analysis.isSoft, analysis.dealerNorm)
                            }
                        </p>

                        {/* Hand summary row */}
                        <div className="flex items-center justify-between mt-2.5 px-1">
                            <div className="flex items-center gap-1">
                                <span className="text-[7px] uppercase tracking-[0.12em] text-white/20 font-bold">Your Hand</span>
                                <span className="text-[9px] font-black tabular-nums" style={{ color: accentColor }}>
                                    {analysis.isSoft && analysis.total <= 20
                                        ? `${analysis.total - 10}/${analysis.total}`
                                        : analysis.total}
                                    {analysis.isSoft ? ' ♞' : ''}
                                </span>
                            </div>
                            <span className="text-white/20 text-[8px]">vs</span>
                            <div className="flex items-center gap-1">
                                <span className="text-[8px] uppercase tracking-[0.12em] text-white/30 font-bold font-sans">Dealer</span>
                                <span className="text-[11px] font-black tabular-nums text-white/70">{analysis.dealerNorm}</span>
                            </div>
                        </div>

                        {/* More Details Link */}
                        <div className="flex items-center justify-center mt-4 pt-3 border-t border-white/5 font-sans" onClick={onOpenStrategy}>
                            <span className="text-[9px] uppercase tracking-wider text-white/40 font-bold flex items-center gap-1.5 cursor-pointer hover:text-white/70 transition-colors">
                                <Info size={11} /> Find out more details in Strategy
                            </span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
