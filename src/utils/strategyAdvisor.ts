// ============================================
// Strategy Advisor — lookup + resolution logic
// Static tables and types live in strategyTables.ts
// ============================================

import { Card } from '@/types/game';
import { calculateHandValue } from '@/utils/hand';
import { buildExchange21Advice } from './exchangeSwitchAdvice';
import type { ExchangeAdvice, SwitchAdviceEngine } from './exchangeSwitchAdvice';
import {
    StrategyAction, AdviceAction, CompositionDependentOverride, ActionMeta,
    HARD_CLASSIC, HARD_DOWNTOWN, HARD_FA, HARD_AC,
    HARD_IBERIAN, HARD_EUROPEAN, HARD_UK, HARD_ZAPOUT, HARD_EXCHANGE,
    HARD_FIRECARD, HARD_VEGAS,
    SOFT_CLASSIC, SOFT_DOWNTOWN, SOFT_FA, SOFT_AC,
    SOFT_IBERIAN, SOFT_EUROPEAN, SOFT_UK, SOFT_VEGAS, SOFT_ZAPOUT,
    SOFT_EXCHANGE, SOFT_FIRECARD,
    PAIRS_TABLE, PAIRS_FA, PAIRS_IBERIAN, PAIRS_EUROPEAN,
    PAIRS_UK, PAIRS_ZAPOUT, PAIRS_EXCHANGE, PAIRS_FIRECARD,
    DEALER_UPCARDS, PAIR_ROWS,
    ACTION_META, COMPOSITION_DEPENDENT_OVERRIDES
} from './strategyTables';
export type { StrategyAction, AdviceAction, CompositionDependentOverride, ActionMeta };
export { ACTION_META, COMPOSITION_DEPENDENT_OVERRIDES };
export type { ExchangeAdvice, SwitchAdviceEngine };




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

export interface StrategyTables {
    hard: StrategyAction[][];
    soft: StrategyAction[][];
    pairs: StrategyAction[][];
    free_hand?: {
        hard: StrategyAction[][];
        soft: StrategyAction[][];
    };
}

const STRATEGY_MAP: Record<string, StrategyTables> = {
    'free_action': { 
        hard: HARD_FA, 
        soft: SOFT_FA, 
        pairs: PAIRS_FA,
        free_hand: { hard: HARD_FA_FREE, soft: SOFT_FA_FREE }
    },
    'iberian_21': { hard: HARD_IBERIAN, soft: SOFT_IBERIAN, pairs: PAIRS_IBERIAN },
    'atlantic_city': { hard: HARD_AC, soft: SOFT_AC, pairs: PAIRS_TABLE },
    'vegas_strip': { hard: HARD_VEGAS, soft: SOFT_VEGAS, pairs: PAIRS_TABLE },
    'vegas_downtown': { hard: HARD_DOWNTOWN, soft: SOFT_DOWNTOWN, pairs: PAIRS_TABLE },
    'european': { hard: HARD_EUROPEAN, soft: SOFT_EUROPEAN, pairs: PAIRS_EUROPEAN },
    'uk': { hard: HARD_UK, soft: SOFT_UK, pairs: PAIRS_UK },
    'zapout_21': { hard: HARD_ZAPOUT, soft: SOFT_ZAPOUT, pairs: PAIRS_ZAPOUT },
    'exchange_21': { hard: HARD_EXCHANGE, soft: SOFT_EXCHANGE, pairs: PAIRS_EXCHANGE },
    'firecard_21': { hard: HARD_FIRECARD, soft: SOFT_FIRECARD, pairs: PAIRS_FIRECARD },
    'classic': { hard: HARD_CLASSIC, soft: SOFT_CLASSIC, pairs: PAIRS_TABLE },
    'standard': { hard: HARD_CLASSIC, soft: SOFT_CLASSIC, pairs: PAIRS_TABLE },
};

export function getStrategyTables(strategyType: string): StrategyTables {
    return STRATEGY_MAP[strategyType] || STRATEGY_MAP['classic'];
}

