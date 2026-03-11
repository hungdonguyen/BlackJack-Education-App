'use client';

// ============================================
// StrategyModal - Basic Strategy Chart
// Premium casino-style presentation
// ============================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, BookOpen, Info, Plus, Minus, ChevronsUp, ArrowLeftRight, Shield, Flag } from 'lucide-react';
import { RoomConfig } from '@/utils/rooms';
import { useGameStore } from '@/hooks/useGameStore';
import { GameStore } from '@/types/game';
import { I18_S17, I18_H17, FAB_4, IBERIAN_HILO, IBERIAN_WALKER } from '@/utils/countingDeviations';
import { COMPOSITION_DEPENDENT_OVERRIDES } from '@/utils/strategyAdvisor';
import { useAudio } from '@/utils/audio';

interface StrategyModalProps {
    room: RoomConfig;
    onClose: () => void;
}

type Action = 'H' | 'S' | 'DS' | 'S4' | 'S5' | 'S6' | 'SP' | 'PS' | 'D' | 'D3' | 'D4' | 'D5' | 'D6' | 'R' | 'RH' | 'SU' | 'FD' | 'FSP';
type Tab = 'hard' | 'soft' | 'pairs' | 'special' | 'counting' | 'rules';
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
    FD: { bg: 'linear-gradient(135deg, #d4a843 0%, #b8922e 100%)', text: '#1a1206', label: 'FD', desc: 'Free Action Double' },
    FSP: { bg: 'linear-gradient(135deg, #e8c547 0%, #ccad3a 100%)', text: '#1a1206', label: 'FSP', desc: 'Free Action Split' },
};

const DEALER_UPCARDS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'];

// Strategy Data
const HARD_ROWS = ['5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'];
const SOFT_ROWS = ['A,2', 'A,3', 'A,4', 'A,5', 'A,6', 'A,7', 'A,8', 'A,9'];
const PAIR_ROWS = ['2,2', '3,3', '4,4', '5,5', '6,6', '7,7', '8,8', '9,9', '10,10', 'A,A'];

