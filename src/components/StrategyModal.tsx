'use client';

// ============================================
// StrategyModal - Basic Strategy Chart
// Premium casino-style presentation
// ============================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, BookOpen, Info, Plus, Minus, ChevronsUp, ArrowLeftRight, Shield, Flag, FlaskConical } from 'lucide-react';
import { RoomConfig } from '@/utils/rooms';
import { useGameStore } from '@/hooks/useGameStore';
import { GameStore } from '@/types/game';
import { I18_S17, I18_H17, FAB_4, IBERIAN_HILO, IBERIAN_WALKER, I18_EUROPEAN, I18_UK, PUSH_22_DEVIATIONS, FIRECARD_DEVIATIONS } from '@/utils/countingDeviations';
import { COMPOSITION_DEPENDENT_OVERRIDES, StrategyAction, CompositionDependentOverride } from '@/utils/strategyAdvisor';
import { useAudio } from '@/utils/audio';

interface StrategyModalProps {
    room: RoomConfig;
    onClose: () => void;
}

type Action = StrategyAction | 'SW';
type Tab = 'hard' | 'soft' | 'pairs' | 'special' | 'counting' | 'rules' | 'free_hand' | 'switch_advice';
type HighlightTone = 'accent' | 'good' | 'warn';

interface RuleHighlight {
    eyebrow: string;
    title: string;
    detail: string;
    tone?: HighlightTone;
}

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

interface StrategyTableContent {
    title: string;
    summary: string;
    bullets: string[];
}

type SpecialCaseGroup = 'hard' | 'soft' | 'pairs';

const SPECIAL_CASE_GROUP_LABELS: Record<SpecialCaseGroup, string> = {
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

// Refined color palette matching casino aesthetic - gradient backgrounds
const ACTION_STYLES: Record<Action, { bg: string; text: string; label: string; desc: string }> = {
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

const DEALER_UPCARDS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];

// Strategy Data
const HARD_ROWS = ['5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'];
const SOFT_ROWS = ['A,2', 'A,3', 'A,4', 'A,5', 'A,6', 'A,7', 'A,8', 'A,9'];
const PAIR_ROWS = ['2,2', '3,3', '4,4', '5,5', '6,6', '7,7', '8,8', '9,9', '10,10', 'A,A'];

const HARD_ROWS_IBERIAN = ['5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'];
const SOFT_ROWS_IBERIAN = ['A,2', 'A,3', 'A,4', 'A,5', 'A,6', 'A,7', 'A,8', 'A,9'];
const PAIR_ROWS_IBERIAN = ['2,2', '3,3', '4,4', '5,5', '6,6', '7,7', '8,8', '9,9', '10,10', 'A,A'];

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
const HARD_ZAPOUT: Action[][] = [
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
    ['Z', 'Z', 'Z', 'Z', 'Z', 'Z', 'Z', 'Z', 'Z', 'Z'], // 15
    ['Z', 'Z', 'Z', 'Z', 'Z', 'Z', 'Z', 'Z', 'Z', 'Z'], // 16
    ['Z', 'Z', 'Z', 'Z', 'Z', 'Z', 'Z', 'Z', 'Z', 'Z'], // 17
    ['S', 'S', 'S', 'S', 'S', 'S', 'Z', 'Z', 'Z', 'Z'], // 18
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 19
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 20
];
const HARD_EXCHANGE: Action[][] = [
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 5
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 6
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 7
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 8
    ['H', 'H', 'H', 'H', 'D', 'H', 'H', 'H', 'H', 'H'], // 9 
    ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H', 'H'], // 10
    ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'], // 11
    ['H', 'H', 'H', 'S', 'S', 'H', 'H', 'H', 'H', 'H'], // 12
    ['H', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'], // 13
    ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'], // 14
    ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'], // 15
    ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'], // 16
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 17
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 18
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 19
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 20
];

const HARD_FIRECARD: Action[][] = [
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
    ['S', 'S', 'S', 'S', 'S', 'H', 'B', 'B', 'B', 'B'], // 15
    ['S', 'S', 'S', 'S', 'S', 'H', 'B', 'B', 'B', 'B'], // 16
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 17
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 18
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 19
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 20
];

const SOFT_FIRECARD: Action[][] = [
    ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // A2
    ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // A3
    ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // A4
    ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // A5
    ['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // A6
    ['S', 'DS', 'DS', 'DS', 'DS', 'S', 'S', 'H', 'H', 'H'], // A7
    ['S', 'S', 'S', 'S', 'DS', 'S', 'S', 'S', 'S', 'S'], // A8
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // A9
];

const PAIRS_FIRECARD: Action[][] = [
    ['H', 'H', 'SP', 'SP', 'SP', 'SP', 'H', 'H', 'H', 'H'], // 22
    ['H', 'H', 'SP', 'SP', 'SP', 'SP', 'H', 'H', 'H', 'H'], // 33
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],    // 44
    ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'],    // 55
    ['SP', 'SP', 'SP', 'SP', 'SP', 'H', 'H', 'H', 'H', 'H'], // 66
    ['SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'H', 'H', 'H', 'H'], // 77
    ['SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP'], // 88
    ['SP', 'SP', 'SP', 'SP', 'SP', 'S', 'SP', 'SP', 'S', 'S'],   // 99
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],    // TT
    ['SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP'], // AA
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
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 5
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 6
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 7
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 8
    ['FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD'], // 9
    ['FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD'], // 10
    ['FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD'], // 11
    ['H', 'H', 'H', 'S', 'S', 'H', 'H', 'H', 'H', 'H'], // 12
    ['H', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'], // 13
    ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'], // 14 (Stand vs 2-6)
    ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'RH', 'RH'], // 15 (R vs 10,A)
    ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'RH', 'RH', 'RH'], // 16 (R vs 9,10,A)
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'RS'], // 17 (RS vs A)
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 18-20
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
];

// Free Hand tables (hands resulting from a free split)
const HARD_FA_FREE: Action[][] = [
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 5-8
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD'], // 9
    ['FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD'], // 10
    ['FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD'], // 11
    ['H', 'H', 'H', 'S', 'S', 'H', 'H', 'H', 'H', 'H'], // 12
    ['H', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'], // 13
    ['H', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'], // 14
    ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'], // 15
    ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'H', 'H'], // 16
    ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'S', 'H'], // 17
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 18-20
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
];
const SOFT_FA_FREE: Action[][] = [
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 13
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 14
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 15
    ['H', 'H', 'H', 'H', 'D', 'H', 'H', 'H', 'H', 'H'], // 16 (D vs dealer 6)
    ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // 17 (D vs dealer 5, 6)
    ['H', 'H', 'D', 'D', 'D', 'S', 'H', 'H', 'H', 'H'], // 18 (D vs 4-6, S vs 7)
    ['S', 'S', 'S', 'D', 'D', 'S', 'S', 'S', 'S', 'S'], // 19 (D vs 5-6)
    ['S', 'S', 'S', 'S', 'D', 'S', 'S', 'S', 'S', 'S'], // 20 (D vs 6)
];
const SOFT_FA: Action[][] = [
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 13
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 14
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 15
    ['H', 'H', 'H', 'H', 'D', 'H', 'H', 'H', 'H', 'H'], // 16 (D vs dealer 6)
    ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // 17 (D vs dealer 5,6)
    ['S', 'S', 'D', 'D', 'D', 'S', 'S', 'H', 'H', 'H'], // 18 (S vs 2-3, D vs 4-6, S vs 7-8, H vs 9-A)
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 19
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 20
];
const PAIRS_FA: Action[][] = [
    ['FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP'], // 2,2
    ['FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP'], // 3,3
    ['FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP'], // 4,4
    ['FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD', 'FD'], // 5,5  Free Double only 
    ['FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP'], // 6,6
    ['FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP'], // 7,7
    ['FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP'], // 8,8
    ['FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP'], // 9,9
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 10,10 Never split 10s
    ['FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP', 'FSP'], // A,A
];

