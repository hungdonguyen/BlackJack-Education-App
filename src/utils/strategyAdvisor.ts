import { Card } from '@/types/game';
import { calculateHandValue } from '@/utils/hand';

export type StrategyAction = 'H' | 'S' | 'DS' | 'S4' | 'S5' | 'S6' | 'SP' | 'PS' | 'D' | 'D3' | 'D4' | 'D5' | 'D6' | 'R' | 'RH' | 'RS' | 'SU' | 'FD' | 'FSP';
export type AdviceAction = StrategyAction | 'INS' | 'NINS';

export interface CompositionDependentOverride {
    id: string;
    roomId: string;
    tab: 'hard' | 'soft' | 'pairs';
    playerTotal: number;
    isSoft: boolean;
    dealerUpcard: string;
    isTopOverride?: boolean;
    handPattern?: string[];
    minCardCount?: number;
    maxCardCount?: number;
    action: StrategyAction;
    title: string;
    trigger: string;
    description: string;
    summary: string;
    source: string;
}

type ActionMeta = {
    label: string;
    shortLabel: string;
    color: string;
    glow: string;
    border: string;
    bg: string;
    desc: string;
    reasoning: (total: number, isSoft: boolean, dealerUp: string) => string;
};

const DEALER_UPCARDS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'] as const;
const PAIR_ROWS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'A'] as const;

const HARD_CLASSIC: StrategyAction[][] = [
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
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
];