const HARD_ROWS_IBERIAN = ['5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20'];
const SOFT_ROWS_IBERIAN = ['A,2', 'A,3', 'A,4', 'A,5', 'A,6', 'A,7', 'A,8', 'A,9'];
const PAIR_ROWS_IBERIAN = ['2,2', '3,3', '6,6', '7,7', '8,8', '9,9', 'A,A'];

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
    ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
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
    ['H', 'H', 'SP', 'SP', 'SP', 'H', 'H', 'H', 'H', 'H'],     // 6,6
    ['SP', 'SP', 'SP', 'SP', 'SP', 'PS', 'H', 'H', 'H', 'H'],  // 7,7
    ['SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'R'], // 8,8
    ['S', 'SP', 'SP', 'SP', 'SP', 'S', 'SP', 'SP', 'S', 'S'],  // 9,9
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
        case 'classic':
            return {
                overview: 'Traditional 8-deck blackjack with S17 dealer rules and a conservative split structure. This table looks familiar, but the limited re-splitting makes pair discipline more important than in Vegas variants.',
                highlights: [
                    {
                        eyebrow: 'Table Identity',
                        title: 'Classic shoe game',
                        detail: '8 decks, dealer stands on all 17s, blackjack pays 3:2, and there is no surrender.',
                    },
                    {
                        eyebrow: 'Split Limit',
                        title: 'Only one split',
                        detail: 'You may split only once, for a maximum of 2 hands. Equal-value cards are enough here, so mixed 10-value pairs such as J-K may be split.',
                        tone: 'warn',
                    },
                    {
                        eyebrow: 'Practical Edge',
                        title: 'Stable but less flexible',
                        detail: 'Because resplitting is restricted, pair mistakes are punished harder than in rooms that allow 4 hands.',
                        tone: 'good',
                    },
                ],
                playerOptions: {
                    title: 'Player Options',
                    items: [
                        'Double down is allowed on any first two cards, except hands created from split aces.',
                        'Double after split is allowed on regular split hands.',
                        'Split requires equal value and stops at 2 total hands per seat, so mixed 10-value pairs are legal.',
                        'Split aces receive one card each and cannot be re-split.',
                        'Surrender is not available.',
                    ],
                },
                payouts: {
                    title: 'Payout & Settlement',
                    items: [
                        'Blackjack pays 3:2 and regular wins pay 1:1.',
                        'Insurance pays 2:1 when the dealer shows an ace.',
                        'Push returns the full wager; bust always loses immediately.',
                    ],
                },
                dealerFlow: {
                    title: 'Dealer Procedure',
                    items: [
                        'Dealer stands on hard 17 and soft 17.',
                        'With 8 decks, card removal matters less than in double-deck rooms, so pure basic strategy discipline matters most.',
                    ],
                },
                strategyNotes: {
                    title: 'Strategy Focus',
                    items: [
                        'Treat this as a baseline chart: no surrender rescue, no special pushes, and no free actions.',
                        'Because only one split is allowed, pair hands such as 8,8 and A,A carry more weight than in multi-split rooms.',
                        'Do not overvalue composition-dependent plays; the 8-deck shoe smooths out extremes.',
                    ],
                },
            };
        case 'vegas_strip':
            return {
                overview: 'A 4-deck S17 Vegas game with more flexible splitting than Classic. Fewer decks improve composition sensitivity while keeping the dealer rule player-friendlier than H17 tables.',
                highlights: [
                    {
                        eyebrow: 'Table Identity',
                        title: '4-deck Vegas Strip',
                        detail: 'Blackjack pays 3:2, dealer stands on all 17s, and the room keeps a clean no-surrender structure.',
                    },
                    {
                        eyebrow: 'Split Logic',
                        title: 'Same value is enough',
                        detail: 'You can split any equal-value pair, including mixed 10-value cards such as J-K, up to 4 hands total.',
                        tone: 'good',
                    },
                    {
                        eyebrow: 'Ace Restriction',
                        title: 'No ace re-split',
                        detail: 'Once aces are split, each ace gets one card and the branch ends. There is no re-split on aces.',
                        tone: 'warn',
                    },
                ],
                playerOptions: {
                    title: 'Player Options',
                    items: [
                        'Double down is allowed on any first two cards, except ace-split hands.',
                        'Double after split is available on normal split hands.',
                        'Split equal-value hands up to 4 total hands per seat.',
                        'Mixed 10-value pairs may be split here because value match is enough.',
                        'Surrender is not available.',
                    ],
                },
                payouts: {
                    title: 'Payout & Settlement',
                    items: [
                        'Blackjack pays 3:2 and regular wins pay 1:1.',
                        'Insurance pays 2:1 when the dealer shows an ace.',
                        'There are no bonus 21 payouts, free actions, or push-on-22 exceptions.',
                    ],
                },
                dealerFlow: {
                    title: 'Dealer Procedure',
                    items: [
                        'Dealer stands on both hard 17 and soft 17.',
                        'The 4-deck shoe makes pair and double spots slightly more composition-sensitive than 8-deck rooms.',
                    ],
                },
                strategyNotes: {
                    title: 'Strategy Focus',
                    items: [
                        'This is one of the cleaner rooms for textbook basic strategy because the rule set is strong and predictable.',
                        'Exploit the broader split rule correctly, but avoid inventing loose mixed-10 splits unless the chart says so.',
                        'The lower deck count slightly improves precision for doubles and pair decisions compared with Classic.',
                    ],
                },
            };
        case 'vegas_downtown':
            return {
                overview: 'A fast 2-deck game where the smaller pack helps the player, but the dealer compensates by hitting soft 17. The result is a sharper, more volatile basic-strategy environment.',
                highlights: [
                    {
                        eyebrow: 'Table Identity',
                        title: '2-deck downtown game',
                        detail: 'The short shoe increases composition value, but H17 gives the dealer more chances to improve weak hands.',
                    },
                    {
                        eyebrow: 'Dealer Pressure',
                        title: 'Soft 17 must hit',
                        detail: 'Dealer A,6 is not a stopping hand here. That extra draw slightly raises house edge and changes some double/stand thresholds.',
                        tone: 'warn',
                    },
                    {
                        eyebrow: 'Split Freedom',
                        title: '4-hand split tree',
                        detail: 'Equal-value pairs, including mixed 10-value cards, can be split up to 4 total hands.',
                        tone: 'good',
                    },
                ],
                playerOptions: {
                    title: 'Player Options',
                    items: [
                        'Double down is allowed on any first two cards, except ace-split hands.',
                        'Double after split is allowed on regular split hands.',
                        'Equal-value pairs may be split up to 4 total hands per seat.',
                        'Split aces cannot be re-split and receive one card each.',
                        'Surrender is not available.',
                    ],
                },
                payouts: {
                    title: 'Payout & Settlement',
                    items: [
                        'Blackjack pays 3:2 and regular wins pay 1:1.',
                        'Insurance pays 2:1 when the dealer shows an ace.',
                        'No rescue surrender, no side-bet interaction, and no alternate 21 payout schedule.',
                    ],
                },
                dealerFlow: {
                    title: 'Dealer Procedure',
                    items: [
                        'Dealer hits soft 17, but stands on hard 17 and above.',
                        'Because there are only 2 decks, removal of small cards and aces has stronger immediate impact than in shoe games.',
                    ],
                },
                strategyNotes: {
                    title: 'Strategy Focus',
                    items: [
                        'Expect a slightly more aggressive chart than S17 rooms, especially around doubles and marginal stands.',
                        'Do not copy 8-deck S17 instincts here; H17 punishes passive play in several borderline totals.',
                        'The small deck count rewards accurate composition-aware counting more than the larger shoes.',
                    ],
                },
            };
        case 'atlantic_city':
            return {
                overview: 'A strong 8-deck S17 ruleset built around late surrender and flexible value-based splitting. This room gives the player more damage control than the standard shoe tables.',
                highlights: [
                    {
                        eyebrow: 'Table Identity',
                        title: 'Atlantic City core rules',
                        detail: '8 decks, blackjack pays 3:2, dealer stands on all 17s, and late surrender is enabled.',
                    },
                    {
                        eyebrow: 'Best Defensive Rule',
                        title: 'Late surrender matters',
                        detail: 'You can save half a bet on the right initial hands after the dealer checks for blackjack, which materially improves close EV spots.',
                        tone: 'good',
                    },
                    {
                        eyebrow: 'Split Structure',
                        title: 'Value-based splits to 4 hands',
                        detail: 'Mixed 10-value cards can be split, but aces still cannot be re-split.',
                    },
                ],
                playerOptions: {
                    title: 'Player Options',
                    items: [
                        'Double down is allowed on any first two cards, including after split, except ace-split hands.',
                        'Late surrender is available only on the original 2-card hand before splitting and after the dealer has confirmed no blackjack.',
                        'Equal-value pairs may be split up to 4 total hands per seat.',
                        'Mixed 10-value pairs can be split; split aces cannot be re-split.',
                    ],
                },
                payouts: {
                    title: 'Payout & Settlement',
                    items: [
                        'Blackjack pays 3:2 and regular wins pay 1:1.',
                        'Insurance pays 2:1 when the dealer shows an ace.',
                        'Surrender returns half the original stake and ends the hand immediately.',
                    ],
                },
                dealerFlow: {
                    title: 'Dealer Procedure',
                    items: [
                        'Dealer stands on hard 17 and soft 17.',
                        'The room uses a shoe game, so the main rule edge comes from surrender access rather than from composition alone.',
                    ],
                },
                strategyNotes: {
                    title: 'Strategy Focus',
                    items: [
                        'Use surrender correctly on the worst negative-EV starters; that is the defining difference of this room.',
                        'Hands like hard 15 and hard 16 versus strong dealer upcards are materially improved by surrender availability.',
                        'Because the dealer stands on soft 17, your default chart is slightly calmer than Vegas Downtown or Free Action.',
                    ],
                },
            };
        case 'free_action':
            return {
                overview: 'This variant rewrites normal blackjack incentives. Free doubles, free splits, and the dealer-22 push rule radically change how aggressively you should pursue extra hands and extra cards.',
                highlights: [
                    {
                        eyebrow: 'Table Identity',
                        title: 'Free Action variant',
                        detail: '6 decks, dealer hits soft 17, no surrender, with special no-cost doubles and splits on many hands.',
                    },
                    {
                        eyebrow: 'Core Twist',
                        title: 'Dealer 22 pushes',
                        detail: 'If the dealer busts with exactly 22, all surviving non-blackjack hands push instead of winning.',
                        tone: 'warn',
                    },
                    {
                        eyebrow: 'Player Compensation',
                        title: 'Free aggression',
                        detail: 'Hard 9, 10, 11 can double for free, and most pairs can split for free. That is why the chart becomes much more aggressive.',
                        tone: 'good',
                    },
                ],
                playerOptions: {
                    title: 'Player Options',
                    items: [
                        'Double down is always allowed on live 2-card hands except ace-split hands.',
                        'Hard 9, 10, and 11 double for free; other doubles still cost the normal extra bet.',
                        'Equal-value pairs may be split up to 4 total hands per seat.',
                        'All non-10-value pairs split for free; 10-value pairs still require a real matching wager.',
                        'Split aces receive one card each and cannot be re-split.',
                    ],
                },
                payouts: {
                    title: 'Payout & Settlement',
                    items: [
                        'Blackjack still pays 3:2 and is protected from the dealer-22 push rule.',
                        'Regular wins pay 1:1; insurance pays 2:1.',
                        'Dealer 22 pushes all surviving non-blackjack hands. Dealer 23 or more busts normally.',
                        'The Multi Action Bonus side bet has much lower RTP than the base game and should be treated as entertainment only.',
                    ],
                },
                dealerFlow: {
                    title: 'Dealer Procedure',
                    items: [
                        'Dealer hits soft 17, increasing volatility in marginal totals.',
                        'Because dealer 22 does not lose, weak stiff hands gain less from simply waiting for a bust than in standard blackjack.',
                    ],
                },
                strategyNotes: {
                    title: 'Strategy Focus',
                    items: [
                        'Use the chart, not standard blackjack instinct. Free doubles and free splits make many seemingly wild actions mathematically right.',
                        'Push-on-22 reduces the value of passive standing on weak totals, so the strategy leans harder into building strong hands.',
                        'Do not chase the side bet as a serious value play; the edge is in the main game adjustments.',
                    ],
                },
            };
        case 'iberian_21':
            return {
                overview: 'Iberian 21 here follows the common casino Spanish 21 profile: 6 no-10 decks, dealer H17, late surrender plus rescue, and liberal split rules. This chart matches the specific "Dealer Hits on Soft 17" protocol.',
                highlights: [
                    {
                        eyebrow: 'Table Identity',
                        title: 'Spanish 21 Profile',
                        detail: 'All rank-10 cards are removed. Player 21 always wins and beats dealer blackjack. These rules significantly favor the player to compensate for the missing 10s.',
                        tone: 'accent',
                    },
                    {
                        eyebrow: 'Soft 17 Rule',
                        title: 'Dealer Hits Soft 17',
                        detail: 'This specific strategy is optimized for rooms where the dealer must draw on Soft 17 (H17).',
                        tone: 'warn',
                    },
                    {
                        eyebrow: 'Surrender & Rescue',
                        title: 'Late Surrender + Rescue',
                        detail: 'Surrender is available on the first two cards, and "Rescue" is available after doubling down.',
                        tone: 'good',
                    },
                ],
                playerOptions: {
                    title: 'Player Options',
                    items: [
                        'Double on any number of cards; Redoubling is not allowed.',
                        'Late Surrender on original hand; Double Down Rescue available after doubling.',
                        'Split up to 4 hands total. Aces can be re-split, hit, and doubled.',
                        'Bonus 21 payouts for 5+ cards, 6-7-8, and 7-7-7 (undoubled).',
                    ],
                },
                payouts: {
                    title: 'Payout & Settlement',
                    items: [
                        'Blackjack pays 3:2 and always wins against dealer blackjack.',
                        'Any Player 21 always wins against dealer 21.',
                        '5-card 21 (3:2), 6-card 21 (2:1), 7-card 21 (3:1).',
                        '6-7-8 or 7-7-7 pays 3:2 (mixed), 2:1 (same suit), 3:1 (spades).',
                    ],
                },
                dealerFlow: {
                    title: 'Dealer Procedure',
                    items: [
                        'Dealer hits Soft 17 (H17) and stands on Hard 17.',
                        'Dealer does not have any 10 cards in the deck, increasing bust rates in specific patterns.',
                    ],
                },
                strategyNotes: {
                    title: 'Strategy Legend',
                    items: [
                        'S4/5/6: Stand, except Hit with 4/5/6 or more cards.',
                        'D3/4/5/6: Double, except Hit with 3/4/5/6 or more cards.',
                        'RH: Surrender if allowed, otherwise Hit.',
                        'PS: Split, except Hit with suited sevens.',
                        '* / \' / ": Compositional Hit overrides for 6-7-8 combinations.',
                    ],
                },
            };
        case 'european':
            return {
                overview: 'European Blackjack uses the European No Hole Card (ENHC) rule. The dealer only receives one card until players finish their hands, significantly altering the optimal strategy for doubles and splits.',
                highlights: [
                    {
                        eyebrow: 'Table Identity',
                        title: 'Standard European Rules',
                        detail: '6 decks. Dealer takes no hole card (ENHC) and stands on soft 17 (S17).',
                    },
                    {
                        eyebrow: 'ENHC Rule',
                        title: 'Dealer takes no hole card',
                        detail: 'If you double or split and the dealer draws to a Blackjack, you lose all bets. Thus, you should be very careful doubling or splitting against dealer 10 or Ace.',
                        tone: 'warn',
                    },
                    {
                        eyebrow: 'Restricted Actions',
                        title: 'Double on Hard 9-11 only',
                        detail: 'You may only double down if your first two cards total a hard 9, 10, or 11. No soft doubles allowed.',
                        tone: 'accent',
                    },
                ],
                playerOptions: {
                    title: 'Player Options',
                    items: [
                        'Double down is only allowed on hard 9, 10, and 11.',
                        'Double after split is NOT allowed.',
                        'Split once only for equal-value cards (e.g., King-Jack is not allowed).',
                        'Split aces receive one card each and cannot be re-split.',
                        'Surrender is not available.',
                    ],
                },
                payouts: {
                    title: 'Payout & Settlement',
                    items: [
                        'Blackjack pays 3:2 and regular wins pay 1:1.',
                        'Insurance pays 2:1 when the dealer shows an ace.',
                        'Push returns the full wager; bust always loses immediately.',
                    ],
                },
                dealerFlow: {
                    title: 'Dealer Procedure',
                    items: [
                        'Dealer stands on hard 17 and soft 17.',
                        'Dealer does not draw a second card (or peek for Blackjack) until all players have completed their hands.',
                    ],
                },
                strategyNotes: {
                    title: 'Strategy Focus',
                    items: [
                        'Hit 11 against Dealer 10 and Ace. Doubling is too risky because of the ENHC rule.',
                        'Hit A,A against an Ace upcard since a split risks double loss.',
                    ],
                },
            };
        default:
            return {
                overview: room.description,
                highlights: [],
                playerOptions: { title: 'Player Options', items: [] },
                payouts: { title: 'Payout & Settlement', items: [] },
                dealerFlow: { title: 'Dealer Procedure', items: [] },
                strategyNotes: { title: 'Strategy Focus', items: [] },
            };
    }
}