// Vegas Strip: 4 decks, S17, DAS
const HARD_DOWNTOWN: Action[][] = [
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
const HARD_VEGAS: Action[][] = HARD_CLASSIC;

const SOFT_DOWNTOWN: Action[][] = [
    ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['DS', 'DS', 'DS', 'DS', 'DS', 'S', 'S', 'H', 'H', 'H'],
    ['S', 'S', 'S', 'S', 'DS', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
];
const SOFT_VEGAS: Action[][] = SOFT_CLASSIC;
const PAIRS_VEGAS: Action[][] = PAIRS_CLASSIC;

// Atlantic City: 8 decks, S17, DAS, Late Surrender
const HARD_AC: Action[][] = [
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'],
    ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H'], // 11
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

// European: 6 decks, S17, ENHC, D9-11 only, No Surrender
const HARD_EUROPEAN: Action[][] = [
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // 9
    ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'], // 10
    ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'], // 11
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
const SOFT_EUROPEAN: Action[][] = [
    // Double is only allowed on hard 9-11
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'H', 'H', 'H'], // 18
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
];
const PAIRS_EUROPEAN: Action[][] = [
    ['H', 'H', 'SP', 'SP', 'SP', 'SP', 'H', 'H', 'H', 'H'], // 2,2
    ['H', 'H', 'SP', 'SP', 'SP', 'SP', 'H', 'H', 'H', 'H'], // 3,3
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],     // 4,4
    ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'],     // 5,5
    ['H', 'SP', 'SP', 'SP', 'SP', 'H', 'H', 'H', 'H', 'H'], // 6,6
    ['SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'H', 'H', 'H', 'H'], // 7,7
    ['SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'H', 'H'], // 8,8
    ['SP', 'SP', 'SP', 'SP', 'SP', 'S', 'SP', 'SP', 'S', 'S'], // 9,9
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],     // 10,10
    ['SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'H'], // A,A
];

// United Kingdom: 6 decks, S17, ENHC but with OBO, DAS allowed, Double any 2 cards
const HARD_UK: Action[][] = [
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // 9
    ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'], // 10
    ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H'], // 11
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
const SOFT_UK: Action[][] = [
    // Because Double ANY 2 is allowed, this mirrors standard soft tables
    ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // A,2
    ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // A,3
    ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // A,4
    ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // A,5
    ['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // A,6
    ['S', 'DS', 'DS', 'DS', 'DS', 'S', 'S', 'H', 'H', 'H'], // A,7
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // A,8
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // A,9
];
const PAIRS_UK: Action[][] = [
    ['SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'H', 'H', 'H', 'H'], // 2,2
    ['SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'H', 'H', 'H', 'H'], // 3,3
    ['H', 'H', 'H', 'SP', 'SP', 'H', 'H', 'H', 'H', 'H'],     // 4,4 (Hit in strict UK, but some permit DAS splits)
    ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'],     // 5,5
    ['SP', 'SP', 'SP', 'SP', 'SP', 'H', 'H', 'H', 'H', 'H'], // 6,6
    ['SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'H', 'H', 'H', 'H'], // 7,7
    ['SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP'], // 8,8
    ['SP', 'SP', 'SP', 'SP', 'SP', 'S', 'SP', 'SP', 'S', 'S'], // 9,9
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],     // 10,10
    ['SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP'], // A,A
];

// Iberian 21: 6 Decks, H17, No 10s. Strategy is hit-heavy.
// Iberian 21: 6 Decks, H17, No 10s. Strategy is hit-heavy.
const HARD_IBERIAN: Action[][] = [
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 5
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 6
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 7
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 8
    ['H', 'H', 'H', 'H', 'D', 'H', 'H', 'H', 'H', 'H'], // 9
    ['D5', 'D5', 'D', 'D', 'D', 'D4', 'D3', 'H', 'H', 'H'], // 10
    ['D4', 'D5', 'D5', 'D5', 'D5', 'D4', 'D4', 'D4', 'D3', 'D3'], // 11
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 12
    ['H', 'H', 'H', 'H', 'S4', 'H', 'H', 'H', 'H', 'H'], // 13
    ['H', 'H', 'S4', 'S5', 'S6', 'H', 'H', 'H', 'H', 'H'], // 14
    ['S4', 'S5', 'S6', 'S6', 'S', 'H', 'H', 'H', 'H', 'H'], // 15
    ['S6', 'S6', 'S6', 'S', 'S', 'H', 'H', 'H', 'H', 'RH'], // 16
    ['S', 'S', 'S', 'S', 'S', 'S', 'S6', 'S6', 'S6', 'RH'], // 17
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 18
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 19
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 20
];
const SOFT_IBERIAN: Action[][] = [
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // A,2 (13)
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // A,3 (14)
    ['H', 'H', 'H', 'H', 'D4', 'H', 'H', 'H', 'H', 'H'], // A,4 (15)
    ['H', 'H', 'H', 'D3', 'D4', 'H', 'H', 'H', 'H', 'H'], // A,5 (16)
    ['H', 'H', 'D3', 'D4', 'D5', 'H', 'H', 'H', 'H', 'H'], // A,6 (17)
    ['S4', 'S4', 'D4', 'D5', 'D6', 'S6', 'S4', 'H', 'H', 'H'], // A,7 (18)
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S6', 'S6'], // A,8 (19)
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // A,9 (20)
];
const PAIRS_IBERIAN: Action[][] = [
    ['SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'H', 'H', 'H'],  // 2,2
    ['SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'H', 'H', 'H'],  // 3,3
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],        // 4,4
    ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H', 'H'],        // 5,5
    ['H', 'H', 'SP', 'SP', 'SP', 'H', 'H', 'H', 'H', 'H'],     // 6,6
    ['SP', 'SP', 'SP', 'SP', 'SP', 'PS', 'H', 'H', 'H', 'H'],  // 7,7
    ['SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'R', 'R'], // 8,8
    ['S', 'SP', 'SP', 'SP', 'SP', 'S', 'SP', 'SP', 'S', 'S'],  // 9,9
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],        // 10,10 (J/Q/K)
    ['SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP'], // A,A
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

function getRoomRulesContent(room: RoomConfig): RoomRulesContent {
    switch (room.id) {
        case 'exchange_21':
            return {
                overview: 'Exchange 21 requires you to play two hands simultaneously and allows you to switch the second card dealt to each hand. To offset this massive advantage, natural blackjacks pay 1:1, and a dealer total of 22 pushes all non-busted player hands.',
                highlights: [
                    {
                        eyebrow: 'Switch Rule',
                        title: 'Exchange the 2nd Cards',
                        detail: 'You play two hands with equal bets. Before making any other moves, you can switch the second card of each hand to create better totals.',
                        tone: 'accent',
                    },
                    {
                        eyebrow: 'Dealer Rule',
                        title: 'Dealer 22 Overload = Push',
                        detail: 'Because players can optimize their hands by switching, the dealer pushes any active player hands on a 22 bust. Natural blackjacks still win.',
                        tone: 'warn',
                    },
                    {
                        eyebrow: 'Blackjack Payouts',
                        title: 'Blackjacks Pay 1:1',
                        detail: 'Natural blackjacks pay even money (1:1). Note that a blackjack created by switching cards does not count as a natural blackjack; it just counts as a regular 21.',
                        tone: 'warn',
                    },
                ],
                playerOptions: {
                    title: 'Player Actions',
                    items: [
                        'Switch — Allowed only as the first action after the initial deal.',
                        'Double Down — Allowed on any first two cards (after deciding whether to switch).',
                        'Double After Split (DAS) — Permitted.',
                        'Split — Equal-value cards, maximum 2 hands per betting spot.',
                    ],
                },
                payouts: {
                    title: 'Payouts & Settlement',
                    items: [
                        'Natural Blackjack pays 1:1.',
                        'Dealer total of 22 results in a Push (except against natural blackjack).',
                        'All other wins pay even money (1:1).',
                        'Insurance pays 2:1 when the dealer shows an Ace.',
                    ],
                },
                dealerFlow: {
                    title: 'Dealer Protocol',
                    items: [
                        'Dealer hits soft 17 (H17).',
                        'Dealer peeks for blackjack when showing an Ace or a 10-value card.',
                        'If the dealer busts with exactly 22, all remaining player hands push.',
                    ],
                },
                strategyNotes: {
                    title: 'Switching Strategy & Tips',
                    items: [
                        'Expected Value (EV): The Action panel will naturally light up the SWITCH button if the calculated win-rate of the swapped hands is mathematically higher than your current hands.',
                        'Make a Strong Hand: Prioritize building one excellent hand (like 20, 21, or 11 to double) over keeping two mediocre hands (like 14 and 15).',
                        'Pairing Rule: Always switch to create powerful split hands (like a pair of Aces or 8s), especially against weak dealer upcards (3 through 6).',
                        'Break Stiffs: If you have two "stiff" hands (12-16) against a Dealer 10, switch them! If you can salvage at least one hand into a 10 or 20, it saves half your bet.',
                    ],
                },
            };
        case 'zapout_21':
            return {
                overview: 'Zap Out 21 allows you to discard hard 15, 16, 17, or 18 and draw a fresh new hand (once per hand). In exchange for this powerful advantage, any dealer total of 22 results in a push for all active non-blackjack player hands.',
                highlights: [
                    {
                        eyebrow: 'Zap Out Rule',
                        title: 'Discard Hard 15-18',
                        detail: 'If your first two cards form a hard total between 15 and 18, you can completely discard them and receive two new cards. This powerful move is allowed once per hand.',
                        tone: 'accent',
                    },
                    {
                        eyebrow: 'Dealer Rule',
                        title: 'Dealer 22 Overload = Push',
                        detail: 'Because players can Zap Out away their bad hands, the dealer pushes any active player hands on a 22 bust. Natural player blackjacks still win.',
                        tone: 'warn',
                    },
                    {
                        eyebrow: 'Decks & Dealer',
                        title: '6-Deck Shoe · Dealer Hits Soft 17',
                        detail: 'Natural Blackjack pays 3:2, Zapped Blackjack pays 1:1. The dealer will hit soft 17 (H17). You may double on any two cards.',
                        tone: 'good',
                    },
                ],
                playerOptions: {
                    title: 'Player Actions',
                    items: [
                        'Zap Out — Allowed once per hand on any initial two cards totaling hard 15, 16, 17, or 18.',
                        'Double Down — Allowed on any first two cards.',
                        'Double After Split (DAS) — Permitted.',
                        'Split — Equal-value cards, maximum 4 total hands.',
                        'Split Aces — One card each, no re-split, no further hitting.',
                    ],
                },
                payouts: {
                    title: 'Payouts & Settlement',
                    items: [
                        'Natural Blackjack pays 3:2.',
                        'Zapped Blackjack pays 1:1 (Even money).',
                        'Dealer total of 22 results in a Push, except against a natural player blackjack which wins 3:2.',
                        'All other wins pay even money (1:1).',
                        'Insurance pays 2:1 when the dealer shows an Ace.',
                    ],
                },
                dealerFlow: {
                    title: 'Dealer Protocol',
                    items: [
                        'Dealer hits soft 17 (H17).',
                        'Dealer peeks for blackjack when showing an Ace or a 10-value card.',
                        'If the dealer busts with a total of exactly 22, all remaining player hands push (tie) instead of winning.',
                    ],
                },
                strategyNotes: {
                    title: 'Strategy Notes',
                    items: [
                        'Always Zap Out any eligible hand (Hard 15, 16, 17) against any dealer upcard. For Hard 18, Zap Out only against Dealer 8, 9, 10, or Ace.',
                        'Because dealer 22 pushes, you should hit a bit more aggressively on some stiff hands than normal.',
                    ],
                },
            };
        case 'firecard_21':
            return {
                overview: 'Fire Card Blackjack lets you replace your second card by paying a burn wager equal to half your initial bet. If the new card is an Ace, you earn a bonus—7:1 for the Ace of Spades and 2:1 for any other Ace. Blackjacks pay even money to offset the power of this mechanic.',
                highlights: [
                    {
                        eyebrow: 'Burn Rule',
                        title: 'Replace Your 2nd Card',
                        detail: 'After receiving your first two cards, you may pay a Burn Wager (half of your initial bet) to discard your second card and draw a fresh one. This is perfect for escaping bad second cards.',
                        tone: 'accent',
                    },
                    {
                        eyebrow: 'Burn Bonus',
                        title: 'Ace Payouts on the Burn',
                        detail: 'If your burn card is an Ace of Spades, your Burn Wager pays 7:1. Any other Ace pays 2:1. All other burn cards result in the burn wager being lost.',
                        tone: 'good',
                    },
                    {
                        eyebrow: 'Blackjack Payouts',
                        title: 'Blackjacks Pay 1:1',
                        detail: 'Natural blackjacks pay even money (1:1). A hand after burning does not count as a natural—the key win is the Ace Bonus from the burn wager.',
                        tone: 'warn',
                    },
                ],
                playerOptions: {
                    title: 'Player Actions',
                    items: [
                        'Burn — Pay half your initial bet to discard the 2nd card and draw a new one. Only once per hand.',
                        'Double Down — Allowed on any first two cards.',
                        'Double After Split (DAS) — Permitted.',
                        'Split — Equal-value cards, maximum 4 total hands.',
                    ],
                },
                payouts: {
                    title: 'Payouts & Settlement',
                    items: [
                        'Natural Blackjack pays 1:1.',
                        'Burn card Ace of Spades: Burn Wager pays 7:1.',
                        'Burn card any other Ace: Burn Wager pays 2:1.',
                        'All other wins pay even money (1:1).',
                        'Insurance pays 2:1 when the dealer shows an Ace.',
                    ],
                },
                dealerFlow: {
                    title: 'Dealer Protocol',
                    items: [
                        'Dealer hits soft 17 (H17).',
                        'Dealer peeks for blackjack when showing an Ace or a 10-value card.',
                    ],
                },
                strategyNotes: {
                    title: 'Strategy Notes',
                    items: [
                        'Always burn a hard 15 or 16 against a dealer 7–A (strong upcard). The risk of busting on a hit is high and the dealer is well-positioned.',
                        'Never burn when you have a strong hand (17+), as you risk losing a winning position.',
                        'The Burn action is best used with a weak second card against a strong dealer upcard to maximize expected value.',
                    ],
                },
            };
        case 'classic':
            return {
                overview: 'The standard 8-deck shoe game found in most online casinos worldwide. Dealer stands on all 17s (S17), peek is used on Ace and 10, and the conservative one-split limit makes pair discipline crucial. This is the baseline ruleset that all other variants build on.',
                highlights: [
                    {
                        eyebrow: 'Decks & Dealer',
                        title: '8-Deck Shoe · Dealer Stands All 17s',
                        detail: 'The large shoe minimizes card-removal effects. The dealer peeks for blackjack on both Ace and 10 upcards, so your doubles and splits are safe from a hidden natural.',
                    },
                    {
                        eyebrow: 'Split Restriction',
                        title: 'One Split Only (Max 2 Hands)',
                        detail: 'You may split once per seat. Equal-value cards qualify (e.g., J-K is allowed). Because re-splitting is blocked, mistakes on pair hands carry higher consequences than in multi-split rooms.',
                        tone: 'warn',
                    },
                    {
                        eyebrow: 'Why It Matters',
                        title: 'Clean Baseline for Learning',
                        detail: 'No surrender, no bonus payouts, no free actions — this room isolates pure basic strategy fundamentals without variant-specific distractions.',
                        tone: 'good',
                    },
                ],
                playerOptions: {
                    title: 'Player Actions',
                    items: [
                        'Double Down — Allowed on any first two cards. Not available on hands created from split aces.',
                        'Double After Split (DAS) — Permitted on regular (non-ace) split hands.',
                        'Split — Equal-value cards only, one split maximum (2 hands total). Mixed 10-value pairs (e.g., J-Q) are valid.',
                        'Split Aces — Receive one card each, cannot be re-split or hit further.',
                        'Surrender — Not available in this room.',
                    ],
                },
                payouts: {
                    title: 'Payouts & Settlement',
                    items: [
                        'Natural Blackjack pays 3:2 (bet $10 → win $15).',
                        'All other wins pay even money (1:1).',
                        'Insurance pays 2:1 when offered (dealer shows Ace).',
                        'Push (tie) returns the original wager in full.',
                    ],
                },
                dealerFlow: {
                    title: 'Dealer Protocol',
                    items: [
                        'Dealer stands on all 17s — both hard 17 (e.g., 10-7) and soft 17 (e.g., A-6).',
                        'Dealer peeks for blackjack when showing an Ace or a 10-value card.',
                        'With 8 decks in the shoe, individual card removal has less strategic impact than in short-shoe games.',
                    ],
                },
                strategyNotes: {
                    title: 'Strategy Notes',
                    items: [
                        'This room is the best starting point for mastering basic strategy — no special rules to learn first.',
                        'Because only one split is allowed, pair hands like 8-8 and A-A carry extra weight. Learn their correct plays carefully.',
                        'The 8-deck shoe smooths out deck composition effects; trust the basic strategy chart over hunches.',
                    ],
                },
            };
        case 'vegas_strip':
            return {
                overview: 'The iconic 4-deck Vegas Strip game with S17 dealer rules and liberal splitting up to 4 hands. Fewer decks improve composition sensitivity compared to 8-deck shoes. Note: This simulation uses S17 rules. On the actual Las Vegas Strip, S17 tables are becoming rare at lower stakes — most have shifted to H17 to increase house edge.',
                highlights: [
                    {
                        eyebrow: 'Decks & Dealer',
                        title: '4-Deck Shoe · Dealer Stands All 17s',
                        detail: 'The smaller shoe increases the strategic impact of individual card removals. Dealer peeks for blackjack, protecting your doubles and splits from a hidden natural.',
                    },
                    {
                        eyebrow: 'Liberal Splitting',
                        title: 'Split Up to 4 Hands',
                        detail: 'Any equal-value pair can be split, including mixed 10-value cards (e.g., J-K). You may re-split up to 4 total hands per seat.',
                        tone: 'good',
                    },
                    {
                        eyebrow: 'Ace Limitation',
                        title: 'Split Aces: One Card Only',
                        detail: 'When aces are split, each receives exactly one card. No hitting, no re-splitting, and a 21 from split aces counts as 21, not as a natural blackjack.',
                        tone: 'warn',
                    },
                ],
                playerOptions: {
                    title: 'Player Actions',
                    items: [
                        'Double Down — Allowed on any first two cards unless the hand came from split aces.',
                        'Double After Split (DAS) — Available on regular (non-ace) split hands.',
                        'Split — Equal-value cards up to 4 total hands. Mixed 10-value pairs are valid.',
                        'Split Aces — One card each, no re-split, no further hitting.',
                        'Surrender — Not available in this room.',
                    ],
                },
                payouts: {
                    title: 'Payouts & Settlement',
                    items: [
                        'Natural Blackjack pays 3:2.',
                        'All other wins pay even money (1:1).',
                        'Insurance pays 2:1 when the dealer shows an Ace.',
                        'No bonus payouts, free actions, or push-on-22 exceptions.',
                    ],
                },
                dealerFlow: {
                    title: 'Dealer Protocol',
                    items: [
                        'Dealer stands on both hard 17 and soft 17.',
                        'Dealer peeks for blackjack on Ace and 10-value upcards.',
                        'The 4-deck shoe makes pair and double decisions slightly more sensitive to deck composition than 8-deck rooms.',
                    ],
                },
                strategyNotes: {
                    title: 'Strategy Notes',
                    items: [
                        'One of the cleanest rulesets for textbook basic strategy — strong and predictable.',
                        'Use the expanded split rule correctly, but don\'t invent loose mixed-10 splits unless the chart recommends them.',
                        'The lower deck count slightly improves the precision of doubles and pair plays compared with Classic.',
                    ],
                },
            };
        case 'vegas_downtown':
            return {
                overview: 'A fast-paced 2-deck game where the smaller shoe benefits card-aware play, but the dealer hitting soft 17 (H17) increases house edge. This produces a sharper, more volatile environment where precise basic strategy matters more than in large shoes.',
                highlights: [
                    {
                        eyebrow: 'Decks & Dealer',
                        title: '2-Deck Shoe · Dealer Hits Soft 17',
                        detail: 'The shortest shoe in the house. Card removal effects are amplified, but the dealer draws on soft 17 (e.g., A-6), gaining extra chances to improve weak hands.',
                    },
                    {
                        eyebrow: 'H17 Impact',
                        title: 'Dealer Draws on Soft 17',
                        detail: 'When the dealer has A-6 (soft 17), they must take another card instead of stopping. This slightly raises the house edge and changes several double and stand thresholds compared to S17 rooms.',
                        tone: 'warn',
                    },
                    {
                        eyebrow: 'Liberal Splitting',
                        title: 'Split Up to 4 Hands',
                        detail: 'Equal-value pairs including mixed 10-value cards can be split up to 4 total hands. DAS (Double After Split) is also permitted.',
                        tone: 'good',
                    },
                ],
                playerOptions: {
                    title: 'Player Actions',
                    items: [
                        'Double Down — Allowed on any first two cards, except hands from split aces.',
                        'Double After Split (DAS) — Permitted on regular split hands.',
                        'Split — Equal-value cards up to 4 total hands. Mixed 10-value pairs are valid.',
                        'Split Aces — One card each, no re-split or further hitting.',
                        'Surrender — Not available in this room.',
                    ],
                },
                payouts: {
                    title: 'Payouts & Settlement',
                    items: [
                        'Natural Blackjack pays 3:2.',
                        'All other wins pay even money (1:1).',
                        'Insurance pays 2:1 when the dealer shows an Ace.',
                        'No surrender, no side bets, and no alternate 21 payout schedule.',
                    ],
                },
                dealerFlow: {
                    title: 'Dealer Protocol',
                    items: [
                        'Dealer hits soft 17 (H17) and stands on hard 17 and above.',
                        'Dealer peeks for blackjack on Ace and 10-value upcards.',
                        'With only 2 decks, each exposed card has a stronger impact on remaining deck composition than in shoe games.',
                    ],
                },
                strategyNotes: {
                    title: 'Strategy Notes',
                    items: [
                        'Do not copy 8-deck S17 instincts — H17 punishes passive play on several borderline totals.',
                        'The small deck rewards composition-aware adjustments far more than larger shoes.',
                        'Expect a slightly more aggressive chart, especially around doubles and marginal stand/hit decisions.',
                    ],
                },
            };
        case 'atlantic_city':
            return {
                overview: 'The classic East Coast 8-deck game defined by its late surrender option — a powerful defensive tool that saves half a bet on the worst starting hands. Combined with S17 dealer rules and flexible splitting, this is one of the most player-friendly standard rulesets.',
                highlights: [
                    {
                        eyebrow: 'Decks & Dealer',
                        title: '8-Deck Shoe · Dealer Stands All 17s',
                        detail: 'Standard shoe game with the dealer peeking for blackjack on Ace and 10-value upcards. S17 dealer rule keeps the house edge below H17 variants.',
                    },
                    {
                        eyebrow: 'Key Advantage',
                        title: 'Late Surrender Available',
                        detail: 'You can forfeit your hand and recover half your bet after the dealer has checked for blackjack. This materially improves the worst starting hands like Hard 15 and Hard 16 vs. strong upcards.',
                        tone: 'good',
                    },
                    {
                        eyebrow: 'Split Structure',
                        title: 'Split Up to 4 Hands',
                        detail: 'Equal-value pairs, including mixed 10-value cards, can be split to a maximum of 4 hands. Aces cannot be re-split.',
                    },
                ],
                playerOptions: {
                    title: 'Player Actions',
                    items: [
                        'Double Down — Allowed on any first two cards, including after split (DAS). Not available on split-ace hands.',
                        'Late Surrender — Available on initial 2-card hand only, after the dealer confirms no blackjack.',
                        'Split — Equal-value cards up to 4 total hands per seat. Mixed 10-value pairs allowed.',
                        'Split Aces — One card each, no re-split.',
                    ],
                },
                payouts: {
                    title: 'Payouts & Settlement',
                    items: [
                        'Natural Blackjack pays 3:2.',
                        'All other wins pay even money (1:1).',
                        'Insurance pays 2:1 when the dealer shows an Ace.',
                        'Surrender returns exactly half the original bet.',
                    ],
                },
                dealerFlow: {
                    title: 'Dealer Protocol',
                    items: [
                        'Dealer stands on both hard 17 and soft 17.',
                        'Dealer peeks for blackjack on Ace and 10-value upcards.',
                        'As a shoe game, the strategic edge comes primarily from correct surrender usage rather than composition reads.',
                    ],
                },
                strategyNotes: {
                    title: 'Strategy Notes',
                    items: [
                        'Surrender is the defining feature of this room — learn the correct surrender spots, as they are the biggest EV difference from other 8-deck tables.',
                        'Hard 15 vs. 10 and Hard 16 vs. 9/10/A are the most important surrender decisions.',
                        'Because the dealer stands on soft 17, the overall chart is calmer than H17 variants like Vegas Downtown.',
                    ],
                },
            };
        case 'free_action':
            return {
                overview: 'Free Action Blackjack fundamentally rewrites the risk-reward calculation. Free doubles on hard 9/10/11, free splits on most pairs, and the Dealer 22 Push rule create a radically different strategy landscape where aggressive play is mathematically rewarded.',
                highlights: [
                    {
                        eyebrow: 'Decks & Dealer',
                        title: '6-Deck Shoe · Dealer Hits Soft 17',
                        detail: 'Standard shoe size with H17 dealer rule. No surrender. The house compensates for the free actions with the Push-on-22 twist.',
                    },
                    {
                        eyebrow: 'House Edge Recovery',
                        title: '⚠ Dealer 22 = Push (Not Bust)',
                        detail: 'When the dealer busts with exactly 22, all surviving non-blackjack hands push instead of winning. This is a significant house advantage that offsets the free actions.',
                        tone: 'warn',
                    },
                    {
                        eyebrow: 'Player Advantage',
                        title: 'Free Doubles & Free Splits',
                        detail: 'Hard 9, 10, 11 can double at no extra cost. All pairs except 10-value cards can split for free. This makes many "reckless-looking" plays mathematically correct.',
                        tone: 'good',
                    },
                ],
                playerOptions: {
                    title: 'Player Actions',
                    items: [
                        'Double Down — Allowed on any 2-card hand (except split aces). Hard 9, 10, 11 double for FREE; all other doubles cost normal wager.',
                        'Split — Equal-value pairs up to 4 hands. ALL non-10-value pairs split for FREE; 10-value pairs require a matching bet.',
                        'Split Aces — One card each, no re-split.',
                        'Free Action Tokens — Each free double or free split earns a token for the Multi Action Bonus side bet.',
                        'Surrender — Not available in this room.',
                    ],
                },
                payouts: {
                    title: 'Payouts & Settlement',
                    items: [
                        'Natural Blackjack pays 3:2 — immune to the Push-on-22 rule.',
                        'All other wins pay 1:1; Insurance pays 2:1.',
                        'Dealer 22 pushes all surviving non-blackjack hands. Dealer 23+ busts normally.',
                        'Multi Action Bonus side bet has a significantly lower RTP (~91%) than the base game (~99%) — treat it as entertainment only.',
                    ],
                },
                dealerFlow: {
                    title: 'Dealer Protocol',
                    items: [
                        'Dealer hits soft 17 (H17), increasing volatility in marginal dealer hands.',
                        'Dealer peeks for blackjack on Ace and 10-value upcards.',
                        'Because dealer 22 doesn\'t bust, weak stiff hands gain less from waiting for a dealer blow-up than in standard blackjack.',
                    ],
                },
                strategyNotes: {
                    title: 'Strategy Notes',
                    items: [
                        'Do NOT import standard blackjack instincts. Free doubles and free splits make many seemingly wild actions mathematically correct — follow the chart.',
                        'Push-on-22 reduces the value of passive standing on weak totals, so the optimal strategy leans harder into building strong hands.',
                        'The side bet is fun but not a value play. Focus your attention on the main game adjustments for maximum RTP.',
                    ],
                },
            };
        case 'iberian_21':
            return {
                overview: 'Iberian 21 follows the common Spanish 21 casino profile: 6 decks with all rank-10 cards removed, dealer H17, late surrender plus Double Down Rescue, and liberal split rules. Player 21 always wins — even against dealer blackjack. The missing 10s fundamentally alter deck composition and strategy.',
                highlights: [
                    {
                        eyebrow: 'Deck Composition',
                        title: 'No 10s in the Deck',
                        detail: 'All 16 rank-10 cards (10♠10♥10♦10♣) are removed from each deck. Face cards (J, Q, K) remain. This fundamentally changes bust rates, doubling math, and hand distributions.',
                        tone: 'accent',
                    },
                    {
                        eyebrow: 'Player Protection',
                        title: 'Player 21 Always Wins',
                        detail: 'Any player hand totaling 21 beats any dealer hand, including dealer blackjack. Combined with late surrender and rescue after double, the player has exceptional damage control.',
                        tone: 'good',
                    },
                    {
                        eyebrow: 'H17 + Surrender',
                        title: 'Dealer Hits Soft 17 · Surrender & Rescue',
                        detail: 'The dealer draws on soft 17 (more volatile), but the player has both late surrender on initial hands AND "rescue" (surrender after doubling down).',
                        tone: 'warn',
                    },
                ],
                playerOptions: {
                    title: 'Player Actions',
                    items: [
                        'Double Down — Allowed on any number of cards (not just first two). Redoubling is not permitted.',
                        'Double Down Rescue — After doubling, you may surrender the doubled hand and recover the doubled portion.',
                        'Late Surrender — Available on initial 2-card hand.',
                        'Split — Equal-value pairs up to 4 total hands. Aces can be re-split, hit, and doubled.',
                        'Bonus 21 payouts (undoubled hands only) for 5+ card 21s, 6-7-8 combos, and 7-7-7 combos.',
                    ],
                },
                payouts: {
                    title: 'Payouts & Settlement',
                    items: [
                        'Natural Blackjack pays 3:2 and always beats dealer blackjack.',
                        'Player 21 always wins, even against dealer 21.',
                        '5-card 21 → 3:2 · 6-card 21 → 2:1 · 7+ card 21 → 3:1 (undoubled only).',
                        '6-7-8 or 7-7-7 → 3:2 (mixed suits) · 2:1 (same suit) · 3:1 (all spades).',
                    ],
                },
                dealerFlow: {
                    title: 'Dealer Protocol',
                    items: [
                        'Dealer hits soft 17 (H17) and stands on hard 17 and above.',
                        'No rank-10 cards in the deck — this changes dealer bust frequency patterns compared to standard blackjack.',
                    ],
                },
                strategyNotes: {
                    title: 'Strategy Legend',
                    items: [
                        'S4/S5/S6 — Stand normally, but Hit if your hand has 4/5/6 or more cards (chasing bonus payouts).',
                        'D3/D4/D5/D6 — Double normally, but Hit if your hand has 3/4/5/6 or more cards.',
                        'RH — Surrender if allowed, otherwise Hit.',
                        'PS — Split normally, but Hit if you hold suited sevens (preserving 7-7-7 bonus potential).',
                    ],
                },
            };
        case 'uk':
            return {
                overview: 'UK Casino Blackjack combines the European No Hole Card (ENHC) dealing style with uniquely player-friendly options: double on any two cards, DAS, and the Original Bets Only (OBO) rule. OBO means your extra bets from doubling and splitting are refunded if the dealer reveals a blackjack — making this significantly more favorable than standard European rules.',
                highlights: [
                    {
                        eyebrow: 'Decks & Dealer',
                        title: '6-Deck Shoe · Dealer Stands All 17s',
                        detail: 'European No Hole Card (ENHC) — the dealer receives only one face-up card initially. No peek for blackjack until all players finish.',
                    },
                    {
                        eyebrow: 'OBO Protection',
                        title: 'Original Bets Only (OBO)',
                        detail: 'If the dealer draws to a blackjack, you lose ONLY your original wager. Any additional bets from doubling down or splitting are refunded. This is the key difference from standard European ENHC.',
                        tone: 'accent',
                    },
                    {
                        eyebrow: 'Full Flexibility',
                        title: 'Double Any Two Cards + DAS',
                        detail: 'Unlike European rules (hard 9-11 only), UK rules allow doubling on any two-card hand. Double After Split is also permitted. Combined with OBO, aggressive play is well-protected.',
                        tone: 'good',
                    },
                ],
                playerOptions: {
                    title: 'Player Actions',
                    items: [
                        'Double Down — Allowed on ANY first two cards, not restricted to hard 9-11.',
                        'Double After Split (DAS) — Fully permitted.',
                        'Split — Any equal-value cards up to 4 total hands per seat.',
                        'Split Aces — One card each, no re-split or further hitting.',
                        'Surrender — Not available in this room.',
                    ],
                },
                payouts: {
                    title: 'Payouts & Settlement',
                    items: [
                        'Natural Blackjack pays 3:2.',
                        'All other wins pay even money (1:1).',
                        'Insurance pays 2:1 when the dealer shows an Ace.',
                        'OBO: If dealer has blackjack, only the original bet is forfeited — double-down and split wagers are pushed (returned).',
                    ],
                },
                dealerFlow: {
                    title: 'Dealer Protocol',
                    items: [
                        'Dealer stands on both hard 17 and soft 17.',
                        'ENHC: Dealer takes no hole card — the second card is drawn only after all players complete their hands.',
                        'No peek for blackjack means you act without knowing if the dealer has a natural.',
                    ],
                },
                strategyNotes: {
                    title: 'Strategy Notes',
                    items: [
                        'Thanks to OBO, you can double and split against dealer 10 or Ace without the full ENHC penalty — your extra bets are refunded if the dealer has blackjack.',
                        'This makes the UK strategy chart much closer to American (peek) games than to standard European ENHC charts.',
                        'Take full advantage of doubling soft hands (A-2 through A-7) against weak dealer upcards.',
                    ],
                },
            };
        case 'firecard_21':
            return {
                overview: 'Fire Card 21 introduces a unique "Burn" mechanic allowing you to replace your second card for a small fee. This room features extreme high-reward bonus payouts for burning into Aces. Note that Natural Blackjacks pay 1:1 instead of 3:2 to balance the powerful Burn mechanic.',
                highlights: [
                    {
                        eyebrow: 'Unique Mechanic',
                        title: 'The Burn Rule',
                        detail: 'On your initial two cards, you can "Burn" your second card for half your bet. You receive a fresh card, and if it\'s an Ace (or Ace of Spades), you win an immediate bonus of up to 7:1!',
                        tone: 'good',
                    },
                    {
                        eyebrow: 'Rule Adjustment',
                        title: '1:1 Natural Blackjack',
                        detail: 'To offset the Burn feature, a Natural Blackjack pays even money (1:1) instead of the standard 3:2 or 2:1.',
                        tone: 'warn',
                    },
                    {
                        eyebrow: 'Player Independence',
                        title: 'Double After Split (DAS)',
                        detail: 'Unlike some strict variants, you are fully allowed to Double Down on your hands after splitting a pair.',
                        tone: 'accent',
                    },
                ],
                playerOptions: {
                    title: 'Player Actions',
                    items: [
                        'Burn — Replace your second card for a cost of 0.5x your bet. Only available on the initial 2-card hand.',
                        'Double Down — Allowed on any two cards.',
                        'Double After Split (DAS) — Fully permitted.',
                        'Split — Equal-value cards up to 4 hands. Aces get exactly one card and auto-stand.',
                        'Surrender — Not available in this room.',
                    ],
                },
                payouts: {
                    title: 'Payouts & Settlement',
                    items: [
                        'Natural Blackjack pays 1:1.',
                        'Burn Bonus: Draw an Ace of Spades → 7:1 payout. Draw any other Ace → 2:1 payout. (Bonus payouts include return of burn wager).',
                        'A 21 created via Burn is treated as a regular 21 and pays 1:1.',
                        'All other wins pay even money (1:1).',
                    ],
                },
                dealerFlow: {
                    title: 'Dealer Protocol',
                    items: [
                        'Dealer hits soft 17 (H17).',
                        'Dealer peeks for blackjack on Ace and 10-value upcards.',
                    ],
                },
                strategyNotes: {
                    title: 'Strategy Notes',
                    items: [
                        'The 1:1 Blackjack payout makes certain aggressive split/double decisions less attractive against dealer 10 or Ace compared to 3:2 games.',
                        'Use the Burn action primarily on weak hard totals (e.g. 15, 16) or to hunt for the Ace bonus when the dealer shows a strong card.',
                        'Remember to use Double After Split aggressively where appropriate, as in standard games.',
                    ],
                },
            };
        case 'european':
            return {
                overview: 'Standard European Blackjack with the most restrictive player options of any room. European No Hole Card (ENHC) means the dealer takes no second card until all players finish — and there is NO OBO protection. If the dealer draws to a blackjack, you lose ALL bets including doubles and splits. This fundamentally changes optimal strategy.',
                highlights: [
                    {
                        eyebrow: 'Decks & Dealer',
                        title: '6-Deck Shoe · Dealer Stands All 17s',
                        detail: 'ENHC dealing — the dealer receives only one face-up card initially. No peek, no hole card. S17 dealer rule.',
                    },
                    {
                        eyebrow: '⚠ ENHC Risk',
                        title: 'No Hole Card · No OBO',
                        detail: 'If you double or split and the dealer subsequently draws to a blackjack, you lose ALL bets — including the doubled or split portions. This makes aggressive plays against 10 and Ace upcards much riskier than in American-style games.',
                        tone: 'warn',
                    },
                    {
                        eyebrow: 'Strict Restrictions',
                        title: 'Double on Hard 9-11 Only · No DAS',
                        detail: 'Doubling is limited to hard totals of 9, 10, or 11. No soft doubles. No doubling after split. Splitting is allowed once only (max 2 hands), and only for same-rank pairs.',
                        tone: 'accent',
                    },
                ],
                playerOptions: {
                    title: 'Player Actions',
                    items: [
                        'Double Down — ONLY on hard 9, 10, and 11. Soft doubles are not allowed.',
                        'Double After Split (DAS) — NOT available.',
                        'Split — Same-rank pairs only (e.g., K-K yes, K-J no). One split maximum (2 hands total).',
                        'Split Aces — One card each, no re-split, no further hitting.',
                        'Surrender — Not available in this room.',
                    ],
                },
                payouts: {
                    title: 'Payouts & Settlement',
                    items: [
                        'Natural Blackjack pays 3:2.',
                        'All other wins pay even money (1:1).',
                        'Insurance pays 2:1 when the dealer shows an Ace.',
                        'No OBO protection — all bets (including doubles/splits) are fully at risk against a late dealer blackjack.',
                    ],
                },
                dealerFlow: {
                    title: 'Dealer Protocol',
                    items: [
                        'Dealer stands on both hard 17 and soft 17.',
                        'ENHC: Dealer takes no hole card — the second card is drawn only after all players complete their hands.',
                        'No peek means you cannot know if the dealer has blackjack when making double or split decisions.',
                    ],
                },
                strategyNotes: {
                    title: 'Strategy Notes',
                    items: [
                        'Never double 11 vs. dealer 10 or Ace — the ENHC risk of losing the doubled bet to a hidden blackjack is too high.',
                        'Never split A-A vs. dealer Ace — a split risks losing both bets to a dealer natural.',
                        'The most restrictive room for player actions. Rely on hitting to improve hands where other rooms would allow doubling.',
                        'European ENHC requires a fundamentally different mindset: protect your bets against strong dealer upcards.',
                    ],
                },
            };
        default:
            return {
                overview: room.description,
                highlights: [],
                playerOptions: { title: 'Player Actions', items: [] },
                payouts: { title: 'Payouts & Settlement', items: [] },
                dealerFlow: { title: 'Dealer Protocol', items: [] },
                strategyNotes: { title: 'Strategy Notes', items: [] },
            };
    }
}

function getStrategyTableContent(room: RoomConfig, tab: 'hard' | 'soft' | 'pairs'): StrategyTableContent {
    if (tab === 'hard') {
        switch (room.id) {
            case 'exchange_21':
                return {
                    title: 'Hard Totals Guide (Post-Switch)',
                    summary: 'This strategy is used after you have decided whether or not to switch your cards.',
                    bullets: [
                        'Due to the dealer 22 push rule, you should double down less often than in standard blackjack. For example, never double against a dealer 10 or Ace.',
                        'You should also be slightly more aggressive when hitting stiff hands, since a dealer bust on 22 will only push, not win for you.',
                    ],
                };
            case 'zapout_21':
                return {
                    title: 'Hard Totals Guide',
                    summary: 'You can escape the worst totals (15-18) in the game using the Zap Out rule. Zapping gives you a fresh chance.',
                    bullets: [
                        'Always Zap hard 15, 16, and 17 against any upcard.',
                        'Zap hard 18 against dealer 8, 9, 10, and Ace.',
                        'Because of the dealer 22 push rule, you should be slightly more aggressive when hitting other hard totals.',
                    ],
                };
            case 'free_action':
                return {
                    title: 'Hard Totals Guide',
                    summary: 'This room pushes hard hands much more aggressively because hard 9, 10, and 11 can double for free.',
                    bullets: [
                        'FD means take the free double; the normal extra-bet risk is removed.',
                        'Dealer 22 pushes reduce the value of simply waiting on weak stiff hands.',
                        'Do not import standard blackjack instincts here. The hard-hand chart is intentionally more forceful.',
                    ],
                };
            case 'atlantic_city':
                return {
                    title: 'Hard Totals Guide',
                    summary: 'Atlantic City looks standard at first glance, but late surrender changes the worst hard-hand spots materially.',
                    bullets: [
                        'SU cells are defensive value plays, not panic buttons.',
                        'Hard 15 and 16 versus strong dealer cards are the main surrender-sensitive totals.',
                        'Because the dealer stands on soft 17, the table is calmer than H17 variants.',
                    ],
                };
            case 'iberian_21':
                return {
                    title: 'Hard Totals Guide',
                    summary: 'Iberian 21 hard totals stay active longer because there are no rank-10 cards in the shoe and player 21 always wins.',
                    bullets: [
                        'Hard 12 and 13 remain live more often than in regular blackjack.',
                        '6+7, 6+8, and 7+8 are now treated as top Walker bonus-hunting overrides, so the live advisor can keep hitting them against any dealer.',
                        'Rescue-style surrender changes how far you can push marginal totals.',
                        'The chart values building to 21 more heavily than standard blackjack does.',
                    ],
                };
            case 'vegas_downtown':
                return {
                    title: 'Hard Totals Guide',
                    summary: 'This 2-deck H17 room pressures hard hands more than S17 tables, especially near the double and stiff thresholds.',
                    bullets: [
                        'Do not copy 8-deck S17 instincts into this room.',
                        'The small deck means each exposed low card changes EV faster than in shoe games.',
                        'When the table says stand on a stiff hand, it is usually because the dealer upcard is weak enough to justify it.',
                    ],
                };
            case 'european':
                return {
                    title: 'Hard Totals Guide',
                    summary: 'European Blackjack removes the dealer peek, making stiff hands riskier against high cards.',
                    bullets: [
                        'Doubling is heavily restricted. Only Hard 9, 10, and 11 can double.',
                        'Because of ENHC, never double 11 against a 10 or Ace.',
                        'Treat stiff hands carefully — hit until you reach a safe threshold.',
                    ],
                };
            case 'firecard_21':
                return {
                    title: 'Hard Totals Guide',
                    summary: 'Use the Burn rule to target your second card when dealing with mediocre hard totals against strong dealer cards.',
                    bullets: [
                        'B means Burn your second card should the advisor suggest it based on the current composition.',
                        'Always burn a hard 15 or 16 against a dealer 7 through Ace.',
                        'Never burn once you have reached 17 or higher to avoid risking a winning hand.',
                    ],
                };
            default:
                return {
                    title: 'Hard Totals Guide',
                    summary: 'Hard totals are your highest-risk hands because any hit can bust immediately.',
                    bullets: [
                        'Against dealer 2 through 6, many stiff hands shift from hit to stand because the dealer is more likely to break.',
                        '9, 10, and 11 are the core double-down totals when the upcard cooperates.',
                        'Use the chart consistently instead of reacting to streaks or short-term emotion.',
                    ],
                };
        }
    } if (tab === 'soft') {
        switch (room.id) {
            case 'iberian_21':
                return {
                    title: 'Soft Totals Guide',
                    summary: 'Soft hands keep their flexibility in Iberian 21, and that flexibility combines with strong 21 incentives.',
                    bullets: [
                        'Soft doubles are powerful because you retain upside without the same bust risk as hard hands.',
                        'Some soft hands stay active longer here because the deck composition is fundamentally different.',
                        'When the chart falls back to stand, it usually means the dealer pressure now outweighs the bonus upside.',
                    ],
                };
            case 'free_action':
                return {
                    title: 'Soft Totals Guide',
                    summary: 'Soft totals are still your safest attack hands, but dealer-22 push means survival alone is not enough.',
                    bullets: [
                        'DS means double if the move is legal, otherwise stand.',
                        'Soft 18 is the biggest pivot hand and changes sharply by upcard.',
                        'These rows reward disciplined aggression, not passive ace protection.',
                    ],
                };
            case 'european':
                return {
                    title: 'Soft Totals Guide',
                    summary: 'Soft hands are flexible but restricted in European rules. Doubling is not allowed on soft hands.',
                    bullets: [
                        'No soft doubles: Basic strategy shifts back to hitting in many spots where standard rooms would double.',
                        'Soft 18 remains the major pivot hand: Stand vs Dealer 2-8, Hit vs 9-Ace.',
                        'Since there is no surrender, you must draw to improve vulnerable soft hands against high upcards.',
                    ],
                };
            case 'firecard_21':
                return {
                    title: 'Soft Totals Guide',
                    summary: 'Soft hands provide flexibility, but the Burn rule adds an extra layer of decision-making for suboptimal soft starts.',
                    bullets: [
                        'The Burn wager is generally less useful for soft hands than hard hands, but can be used to chase an Ace Bonus.',
                        'Follow the chart for soft hitting and doubling thresholds.',
                        'If you draw an Ace of Spades after burning, you win the top 7:1 bonus.',
                    ],
                };
            default:
                return {
                    title: 'Soft Totals Guide',
                    summary: 'Soft totals are flexible because the ace can collapse from 11 to 1 when needed.',
                    bullets: [
                        'That flexibility is why many soft hands double against weak dealer cards.',
                        'Soft 18 is the key decision row and flips between stand, hit, and double.',
                        'If a cell says DS, treat it as a conditional value play, not a default stand.',
                    ],
                };
        }
    }

    switch (room.id) {
        case 'european':
            return {
                title: 'Pairs Guide',
                summary: 'European Strategy restricts splitting due to the ENHC rule and no double-after-split.',
                bullets: [
                    'Equal value is the rule, but you only get to split once.',
                    'Because you can lose both bets against a dealer Blackjack, hit A,A against a dealer Ace.',
                    'Since there is no double after split, pairs like 2,2 and 3,3 are hit more often.',
                ],
            };
        case 'classic':
            return {
                title: 'Pairs Guide',
                summary: 'Classic has the tightest split policy in the app, so every pair decision matters more.',
                bullets: [
                    'Pairs only need equal value in this online ruleset, so mixed 10-value pairs like J-K are legal splits.',
                    'You only get one split, for a maximum of 2 hands total.',
                    'A,A and 8,8 are especially important because you do not get extra repair chances later.',
                ],
            };
        case 'free_action':
            return {
                title: 'Pairs Guide',
                summary: 'Free Action pair play is radically different because most splits cost nothing.',
                bullets: [
                    'FSP means the split is free and should be taken when the chart says so.',
                    '10-value pairs are the exception; they still cost real money to split.',
                    'The side bet may reward extra free actions, but that does not make it a strong long-run bet.',
                ],
            };
        case 'iberian_21':
            return {
                title: 'Pairs Guide',
                summary: 'Iberian 21 pair logic is shaped by no-10 decks, flexible ace branches, and bonus-driven 7-based hands.',
                bullets: [
                    'You can hit and double after splitting aces, unlike most blackjack rooms.',
                    '7,7 is now elevated as a top Walker bonus-hunting override, so the live advisor can keep the pair together and hit for premium 7-7-7 routes.',
                    'The 7,7 row matters extra because 7-7-7 based 21 outcomes have premium value.',
                    'The face-card row represents J/J, Q/Q, and K/K logic because there are no rank-10 cards here.',
                ],
            };
        case 'firecard_21':
            return {
                title: 'Pairs Guide',
                summary: 'Standard pair strategy applies, with the extra option to burn one card if the initial pair is weak.',
                bullets: [
                    'Standard split logic for most pairs. Double After Split is allowed.',
                    'Because of the 1:1 blackjack payout, the value of splitting 10s is even lower than usual.',
                    'Burn wagers do not apply to split hands; you must make the decision on the initial deal.',
                ],
            };
        case 'zapout_21':
        case 'exchange_21':
            return {
                title: 'Pairs Guide',
                summary: 'Because of the dealer 22 push, the value of split hands changes slightly to favor more aggressive defense.',
                bullets: [
                    'Splitting allows you to attack weak dealer cards even when a dealer 22 might push your total.',
                    'Maintain discipline on 10,10 and 5,5.',
                ],
            };
        default:
            return {
                title: 'Pairs Guide',
                summary: 'Pair strategy is about converting one medium hand into two stronger starts when the dealer is vulnerable.',
                bullets: [
                    'Always respect the room rule: some tables split by exact rank, others by equal value.',
                    '5,5 usually behaves like a hard 10, so the chart often prefers doubling over splitting.',
                    '10,10 stands almost everywhere unless a count-driven deviation specifically overrides it.',
                ],
            };
    }
}

export default function StrategyModal({
    room,
    onClose,
}: StrategyModalProps) {
    const [tab, setTab] = useState<Tab>('rules');
    const countSystem = useGameStore((s: GameStore) => s.countSystem);
    const [countTab, setCountTab] = useState<'hilo' | 'kw'>(countSystem === 'Katarina Walker' ? 'kw' : 'hilo');
    const { playSound } = useAudio();

    const isIberianHiLo = room.id === 'iberian_21' && countTab === 'hilo';
    const isIberianWalker = room.id === 'iberian_21' && countTab === 'kw';
    const roomRulesContent = getRoomRulesContent(room);
    const roomCompositionOverrides = COMPOSITION_DEPENDENT_OVERRIDES.filter((override: CompositionDependentOverride) => override.roomId === room.id);
    const topCompositionOverrides = roomCompositionOverrides.filter((override: CompositionDependentOverride) => override.isTopOverride);
    const specialCaseGroups = (['hard', 'soft', 'pairs'] as SpecialCaseGroup[]).map((group: SpecialCaseGroup) => ({
        group,
        items: roomCompositionOverrides.filter((override: CompositionDependentOverride) => override.tab === group && !override.isTopOverride),
    })).filter((entry) => entry.items.length > 0);
    const visibleTabs = (room.id === 'iberian_21'
        ? ['rules', 'hard', 'soft', 'pairs', 'special', 'counting']
        : room.id === 'free_action'
            ? ['rules', 'hard', 'soft', 'pairs', 'free_hand', 'counting']
            : room.id === 'exchange_21'
                ? ['rules', 'hard', 'soft', 'pairs', 'switch_advice', 'counting']
            : room.id === 'zapout_21'
                ? ['rules', 'hard', 'soft', 'pairs', 'counting']
            : room.id === 'firecard_21'
                ? ['rules', 'hard', 'soft', 'pairs', 'counting']
                : ['rules', 'hard', 'soft', 'pairs', 'counting']) as Tab[];

    const strategyType = room.id;

    const rows = tab === 'hard' || (tab === 'free_hand')
        ? (strategyType === 'iberian_21' ? HARD_ROWS_IBERIAN : HARD_ROWS)
        : tab === 'soft'
            ? (strategyType === 'iberian_21' ? SOFT_ROWS_IBERIAN : SOFT_ROWS)
            : tab === 'pairs'
                ? (strategyType === 'iberian_21' ? PAIR_ROWS_IBERIAN : PAIR_ROWS)
                : [];

    const FREE_HAND_ROWS = [...HARD_ROWS, ...SOFT_ROWS];

    const freeHandRows = tab === 'free_hand' ? FREE_HAND_ROWS : rows;

    const data = tab === 'free_hand'
        ? [...HARD_FA_FREE, ...SOFT_FA_FREE]
        : tab === 'hard'
            ? (strategyType === 'free_action'
                ? HARD_FA
                : strategyType === 'iberian_21'
                    ? HARD_IBERIAN
                    : strategyType === 'uk'
                        ? HARD_UK
                        : strategyType === 'atlantic_city'
                            ? HARD_AC
                            : strategyType === 'vegas_strip'
                                ? HARD_VEGAS
                                : strategyType === 'vegas_downtown'
                                    ? HARD_DOWNTOWN
                                    : strategyType === 'european'
                                        ? HARD_EUROPEAN
                                    : strategyType === 'zapout_21'
                                        ? HARD_ZAPOUT
                                    : strategyType === 'exchange_21'
                                        ? HARD_EXCHANGE
                                    : strategyType === 'firecard_21'
                                        ? HARD_FIRECARD
                                        : HARD_CLASSIC)
            : tab === 'soft'
                ? (strategyType === 'free_action'
                    ? SOFT_FA
                    : strategyType === 'iberian_21'
                        ? SOFT_IBERIAN
                        : strategyType === 'uk'
                            ? SOFT_UK
                            : strategyType === 'atlantic_city'
                                ? SOFT_AC
                                : strategyType === 'vegas_strip'
                                    ? SOFT_VEGAS
                                    : strategyType === 'vegas_downtown'
                                        ? SOFT_DOWNTOWN
                                        : strategyType === 'european'
                                            ? SOFT_EUROPEAN
                                            : strategyType === 'firecard_21'
                                                ? SOFT_FIRECARD
                                                : SOFT_CLASSIC)
                : tab === 'pairs'
                    ? (strategyType === 'free_action'
                        ? PAIRS_FA
                        : strategyType === 'iberian_21'
                            ? PAIRS_IBERIAN
                            : strategyType === 'uk'
                                ? PAIRS_UK
                                : strategyType === 'atlantic_city'
                                    ? PAIRS_AC
                                    : strategyType === 'vegas_strip' || strategyType === 'vegas_downtown'
                                        ? PAIRS_VEGAS
                                        : strategyType === 'european'
                                            ? PAIRS_EUROPEAN
                                            : strategyType === 'firecard_21'
                                                ? PAIRS_FIRECARD
                                                : PAIRS_CLASSIC)
                    : [];

    const activeRows = tab === 'free_hand' ? freeHandRows : rows;

    const strategyTableContent = tab === 'hard' || tab === 'soft' || tab === 'pairs' || tab === 'free_hand'
        ? getStrategyTableContent(room, tab === 'free_hand' ? 'hard' : tab)
        : null;
    const standardHiLoDeviations = room.gameRules.allowSurrender
        ? [...(room.gameRules.dealerHitsSoft17 ? I18_H17 : I18_S17), ...FAB_4]
        : [...(room.gameRules.dealerHitsSoft17 ? I18_H17 : I18_S17)];
    const visibleDeviations = strategyType === 'iberian_21'
        ? (countTab === 'kw' ? IBERIAN_WALKER : IBERIAN_HILO)
        : strategyType === 'european'
            ? I18_EUROPEAN
            : strategyType === 'uk'
                ? I18_UK
                : strategyType === 'free_action' || strategyType === 'zapout_21' || strategyType === 'exchange_21'
                    ? PUSH_22_DEVIATIONS
                    : strategyType === 'firecard_21'
                        ? FIRECARD_DEVIATIONS
                        : standardHiLoDeviations;

    const tabConfig: Record<Tab, { label: string; rowTitle: string }> = {
        rules: { label: 'Rules', rowTitle: '' },
        hard: { label: 'Hard Totals', rowTitle: 'Hand' },
        soft: { label: 'Soft Totals', rowTitle: 'Hand' },
        pairs: { label: 'Pairs', rowTitle: 'Pair' },
        free_hand: { label: 'Free Hand', rowTitle: 'Hand' },
        special: { label: 'Special Case', rowTitle: '' },
        counting: { label: 'Card Counting', rowTitle: '' },
        switch_advice: { label: 'Switch Advice', rowTitle: '' },
    };

    return (
        <motion.div
            className="absolute inset-0 z-200 flex items-center justify-center p-3 sm:p-4"
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
                    maxHeight: 'min(92vh, 994px)',
                    width: 'min(820px, calc(100vw - 1.5rem))',
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
                                {room.name} {'\u2014'} {room.gameRules.numberOfDecks} Decks {'\u00b7'} Double After Split {'\u00b7'} {room.gameRules.allowSurrender ? 'Allow Surrender' : 'No Surrender'}
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
                    {visibleTabs.map((t) => {
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
                                        className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
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

                    {tab === 'rules' ? (
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
                                            <strong className="text-white/80 block mb-0.5 text-xs"><Flag size={12} className="inline text-orange-400 mr-1" />Surrender / Rescue</strong>
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
                                    <span>RTP {room.rtp}</span>
                                </div>
                            </div>
                        </div>
                    ) : tab === 'switch_advice' ? (
                        <div className="space-y-6">
                            <div
                                className="rounded-2xl border p-5 relative overflow-hidden"
                                style={{
                                    background: `linear-gradient(135deg, ${room.accentColor}18 0%, rgba(255,255,255,0.02) 100%)`,
                                    borderColor: `${room.accentColor}26`,
                                }}
                            >
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-1 px-2 py-0.5 rounded w-fit" style={{ background: `${room.accentColor}20`, color: room.accentColor }}>
                                        Exchange 21 Protocol
                                    </p>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-black text-white/90" style={{ fontFamily: "'Georgia', serif" }}>
                                            Switching Strategy & EV
                                        </h3>
                                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 font-black tracking-widest uppercase">Under Development</span>
                                    </div>
                                    <p className="text-[12px] leading-relaxed text-white/50 max-w-lg">
                                        The Switch rule is your ultimate weapon. Our advisor calculates the <span className="text-white/80 font-bold">Expected Value (EV)</span> of both hand combinations. If switching increases your total win probability, the button will glow.
                                    </p>
                                </div>
                                <div className="absolute top-[-20%] right-[-5%] opacity-10 pointer-events-none">
                                    <ArrowLeftRight size={160} style={{ color: room.accentColor }} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white/5 p-4 rounded-xl border border-white/8">
                                    <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
                                        <Info size={14} /> Core Principles
                                    </h4>
                                    <ul className="space-y-3">
                                        <li className="flex gap-2 text-[11px] text-white/60 leading-snug">
                                            <span className="text-amber-500 font-bold">•</span>
                                            <span>Prioritize creating <span className="text-white/80 font-bold">one</span> excellent hand (20, 21, or 11 to double) over keeping two mediocre hands.</span>
                                        </li>
                                        <li className="flex gap-2 text-[11px] text-white/60 leading-snug">
                                            <span className="text-amber-500 font-bold">•</span>
                                            <span>Always switch to create <span className="text-white/80 font-bold">Split opportunities</span> (like AA or 88) against weak dealer cards (3-6).</span>
                                        </li>
                                        <li className="flex gap-2 text-[11px] text-white/60 leading-snug">
                                            <span className="text-amber-500 font-bold">•</span>
                                            <span>If you have two "stiff" hands (12-16) against a Dealer 10, switch them! Salvaging one hand into a 10 or 20 saves half your bet.</span>
                                        </li>
                                    </ul>
                                </div>

                                <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
                                    <h4 className="text-[11px] font-black uppercase tracking-wider text-emerald-400 mb-3">Mathematical Goal</h4>
                                    <p className="text-[11px] text-white/50 italic leading-relaxed">
                                        "A Switch is profitable if the SUM of the EVs of the new hands is higher than the original. Sometimes you sacrifice a strong hand to fix a terrible one for a net gain."
                                    </p>
                                </div>
                            </div>

                            <section className="space-y-3">
                                <h4 className="text-[11px] font-black uppercase tracking-widest text-white/30 px-1">Example Situations</h4>
                                <div className="grid grid-cols-1 gap-3">
                                    {[
                                        {
                                            title: "Salvaging Stiff Hands",
                                            dealer: "10",
                                            h1: ["10", "6"],
                                            h2: ["10", "5"],
                                            result: "Switch to [10, 10] and [6, 5]",
                                            why: "Converts two high-risk hands into one strong 20 and one weak 11. Much higher survival rate.",
                                            recommended: true
                                        },
                                        {
                                            title: "Making a Monster",
                                            dealer: "7",
                                            h1: ["A", "5"],
                                            h2: ["Q", "10"],
                                            result: "Switch to [A, 10] and [Q, 5]",
                                            why: "Creates a Natural 21 (Blackjack) immediately. Don't risk two hits when you can secure 1:1 payout.",
                                            recommended: true
                                        },
                                        {
                                            title: "The Split Setup",
                                            dealer: "5",
                                            h1: ["A", "8"],
                                            h2: ["A", "2"],
                                            result: "Switch to [A, A] and [8, 2]",
                                            why: "Splitting Aces against 5 is extremely profitable. Hand 2 becomes a soft 13/3 which you can then improve.",
                                            recommended: true
                                        },
                                        {
                                            title: "Over-Optimization Trap",
                                            dealer: "6",
                                            h1: ["10", "10"],
                                            h2: ["10", "10"],
                                            result: "Stay [20] and [20]",
                                            why: "Don't switch to create a split if you already have two 20s. Two 20s against a 6 is a massive mathematical lock.",
                                            recommended: false
                                        }
                                    ].map((ex, idx) => (
                                        <div key={idx} className="bg-white/5 rounded-xl border border-white/8 p-4 flex flex-col md:flex-row md:items-center gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${ex.recommended ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                                        {ex.recommended ? 'RECOMMENDED' : 'STAY PAT'}
                                                    </span>
                                                    <h5 className="text-xs font-bold text-white/90">{ex.title}</h5>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 text-[10px]">
                                                    <div>
                                                        <span className="block text-white/30 uppercase tracking-tighter mb-1">Hand 1</span>
                                                        <span className="text-white/70">[{ex.h1[0]}, {ex.h1[1]}]</span>
                                                    </div>
                                                    <div>
                                                        <span className="block text-white/30 uppercase tracking-tighter mb-1">Hand 2</span>
                                                        <span className="text-white/70">[{ex.h2[0]}, {ex.h2[1]}]</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex-1 border-t md:border-t-0 md:border-l border-white/10 pt-3 md:pt-0 md:pl-4">
                                                <div className="text-[10px] mb-1">
                                                    <span className="text-amber-400 font-bold uppercase tracking-tighter mr-2">vs Dealer {ex.dealer}</span>
                                                    <span className="text-white/50">{ex.result}</span>
                                                </div>
                                                <p className="text-[10px] text-white/40 leading-relaxed">{ex.why}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    ) : tab === 'special' ? (
                        <div className="space-y-6">
                            {/* Rebranded Header */}
                            <div
                                className="rounded-2xl border p-5 relative overflow-hidden"
                                style={{
                                    background: `linear-gradient(135deg, ${room.accentColor}18 0%, rgba(255,255,255,0.02) 100%)`,
                                    borderColor: `${room.accentColor}26`,
                                }}
                            >
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black uppercase tracking-[0.25em] mb-1 px-2 py-0.5 rounded w-fit" style={{ background: `${room.accentColor}20`, color: room.accentColor }}>
                                        {room.id === 'iberian_21' ? 'Walker Stratos Guide' : 'Strategy Intelligence'}
                                    </p>
                                    <h3 className="text-xl font-black text-white/90 mb-2" style={{ fontFamily: "'Georgia', serif" }}>
                                        {room.id === 'iberian_21' ? 'Composition Intelligence' : 'Hand Deviations'}
                                    </h3>
                                    <p className="text-[12px] leading-relaxed text-white/50 max-w-lg">
                                        {room.id === 'iberian_21' 
                                            ? 'Advanced strategy overrides derived from Katarina Walker\'s research. Prioritize Tactical Overrides for immediate gains, and use the Almanac for bonus-optimized reference.'
                                            : 'Calculated strategy overrides based on specific card compositions or game states. Use these tactical plays to maximize your expected value over standard play.'}
                                    </p>
                                </div>
                                <div className="absolute top-[-20%] right-[-5%] opacity-10 pointer-events-none">
                                    <Info size={160} style={{ color: room.accentColor }} />
                                </div>
                            </div>

                            {/* Section 1: Tactical Overrides (Priority Layer) */}
                            {topCompositionOverrides.length > 0 && (
                                <section className="space-y-4">
                                    <div className="flex items-center gap-3 px-1">
                                        <div className="h-px flex-1 bg-gradient-to-r from-yellow-500/0 via-yellow-500/40 to-yellow-500/0" />
                                        <div className="flex items-center gap-2">
                                            <Shield size={14} className="text-yellow-400" />
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-yellow-500/80" style={{ fontFamily: "'Georgia', serif" }}>Tactical Overrides</h4>
                                        </div>
                                        <div className="h-px flex-1 bg-gradient-to-r from-yellow-500/0 via-yellow-500/40 to-yellow-500/0" />
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        {topCompositionOverrides.map((override: CompositionDependentOverride, idx: number) => {
                                            const pattern = renderSpecialCaseCards(override.handPattern ?? []);
                                            const actionStyle = ACTION_STYLES[override.action as Action];
                                            return (
                                                <motion.div
                                                    key={override.id}
                                                    className="rounded-2xl border p-4 relative"
                                                    style={{
                                                        background: 'rgba(250,204,21,0.04)',
                                                        borderColor: 'rgba(250,204,21,0.18)',
                                                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                                                    }}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.1 }}
                                                >
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-yellow-500/60 bg-yellow-500/10 px-2 py-0.5 rounded">High Impact</span>
                                                                <span className="text-[9px] font-bold text-white/30">{SPECIAL_CASE_GROUP_LABELS[override.tab as SpecialCaseGroup]}</span>
                                                            </div>

                                                            <div className="flex items-center gap-3">
                                                                <div className="flex items-center gap-1.5">
                                                                    {pattern.map((card) => (
                                                                        <div key={card.key} className="w-12 h-16 rounded-lg border-2 flex flex-col items-center justify-center relative overflow-hidden" style={{ background: '#fff', borderColor: '#e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                                                            <span className="text-lg font-black text-slate-900 leading-none">{card.label}</span>
                                                                            <div className="absolute bottom-1 right-1 opacity-20"><Info size={10} className="text-red-600" /></div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <div className="flex flex-col items-center justify-center opacity-30 px-1">
                                                                    <div className="w-px h-3 bg-white/40" />
                                                                    <span className="text-[10px] font-black my-1">VS</span>
                                                                    <div className="w-px h-3 bg-white/40" />
                                                                </div>
                                                                <div className="w-12 h-16 rounded-lg border-2 border-dashed flex flex-col items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)', borderColor: `${room.accentColor}40` }}>
                                                                    <span className="text-lg font-black text-white/90 leading-none">{formatSpecialCaseRank(override.dealerUpcard)}</span>
                                                                    <span className="text-[8px] font-bold uppercase tracking-tighter text-white/40 mt-1">Dealer</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-row md:flex-col items-center gap-4 bg-white/3 rounded-2xl p-4 border border-white/5 flex-1 md:flex-none">
                                                            <div className="text-center">
                                                                <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-2">Recommended</p>
                                                                <div
                                                                    className="px-6 py-2 rounded-xl text-center shadow-lg transform hover:scale-105 transition-all"
                                                                    style={{ background: actionStyle.bg, color: actionStyle.text }}
                                                                >
                                                                    <span className="text-xl font-black block">{actionStyle.label}</span>
                                                                    <span className="text-[9px] font-bold block uppercase opacity-80">{actionStyle.desc}</span>
                                                                </div>
                                                            </div>
                                                            <div className="hidden md:block w-px h-8 bg-white/5" />
                                                            <div className="flex-1 md:text-right">
                                                                <p className="text-[13px] font-bold text-white/80 leading-snug">{override.summary}</p>
                                                                <p className="text-[10px] text-white/40 mt-1 italic">&ldquo;{override.trigger}&rdquo;</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}

                            {/* Section 2: The Iberian Almanac (Reference & Bonus Notes) */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-3 px-1">
                                    <div className="h-px flex-1 bg-gradient-to-r from-white/0 via-white/10 to-white/0" />
                                    <div className="flex items-center gap-2">
                                        <BookOpen size={14} className="text-white/40" />
                                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/40" style={{ fontFamily: "'Georgia', serif" }}>The Iberian Almanac</h4>
                                    </div>
                                    <div className="h-px flex-1 bg-gradient-to-r from-white/0 via-white/10 to-white/0" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {specialCaseGroups.flatMap(({ group, items }) =>
                                        items.map((override: CompositionDependentOverride, entryIdx: number) => {
                                            const pattern = renderSpecialCaseCards(override.handPattern ?? []);
                                            const actionStyle = ACTION_STYLES[override.action as Action];
                                            return (
                                                <motion.div
                                                    key={override.id}
                                                    className="rounded-xl border p-3 flex gap-4 group hover:bg-white/[0.04] transition-colors"
                                                    style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.3 + (entryIdx * 0.05) }}
                                                >
                                                    <div className="flex flex-col gap-1 shrink-0 pt-0.5">
                                                        <div className="flex items-center gap-0.5">
                                                            {pattern.map((c) => (
                                                                <div key={c.key} className="w-6 h-8 rounded border flex items-center justify-center bg-white border-slate-200">
                                                                    <span className="text-[10px] font-black text-slate-800">{c.label}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="text-[10px] text-center font-black py-0.5 rounded-md" style={{ background: actionStyle.bg, color: actionStyle.text, fontSize: '9px' }}>
                                                            {actionStyle.label}
                                                        </div>
                                                    </div>

                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-[9px] font-bold text-white/30 uppercase tracking-tighter">{SPECIAL_CASE_GROUP_LABELS[group]} vs {formatSpecialCaseRank(override.dealerUpcard)}</span>
                                                            {override.isSoft && <span className="text-[8px] bg-blue-500/10 text-blue-400/80 px-1 py-0.5 rounded border border-blue-500/20">Soft</span>}
                                                        </div>
                                                        <p className="text-[11px] font-semibold text-white/70 leading-snug group-hover:text-white transition-colors">{override.summary}</p>
                                                        <p className="text-[10px] text-white/30 mt-1 line-clamp-1 italic">{override.trigger}</p>
                                                    </div>
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </div>
                            </section>

                            <div className="pt-2">
                                <p className="text-[10px] text-white/20 text-center italic">
                                    Note: Almanac entries provide context for the live advisor but do not force overrides unless priority conditions are met.
                                </p>
                            </div>
                        </div>
                    ) : tab === 'counting' ? (
                        /* ─── Card Counting Guide ─── */
                        <div className="space-y-5">
                            {room.isBeta && (
                                <div
                                    className="mb-4 px-4 py-3 rounded-2xl flex items-start gap-3.5"
                                    style={{
                                        background: 'rgba(251,146,60,0.1)',
                                        border: '1px solid rgba(251,146,60,0.3)',
                                    }}
                                >
                                    <FlaskConical size={16} className="text-orange-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-400">Under Development</p>
                                        <p className="text-[10px] text-orange-300/60 font-semibold mt-0.5 leading-relaxed">
                                            Card counting indices and betting logic for this variant are currently being calibrated.
                                        </p>
                                    </div>
                                </div>
                            )}

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
                                            Unlike balanced systems, Katarina Walker for Iberian 21 is an unbalanced system (+8 per deck). The counting engine offsets that baseline automatically so a fresh shoe still displays from a practical zero point.
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
                                            {strategyType === 'iberian_21' ? 'Hi-Lo System — Iberian 21 Version' : 'Hi-Lo System — Standard Blackjack'}
                                        </p>
                                        <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(240,230,214,0.55)' }}>
                                            {strategyType === 'iberian_21' ? (
                                                <>
                                                    Card counting using Hi-Lo in Iberian 21 is an <span style={{ color: 'rgba(240,230,214,0.8)', fontWeight: 700 }}>unbalanced system</span> because all 10s are removed. In a 6-deck Iberian shoe, the running count naturally starts around <span style={{ color: '#fca5a5', fontWeight: 700 }}>−24</span>.
                                                    <br /><br />The <span style={{ color: 'rgba(240,230,214,0.8)', fontWeight: 700 }}>Bet Advice</span> panel compensates for that baseline automatically, while strategy deviations still use the real Iberian Hi-Lo thresholds. Use Katarina Walker in Settings if you prefer the room-specific Walker indices instead.
                                                </>
                                            ) : (
                                                <>
                                                    Standard blackjack uses the <span style={{ color: 'rgba(240,230,214,0.8)', fontWeight: 700 }}>balanced Hi-Lo system</span>: 2 through 6 are +1, 7 through 9 are 0, and 10 through Ace are −1.
                                                    <br /><br />Lower-deck games like Vegas Downtown react faster to card removal, while larger shoe games demand more patience and cleaner deck estimation before you raise bets.
                                                </>
                                            )}
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
                                <div className="rounded-lg px-4 py-3 mb-3" style={{ background: `linear-gradient(135deg, ${room.accentColor}08 0%, transparent 100%)`, border: `1px solid ${room.accentColor}18` }}>
                                    <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(240,230,214,0.58)' }}>
                                        <span className="font-bold" style={{ color: room.accentColor }}>Room note:</span>{' '}
                                        {strategyType === 'iberian_21'
                                            ? (isIberianWalker
                                                ? 'Walker gives Iberian 21 a cleaner zero-based meter, but bet ramps should still stay disciplined because bonus volatility can hide short-term variance.'
                                                : 'Hi-Lo in Iberian 21 starts deeply negative by design, so judge improvement from the baseline instead of chasing raw positive counts too early.')
                                            : `Insurance becomes interesting at TC ≥ +3. ${room.gameRules.allowSurrender ? 'This room also keeps the Fab 4 surrender deviations active.' : 'Because this room has no surrender, only playing deviations from the Illustrious 18 matter.'}`}
                                    </p>
                                </div>
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
                                            <span className="text-[10px] font-black tracking-wider shrink-0 w-22.5" style={{ color: row.color }}>{row.tc}</span>
                                            <span className="text-[10px] font-black uppercase tracking-wider shrink-0 w-15" style={{ color: row.color }}>{row.label}</span>
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
                                        : strategyType === 'free_action'
                                            ? 'Advanced: Push 22 Deviations (Free Action)'
                                            : strategyType === 'zapout_21'
                                                ? 'Advanced: Push 22 Deviations (Zap Out 21)'
                                                : strategyType === 'exchange_21'
                                                    ? 'Advanced: Push 22 Deviations (Exchange 21)'
                                                    : strategyType === 'firecard_21'
                                                        ? 'Advanced: Fire Card Deviations'
                                                        : strategyType === 'uk'
                                                            ? 'Advanced: UK Standards (OBO Protected)'
                                                            : strategyType === 'european'
                                                                ? 'Advanced: Strict ENHC Deviations'
                                                                : room.gameRules.allowSurrender
                                                                    ? 'Advanced: Key Deviations (Illustrious 18 + Fab 4)'
                                                                    : 'Advanced: Key Deviations (Illustrious 18)'}
                                </p>
                                <p className="text-[12px] leading-relaxed mb-3" style={{ color: 'rgba(240,230,214,0.45)' }}>
                                    {strategyType === 'iberian_21'
                                        ? `These indices are specifically for Iberian 21 using the ${countTab === 'kw' ? 'Katarina Walker' : 'Hi-Lo'} system. Deviate from basic strategy when the True Count (TC) reaches these thresholds:`
                                        : strategyType === 'free_action'
                                            ? 'At specific True Counts, the Hand Advisor uses specialized Push 22 indices for the Free Action room. These account for the dealer pushing on 22, making certain standing decisions more conservative.'
                                            : strategyType === 'zapout_21'
                                                ? 'At specific True Counts, the Hand Advisor uses specialized Push 22 indices for Zap Out 21. These account for the dealer pushing on 22 and replace the standard Illustrious 18 table. Zap action indices are for the initial Zap decision only.'
                                                : strategyType === 'exchange_21'
                                                    ? 'At specific True Counts, the Hand Advisor uses specialized Push 22 indices for Exchange 21. These account for the dealer pushing on 22 and are adapted from the Push 22 base set with Exchange-specific adjustments.'
                                                    : strategyType === 'firecard_21'
                                                        ? 'At specific True Counts, the Hand Advisor uses specialized indices adapted for Fire Card 21. These include unique True Count indices for when to use the Burn action instead of hitting.'
                                                        : strategyType === 'uk'
                                                            ? 'Since UK rules use the Original Bets Only (OBO) rule, you are protected against dealer blackjacks after doubling or splitting. Use standard Illustrious 18 indices for maximum advantage.'
                                                            : strategyType === 'european'
                                                                ? 'Strict ENHC rules mean you lose all bets if the dealer has a blackjack. These specialized indices require much higher True Counts before doubling or splitting against a 10 or Ace to justify the increased risk.'
                                                                : room.gameRules.allowSurrender
                                                                    ? 'At specific True Counts, the Hand Advisor can move beyond basic strategy using the Illustrious 18 plus the Fab 4 surrender set.'
                                                                    : 'At specific True Counts, the Hand Advisor can move beyond basic strategy using the core Illustrious 18 play deviations. Surrender indices are hidden because this room does not allow surrender.'}
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
                                            {visibleDeviations.map((dev, i) => (
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
                            {room.isBeta && (
                                <div
                                    className="mb-4 px-4 py-3 rounded-2xl flex items-start gap-3.5"
                                    style={{
                                        background: 'rgba(251,146,60,0.1)',
                                        border: '1px solid rgba(251,146,60,0.3)',
                                    }}
                                >
                                    <FlaskConical size={16} className="text-orange-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-orange-400">Under Development</p>
                                        <p className="text-[10px] text-orange-300/60 font-semibold mt-0.5 leading-relaxed">
                                            The basic strategy matrix for this variant is currently under review and may be subject to changes.
                                        </p>
                                    </div>
                                </div>
                            )}


                            {strategyTableContent && (
                                <div className="mb-4 rounded-2xl border p-4" style={{ background: `linear-gradient(135deg, ${room.accentColor}0f 0%, rgba(255,255,255,0.02) 100%)`, borderColor: `${room.accentColor}26` }}>
                                    <p className="text-[11px] font-black uppercase tracking-[0.22em] mb-1" style={{ color: `${room.accentColor}cc` }}>{strategyTableContent.title}</p>
                                    <p className="text-[12px] leading-relaxed text-white/70">{strategyTableContent.summary}</p>
                                    <div className="grid grid-cols-1 gap-2 mt-3 md:grid-cols-3">
                                        {strategyTableContent.bullets.map((bullet) => (
                                            <div key={bullet} className="rounded-xl border px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
                                                <p className="text-[11px] leading-relaxed text-white/58">{bullet}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

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

                                        {activeRows.map((row, rowIdx) => (
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
                                                    {row === '10,10' && strategyType === 'iberian_21' ? 'J/Q/K' : row}
                                                </td>
                                                {/* Action cells */}
                                                {(data[rowIdx] as Action[]).map((action: Action, colIdx: number) => {
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
                            {/* Legend */}
                            {(() => {
                                const usedActions = new Set<Action>();
                                const allData = [
                                    ...(strategyType === 'free_action' ? HARD_FA : strategyType === 'iberian_21' ? HARD_IBERIAN : strategyType === 'zapout_21' ? HARD_ZAPOUT : strategyType === 'exchange_21' ? HARD_EXCHANGE : strategyType === 'firecard_21' ? HARD_FIRECARD : strategyType === 'atlantic_city' ? HARD_AC : strategyType === 'vegas_strip' ? HARD_VEGAS : strategyType === 'vegas_downtown' ? HARD_DOWNTOWN : strategyType === 'european' ? HARD_EUROPEAN : HARD_CLASSIC),
                                    ...(strategyType === 'free_action' ? SOFT_FA : strategyType === 'iberian_21' ? SOFT_IBERIAN : strategyType === 'firecard_21' ? SOFT_FIRECARD : strategyType === 'atlantic_city' ? SOFT_AC : strategyType === 'vegas_strip' ? SOFT_VEGAS : strategyType === 'vegas_downtown' ? SOFT_DOWNTOWN : strategyType === 'european' ? SOFT_EUROPEAN : SOFT_CLASSIC),
                                    ...(strategyType === 'free_action' ? PAIRS_FA : strategyType === 'iberian_21' ? PAIRS_IBERIAN : strategyType === 'firecard_21' ? PAIRS_FIRECARD : strategyType === 'atlantic_city' ? PAIRS_AC : strategyType === 'vegas_strip' || strategyType === 'vegas_downtown' ? PAIRS_VEGAS : strategyType === 'european' ? PAIRS_EUROPEAN : PAIRS_CLASSIC),
                                ];
                                allData.forEach(r => r.forEach(a => usedActions.add(a as Action)));
                                const legendEntries = (Object.entries(ACTION_STYLES) as [Action, typeof ACTION_STYLES[Action]][]).filter(([key]) => usedActions.has(key));
                                return (
                                    <div className="mt-5 px-0.5">
                                        <p
                                            className="text-[11px] uppercase tracking-[0.2em] mb-3 font-bold"
                                            style={{ color: `${room.accentColor}80`, fontFamily: "'Georgia', serif" }}
                                        >
                                            Legend
                                        </p>
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                                            {legendEntries.map(([, st]) => (
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
                                );
                            })()}

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

function RuleSection({ title, content, children }: { title: string; content?: string; children?: React.ReactNode }) {
    return (
        <div>
            <h3 className="text-xs font-bold text-white/80 uppercase tracking-[0.15em] mb-1.5">{title}</h3>
            {content && <p className="text-xs text-white/50 leading-relaxed">{content}</p>}
            {children}
        </div>
    );
}

function RuleHighlightCard({ accentColor, highlight }: { accentColor: string; highlight: RuleHighlight }) {
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

function RuleBulletSection({ title, items, accentColor }: { title: string; items: string[]; accentColor: string }) {
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
