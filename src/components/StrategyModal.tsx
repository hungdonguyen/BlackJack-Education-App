'use client';

// ============================================
// StrategyModal - Basic Strategy Chart
// Premium casino-style presentation
// ============================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, BookOpen } from 'lucide-react';
import { RoomConfig } from '@/utils/rooms';
import { useGameStore } from '@/hooks/useGameStore';
import { GameStore } from '@/types/game';
import { I18_S17, I18_H17, FAB_4, IBERIAN_HILO, IBERIAN_WALKER } from '@/utils/countingDeviations';
import { useAudio } from '@/utils/audio';

interface StrategyModalProps {
    room: RoomConfig;
    onClose: () => void;
}

type Action = 'H' | 'S' | 'D' | 'DS' | 'SP' | 'SU' | 'FD' | 'FSP';
type Tab = 'hard' | 'soft' | 'pairs' | 'counting';

// Refined color palette matching casino aesthetic - gradient backgrounds
const ACTION_STYLES: Record<Action, { bg: string; text: string; label: string; desc: string }> = {
    H: { bg: 'linear-gradient(135deg, #1b7a3e 0%, #14532d 100%)', text: '#d1fae5', label: 'H', desc: 'Hit' },
    S: { bg: 'linear-gradient(135deg, #a8322c 0%, #8b1a1a 100%)', text: '#fde8e8', label: 'S', desc: 'Stand' },
    D: { bg: 'linear-gradient(135deg, #c9983a 0%, #a67c2e 100%)', text: '#1a1206', label: 'D', desc: 'Double Down' },
    DS: { bg: 'linear-gradient(135deg, #1a7a7a 0%, #115e5e 100%)', text: '#ccfbf1', label: 'DS', desc: 'Double if allowed, else Stand' },
    SP: { bg: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', text: '#dbeafe', label: 'SP', desc: 'Split' },
    SU: { bg: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', text: '#ede9fe', label: 'SU', desc: 'Surrender if allowed, else Hit' },
    FD: { bg: 'linear-gradient(135deg, #d4a843 0%, #b8922e 100%)', text: '#1a1206', label: 'FD', desc: 'Free Action Double' },
    FSP: { bg: 'linear-gradient(135deg, #e8c547 0%, #ccad3a 100%)', text: '#1a1206', label: 'FSP', desc: 'Free Action Split' },
};

const DEALER_UPCARDS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];

// Strategy Data
const HARD_ROWS = ['5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'];
const SOFT_ROWS = ['A,2', 'A,3', 'A,4', 'A,5', 'A,6', 'A,7', 'A,8', 'A,9'];
const PAIR_ROWS = ['2,2', '3,3', '4,4', '5,5', '6,6', '7,7', '8,8', '9,9', '10,10', 'A,A'];

// Classic: 8 decks, S17
const HARD_CLASSIC: Action[][] = [
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'],
    ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H'],
    ['H', 'H', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
    ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
    ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
    ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
    ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 18
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 19
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 20
];
const SOFT_CLASSIC: Action[][] = [
    ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['S', 'DS', 'DS', 'DS', 'DS', 'S', 'S', 'H', 'H', 'H'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
];
const PAIRS_CLASSIC: Action[][] = [
    ['SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'H', 'H', 'H', 'H'],
    ['SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'SP', 'SP', 'H', 'H', 'H', 'H', 'H'],
    ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'],
    ['SP', 'SP', 'SP', 'SP', 'SP', 'H', 'H', 'H', 'H', 'H'],
    ['SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'H', 'H', 'H', 'H'],
    ['SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP'],
    ['SP', 'SP', 'SP', 'SP', 'SP', 'S', 'SP', 'SP', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP'],
];

// Free Action rules
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
const PAIRS_FA: Action[][] = [
    ['FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP'],
    ['FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP'],
    ['FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP'],
    ['FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD'],
    ['FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP'],
    ['FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP'],
    ['FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP'],
    ['FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP'],
];

// Vegas Strip: 4 decks, S17, DAS
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
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 18
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 19
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 20
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
const PAIRS_VEGAS: Action[][] = PAIRS_CLASSIC;

// Atlantic City: 8 decks, S17, DAS, Late Surrender
const HARD_AC: Action[][] = [
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'],
    ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'], // 11
    ['H', 'H', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
    ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
    ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'],
    ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'SU', 'H'], // 15
    ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'SU', 'SU', 'SU'], // 16
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
];
const SOFT_AC: Action[][] = SOFT_CLASSIC;
const PAIRS_AC: Action[][] = PAIRS_CLASSIC;

// Iberian 21: 6 Decks, H17, No 10s. Strategy is hit-heavy.
const HARD_IBERIAN: Action[][] = [
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 5
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 6
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 7
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 8
    ['H', 'H', 'H', 'H', 'D', 'H', 'H', 'H', 'H', 'H'], // 9
    ['D', 'D', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H'], // 10
    ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H', 'H'], // 11
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 12
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 13
    ['H', 'H', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'], // 14
    ['H', 'H', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'], // 15
    ['H', 'H', 'S', 'S', 'S', 'H', 'H', 'SU', 'SU', 'SU'], // 16
    ['SU', 'SU', 'S', 'S', 'S', 'S', 'S', 'SU', 'SU', 'SU'], // 17
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 18
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 19
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 20
];
const SOFT_IBERIAN: Action[][] = [
    ['H', 'H', 'H', 'H', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['S', 'DS', 'DS', 'DS', 'DS', 'S', 'S', 'H', 'H', 'H'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
];
const PAIRS_IBERIAN: Action[][] = [
    ['SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'H', 'H', 'H', 'H'],
    ['SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H', 'H'],
    ['SP', 'SP', 'SP', 'SP', 'SP', 'H', 'H', 'H', 'H', 'H'],
    ['SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'H', 'H', 'H', 'H'], // 7s (hit heavy due to 7-7-7 bonus)
    ['SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP'],
    ['SP', 'SP', 'SP', 'SP', 'SP', 'S', 'SP', 'SP', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP'],
];

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

export default function StrategyModal({
    room,
    onClose,
}: StrategyModalProps) {
    const [tab, setTab] = useState<Tab>('hard');
    const countSystem = useGameStore((s: GameStore) => s.countSystem);
    const [countTab, setCountTab] = useState<'hilo' | 'kw'>(countSystem === 'Katarina Walker' ? 'kw' : 'hilo');
    const { playSound } = useAudio();

    const isIberianHiLo = room.id === 'iberian_21' && countTab === 'hilo';

    const strategyType = room.id;

    const rows = tab === 'hard' ? HARD_ROWS : tab === 'soft' ? SOFT_ROWS : PAIR_ROWS;
    const data = tab === 'hard'
        ? (strategyType === 'free_action'
            ? HARD_FA
            : strategyType === 'iberian_21'
                ? HARD_IBERIAN
                : strategyType === 'atlantic_city'
                    ? HARD_AC
                    : strategyType === 'vegas_downtown'
                        ? HARD_VEGAS
                        : HARD_CLASSIC)
        : tab === 'soft'
            ? (strategyType === 'free_action'
                ? SOFT_FA
                : strategyType === 'iberian_21'
                    ? SOFT_IBERIAN
                    : strategyType === 'atlantic_city'
                        ? SOFT_AC
                        : strategyType === 'vegas_downtown'
                            ? SOFT_VEGAS
                            : SOFT_CLASSIC)
            : (strategyType === 'free_action'
                ? PAIRS_FA
                : strategyType === 'iberian_21'
                    ? PAIRS_IBERIAN
                    : strategyType === 'atlantic_city'
                        ? PAIRS_AC
                        : strategyType === 'vegas_downtown'
                            ? PAIRS_VEGAS
                            : PAIRS_CLASSIC);

    const tabConfig: Record<Tab, { label: string; rowTitle: string }> = {
        hard: { label: 'Hard Totals', rowTitle: 'Hand' },
        soft: { label: 'Soft Totals', rowTitle: 'Hand' },
        pairs: { label: 'Pairs', rowTitle: 'Pair' },
        counting: { label: 'Card Counting', rowTitle: '' },
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
                    maxHeight: '994px',
                    width: '820px',
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
                                {room.name} {'\u2014'} {room.gameRules.numberOfDecks} Decks {'\u00b7'} {room.gameRules.dealerHitsSoft17 ? 'H17' : 'S17'} {'\u00b7'} Double After Split {'\u00b7'} {room.gameRules.allowSurrender ? 'Allow Surrender' : 'No Surrender'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => { playSound('click'); onClose(); }}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white/70 transition-all cursor-pointer"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                        <X size={15} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex px-6 pt-1" style={{ background: 'rgba(0,0,0,0.15)' }}>
                    {(['hard', 'soft', 'pairs', 'counting'] as Tab[]).map((t) => {
                        const active = tab === t;
                        return (
                            <button
                                key={t}
                                onClick={() => { playSound('click'); setTab(t); }}
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

                    {tab === 'counting' ? (
                        /* ─── Card Counting Guide ─── */
                        <div className="space-y-5">
                            {strategyType === 'iberian_21' && (
                                <div className="flex justify-center mb-2">
                                    <div className="flex bg-white/5 p-1 rounded-lg border border-white/10 relative">
                                        <button
                                            onClick={() => { playSound('click'); setCountTab('hilo'); }}
                                            className={`relative px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors z-10 ${countTab === 'hilo' ? 'text-black' : 'text-white/40 hover:text-white/70'}`}
                                        >
                                            Hi-Lo
                                            {countTab === 'hilo' && (
                                                <motion.div layoutId="count-tab-bg" className="absolute inset-0 rounded-md -z-10" style={{ background: room.accentColor }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => { playSound('click'); setCountTab('kw'); }}
                                            className={`relative px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors z-10 ${countTab === 'kw' ? 'text-black' : 'text-white/40 hover:text-white/70'}`}
                                        >
                                            Katarina Walker
                                            {countTab === 'kw' && (
                                                <motion.div layoutId="count-tab-bg" className="absolute inset-0 rounded-md -z-10" style={{ background: room.accentColor }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {countTab === 'kw' && strategyType === 'iberian_21' ? (
                                <>
                                    {/* Introduction */}
                                    <div>
                                        <p className="text-[11px] uppercase tracking-[0.2em] mb-2 font-bold" style={{ color: `${room.accentColor}80`, fontFamily: "'Georgia', serif" }}>
                                            Katarina Walker System
                                        </p>
                                        <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(240,230,214,0.55)' }}>
                                            Developed specifically for Iberian 21 by Katarina Walker. Because all 10s are removed, the deck dynamics change drastically. This advanced system perfectly captures the value of the remaining cards, assigning higher weights to 4s and 5s which are the most valuable cards for the dealer.
                                        </p>
                                    </div>

                                    <Ornament color={room.accentColor} />

                                    {/* Walker Values Table */}
                                    <div>
                                        <p className="text-[11px] uppercase tracking-[0.2em] mb-3 font-bold" style={{ color: `${room.accentColor}80`, fontFamily: "'Georgia', serif" }}>
                                            Card Values
                                        </p>
                                        <div className="w-full overflow-x-auto">
                                            <table className="w-full border-separate" style={{ borderSpacing: '3px' }}>
                                                <thead>
                                                    <tr>
                                                        <th className="text-[10px] font-bold uppercase tracking-wider text-center py-2 rounded" style={{ color: 'rgba(240,230,214,0.6)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.05)', fontFamily: "'Georgia', serif" }}>Card</th>
                                                        <th className="text-[10px] font-bold uppercase tracking-wider text-center py-2 rounded" style={{ color: 'rgba(240,230,214,0.6)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.05)', fontFamily: "'Georgia', serif" }}>Value</th>
                                                        <th className="text-[10px] font-bold uppercase tracking-wider text-center py-2 rounded" style={{ color: 'rgba(240,230,214,0.6)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.05)', fontFamily: "'Georgia', serif" }}>Impact</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td className="text-[13px] font-extrabold text-center py-2.5 rounded" style={{ background: 'linear-gradient(135deg, #1b7a3e 0%, #14532d 100%)', color: '#d1fae5' }}>4, 5</td>
                                                        <td className="text-[15px] font-black text-center py-2.5 rounded" style={{ background: 'rgba(34,197,94,0.15)', color: '#86efac' }}>+2</td>
                                                        <td className="text-[10px] text-center py-2.5 rounded" style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(240,230,214,0.5)' }}>Highly favorable when removed</td>
                                                    </tr>
                                                    <tr><td colSpan={3} style={{ height: 2 }} /></tr>
                                                    <tr>
                                                        <td className="text-[13px] font-extrabold text-center py-2.5 rounded" style={{ background: 'linear-gradient(135deg, #1b7a3e 0%, #14532d 100%)', color: '#d1fae5' }}>2, 3, 6</td>
                                                        <td className="text-[15px] font-black text-center py-2.5 rounded" style={{ background: 'rgba(34,197,94,0.15)', color: '#86efac' }}>+1</td>
                                                        <td className="text-[10px] text-center py-2.5 rounded" style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(240,230,214,0.5)' }}>Favorable when removed</td>
                                                    </tr>
                                                    <tr><td colSpan={3} style={{ height: 2 }} /></tr>
                                                    <tr>
                                                        <td className="text-[13px] font-extrabold text-center py-2.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(240,230,214,0.7)' }}>7, 8</td>
                                                        <td className="text-[15px] font-black text-center py-2.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>0</td>
                                                        <td className="text-[10px] text-center py-2.5 rounded" style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(240,230,214,0.5)' }}>Neutral</td>
                                                    </tr>
                                                    <tr><td colSpan={3} style={{ height: 2 }} /></tr>
                                                    <tr>
                                                        <td className="text-[13px] font-extrabold text-center py-2.5 rounded" style={{ background: 'linear-gradient(135deg, #a8322c 0%, #8b1a1a 100%)', color: '#fde8e8' }}>9, J, Q, K, A</td>
                                                        <td className="text-[15px] font-black text-center py-2.5 rounded" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}>−1</td>
                                                        <td className="text-[10px] text-center py-2.5 rounded" style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(240,230,214,0.5)' }}>Unfavorable when removed</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <Ornament color={room.accentColor} />

                                    {/* Running Count */}
                                    <div>
                                        <p className="text-[11px] uppercase tracking-[0.2em] mb-2 font-bold" style={{ color: `${room.accentColor}80`, fontFamily: "'Georgia', serif" }}>
                                            Step 1: Running Count (RC)
                                        </p>
                                        <p className="text-[12px] leading-relaxed mb-2" style={{ color: 'rgba(240,230,214,0.55)' }}>
                                            Unlike balanced systems, Katarina Walker for Iberian 21 is an unbalanced system (+8 per deck). Our Hand Advisor mathematically corrects this offset automatically so your display safely starts at 0.
                                            For every card you see dealt, add or subtract its Walker value.
                                        </p>
                                    </div>

                                    {/* True Count */}
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
                                    {/* Introduction */}
                                    <div>
                                        <p className="text-[11px] uppercase tracking-[0.2em] mb-2 font-bold" style={{ color: `${room.accentColor}80`, fontFamily: "'Georgia', serif" }}>
                                            Hi-Lo System — Iberian 21 Version
                                        </p>
                                        <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(240,230,214,0.55)' }}>
                                            Card counting using Hi-Lo in Iberian 21 is an <span style={{ color: 'rgba(240,230,214,0.8)', fontWeight: 700 }}>unbalanced system</span> — because all 10s are removed, the deck naturally starts at a Running Count of <span style={{ color: '#fca5a5', fontWeight: 700 }}>−24</span> (for 6 decks). This is intentional: it visually shows you how skewed the 48-card deck is compared to a normal shoe.
                                            <br /><br />The <span style={{ color: 'rgba(240,230,214,0.8)', fontWeight: 700 }}>Bet Advice</span> panel automatically compensates for this baseline, so bet sizing guidance is always meaningful regardless of the starting offset.
                                            Use Katarina Walker in Settings for a balanced alternative that starts at 0.
                                        </p>
                                    </div>

                                    <Ornament color={room.accentColor} />

                                    {/* Hi-Lo Values Table */}
                                    <div>
                                        <p className="text-[11px] uppercase tracking-[0.2em] mb-3 font-bold" style={{ color: `${room.accentColor}80`, fontFamily: "'Georgia', serif" }}>
                                            Card Values
                                        </p>
                                        <div className="w-full overflow-x-auto">
                                            <table className="w-full border-separate" style={{ borderSpacing: '3px' }}>
                                                <thead>
                                                    <tr>
                                                        <th className="text-[10px] font-bold uppercase tracking-wider text-center py-2 rounded" style={{ color: 'rgba(240,230,214,0.6)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.05)', fontFamily: "'Georgia', serif" }}>Card</th>
                                                        <th className="text-[10px] font-bold uppercase tracking-wider text-center py-2 rounded" style={{ color: 'rgba(240,230,214,0.6)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.05)', fontFamily: "'Georgia', serif" }}>Value</th>
                                                        <th className="text-[10px] font-bold uppercase tracking-wider text-center py-2 rounded" style={{ color: 'rgba(240,230,214,0.6)', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.05)', fontFamily: "'Georgia', serif" }}>Why</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td className="text-[13px] font-extrabold text-center py-2.5 rounded" style={{ background: 'linear-gradient(135deg, #1b7a3e 0%, #14532d 100%)', color: '#d1fae5' }}>2, 3, 4, 5, 6</td>
                                                        <td className="text-[15px] font-black text-center py-2.5 rounded" style={{ background: 'rgba(34,197,94,0.15)', color: '#86efac' }}>+1</td>
                                                        <td className="text-[10px] text-center py-2.5 rounded" style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(240,230,214,0.5)' }}>Low cards removed = favorable</td>
                                                    </tr>
                                                    <tr><td colSpan={3} style={{ height: 2 }} /></tr>
                                                    <tr>
                                                        <td className="text-[13px] font-extrabold text-center py-2.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(240,230,214,0.7)' }}>7, 8, 9</td>
                                                        <td className="text-[15px] font-black text-center py-2.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>0</td>
                                                        <td className="text-[10px] text-center py-2.5 rounded" style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(240,230,214,0.5)' }}>Neutral — no impact</td>
                                                    </tr>
                                                    <tr><td colSpan={3} style={{ height: 2 }} /></tr>
                                                    <tr>
                                                        <td className="text-[13px] font-extrabold text-center py-2.5 rounded" style={{ background: 'linear-gradient(135deg, #a8322c 0%, #8b1a1a 100%)', color: '#fde8e8' }}>10, J, Q, K, A</td>
                                                        <td className="text-[15px] font-black text-center py-2.5 rounded" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}>−1</td>
                                                        <td className="text-[10px] text-center py-2.5 rounded" style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(240,230,214,0.5)' }}>High cards removed = unfavorable</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <Ornament color={room.accentColor} />

                                    {/* Running Count */}
                                    <div>
                                        <p className="text-[11px] uppercase tracking-[0.2em] mb-2 font-bold" style={{ color: `${room.accentColor}80`, fontFamily: "'Georgia', serif" }}>
                                            Step 1: Running Count (RC)
                                        </p>
                                        <p className="text-[12px] leading-relaxed mb-2" style={{ color: 'rgba(240,230,214,0.55)' }}>
                                            Start at <span className="font-bold" style={{ color: 'rgba(240,230,214,0.8)' }}>0</span> after the shuffle.
                                            For every card you see dealt (to any player or the dealer), add or subtract its Hi-Lo value.
                                        </p>
                                        <div className="rounded-lg px-4 py-3" style={{ background: `linear-gradient(135deg, ${room.accentColor}08 0%, transparent 100%)`, border: `1px solid ${room.accentColor}18` }}>
                                            <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(240,230,214,0.6)' }}>
                                                <span className="font-bold" style={{ color: room.accentColor }}>Example:</span>{' '}
                                                Cards dealt: 5 (+1), K (−1), 3 (+1), 7 (0), A (−1) → RC = <span className="font-black" style={{ color: '#86efac' }}>0</span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* True Count */}
                                    <div>
                                        <p className="text-[11px] uppercase tracking-[0.2em] mb-2 font-bold" style={{ color: `${room.accentColor}80`, fontFamily: "'Georgia', serif" }}>
                                            Step 2: True Count (TC)
                                        </p>
                                        <p className="text-[12px] leading-relaxed mb-2" style={{ color: 'rgba(240,230,214,0.55)' }}>
                                            Divide the Running Count by the estimated number of decks remaining in the shoe.
                                            This normalizes the count across different shoe sizes.
                                        </p>
                                        <div className="rounded-lg px-4 py-3" style={{ background: `linear-gradient(135deg, ${room.accentColor}08 0%, transparent 100%)`, border: `1px solid ${room.accentColor}18` }}>
                                            <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(240,230,214,0.6)' }}>
                                                <span className="font-bold" style={{ color: room.accentColor }}>Formula:</span>{' '}
                                                TC = RC ÷ Decks Remaining
                                            </p>
                                            <p className="text-[11px] leading-relaxed mt-1" style={{ color: 'rgba(240,230,214,0.45)' }}>
                                                Example: RC = +6, 3 decks left → TC = <span className="font-black" style={{ color: '#86efac' }}>+2.0</span>
                                            </p>
                                        </div>
                                    </div>

                                    <Ornament color={room.accentColor} />
                                </>
                            )}

                            {/* Betting Strategy (Shared across systems for simplicity of explanation) */}
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.2em] mb-3 font-bold" style={{ color: `${room.accentColor}80`, fontFamily: "'Georgia', serif" }}>
                                    Step 3: Betting Strategy
                                </p>
                                <div className="space-y-2">
                                    {[
                                        { tc: isIberianHiLo ? 'TC ≤ −7' : 'TC ≤ −3', label: 'Sit Out', color: '#f87171', bg: 'rgba(239,68,68,0.12)', desc: 'Very unfavorable. Bet minimum or skip the hand.' },
                                        { tc: isIberianHiLo ? 'TC −7 to −5' : 'TC −3 to −1', label: 'Min Bet', color: '#fca5a5', bg: 'rgba(239,68,68,0.08)', desc: 'Unfavorable. Keep bets at minimum.' },
                                        { tc: isIberianHiLo ? 'TC −5 to −3' : 'TC −1 to +1', label: 'Flat Bet', color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.04)', desc: 'Neutral. Bet table minimum — no edge.' },
                                        { tc: isIberianHiLo ? 'TC −3 to −1' : 'TC +1 to +3', label: 'Raise', color: '#93c5fd', bg: 'rgba(59,130,246,0.1)', desc: 'Slightly favorable. Bet 2-3× minimum.' },
                                        { tc: isIberianHiLo ? 'TC −1 to +1' : 'TC +3 to +5', label: 'High Bet', color: '#86efac', bg: 'rgba(34,197,94,0.12)', desc: 'Very favorable. Bet 3-5× minimum.' },
                                        { tc: isIberianHiLo ? 'TC ≥ +1' : 'TC ≥ +5', label: 'Max Bet', color: '#fcd34d', bg: 'rgba(234,179,8,0.12)', desc: 'Extremely favorable. Bet 5-8× minimum!' },
                                    ].map((row) => (
                                        <div key={row.tc} className="flex items-center gap-3 rounded-lg px-3 py-2" style={{ background: row.bg, border: `1px solid ${row.color}25` }}>
                                            <span className="text-[10px] font-black tracking-wider shrink-0 w-[90px]" style={{ color: row.color }}>{row.tc}</span>
                                            <span className="text-[10px] font-black uppercase tracking-wider shrink-0 w-[60px]" style={{ color: row.color }}>{row.label}</span>
                                            <span className="text-[10px]" style={{ color: 'rgba(240,230,214,0.5)' }}>{row.desc}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Ornament color={room.accentColor} />

                            {/* Strategy Deviations */}
                            <div>
                                <p className="text-[11px] uppercase tracking-[0.2em] mb-2 font-bold" style={{ color: `${room.accentColor}80`, fontFamily: "'Georgia', serif" }}>
                                    {strategyType === 'iberian_21'
                                        ? (countTab === 'kw' ? 'Iberian 21: Walker Indices' : 'Iberian 21: Hi-Lo Deviations')
                                        : 'Advanced: Key Deviations (Illustrious 18 + Fab 4)'}
                                </p>
                                <p className="text-[12px] leading-relaxed mb-3" style={{ color: 'rgba(240,230,214,0.45)' }}>
                                    {strategyType === 'iberian_21'
                                        ? `These indices are specifically for Iberian 21 using the ${countTab === 'kw' ? 'Katarina Walker' : 'Hi-Lo'} system. Deviate from basic strategy when the True Count (TC) reaches these thresholds:`
                                        : "At certain True Counts, you should deviate from basic strategy. These are the most important deviations, and the Hand Advisor will automatically adapt to them if enabled:"}
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
                                            {(strategyType === 'iberian_21'
                                                ? (countTab === 'kw' ? IBERIAN_WALKER : IBERIAN_HILO)
                                                : [...(room.gameRules.dealerHitsSoft17 ? I18_H17 : I18_S17), ...FAB_4]
                                            ).map((dev, i) => (
                                                <tr key={i}>
                                                    <td className="text-[10px] font-bold text-center py-1.5 rounded whitespace-nowrap px-2" style={{ color: 'rgba(245,158,11,0.8)', background: 'rgba(245,158,11,0.08)' }}>
                                                        {dev.id}
                                                    </td>
                                                    <td className="text-[11px] font-bold text-center py-1.5 rounded whitespace-nowrap px-2" style={{ color: 'rgba(240,230,214,0.7)', background: 'rgba(255,255,255,0.04)' }}>
                                                        {dev.playerTotal === 0 ? 'Ins' : (dev.isPair ? `${dev.playerTotal / 2},${dev.playerTotal / 2}` : (dev.isSoft ? `A,${dev.playerTotal - 11}` : dev.playerTotal))}
                                                    </td>
                                                    <td className="text-[11px] font-bold text-center py-1.5 rounded" style={{ color: 'rgba(240,230,214,0.7)', background: 'rgba(255,255,255,0.04)' }}>
                                                        {dev.dealerUpcard}
                                                    </td>
                                                    <td className="text-[11px] font-black text-center py-1.5 rounded whitespace-nowrap px-2" style={{ color: dev.direction === 'gte' ? '#86efac' : '#fca5a5', background: dev.direction === 'gte' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)' }}>
                                                        {dev.direction === 'gte' ? '≥ ' : '< '}
                                                        {dev.index > 0 ? '+' : ''}{dev.index}
                                                    </td>
                                                    <td className="text-[10px] font-medium text-left py-1.5 px-3 rounded" style={{ color: 'rgba(240,230,214,0.6)', background: 'rgba(255,255,255,0.04)' }}>
                                                        {dev.description}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Footnote */}
                            <div className="rounded-lg px-4 py-3.5" style={{ background: `linear-gradient(135deg, ${room.accentColor}08 0%, transparent 100%)`, border: `1px solid ${room.accentColor}18` }}>
                                <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(240,230,214,0.45)' }}>
                                    <span className="font-bold" style={{ color: 'rgba(240,230,214,0.65)', fontFamily: "'Georgia', serif" }}>Note:</span>{' '}
                                    Card counting is a <span className="font-bold" style={{ color: 'rgba(240,230,214,0.7)' }}>legal</span> skill, not cheating.
                                    However, casinos may ask counters to leave.
                                    This tool is for <span className="font-bold" style={{ color: room.accentColor }}>educational purposes only</span> — practice your skills in this simulation!
                                </p>
                            </div>
                        </div>
                    ) : (
                        /* ─── Strategy Charts ─── */
                        <>

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
                                                    {row === '10,10' && strategyType === 'iberian_21' ? 'J,Q,K' : row}
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
                                    {room.hasSideBet && room.baseGameRtp ? (
                                        <>
                                            Base Game RTP:{' '}
                                            <span className="font-black" style={{ color: room.accentColor }}>{room.baseGameRtp}</span>
                                        </>
                                    ) : (
                                        <>
                                            Theoretical RTP:{' '}
                                            <span className="font-black" style={{ color: room.accentColor }}>{room.rtp}</span>
                                        </>
                                    )}
                                </p>
                            </div>

                            {/* Side Bet Strategy — Free Action only */}
                            {room.isFreeAction && (
                                <>
                                    <Ornament color={room.accentColor} />
                                    <div className="mt-3">
                                        <p className="text-[11px] uppercase tracking-[0.2em] mb-3 font-bold" style={{ color: `${room.accentColor}80`, fontFamily: "'Georgia', serif" }}>
                                            Multi Action Bonus — Side Bet
                                        </p>
                                        <div className="space-y-3">
                                            <div className="rounded-lg px-4 py-3" style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.18)' }}>
                                                <p className="text-[11px] font-bold mb-1" style={{ color: 'rgba(250,204,21,0.8)' }}>What is it?</p>
                                                <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(240,230,214,0.5)' }}>
                                                    The Multi Action Bonus is a side bet that pays based on how many Free Actions (Free Doubles + Free Splits)
                                                    you trigger during a round. More Free Actions = bigger payout.
                                                </p>
                                            </div>
                                            <div className="rounded-lg px-4 py-3" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)' }}>
                                                <p className="text-[11px] font-bold mb-1" style={{ color: 'rgba(252,165,165,0.9)' }}>House Edge Warning</p>
                                                <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(240,230,214,0.5)' }}>
                                                    Side bets carry a <span className="font-bold text-red-400">significantly higher house edge</span> than the main game.
                                                    {room.sideBetRtp ? (
                                                        <>
                                                            {' '}Side Bet RTP: <span className="font-bold text-red-400">{room.sideBetRtp}</span> vs Base Game: <span className="font-bold" style={{ color: room.accentColor }}>{room.baseGameRtp}</span>.
                                                        </>
                                                    ) : (
                                                        <>
                                                            {' '}The Multi Action Bonus has a much lower RTP than the base game ({room.rtp}).
                                                        </>
                                                    )}
                                                    {' '}In the long run, side bets will cost you more than the main game.
                                                </p>
                                            </div>
                                            <div className="rounded-lg px-4 py-3" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.18)' }}>
                                                <p className="text-[11px] font-bold mb-1" style={{ color: 'rgba(134,239,172,0.9)' }}>When to play?</p>
                                                <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(240,230,214,0.5)' }}>
                                                    Only place the side bet when you&apos;re feeling lucky and want some extra excitement.
                                                    It&apos;s purely for entertainment — <span className="font-bold" style={{ color: room.accentColor }}>never rely on it for profit</span>.
                                                    Keep your side bet small relative to your main bet.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