function getStrategyTableContent(room: RoomConfig, tab: 'hard' | 'soft' | 'pairs'): StrategyTableContent {
    if (tab === 'hard') {
        switch (room.id) {
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
    }    if (tab === 'soft') {
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
    const roomCompositionOverrides = COMPOSITION_DEPENDENT_OVERRIDES.filter((override) => override.roomId === room.id);
    const topCompositionOverrides = roomCompositionOverrides.filter((override) => override.isTopOverride);
    const specialCaseGroups = (['hard', 'soft', 'pairs'] as SpecialCaseGroup[]).map((group) => ({
        group,
        items: roomCompositionOverrides.filter((override) => override.tab === group && !override.isTopOverride),
    })).filter((entry) => entry.items.length > 0);
    const visibleTabs = (room.id === 'iberian_21'
        ? ['rules', 'hard', 'soft', 'pairs', 'special', 'counting']
        : ['rules', 'hard', 'soft', 'pairs', 'counting']) as Tab[];

    const strategyType = room.id;

    const rows = tab === 'hard'
        ? (strategyType === 'iberian_21' ? HARD_ROWS_IBERIAN : HARD_ROWS)
        : tab === 'soft'
            ? (strategyType === 'iberian_21' ? SOFT_ROWS_IBERIAN : SOFT_ROWS)
            : tab === 'pairs'
                ? (strategyType === 'iberian_21' ? PAIR_ROWS_IBERIAN : PAIR_ROWS)
                : [];
    const data = tab === 'hard'
        ? (strategyType === 'free_action'
            ? HARD_FA
            : strategyType === 'iberian_21'
                ? HARD_IBERIAN
                : strategyType === 'atlantic_city'
                    ? HARD_AC
                    : strategyType === 'vegas_strip'
                        ? HARD_VEGAS
                        : strategyType === 'vegas_downtown'
                            ? HARD_DOWNTOWN
                            : strategyType === 'european'
                                ? HARD_EUROPEAN
                                : HARD_CLASSIC)
        : tab === 'soft'
            ? (strategyType === 'free_action'
                ? SOFT_FA
                : strategyType === 'iberian_21'
                    ? SOFT_IBERIAN
                    : strategyType === 'atlantic_city'
                        ? SOFT_AC
                        : strategyType === 'vegas_strip'
                            ? SOFT_VEGAS
                            : strategyType === 'vegas_downtown'
                                ? SOFT_DOWNTOWN
                                : strategyType === 'european'
                                    ? SOFT_EUROPEAN
                                    : SOFT_CLASSIC)
            : tab === 'pairs'
                ? (strategyType === 'free_action'
                    ? PAIRS_FA
                    : strategyType === 'iberian_21'
                        ? PAIRS_IBERIAN
                        : strategyType === 'atlantic_city'
                            ? PAIRS_AC
                            : strategyType === 'vegas_strip' || strategyType === 'vegas_downtown'
                                ? PAIRS_VEGAS
                                : strategyType === 'european'
                                    ? PAIRS_EUROPEAN
                                    : PAIRS_CLASSIC)
                : [];

    const strategyTableContent = tab === 'hard' || tab === 'soft' || tab === 'pairs'
        ? getStrategyTableContent(room, tab)
        : null;
    const standardHiLoDeviations = room.gameRules.allowSurrender
        ? [...(room.gameRules.dealerHitsSoft17 ? I18_H17 : I18_S17), ...FAB_4]
        : [...(room.gameRules.dealerHitsSoft17 ? I18_H17 : I18_S17)];
    const visibleDeviations = strategyType === 'iberian_21'
        ? (countTab === 'kw' ? IBERIAN_WALKER : IBERIAN_HILO)
        : standardHiLoDeviations;

    const tabConfig: Record<Tab, { label: string; rowTitle: string }> = {
        rules: { label: 'Rules', rowTitle: '' },
        hard: { label: 'Hard Totals', rowTitle: 'Hand' },
        soft: { label: 'Soft Totals', rowTitle: 'Hand' },
        pairs: { label: 'Pairs', rowTitle: 'Pair' },
        special: { label: 'Special Case', rowTitle: '' },
        counting: { label: 'Card Counting', rowTitle: '' },
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
                    ) : tab === 'special' ? (
                        <div className="space-y-5">
                            <div className="rounded-2xl border p-4" style={{ background: `linear-gradient(135deg, ${room.accentColor}0f 0%, rgba(255,255,255,0.02) 100%)`, borderColor: `${room.accentColor}26` }}>
                                <p className="text-[11px] font-black uppercase tracking-[0.22em] mb-1" style={{ color: `${room.accentColor}cc` }}>Walker Special Cases</p>
                                <p className="text-[12px] leading-relaxed text-white/72">
                                    Top overrides below can replace the live advice. All other Walker entries stay as reference notes under the main recommendation.
                                </p>
                            </div>

                            {topCompositionOverrides.length > 0 && (
                                <div className="rounded-2xl border p-4" style={{ background: 'rgba(250,204,21,0.05)', borderColor: 'rgba(250,204,21,0.18)' }}>
                                    <div className="flex items-center justify-between gap-3 mb-3">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-300/70">Priority Layer</p>
                                            <p className="text-[15px] font-black text-yellow-200" style={{ fontFamily: "'Georgia', serif" }}>Top Overrides</p>
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-yellow-300/60">Walker</span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        {topCompositionOverrides.map((override) => {
                                            const pattern = renderSpecialCaseCards(override.handPattern ?? []);
                                            const accent = getSpecialCaseAccent(true);
                                            return (
                                                <div key={override.id} className="rounded-xl border px-3.5 py-3" style={{ background: accent.background, borderColor: accent.borderColor }}>
                                                    <div className="flex items-center justify-between gap-3 mb-2">
                                                        <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: accent.badgeColor }}>{accent.badge}</p>
                                                        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-yellow-100/60">{SPECIAL_CASE_GROUP_LABELS[override.tab]}</span>
                                                    </div>
                                                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            {pattern.map((card) => (
                                                                <div key={card.key} className="min-w-11.5 rounded-lg border px-2.5 py-2 text-center" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(238,231,222,0.92) 100%)', borderColor: 'rgba(255,255,255,0.18)' }}>
                                                                    <span className="block text-[13px] font-black leading-none text-slate-900">{card.label}</span>
                                                                    <span className="block mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-red-600">card</span>
                                                                </div>
                                                            ))}
                                                            <span className="text-white/30 text-[11px] font-black">vs</span>
                                                            <div className="min-w-11.5 rounded-lg border px-2.5 py-2 text-center" style={{ background: 'rgba(255,255,255,0.06)', borderColor: `${room.accentColor}30` }}>
                                                                <span className="block text-[13px] font-black leading-none text-white/88">{formatSpecialCaseRank(override.dealerUpcard)}</span>
                                                                <span className="block mt-1 text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: `${room.accentColor}cc` }}>dealer</span>
                                                            </div>
                                                            <div className="rounded-lg border px-3 py-2" style={{ background: `${room.accentColor}12`, borderColor: `${room.accentColor}30` }}>
                                                                <span className="block text-[9px] font-black uppercase tracking-[0.15em]" style={{ color: `${room.accentColor}cc` }}>Action</span>
                                                                <span className="block mt-1 text-[12px] font-black text-white/88">{formatSpecialCaseAction(override.action)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className="mt-2 text-[12px] font-semibold leading-relaxed text-white/86">{override.summary}</p>
                                                    <p className="mt-1 text-[11px] leading-relaxed text-white/54">Walker note: {override.trigger}.</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {specialCaseGroups.map(({ group, items }) => (
                                <div key={group} className="rounded-2xl border p-4" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}>
                                    <div className="flex items-center justify-between gap-3 mb-3">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Special Case</p>
                                            <p className="text-[15px] font-black" style={{ color: room.accentColor, fontFamily: "'Georgia', serif" }}>{SPECIAL_CASE_GROUP_LABELS[group]}</p>
                                        </div>
                                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Walker</span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        {items.map((override) => {
                                            const pattern = renderSpecialCaseCards(override.handPattern ?? []);
                                            const accent = getSpecialCaseAccent(false);
                                            return (
                                                <div key={override.id} className="rounded-xl border px-3.5 py-3" style={{ background: accent.background, borderColor: accent.borderColor }}>
                                                    <div className="flex items-center justify-between gap-3 mb-2">
                                                        <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: accent.badgeColor }}>{accent.badge}</p>
                                                        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/28">{override.isSoft ? 'Soft hand' : group === 'pairs' ? 'Pair hand' : 'Hard hand'}</span>
                                                    </div>
                                                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            {pattern.map((card) => (
                                                                <div
                                                                    key={card.key}
                                                                    className="min-w-11.5 rounded-lg border px-2.5 py-2 text-center"
                                                                    style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(238,231,222,0.92) 100%)', borderColor: 'rgba(255,255,255,0.18)' }}
                                                                >
                                                                    <span className="block text-[13px] font-black leading-none text-slate-900">{card.label}</span>
                                                                    <span className="block mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-red-600">card</span>
                                                                </div>
                                                            ))}
                                                            <span className="text-white/30 text-[11px] font-black">vs</span>
                                                            <div className="min-w-11.5 rounded-lg border px-2.5 py-2 text-center" style={{ background: 'rgba(255,255,255,0.06)', borderColor: `${room.accentColor}30` }}>
                                                                <span className="block text-[13px] font-black leading-none text-white/88">{formatSpecialCaseRank(override.dealerUpcard)}</span>
                                                                <span className="block mt-1 text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: `${room.accentColor}cc` }}>dealer</span>
                                                            </div>
                                                            <div className="rounded-lg border px-3 py-2" style={{ background: `${room.accentColor}12`, borderColor: `${room.accentColor}30` }}>
                                                                <span className="block text-[9px] font-black uppercase tracking-[0.15em]" style={{ color: `${room.accentColor}cc` }}>Action</span>
                                                                <span className="block mt-1 text-[12px] font-black text-white/88">{formatSpecialCaseAction(override.action)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className="mt-2 text-[12px] font-semibold leading-relaxed text-white/82">{override.summary}</p>
                                                    <p className="mt-1 text-[11px] leading-relaxed text-white/48">Walker note: {override.trigger}.</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : tab === 'counting' ? (
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
                                        : room.gameRules.allowSurrender
                                            ? 'Advanced: Key Deviations (Illustrious 18 + Fab 4)'
                                            : 'Advanced: Key Deviations (Illustrious 18)'}
                                </p>
                                <p className="text-[12px] leading-relaxed mb-3" style={{ color: 'rgba(240,230,214,0.45)' }}>
                                    {strategyType === 'iberian_21'
                                        ? `These indices are specifically for Iberian 21 using the ${countTab === 'kw' ? 'Katarina Walker' : 'Hi-Lo'} system. Deviate from basic strategy when the True Count (TC) reaches these thresholds:`
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
                                                    {row === '10,10' && strategyType === 'iberian_21' ? 'J/Q/K' : row}
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
                            {/* Legend */}
                            {(() => {
                                const usedActions = new Set<Action>();
                                const allData = [
                                    ...(strategyType === 'free_action' ? HARD_FA : strategyType === 'iberian_21' ? HARD_IBERIAN : strategyType === 'atlantic_city' ? HARD_AC : strategyType === 'vegas_strip' ? HARD_VEGAS : strategyType === 'vegas_downtown' ? HARD_DOWNTOWN : strategyType === 'european' ? HARD_EUROPEAN : HARD_CLASSIC),
                                    ...(strategyType === 'free_action' ? SOFT_FA : strategyType === 'iberian_21' ? SOFT_IBERIAN : strategyType === 'atlantic_city' ? SOFT_AC : strategyType === 'vegas_strip' ? SOFT_VEGAS : strategyType === 'vegas_downtown' ? SOFT_DOWNTOWN : strategyType === 'european' ? SOFT_EUROPEAN : SOFT_CLASSIC),
                                    ...(strategyType === 'free_action' ? PAIRS_FA : strategyType === 'iberian_21' ? PAIRS_IBERIAN : strategyType === 'atlantic_city' ? PAIRS_AC : strategyType === 'vegas_strip' || strategyType === 'vegas_downtown' ? PAIRS_VEGAS : strategyType === 'european' ? PAIRS_EUROPEAN : PAIRS_CLASSIC),
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