export function getCompositionDependentOverride(
    cards: Card[],
    total: number,
    isSoft: boolean,
    dealerUpRank: string,
    strategyType: string,
): CompositionDependentOverride | null {
    const dealerUpcard = normRank(dealerUpRank);
    const handPattern = getHandPattern(cards);
    const matches: CompositionDependentOverride[] = [];

    for (const override of COMPOSITION_DEPENDENT_OVERRIDES) {
        if (override.strategyType !== strategyType) continue;
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
    resolveOptions: { resolveConditions?: boolean, canZap?: boolean, canBurn?: boolean } = { resolveConditions: true, canZap: false, canBurn: false }
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
        if (action === 'Z' && !resolveOptions.canZap) {
            if (total === 15 || total === 16) {
                // Stand vs 2-6, Hit vs 7-A
                action = dealerIndex <= 4 ? 'S' : 'H';
            } else if (total === 17 || total === 18) {
                action = 'S';
            } else {
                action = 'H';
            }
        }

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

        // 'B' = Burn Card. If burn is not available (e.g. after a split), fall back to hard-table logic.
        if (action === 'B' && !resolveOptions.canBurn) {
            const clampedTotal = Math.min(Math.max(total, 5), 20);
            const tables = getStrategyTables(strategyType);
            action = (tables.hard[clampedTotal - 5]?.[getDealerIdx(dealerUpRank)] ?? (total >= 17 ? 'S' : 'H')) as StrategyAction;
            // If the fallback hard-table action is also 'B', default to H
            if (action === 'B') action = 'H';
        }
    }

    return action;
}

// Very basic Expected Value estimator used ONLY for Exchange 21 Switch advice.
// Real EV spreadsheets are massive matrices, so this uses rough approximations based purely on the player's best assumed action vs dealer upcard.
export function getHandEV(cards: Card[], dealerUpcard: string, isSwitched = false, strategyType = 'classic'): number {
    const value = calculateHandValue(cards);
    if (value.total > 21) return -1.0; // Bust
    if (value.total === 21 && cards.length === 2) return isSwitched ? 1.0 : 1.5; // Natural BJ
    
    const pTotal = value.total;
    const isSoft = value.isSoft;
    const dUpStr = normRank(dealerUpcard);

    // getStrategyAction signature: cards, total, isSoft, dealerUpRank, strategyType, canDouble, canSplit, canSurrender, resolveOptions
    const action = getStrategyAction(
        cards, 
        pTotal,
        isSoft, 
        dUpStr, 
        strategyType, 
        true, // canDouble (assume true for pure strength EV)
        cards.length === 2 && cards[0].rank === cards[1].rank, // canSplit
        true  // canSurrender
    );
    const dUp = ['10', 'J', 'Q', 'K'].includes(dealerUpcard) ? 10 : dealerUpcard === 'A' ? 11 : parseInt(dealerUpcard);

    // Extremely simplified EV grid just to compare hand strength.
    let ev = 0;

    if (action === 'S') {
        if (pTotal >= 19) ev = 0.5;
        else if (pTotal === 18) {
            ev = dUp >= 9 ? -0.2 : 0.2;
        }
        else if (pTotal === 17) {
            ev = dUp >= 8 ? -0.4 : -0.1;
        }
        else { // 12-16 standing
            if (dUp >= 7) ev = -0.6; // Terrible stands
            else ev = -0.2; // Standing vs bust card
        }
    } else if (action === 'H') {
        if (pTotal <= 11) ev = 0.2 + (11 - pTotal) * 0.05; // 11 is good, 5 is okayish
        else if (pTotal >= 12) ev = -0.4; // Hitting stiffs is bad EV in general
    } else if (action === 'D' || action === 'DS') {
        if (pTotal === 11) ev = dUp === 11 ? 0.1 : 0.6;
        else if (pTotal === 10) ev = dUp >= 10 ? -0.1 : 0.5;
        else if (pTotal === 9) ev = dUp >= 7 ? -0.2 : 0.3;
        else ev = 0.1; // Soft doubles
    } else if (action === 'SP' && cards.length === 2 && cards[0].rank === cards[1].rank) {
        const rankStr = cards[0].rank as string;
        if (rankStr === 'A' || rankStr === '8') ev = 0.4;
        else if (['10', 'J', 'Q', 'K'].includes(rankStr as string)) ev = 0.5; // Actually 20, shouldn't split but if logic said so
        else ev = -0.1; // Small pairs
    } else if (action === 'SU' || action === 'RS') {
        ev = -0.5;
    }

    return ev;
}

export function getExchange21Advice(
    hand1: Card[],
    hand2: Card[],
    dealerUpcard: string,
    engine: SwitchAdviceEngine = 'cindy_advanced',
): ExchangeAdvice | null {
    return buildExchange21Advice({
        hand1,
        hand2,
        dealerUpcard,
        engine,
        getHandEV,
        normalizeRank: normRank,
    });
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