const HARD_DOWNTOWN: StrategyAction[][] = [
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],
    ['D', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
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

const HARD_FA: StrategyAction[][] = [
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

const SOFT_CLASSIC: StrategyAction[][] = [
    ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['S', 'DS', 'DS', 'DS', 'DS', 'S', 'S', 'H', 'H', 'H'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
];

const SOFT_DOWNTOWN: StrategyAction[][] = [
    ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // Soft 17: Hit vs 2 (Corrected per image)
    ['DS', 'DS', 'DS', 'DS', 'DS', 'S', 'S', 'H', 'H', 'H'], // Soft 18: DS vs 2 (Corrected per image)
    ['S', 'S', 'S', 'S', 'DS', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
];

const SOFT_FA: StrategyAction[][] = [
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 13
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 14
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 15
    ['H', 'H', 'H', 'H', 'D', 'H', 'H', 'H', 'H', 'H'], // 16 (D vs dealer 6)
    ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // 17 (D vs dealer 5,6)
    ['S', 'S', 'D', 'D', 'D', 'S', 'S', 'H', 'H', 'H'], // 18 (S vs 2-3, D vs 4-6, S vs 7-8, H vs 9-A)
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 19
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 20
];

// Free Hand tables (hands resulting from a free split — more aggressive, no surrender)
const HARD_FA_FREE: StrategyAction[][] = [
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

const SOFT_FA_FREE: StrategyAction[][] = [
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 13
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 14
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 15
    ['H', 'H', 'H', 'H', 'D', 'H', 'H', 'H', 'H', 'H'], // 16 (D vs dealer 6)
    ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // 17 (D vs dealer 5, 6)
    ['H', 'H', 'D', 'D', 'D', 'S', 'H', 'H', 'H', 'H'], // 18 (D vs 4-6, S vs 7)
    ['S', 'S', 'S', 'D', 'D', 'S', 'S', 'S', 'S', 'S'], // 19 (D vs 5-6)
    ['S', 'S', 'S', 'S', 'D', 'S', 'S', 'S', 'S', 'S'], // 20 (D vs 6)
];
const HARD_VEGAS = HARD_CLASSIC;
const SOFT_VEGAS = SOFT_CLASSIC;

const HARD_AC: StrategyAction[][] = [
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
    ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'H', 'SU', 'H'],
    ['S', 'S', 'S', 'S', 'S', 'H', 'H', 'SU', 'SU', 'SU'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
];

const SOFT_AC: StrategyAction[][] = [
    ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['S', 'DS', 'DS', 'DS', 'DS', 'S', 'S', 'H', 'H', 'H'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
];

const HARD_IBERIAN: StrategyAction[][] = [
    // Dealer: 2    3    4    5    6    7    8    9   10    A
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

const SOFT_IBERIAN: StrategyAction[][] = [
    // Dealer:   2    3    4    5    6    7    8    9   10    A
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // A+2 (soft 13)
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // A+3 (soft 14)
    ['H', 'H', 'H', 'H', 'D4', 'H', 'H', 'H', 'H', 'H'], // A+4 (soft 15)
    ['H', 'H', 'H', 'D3', 'D4', 'H', 'H', 'H', 'H', 'H'], // A+5 (soft 16)
    ['H', 'H', 'D3', 'D4', 'D5', 'H', 'H', 'H', 'H', 'H'], // A+6 (soft 17)
    ['S4', 'S4', 'D4', 'D5', 'D6', 'S6', 'S4', 'H', 'H', 'H'], // A+7 (soft 18)
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S6', 'S6'], // A+8 (soft 19)
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // A+9 (soft 20)
];

const PAIRS_TABLE: StrategyAction[][] = [
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

const PAIRS_FA: StrategyAction[][] = [
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

const PAIRS_IBERIAN: StrategyAction[][] = [
    // Dealer:    2    3    4    5    6    7    8    9   10    A
    ['SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'H', 'H', 'H'], // 2,2
    ['SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'H', 'H', 'H'], // 3,3
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'],       // 4,4 (never split)
    ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H', 'H'],       // 5,5 (treat as hard 10)
    ['H', 'H', 'SP', 'SP', 'SP', 'H', 'H', 'H', 'H', 'H'],    // 6,6
    ['SP', 'SP', 'SP', 'SP', 'SP', 'PS', 'H', 'H', 'H', 'H'], // 7,7
    ['SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'R', 'R'], // 8,8
    ['S', 'SP', 'SP', 'SP', 'SP', 'S', 'SP', 'SP', 'S', 'S'], // 9,9
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],       // J,J (no 10s)
    ['SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP'], // A,A
];

const HARD_EUROPEAN: StrategyAction[][] = [
    // 2    3    4    5    6    7    8    9   10    A
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 5
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 6
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 7
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 8
    ['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'], // 9
    ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'], // 10
    ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'], // 11
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

const SOFT_EUROPEAN: StrategyAction[][] = [
    // 2    3    4    5    6    7    8    9   10    A
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // A,2 (13)
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // A,3 (14)
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // A,4 (15)
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // A,5 (16)
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // A,6 (17)
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'H', 'H', 'H'], // A,7 (18)
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // A,8 (19)
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // A,9 (20)
];

const PAIRS_EUROPEAN: StrategyAction[][] = [
    // 2    3    4    5    6    7    8    9   10    A
    ['H', 'H', 'SP', 'SP', 'SP', 'SP', 'H', 'H', 'H', 'H'], // 2,2
    ['H', 'H', 'SP', 'SP', 'SP', 'SP', 'H', 'H', 'H', 'H'], // 3,3
    ['H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H', 'H'], // 4,4
    ['D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'H', 'H'], // 5,5 (Hard 10)
    ['H', 'SP', 'SP', 'SP', 'SP', 'H', 'H', 'H', 'H', 'H'], // 6,6
    ['SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'H', 'H', 'H', 'H'], // 7,7
    ['SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'H', 'H'], // 8,8
    ['SP', 'SP', 'SP', 'SP', 'SP', 'S', 'SP', 'SP', 'S', 'S'], // 9,9
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'], // 10,10
    ['SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'SP', 'H'], // A,A
];

const HARD_UK: StrategyAction[][] = [
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
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
];

const SOFT_UK: StrategyAction[][] = [
    ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'H', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'H', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['H', 'D', 'D', 'D', 'D', 'H', 'H', 'H', 'H', 'H'],
    ['S', 'DS', 'DS', 'DS', 'DS', 'S', 'S', 'H', 'H', 'H'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
    ['S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'S'],
];

const PAIRS_UK: StrategyAction[][] = [
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

export const ACTION_META: Record<AdviceAction, ActionMeta> = {
    H: {
        label: 'HIT',
        shortLabel: 'H',
        color: '#86efac',
        glow: 'rgba(34,197,94,0.35)',
        border: 'rgba(34,197,94,0.4)',
        bg: 'rgba(21,128,61,0.2)',
        desc: 'Draw another card',
        reasoning: (total, isSoft, dealerUp) => isSoft
            ? `Soft ${total} — Current hand is weak, draw to improve`
            : dealerUp === 'A' || ['7', '8', '9', '10'].includes(dealerUp)
                ? `Dealer is strong (${dealerUp}) — Cannot stand on ${total}`
                : `Total of ${total} is not competitive enough`,
    },
    S: {
        label: 'STAND',
        shortLabel: 'S',
        color: '#fca5a5',
        glow: 'rgba(239,68,68,0.35)',
        border: 'rgba(239,68,68,0.4)',
        bg: 'rgba(185,28,28,0.2)',
        desc: 'Keep your hand',
        reasoning: (total, isSoft, dealerUp) => total >= 17
            ? `${total}${isSoft ? ' soft' : ''} — Strong hand, no need to risk drawing more`
            : ['2', '3', '4', '5', '6'].includes(dealerUp)
                ? `Dealer is weak (${dealerUp}) — Let the dealer bust, that's the optimal play`
                : 'High bust risk if you continue drawing',
    },
    D: {
        label: 'DOUBLE DOWN',
        shortLabel: 'D',
        color: '#fcd34d',
        glow: 'rgba(234,179,8,0.35)',
        border: 'rgba(234,179,8,0.45)',
        bg: 'rgba(161,98,7,0.2)',
        desc: 'Double bet, draw 1 card',
        reasoning: (total, _isSoft, dealerUp) => total >= 10 && total <= 11
            ? `${total} — Ideal position to maximise profit`
            : `Dealer is weak (${dealerUp}) and you hold the advantage`,
    },
    DS: {
        label: 'DOUBLE / STAND',
        shortLabel: 'DS',
        color: '#67e8f9',
        glow: 'rgba(6,182,212,0.35)',
        border: 'rgba(6,182,212,0.4)',
        bg: 'rgba(14,116,144,0.2)',
        desc: 'Double if allowed, otherwise Stand',
        reasoning: () => 'Take the Double if you have enough chips; otherwise Standing is still the optimal choice',
    },
    SP: {
        label: 'SPLIT',
        shortLabel: 'SP',
        color: '#93c5fd',
        glow: 'rgba(59,130,246,0.35)',
        border: 'rgba(59,130,246,0.4)',
        bg: 'rgba(29,78,216,0.2)',
        desc: 'Split into 2 independent hands',
        reasoning: (total, _isSoft, dealerUp) => total === 22
            ? 'Pair of Aces — Always split, chance at two Blackjacks'
            : total === 16
                ? 'Pair of 8s — 16 is the worst hand, split to recover'
                : `Dealer is weak (${dealerUp}) — Split to double your advantage`,
    },
    SU: {
        label: 'SURRENDER',
        shortLabel: 'SU',
        color: '#d8b4fe',
        glow: 'rgba(139,92,246,0.35)',
        border: 'rgba(139,92,246,0.4)',
        bg: 'rgba(109,40,217,0.2)',
        desc: 'Forfeit hand, recover 50% of bet',
        reasoning: (total, _isSoft, dealerUp) => `Total ${total} vs Dealer (${dealerUp}) — Win rate < 25%, Surrendering is optimal to minimise losses`,
    },
    RS: {
        label: 'SURRENDER / STAND',
        shortLabel: 'RS',
        color: '#d8b4fe',
        glow: 'rgba(139,92,246,0.35)',
        border: 'rgba(139,92,246,0.4)',
        bg: 'rgba(109,40,217,0.2)',
        desc: 'Surrender if possible, otherwise Stand',
        reasoning: (total, _isSoft, dealerUp) => `Total ${total} vs Dealer (${dealerUp}) — Surrender saves money here, but Stand if Surrender is not available`,
    },
    FD: {
        label: 'FREE ACTION DOUBLE',
        shortLabel: 'FD',
        color: '#facc15',
        glow: 'rgba(250,204,21,0.5)',
        border: 'rgba(250,204,21,0.6)',
        bg: 'rgba(161,98,7,0.3)',
        desc: 'Double with free chips',
        reasoning: (total) => `Hard ${total} — Always take the Free Action Double, it's risk-free profit!`,
    },
    FSP: {
        label: 'FREE ACTION SPLIT',
        shortLabel: 'FSP',
        color: '#facc15',
        glow: 'rgba(250,204,21,0.5)',
        border: 'rgba(250,204,21,0.6)',
        bg: 'rgba(161,98,7,0.3)',
        desc: 'Split hand with free chips',
        reasoning: () => 'Non-10 pair — Always take the Free Action Split, double your chances for free!',
    },
    S4: {
        label: 'STAND (HIT IF 4+ CARDS)',
        shortLabel: 'S4',
        color: '#fca5a5',
        glow: 'rgba(239,68,68,0.35)',
        border: 'rgba(239,68,68,0.4)',
        bg: 'rgba(185,28,28,0.2)',
        desc: 'Stand, but hit if you have 4 or more cards',
        reasoning: () => 'Composition dependent: standing on 14/15 becomes riskier with more small cards.',
    },
    S5: {
        label: 'STAND (HIT IF 5+ CARDS)',
        shortLabel: 'S5',
        color: '#fca5a5',
        glow: 'rgba(239,68,68,0.35)',
        border: 'rgba(239,68,68,0.4)',
        bg: 'rgba(185,28,28,0.2)',
        desc: 'Stand, but hit if you have 5 or more cards',
        reasoning: () => 'Small cards in hand increase the density of high cards in the shoe.',
    },
    S6: {
        label: 'STAND (HIT IF 6+ CARDS)',
        shortLabel: 'S6',
        color: '#fca5a5',
        glow: 'rgba(239,68,68,0.35)',
        border: 'rgba(239,68,68,0.4)',
        bg: 'rgba(185,28,28,0.2)',
        desc: 'Stand, but hit if you have 6 or more cards',
        reasoning: () => 'Standard Spanish 21 rule: 6 cards reduce the stand threshold.',
    },
    PS: {
        label: 'SPLIT (HIT IF SUITED 7S)',
        shortLabel: 'PS',
        color: '#93c5fd',
        glow: 'rgba(59,130,246,0.35)',
        border: 'rgba(59,130,246,0.4)',
        bg: 'rgba(29,78,216,0.2)',
        desc: 'Split, but HIT if you have Suited Sevens',
        reasoning: () => 'Keep suited sevens together for the bonus, otherwise split.',
    },
    D3: {
        label: 'DOUBLE (HIT IF 3+ CARDS)',
        shortLabel: 'D3',
        color: '#fcd34d',
        glow: 'rgba(234,179,8,0.35)',
        border: 'rgba(234,179,8,0.45)',
        bg: 'rgba(161,98,7,0.2)',
        desc: 'Double, but hit if you have 3 or more cards',
        reasoning: () => 'Double flexibility decreases as card count increases.',
    },
    D4: {
        label: 'DOUBLE (HIT IF 4+ CARDS)',
        shortLabel: 'D4',
        color: '#fcd34d',
        glow: 'rgba(234,179,8,0.35)',
        border: 'rgba(234,179,8,0.45)',
        bg: 'rgba(161,98,7,0.2)',
        desc: 'Double, but hit if you have 4 or more cards',
        reasoning: () => 'Double flexibility decreases as card count increases.',
    },
    D5: {
        label: 'DOUBLE (HIT IF 5+ CARDS)',
        shortLabel: 'D5',
        color: '#fcd34d',
        glow: 'rgba(234,179,8,0.35)',
        border: 'rgba(234,179,8,0.45)',
        bg: 'rgba(161,98,7,0.2)',
        desc: 'Double, but hit if you have 5 or more cards',
        reasoning: () => 'Double flexibility decreases as card count increases.',
    },
    D6: {
        label: 'DOUBLE (HIT IF 6+ CARDS)',
        shortLabel: 'D6',
        color: '#fcd34d',
        glow: 'rgba(234,179,8,0.35)',
        border: 'rgba(234,179,8,0.45)',
        bg: 'rgba(161,98,7,0.2)',
        desc: 'Double, but hit if you have 6 or more cards',
        reasoning: () => 'Double flexibility decreases as card count increases.',
    },
    R: {
        label: 'SURRENDER',
        shortLabel: 'R',
        color: '#cbd5e1',
        glow: 'rgba(148,163,184,0.22)',
        border: 'rgba(148,163,184,0.3)',
        bg: 'rgba(148,163,184,0.08)',
        desc: 'Surrender',
        reasoning: () => 'Standard surrender.',
    },
    RH: {
        label: 'SURRENDER / HIT',
        shortLabel: 'RH',
        color: '#d8b4fe',
        glow: 'rgba(139,92,246,0.35)',
        border: 'rgba(139,92,246,0.4)',
        bg: 'rgba(109,40,217,0.2)',
        desc: 'Surrender if allowed, otherwise Hit',
        reasoning: () => 'Surrender is the best option, but hitting is better than standing.',
    },
    INS: {
        label: 'TAKE INSURANCE',
        shortLabel: 'INSURANCE',
        color: '#fcd34d',
        glow: 'rgba(245,158,11,0.35)',
        border: 'rgba(245,158,11,0.45)',
        bg: 'rgba(245,158,11,0.14)',
        desc: 'Side bet at 2:1 against dealer blackjack',
        reasoning: () => 'True count is high enough that Insurance becomes positive expectation.',
    },
    NINS: {
        label: 'DECLINE INSURANCE',
        shortLabel: 'NO INSURANCE',
        color: '#cbd5e1',
        glow: 'rgba(148,163,184,0.22)',
        border: 'rgba(148,163,184,0.3)',
        bg: 'rgba(148,163,184,0.08)',
        desc: 'Keep your edge and avoid a negative side bet',
        reasoning: () => 'True count is below the insurance index, so buying Insurance is mathematically losing.',
    },
};

export const COMPOSITION_DEPENDENT_OVERRIDES: CompositionDependentOverride[] = [
    {
        id: 'IB21-SC-H12-10-2-4',
        roomId: 'iberian_21',
        tab: 'hard',
        playerTotal: 12,
        isSoft: false,
        dealerUpcard: '4',
        isTopOverride: true,
        handPattern: ['2', '10'],
        action: 'S',
        title: '10-value + 2 vs dealer 4',
        trigger: 'Hard 12 made from 10-value + 2 against dealer 4',
        description: 'This exact 12 is a special-case stand in Spanish 21 because the 10-value composition makes hitting less attractive than lower-card versions.',
        summary: 'Stand with 10-value + 2 against dealer 4.',
        source: 'Katarina Walker — The Pro\'s Guide to Spanish 21 and Australian Pontoon',
    },
    {
        id: 'IB21-SC-H12-9-3-4',
        roomId: 'iberian_21',
        tab: 'hard',
        playerTotal: 12,
        isSoft: false,
        dealerUpcard: '4',
        isTopOverride: true,
        handPattern: ['3', '9'],
        action: 'S',
        title: '9 + 3 vs dealer 4',
        trigger: 'Hard 12 made from 9 + 3 against dealer 4',
        description: 'This 12 composition is another stand special case against dealer 4.',
        summary: 'Stand with 9 + 3 against dealer 4.',
        source: 'Katarina Walker — The Pro\'s Guide to Spanish 21 and Australian Pontoon',
    },
    {
        id: 'IB21-SC-H12-8-4-4',
        roomId: 'iberian_21',
        tab: 'hard',
        playerTotal: 12,
        isSoft: false,
        dealerUpcard: '4',
        handPattern: ['4', '8'],
        action: 'H',
        title: '8 + 4 vs dealer 4',
        trigger: 'Hard 12 made from 8 + 4 against dealer 4',
        description: 'This lower-card 12 keeps the standard attacking line and continues to hit.',
        summary: 'Hit with 8 + 4 against dealer 4.',
        source: 'Katarina Walker — The Pro\'s Guide to Spanish 21 and Australian Pontoon',
    },
    {
        id: 'IB21-SC-H12-7-5-4',
        roomId: 'iberian_21',
        tab: 'hard',
        playerTotal: 12,
        isSoft: false,
        dealerUpcard: '4',
        handPattern: ['5', '7'],
        action: 'H',
        title: '7 + 5 vs dealer 4',
        trigger: 'Hard 12 made from 7 + 5 against dealer 4',
        description: 'This lighter 12 continues to hit rather than taking the 10-value stand exceptions.',
        summary: 'Hit with 7 + 5 against dealer 4.',
        source: 'Katarina Walker — The Pro\'s Guide to Spanish 21 and Australian Pontoon',
    },
    {
        id: 'IB21-SC-H13-10-3-6',
        roomId: 'iberian_21',
        tab: 'hard',
        playerTotal: 13,
        isSoft: false,
        dealerUpcard: '6',
        handPattern: ['3', '10'],
        action: 'S',
        title: '10-value + 3 vs dealer 6',
        trigger: 'Hard 13 made from 10-value + 3 against dealer 6',
        description: 'A 10-value heavy 13 can stand here while the lighter 13 compositions still attack.',
        summary: 'Stand with 10-value + 3 against dealer 6.',
        source: 'Katarina Walker — The Pro\'s Guide to Spanish 21 and Australian Pontoon',
    },
    {
        id: 'IB21-SC-H13-9-4-6',
        roomId: 'iberian_21',
        tab: 'hard',
        playerTotal: 13,
        isSoft: false,
        dealerUpcard: '6',
        handPattern: ['4', '9'],
        action: 'S',
        title: '9 + 4 vs dealer 6',
        trigger: 'Hard 13 made from 9 + 4 against dealer 6',
        description: 'This composition-specific 13 also stops against the weak 6.',
        summary: 'Stand with 9 + 4 against dealer 6.',
        source: 'Katarina Walker — The Pro\'s Guide to Spanish 21 and Australian Pontoon',
    },
    {
        id: 'IB21-SC-H13-8-5-6',
        roomId: 'iberian_21',
        tab: 'hard',
        playerTotal: 13,
        isSoft: false,
        dealerUpcard: '6',
        handPattern: ['5', '8'],
        action: 'H',
        title: '8 + 5 vs dealer 6',
        trigger: 'Hard 13 made from 8 + 5 against dealer 6',
        description: 'The lower-card 13 keeps hitting in contrast to the heavier stand compositions.',
        summary: 'Hit with 8 + 5 against dealer 6.',
        source: 'Katarina Walker — The Pro\'s Guide to Spanish 21 and Australian Pontoon',
    },
    {
        id: 'IB21-SC-H13-7-6-6',
        roomId: 'iberian_21',
        tab: 'hard',
        playerTotal: 13,
        isSoft: false,
        dealerUpcard: '6',
        handPattern: ['6', '7'],
        action: 'H',
        title: '7 + 6 vs dealer 6',
        trigger: 'Hard 13 made from 7 + 6 against dealer 6',
        description: 'This composition also stays on the generic hit branch.',
        summary: 'Hit with 7 + 6 against dealer 6.',
        source: 'Katarina Walker — The Pro\'s Guide to Spanish 21 and Australian Pontoon',
    },
    {
        id: 'IB21-TOP-H13-6-7-ANY',
        roomId: 'iberian_21',
        tab: 'hard',
        playerTotal: 13,
        isSoft: false,
        dealerUpcard: '*',
        isTopOverride: true,
        handPattern: ['6', '7'],
        action: 'H',
        title: '6 + 7 vs any dealer',
        trigger: 'Hard 13 made from 6 + 7 against any dealer upcard',
        description: 'This top Walker override keeps hitting against any dealer because the hand is hunting 6-7-8 and related premium 21 routes.',
        summary: 'Hit with 6 + 7 against any dealer.',
        source: 'Katarina Walker — The Pro\'s Guide to Spanish 21 and Australian Pontoon',
    },
    {
        id: 'IB21-SC-H14-10-4-10',
        roomId: 'iberian_21',
        tab: 'hard',
        playerTotal: 14,
        isSoft: false,
        dealerUpcard: '10',
        handPattern: ['4', '10'],
        action: 'S',
        title: '10-value + 4 vs dealer 10',
        trigger: 'Hard 14 made from 10-value + 4 against dealer 10',
        description: 'A signature Spanish 21 stiff-hand stand against a dealer 10.',
        summary: 'Stand with 10-value + 4 against dealer 10.',
        source: 'Katarina Walker — The Pro\'s Guide to Spanish 21 and Australian Pontoon',
    },
    {
        id: 'IB21-SC-H14-9-5-10',
        roomId: 'iberian_21',
        tab: 'hard',
        playerTotal: 14,
        isSoft: false,
        dealerUpcard: '10',
        handPattern: ['5', '9'],
        action: 'H',
        title: '9 + 5 vs dealer 10',
        trigger: 'Hard 14 made from 9 + 5 against dealer 10',
        description: 'This 14 remains a hit; only the 10-value branch stands.',
        summary: 'Hit with 9 + 5 against dealer 10.',
        source: 'Katarina Walker — The Pro\'s Guide to Spanish 21 and Australian Pontoon',
    },
    {
        id: 'IB21-SC-H14-8-6-10',
        roomId: 'iberian_21',
        tab: 'hard',
        playerTotal: 14,
        isSoft: false,
        dealerUpcard: '10',
        handPattern: ['6', '8'],
        action: 'H',
        title: '8 + 6 vs dealer 10',
        trigger: 'Hard 14 made from 8 + 6 against dealer 10',
        description: 'This lower-card 14 continues to hit against dealer 10.',
        summary: 'Hit with 8 + 6 against dealer 10.',
        source: 'Katarina Walker — The Pro\'s Guide to Spanish 21 and Australian Pontoon',
    },
    {
        id: 'IB21-TOP-H14-6-8-ANY',
        roomId: 'iberian_21',
        tab: 'hard',
        playerTotal: 14,
        isSoft: false,
        dealerUpcard: '*',
        isTopOverride: true,
        handPattern: ['6', '8'],
        action: 'H',
        title: '6 + 8 vs any dealer',
        trigger: 'Hard 14 made from 6 + 8 against any dealer upcard',
        description: 'This top Walker override keeps hitting against any dealer to preserve premium 6-7-8 bonus routes.',
        summary: 'Hit with 6 + 8 against any dealer.',
        source: 'Katarina Walker — The Pro\'s Guide to Spanish 21 and Australian Pontoon',
    },
    {
        id: 'IB21-SC-H15-10-5-9',
        roomId: 'iberian_21',
        tab: 'hard',
        playerTotal: 15,
        isSoft: false,
        dealerUpcard: '9',
        isTopOverride: true,
        handPattern: ['5', '10'],
        action: 'S',
        title: '10-value + 5 vs dealer 9',
        trigger: 'Hard 15 made from 10-value + 5 against dealer 9',
        description: 'This exact 15 composition stands instead of following the generic hit line.',
        summary: 'Stand with 10-value + 5 against dealer 9.',
        source: 'Katarina Walker — The Pro\'s Guide to Spanish 21 and Australian Pontoon',
    },
    {
        id: 'IB21-SC-H15-9-6-9',
        roomId: 'iberian_21',
        tab: 'hard',
        playerTotal: 15,
        isSoft: false,
        dealerUpcard: '9',
        handPattern: ['6', '9'],
        action: 'H',
        title: '9 + 6 vs dealer 9',
        trigger: 'Hard 15 made from 9 + 6 against dealer 9',
        description: 'This 15 remains a hit; the stand exception is reserved for the 10-value branch.',
        summary: 'Hit with 9 + 6 against dealer 9.',
        source: 'Katarina Walker — The Pro\'s Guide to Spanish 21 and Australian Pontoon',
    },
    {
        id: 'IB21-SC-H15-8-7-9',
        roomId: 'iberian_21',
        tab: 'hard',
        playerTotal: 15,
        isSoft: false,
        dealerUpcard: '9',
        handPattern: ['7', '8'],
        action: 'H',
        title: '8 + 7 vs dealer 9',
        trigger: 'Hard 15 made from 8 + 7 against dealer 9',
        description: 'This lower-card 15 also stays on the hit side of the split.',
        summary: 'Hit with 8 + 7 against dealer 9.',
        source: 'Katarina Walker — The Pro\'s Guide to Spanish 21 and Australian Pontoon',
    },
    {
        id: 'IB21-TOP-H15-7-8-ANY',
        roomId: 'iberian_21',
        tab: 'hard',
        playerTotal: 15,
        isSoft: false,
        dealerUpcard: '*',
        isTopOverride: true,
        handPattern: ['7', '8'],
        action: 'H',
        title: '7 + 8 vs any dealer',
        trigger: 'Hard 15 made from 7 + 8 against any dealer upcard',
        description: 'This top Walker override keeps hitting against any dealer to chase 7-heavy Spanish 21 bonuses.',
        summary: 'Hit with 7 + 8 against any dealer.',
        source: 'Katarina Walker — The Pro\'s Guide to Spanish 21 and Australian Pontoon',
    },
    {
        id: 'IB21-SC-H16-10-6-10',
        roomId: 'iberian_21',
        tab: 'hard',
        playerTotal: 16,
        isSoft: false,
        dealerUpcard: '10',
        isTopOverride: true,
        handPattern: ['6', '10'],
        action: 'S',
        title: '10-value + 6 vs dealer 10',
        trigger: 'Hard 16 made from 10-value + 6 against dealer 10',
        description: 'The exact 10-value 16 freezes against dealer 10 in the common Spanish 21 ruleset.',
        summary: 'Stand with 10-value + 6 against dealer 10.',
        source: 'Katarina Walker — The Pro\'s Guide to Spanish 21 and Australian Pontoon',
    },
    {
        id: 'IB21-SC-H16-9-7-10',
        roomId: 'iberian_21',
        tab: 'hard',
        playerTotal: 16,
        isSoft: false,
        dealerUpcard: '10',
        handPattern: ['7', '9'],
        action: 'H',
        title: '9 + 7 vs dealer 10',
        trigger: 'Hard 16 made from 9 + 7 against dealer 10',
        description: 'This 16 keeps hitting while the 10-value branch takes the stand exception.',
        summary: 'Hit with 9 + 7 against dealer 10.',
        source: 'Katarina Walker — The Pro\'s Guide to Spanish 21 and Australian Pontoon',
    },
    {
        id: 'IB21-SC-H17-10-7-A',
        roomId: 'iberian_21',
        tab: 'hard',
        playerTotal: 17,
        isSoft: false,
        dealerUpcard: 'A',
        handPattern: ['7', '10'],
        action: 'S',
        title: '10-value + 7 vs dealer A',
        trigger: 'Hard 17 made from 10-value + 7 against dealer A',
        description: 'This 17 stands, unlike more dynamic small-card 17 compositions.',
        summary: 'Stand with 10-value + 7 against dealer A.',
        source: 'Katarina Walker — The Pro\'s Guide to Spanish 21 and Australian Pontoon',
    },
    {
        id: 'IB21-SC-H17-9-8-A',
        roomId: 'iberian_21',
        tab: 'hard',
        playerTotal: 17,
        isSoft: false,
        dealerUpcard: 'A',
        handPattern: ['8', '9'],
        action: 'H',
        title: '9 + 8 vs dealer A',
        trigger: 'Hard 17 made from 9 + 8 against dealer A',
        description: 'One of the best-known Spanish 21 special cases: this 17 keeps hitting against an ace.',
        summary: 'Hit with 9 + 8 against dealer A.',
        source: 'Katarina Walker — The Pro\'s Guide to Spanish 21 and Australian Pontoon',
    },
    {
        id: 'IB21-SC-H17-8-7-2-A',
        roomId: 'iberian_21',
        tab: 'hard',
        playerTotal: 17,
        isSoft: false,
        dealerUpcard: 'A',
        handPattern: ['2', '7', '8'],
        action: 'H',
        title: '8 + 7 + 2 vs dealer A',
        trigger: 'Three-card hard 17 made from 8 + 7 + 2 against dealer A',
        description: 'A small-card 17 remains live enough to hit even though the play looks uncomfortable.',
        summary: 'Hit with 8 + 7 + 2 against dealer A.',
        source: 'Katarina Walker — The Pro\'s Guide to Spanish 21 and Australian Pontoon',
    },
    {
        id: 'IB21-SC-H18-7-6-5-10',
        roomId: 'iberian_21',
        tab: 'hard',
        playerTotal: 18,
        isSoft: false,
        dealerUpcard: '10',
        handPattern: ['5', '6', '7'],
        action: 'H',
        title: '7 + 6 + 5 vs dealer 10',
        trigger: 'Three-card hard 18 made from 7 + 6 + 5 against dealer 10',
        description: 'This 18 stays active because the composition leaves high-value routes open in Spanish 21.',
        summary: 'Hit with 7 + 6 + 5 against dealer 10.',
        source: 'Katarina Walker — The Pro\'s Guide to Spanish 21 and Australian Pontoon',
    },
    {
        id: 'IB21-SC-H18-10-8-10',
        roomId: 'iberian_21',
        tab: 'hard',
        playerTotal: 18,
        isSoft: false,
        dealerUpcard: '10',
        handPattern: ['8', '10'],
        action: 'S',
        title: '10-value + 8 vs dealer 10',
        trigger: 'Hard 18 made from 10-value + 8 against dealer 10',
        description: 'The heavy-card 18 holds its stand against dealer 10.',
        summary: 'Stand with 10-value + 8 against dealer 10.',
        source: 'Katarina Walker — The Pro\'s Guide to Spanish 21 and Australian Pontoon',
    },
    {
        id: 'IB21-SC-H11-6-5-A',
        roomId: 'iberian_21',
        tab: 'hard',
        playerTotal: 11,
        isSoft: false,
        dealerUpcard: 'A',
        isTopOverride: true,
        handPattern: ['5', '6'],
        action: 'D',
        title: '6 + 5 vs dealer A',
        trigger: 'Hard 11 made from 6 + 5 against dealer A',
        description: 'This 11 doubles against an ace in the common Spanish 21 profile.',
        summary: 'Double with 6 + 5 against dealer A.',
        source: 'Katarina Walker — The Pro\'s Guide to Spanish 21 and Australian Pontoon',
    },
    {
        id: 'IB21-SC-H11-7-4-A',
        roomId: 'iberian_21',
        tab: 'hard',
        playerTotal: 11,
        isSoft: false,
        dealerUpcard: 'A',
        isTopOverride: true,
        handPattern: ['4', '7'],
        action: 'D',
        title: '7 + 4 vs dealer A',
        trigger: 'Hard 11 made from 7 + 4 against dealer A',
        description: 'A second key 11-versus-ace double in Spanish 21.',
        summary: 'Double with 7 + 4 against dealer A.',
        source: 'Katarina Walker — The Pro\'s Guide to Spanish 21 and Australian Pontoon',
    },
    {
        id: 'IB21-SC-H11-8-3-A',
        roomId: 'iberian_21',
        tab: 'hard',
        playerTotal: 11,
        isSoft: false,
        dealerUpcard: 'A',
        isTopOverride: true,
        handPattern: ['3', '8'],
        action: 'D',
        title: '8 + 3 vs dealer A',
        trigger: 'Hard 11 made from 8 + 3 against dealer A',
        description: 'This exact 11 composition also doubles against the ace.',
        summary: 'Double with 8 + 3 against dealer A.',
        source: 'Katarina Walker — The Pro\'s Guide to Spanish 21 and Australian Pontoon',
    },
    {
        id: 'IB21-SC-H11-9-2-A',
        roomId: 'iberian_21',
        tab: 'hard',
        playerTotal: 11,
        isSoft: false,
        dealerUpcard: 'A',
        isTopOverride: true,
        handPattern: ['2', '9'],
        action: 'D',
        title: '9 + 2 vs dealer A',
        trigger: 'Hard 11 made from 9 + 2 against dealer A',
        description: 'The highest small-card 11 in this family still doubles against the ace.',
        summary: 'Double with 9 + 2 against dealer A.',
        source: 'Katarina Walker — The Pro\'s Guide to Spanish 21 and Australian Pontoon',
    },
    {
        id: 'IB21-SC-S18-A-4-3-2',
        roomId: 'iberian_21',
        tab: 'soft',
        playerTotal: 18,
        isSoft: true,
        dealerUpcard: '2',
        isTopOverride: true,
        handPattern: ['3', '4', 'A'],
        action: 'H',
        title: 'A + 4 + 3 vs dealer 2',
        trigger: 'Soft 18 made from A + 4 + 3 against dealer 2',
        description: 'This exact soft 18 hits instead of following the generic soft-18 line.',
        summary: 'Hit with A + 4 + 3 against dealer 2.',
        source: 'Katarina Walker — The Pro\'s Guide to Spanish 21 and Australian Pontoon',
    },
    {
        id: 'IB21-SC-S18-A-5-2-2',
        roomId: 'iberian_21',
        tab: 'soft',
        playerTotal: 18,
        isSoft: true,
        dealerUpcard: '2',
        isTopOverride: true,
        handPattern: ['2', '5', 'A'],
        action: 'H',
        title: 'A + 5 + 2 vs dealer 2',
        trigger: 'Soft 18 made from A + 5 + 2 against dealer 2',
        description: 'This soft 18 composition also keeps hitting against dealer 2.',
        summary: 'Hit with A + 5 + 2 against dealer 2.',
        source: 'Katarina Walker — The Pro\'s Guide to Spanish 21 and Australian Pontoon',
    },
    {
        id: 'IB21-SC-S18-A-6-A-2',
        roomId: 'iberian_21',
        tab: 'soft',
        playerTotal: 18,
        isSoft: true,
        dealerUpcard: '2',
        handPattern: ['6', 'A', 'A'],
        action: 'D',
        title: 'A + 6 + A vs dealer 2',
        trigger: 'Soft 18 made from A + 6 + A against dealer 2',
        description: 'This ace-rich soft 18 keeps the double.',
        summary: 'Double with A + 6 + A against dealer 2.',
        source: 'Katarina Walker — The Pro\'s Guide to Spanish 21 and Australian Pontoon',
    },
    {
        id: 'IB21-SC-P77-8',
        roomId: 'iberian_21',
        tab: 'pairs',
        playerTotal: 14,
        isSoft: false,
        dealerUpcard: '8',
        handPattern: ['7', '7'],
        action: 'SP',
        title: '7,7 vs dealer 8',
        trigger: 'Pair of 7s against dealer 8',
        description: 'A signature Spanish 21 pair special case because splitting opens bonus-heavy routes.',
        summary: 'Split 7,7 against dealer 8.',
        source: 'Katarina Walker — The Pro\'s Guide to Spanish 21 and Australian Pontoon',
    },
    {
        id: 'IB21-SC-P77-9',
        roomId: 'iberian_21',
        tab: 'pairs',
        playerTotal: 14,
        isSoft: false,
        dealerUpcard: '9',
        handPattern: ['7', '7'],
        action: 'SP',
        title: '7,7 vs dealer 9',
        trigger: 'Pair of 7s against dealer 9',
        description: 'This special-case split keeps the premium 7-based upside alive.',
        summary: 'Split 7,7 against dealer 9.',
        source: 'Katarina Walker — The Pro\'s Guide to Spanish 21 and Australian Pontoon',
    },
    {
        id: 'IB21-SC-P77-10',
        roomId: 'iberian_21',
        tab: 'pairs',
        playerTotal: 14,
        isSoft: false,
        dealerUpcard: '10',
        handPattern: ['7', '7'],
        action: 'SP',
        title: '7,7 vs dealer 10',
        trigger: 'Pair of 7s against dealer 10',
        description: 'In this common no-redouble Spanish 21 profile, 7,7 remains a split special case even against dealer 10.',
        summary: 'Split 7,7 against dealer 10.',
        source: 'Katarina Walker — The Pro\'s Guide to Spanish 21 and Australian Pontoon',
    },
    {
        id: 'IB21-TOP-P77-ANY',
        roomId: 'iberian_21',
        tab: 'pairs',
        playerTotal: 14,
        isSoft: false,
        dealerUpcard: '*',
        handPattern: ['7', '7'],
        action: 'H',
        title: '7,7 vs any dealer',
        trigger: 'Pair of 7s against any dealer upcard',
        description: 'This top Walker override keeps 7,7 together and hits to hunt premium 7-7-7 bonus outcomes.',
        summary: 'Hit with 7,7 against any dealer.',
        source: 'Katarina Walker — The Pro\'s Guide to Spanish 21 and Australian Pontoon',
    },
    {
        id: 'IB21-SC-P66-4',
        roomId: 'iberian_21',
        tab: 'pairs',
        playerTotal: 12,
        isSoft: false,
        dealerUpcard: '4',
        handPattern: ['6', '6'],
        action: 'SP',
        title: '6,6 vs dealer 4',
        trigger: 'Pair of 6s against dealer 4',
        description: 'This pair split is already supported by the room rules and remains part of the special-case reference set.',
        summary: 'Split 6,6 against dealer 4.',
        source: 'Katarina Walker — The Pro\'s Guide to Spanish 21 and Australian Pontoon',
    },
    {
        id: 'IB21-SC-P88-10',
        roomId: 'iberian_21',
        tab: 'pairs',
        playerTotal: 16,
        isSoft: false,
        dealerUpcard: '10',
        handPattern: ['8', '8'],
        action: 'SP',
        title: '8,8 vs dealer 10',
        trigger: 'Pair of 8s against dealer 10',
        description: 'This hand already splits on the base chart, but it remains a premium Spanish 21 special-case reminder.',
        summary: 'Split 8,8 against dealer 10.',
        source: 'Katarina Walker — The Pro\'s Guide to Spanish 21 and Australian Pontoon',
    },
    {
        id: 'IB21-SC-P99-10',
        roomId: 'iberian_21',
        tab: 'pairs',
        playerTotal: 18,
        isSoft: false,
        dealerUpcard: '10',
        handPattern: ['9', '9'],
        action: 'SP',
        title: '9,9 vs dealer 10',
        trigger: 'Pair of 9s against dealer 10',
        description: 'A notable Spanish 21 pair split that breaks away from the conservative stand instinct.',
        summary: 'Split 9,9 against dealer 10.',
        source: 'Katarina Walker — The Pro\'s Guide to Spanish 21 and Australian Pontoon',
    },
];

export function normRank(rank: string): string {
    if (rank === 'ACE') return 'A';
    if (['JACK', 'QUEEN', 'KING'].includes(rank)) return '10';
    return rank;
}

function getHandPattern(cards: Card[]): string[] {
    return cards
        .map((card) => normRank(card.rank))
        .sort((left, right) => {
            const leftValue = left === 'A' ? 11 : Number(left);
            const rightValue = right === 'A' ? 11 : Number(right);
            return leftValue - rightValue || left.localeCompare(right);
        });
}

function getDealerIdx(rank: string): number {
    return DEALER_UPCARDS.indexOf(normRank(rank) as (typeof DEALER_UPCARDS)[number]);
}

function getPairRowIdx(cards: Card[]): number {
    if (cards.length !== 2) return -1;

    const isPair = cards[0].value === cards[1].value;

    if (!isPair) return -1;

    const rank = normRank(cards[0].rank);
    return PAIR_ROWS.indexOf(rank as (typeof PAIR_ROWS)[number]);
}

export function getStrategyTables(strategyType: string) {
    if (strategyType === 'free_action') {
        return { hard: HARD_FA, soft: SOFT_FA, pairs: PAIRS_FA };
    }

    if (strategyType === 'iberian_21') {
        return { hard: HARD_IBERIAN, soft: SOFT_IBERIAN, pairs: PAIRS_IBERIAN };
    }

    if (strategyType === 'atlantic_city') {
        return { hard: HARD_AC, soft: SOFT_AC, pairs: PAIRS_TABLE };
    }

    if (strategyType === 'vegas_strip') {
        return { hard: HARD_VEGAS, soft: SOFT_VEGAS, pairs: PAIRS_TABLE };
    }

    if (strategyType === 'vegas_downtown') {
        return { hard: HARD_DOWNTOWN, soft: SOFT_DOWNTOWN, pairs: PAIRS_TABLE };
    }

    if (strategyType === 'european') {
        return { hard: HARD_EUROPEAN, soft: SOFT_EUROPEAN, pairs: PAIRS_EUROPEAN };
    }

    if (strategyType === 'uk') {
        return { hard: HARD_UK, soft: SOFT_UK, pairs: PAIRS_UK };
    }

    return { hard: HARD_CLASSIC, soft: SOFT_CLASSIC, pairs: PAIRS_TABLE };
}

export function getCompositionDependentOverride(
    cards: Card[],
    total: number,
    isSoft: boolean,
    dealerUpRank: string,
    roomId: string,
): CompositionDependentOverride | null {
    const dealerUpcard = normRank(dealerUpRank);
    const handPattern = getHandPattern(cards);
    const matches: CompositionDependentOverride[] = [];

    for (const override of COMPOSITION_DEPENDENT_OVERRIDES) {
        if (override.roomId !== roomId) continue;
        if (override.playerTotal !== total) continue;
        if (override.isSoft !== isSoft) continue;
        if (override.dealerUpcard !== dealerUpcard && override.dealerUpcard !== '*') continue;
        if (override.handPattern) {
            if (override.handPattern.length !== handPattern.length) continue;
            if (!override.handPattern.every((rank, index) => rank === handPattern[index])) continue;
        }
        if (override.minCardCount !== undefined && cards.length < override.minCardCount) continue;
        if (override.maxCardCount !== undefined && cards.length > override.maxCardCount) continue;

        matches.push(override);
    }

    if (matches.length === 0) return null;

    matches.sort((left, right) => {
        const topDelta = Number(Boolean(right.isTopOverride)) - Number(Boolean(left.isTopOverride));
        if (topDelta !== 0) return topDelta;

        const exactDealerDelta = Number(right.dealerUpcard !== '*') - Number(left.dealerUpcard !== '*');
        if (exactDealerDelta !== 0) return exactDealerDelta;

        const patternLengthDelta = (right.handPattern?.length ?? 0) - (left.handPattern?.length ?? 0);
        if (patternLengthDelta !== 0) return patternLengthDelta;

        return left.id.localeCompare(right.id);
    });

    return matches[0] ?? null;
}

export function getStrategyAction(
    cards: Card[],
    total: number,
    isSoft: boolean,
    dealerUpRank: string,
    strategyType: string,
    canDouble: boolean,
    canSplit: boolean,
    canSurrender: boolean,
    resolveOptions: { resolveConditions?: boolean } = { resolveConditions: true }
): StrategyAction {
    const dealerIndex = getDealerIdx(dealerUpRank);
    if (dealerIndex < 0) return 'H';

    const tables = getStrategyTables(strategyType);
    let action: StrategyAction;

    const pairIndex = getPairRowIdx(cards);
    if (pairIndex >= 0) {
        action = tables.pairs[pairIndex][dealerIndex];
        if ((action === 'SP' || action === 'FSP') && !canSplit) {
            const isAces = cards.length === 2 && cards[0].rank === cards[1].rank && cards[0].rank.includes('A');
            if (isAces) {
                // Soft 12 (A,A) should always hit if it cannot be split
                action = 'H';
            } else {
                const clampedTotal = Math.min(Math.max(total, 5), 20);
                action = tables.hard[clampedTotal - 5]?.[dealerIndex] ?? 'H';
            }
        }
    } else if (isSoft && total >= 13 && total <= 20) {
        action = tables.soft[total - 13]?.[dealerIndex] ?? 'H';
    } else {
        const clampedTotal = Math.min(Math.max(total, 5), 20);
        action = tables.hard[clampedTotal - 5]?.[dealerIndex] ?? (total >= 17 ? 'S' : 'H');
    }

    if ((action === 'D' || action === 'FD') && !canDouble) {
        action = 'H';
    }

    if (resolveOptions.resolveConditions) {
        if (action === 'DS') {
            action = canDouble ? 'D' : 'S';
        }

        if (action === 'S4' || action === 'S5' || action === 'S6') {
            const threshold = action === 'S4' ? 4 : action === 'S5' ? 5 : 6;
            // Iberian 21: Stand if little cards, Hit if many cards (hunt bonus)
            action = cards.length >= threshold ? 'H' : 'S';
        }

        if (action === 'D3' || action === 'D4' || action === 'D5' || action === 'D6') {
            const threshold = action === 'D3' ? 3 : action === 'D4' ? 4 : action === 'D5' ? 5 : 6;
            if (cards.length >= threshold) {
                action = 'H';
            } else {
                action = canDouble ? 'D' : 'H';
            }
        }

        if (action === 'RH') {
            action = canSurrender ? 'SU' : 'H';
        }

        if (action === 'PS') {
            const isSuitedSevens = cards.length === 2 && 
                                  cards[0].rank === cards[1].rank && 
                                  cards[0].rank === '7' && 
                                  cards[0].suit === cards[1].suit;
            if (isSuitedSevens) {
                action = 'H';
            } else {
                action = canSplit ? 'SP' : 'H';
            }
        }

        if (action === 'SU' && !canSurrender) {
            action = 'H';
        }
    }

    return action;
}

export function computeBustStats(cards: Card[], shoe: Card[]) {
    if (!shoe.length) {
        return { bustPct: 0, improvePct: 100, bustCount: 0, safeCount: 0, total: 0 };
    }

    let bustCount = 0;
    for (const card of shoe) {
        if (calculateHandValue([...cards, card]).total > 21) {
            bustCount++;
        }
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