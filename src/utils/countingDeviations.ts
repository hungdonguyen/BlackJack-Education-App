// ============================================
// Card Counting Deviations — Illustrious 18 + Fab 4
// Hi-Lo true count indices for playing deviations
// ============================================
//
// Two tables: S17 (dealer stands on soft 17) and H17 (dealer hits soft 17).
// Multi-deck S17 indices are identical across 4/6/8 decks.
// H17 changes 4 indices: 11vA, 10vA, 12v6, TT v6.
//
// Source: Don Schlesinger "Blackjack Attack" — Illustrious 18 & Fab 4.
// Source: Katarina Walker "The Pro's Guide to Spanish 21" — Walker Indices.

import { CountingSystem } from './cardCounting';

export type DeviationAction = 'H' | 'S' | 'D' | 'SP' | 'SU';

export interface Deviation {
    /** Illustrious 18 rank (1-18) or Fab 4 rank (F1-F4) */
    id: string;
    /** Player hard/soft total (0 for insurance, pair total for splits) */
    playerTotal: number;
    isSoft: boolean;
    isPair: boolean;
    /** Dealer upcard: '2'-'10', 'A' */
    dealerUpcard: string;
    /** True count threshold */
    index: number;
    /** Action to take when deviation fires */
    deviationAction: DeviationAction;
    /** What basic strategy normally says */
    basicAction: DeviationAction;
    /** 'gte' = deviate when TC >= index; 'lt' = deviate when TC < index */
    direction: 'gte' | 'lt';
    /** Human-readable description */
    description: string;
}

// ─── Illustrious 18 — S17 (Dealer Stands on Soft 17) ──────────────────────

export const I18_S17: Deviation[] = [
    // Insurance is handled separately (not a hand play), but included for completeness
    { id: 'I18-1',  playerTotal: 0,  isSoft: false, isPair: false, dealerUpcard: 'A',  index: 3,  deviationAction: 'S', basicAction: 'H', direction: 'gte', description: 'Take Insurance when TC ≥ +3' },
    { id: 'I18-2',  playerTotal: 16, isSoft: false, isPair: false, dealerUpcard: '10', index: 0,  deviationAction: 'S', basicAction: 'H', direction: 'gte', description: 'Stand on 16 vs 10 (instead of Hit)' },
    { id: 'I18-3',  playerTotal: 15, isSoft: false, isPair: false, dealerUpcard: '10', index: 4,  deviationAction: 'S', basicAction: 'H', direction: 'gte', description: 'Stand on 15 vs 10 (instead of Hit)' },
    { id: 'I18-4',  playerTotal: 20, isSoft: false, isPair: true,  dealerUpcard: '5',  index: 5,  deviationAction: 'SP', basicAction: 'S', direction: 'gte', description: 'Split 10,10 vs 5 (instead of Stand)' },
    { id: 'I18-5',  playerTotal: 20, isSoft: false, isPair: true,  dealerUpcard: '6',  index: 5,  deviationAction: 'SP', basicAction: 'S', direction: 'gte', description: 'Split 10,10 vs 6 (instead of Stand)' },
    { id: 'I18-6',  playerTotal: 10, isSoft: false, isPair: false, dealerUpcard: '10', index: 4,  deviationAction: 'D', basicAction: 'H', direction: 'gte', description: 'Double 10 vs 10 (instead of Hit)' },
    { id: 'I18-7',  playerTotal: 12, isSoft: false, isPair: false, dealerUpcard: '3',  index: 2,  deviationAction: 'S', basicAction: 'H', direction: 'gte', description: 'Stand on 12 vs 3 (instead of Hit)' },
    { id: 'I18-8',  playerTotal: 12, isSoft: false, isPair: false, dealerUpcard: '2',  index: 4,  deviationAction: 'S', basicAction: 'H', direction: 'gte', description: 'Stand on 12 vs 2 (instead of Hit)' },
    { id: 'I18-9',  playerTotal: 11, isSoft: false, isPair: false, dealerUpcard: 'A',  index: 1,  deviationAction: 'D', basicAction: 'H', direction: 'gte', description: 'Double 11 vs A (instead of Hit)' },
    { id: 'I18-10', playerTotal: 9,  isSoft: false, isPair: false, dealerUpcard: '2',  index: 1,  deviationAction: 'D', basicAction: 'H', direction: 'gte', description: 'Double 9 vs 2 (instead of Hit)' },
    { id: 'I18-11', playerTotal: 10, isSoft: false, isPair: false, dealerUpcard: 'A',  index: 4,  deviationAction: 'D', basicAction: 'H', direction: 'gte', description: 'Double 10 vs A (instead of Hit)' },
    { id: 'I18-12', playerTotal: 9,  isSoft: false, isPair: false, dealerUpcard: '7',  index: 4,  deviationAction: 'D', basicAction: 'H', direction: 'gte', description: 'Double 9 vs 7 (instead of Hit)' },
    { id: 'I18-13', playerTotal: 16, isSoft: false, isPair: false, dealerUpcard: '9',  index: 5,  deviationAction: 'S', basicAction: 'H', direction: 'gte', description: 'Stand on 16 vs 9 (instead of Hit)' },
    { id: 'I18-14', playerTotal: 13, isSoft: false, isPair: false, dealerUpcard: '2',  index: -1, deviationAction: 'H', basicAction: 'S', direction: 'lt',  description: 'Hit 13 vs 2 (instead of Stand)' },
    { id: 'I18-15', playerTotal: 12, isSoft: false, isPair: false, dealerUpcard: '4',  index: 0,  deviationAction: 'H', basicAction: 'S', direction: 'lt',  description: 'Hit 12 vs 4 (instead of Stand)' },
    { id: 'I18-16', playerTotal: 12, isSoft: false, isPair: false, dealerUpcard: '5',  index: -2, deviationAction: 'H', basicAction: 'S', direction: 'lt',  description: 'Hit 12 vs 5 (instead of Stand)' },
    { id: 'I18-17', playerTotal: 12, isSoft: false, isPair: false, dealerUpcard: '6',  index: -1, deviationAction: 'H', basicAction: 'S', direction: 'lt',  description: 'Hit 12 vs 6 (instead of Stand)' },
    { id: 'I18-18', playerTotal: 13, isSoft: false, isPair: false, dealerUpcard: '3',  index: -2, deviationAction: 'H', basicAction: 'S', direction: 'lt',  description: 'Hit 13 vs 3 (instead of Stand)' },
];

// ─── Illustrious 18 — H17 (Dealer Hits Soft 17) ───────────────────────────
// Only 4 indices differ from S17; the rest are identical.

export const I18_H17: Deviation[] = I18_S17.map((d) => {
    switch (d.id) {
        case 'I18-5':  // 10,10 vs 6: S17 +5 → H17 +4
            return { ...d, index: 4 };
        case 'I18-9':  // 11 vs A: S17 +1 → H17 -1
            return { ...d, index: -1 };
        case 'I18-11': // 10 vs A: S17 +4 → H17 +3
            return { ...d, index: 3 };
        case 'I18-17': // 12 vs 6: S17 -1 → H17 -3
            return { ...d, index: -3 };
        default:
            return d;
    }
});

// ─── Fab 4 Surrender Deviations ────────────────────────────────────────────
// These apply regardless of S17/H17 since they concern hard totals vs high upcards.

export const FAB_4: Deviation[] = [
    { id: 'F4-1', playerTotal: 14, isSoft: false, isPair: false, dealerUpcard: '10', index: 3,  deviationAction: 'SU', basicAction: 'H', direction: 'gte', description: 'Surrender 14 vs 10 (instead of Hit)' },
    { id: 'F4-2', playerTotal: 15, isSoft: false, isPair: false, dealerUpcard: '10', index: 0,  deviationAction: 'SU', basicAction: 'H', direction: 'gte', description: 'Surrender 15 vs 10 (instead of Hit)' },
    { id: 'F4-3', playerTotal: 15, isSoft: false, isPair: false, dealerUpcard: '9',  index: 2,  deviationAction: 'SU', basicAction: 'H', direction: 'gte', description: 'Surrender 15 vs 9 (instead of Hit)' },
    { id: 'F4-4', playerTotal: 15, isSoft: false, isPair: false, dealerUpcard: 'A',  index: 1,  deviationAction: 'SU', basicAction: 'H', direction: 'gte', description: 'Surrender 15 vs A (instead of Hit)' },
];

export const I18_UK: Deviation[] = [...I18_S17, ...FAB_4];

export const I18_EUROPEAN: Deviation[] = [
    // Standard stand/hit deviations from I18 S17 (excluding doubles against 10/A)
    ...I18_S17.filter(d => !['I18-6', 'I18-9', 'I18-11'].includes(d.id)),
    // High-count conservative doubles for Strict ENHC
    { id: 'E18-6',  playerTotal: 10, isSoft: false, isPair: false, dealerUpcard: '10', index: 4,  deviationAction: 'D', basicAction: 'H', direction: 'gte', description: 'Double 10 vs 10 only if TC ≥ +4' },
    { id: 'E18-9',  playerTotal: 11, isSoft: false, isPair: false, dealerUpcard: 'A',  index: 10, deviationAction: 'D', basicAction: 'H', direction: 'gte', description: 'Double 11 vs A only if TC ≥ +10' },
    { id: 'E18-11', playerTotal: 10, isSoft: false, isPair: false, dealerUpcard: 'A',  index: 10, deviationAction: 'D', basicAction: 'H', direction: 'gte', description: 'Double 10 vs A only if TC ≥ +10' },
    // Strict ENHC specialized doubles
    { id: 'E18-19', playerTotal: 11, isSoft: false, isPair: false, dealerUpcard: '10', index: 1,  deviationAction: 'D', basicAction: 'H', direction: 'gte', description: 'Double 11 vs 10 only if TC ≥ +1' },
    // Strict ENHC Pair Splits (High count required to risk total loss)
    { id: 'E18-20', playerTotal: 16, isSoft: false, isPair: true,  dealerUpcard: '10', index: 6,  deviationAction: 'SP', basicAction: 'H', direction: 'gte', description: 'Split 8,8 vs 10 only if TC ≥ +6' },
    { id: 'E18-21', playerTotal: 16, isSoft: false, isPair: true,  dealerUpcard: 'A',  index: 8,  deviationAction: 'SP', basicAction: 'H', direction: 'gte', description: 'Split 8,8 vs A only if TC ≥ +8' },
    { id: 'E18-22', playerTotal: 2,  isSoft: false, isPair: true,  dealerUpcard: 'A',  index: 1,  deviationAction: 'SP', basicAction: 'H', direction: 'gte', description: 'Split A,A vs A only if TC ≥ +1' },
];

// ─── Iberian 21 (Spanish 21) Deviations ────────────────────────────────────

export const IBERIAN_HILO: Deviation[] = [
    { id: 'I21-H1', playerTotal: 0,  isSoft: false, isPair: false, dealerUpcard: 'A',  index: 7,  deviationAction: 'S', basicAction: 'H', direction: 'gte', description: 'Take Insurance when TC ≥ +7' },
    { id: 'I21-H2', playerTotal: 12, isSoft: false, isPair: false, dealerUpcard: '4',  index: 2,  deviationAction: 'S', basicAction: 'H', direction: 'gte', description: 'Stand on 12 vs 4 (instead of Hit)' },
    { id: 'I21-H3', playerTotal: 12, isSoft: false, isPair: false, dealerUpcard: '5',  index: 1,  deviationAction: 'S', basicAction: 'H', direction: 'gte', description: 'Stand on 12 vs 5 (instead of Hit)' },
    { id: 'I21-H4', playerTotal: 12, isSoft: false, isPair: false, dealerUpcard: '6',  index: 0,  deviationAction: 'S', basicAction: 'H', direction: 'gte', description: 'Stand on 12 vs 6 (instead of Hit)' },
    { id: 'I21-H5', playerTotal: 13, isSoft: false, isPair: false, dealerUpcard: '2',  index: 0,  deviationAction: 'S', basicAction: 'H', direction: 'gte', description: 'Stand on 13 vs 2 (instead of Hit)' },
    { id: 'I21-H6', playerTotal: 13, isSoft: false, isPair: false, dealerUpcard: '3',  index: -1, deviationAction: 'S', basicAction: 'H', direction: 'gte', description: 'Stand on 13 vs 3 (instead of Hit)' },
];

export const IBERIAN_WALKER: Deviation[] = [
    { id: 'I21-W1', playerTotal: 0,  isSoft: false, isPair: false, dealerUpcard: 'A',  index: 7,  deviationAction: 'S', basicAction: 'H', direction: 'gte', description: 'Take Insurance when TC ≥ +7' },
    { id: 'I21-W2', playerTotal: 12, isSoft: false, isPair: false, dealerUpcard: '4',  index: 3,  deviationAction: 'S', basicAction: 'H', direction: 'gte', description: 'Stand on 12 vs 4 (instead of Hit)' },
    { id: 'I21-W3', playerTotal: 12, isSoft: false, isPair: false, dealerUpcard: '5',  index: 1,  deviationAction: 'S', basicAction: 'H', direction: 'gte', description: 'Stand on 12 vs 5 (instead of Hit)' },
    { id: 'I21-W4', playerTotal: 12, isSoft: false, isPair: false, dealerUpcard: '6',  index: 0,  deviationAction: 'S', basicAction: 'H', direction: 'gte', description: 'Stand on 12 vs 6 (instead of Hit)' },
    { id: 'I21-W5', playerTotal: 13, isSoft: false, isPair: false, dealerUpcard: '2',  index: 0,  deviationAction: 'S', basicAction: 'H', direction: 'gte', description: 'Stand on 13 vs 2 (instead of Hit)' },
    { id: 'I21-W6', playerTotal: 13, isSoft: false, isPair: false, dealerUpcard: '3',  index: -1, deviationAction: 'S', basicAction: 'H', direction: 'gte', description: 'Stand on 13 vs 3 (instead of Hit)' },
];

// ─── Push 22 (Free Bet Blackjack) Deviations ───────────────────────────────
// Specialized for the "Push 22" rule where dealer 22 pushes all non-busted hands.

export const PUSH_22_DEVIATIONS: Deviation[] = [
    { id: 'P22-1',  playerTotal: 0,  isSoft: false, isPair: false, dealerUpcard: 'A',  index: 7,  deviationAction: 'S', basicAction: 'H', direction: 'gte', description: 'Take Insurance when TC ≥ +7' },
    { id: 'P22-2',  playerTotal: 16, isSoft: false, isPair: false, dealerUpcard: '10', index: 0,  deviationAction: 'S', basicAction: 'H', direction: 'gte', description: 'Stand on 16 vs 10 (instead of Hit)' },
    { id: 'P22-3',  playerTotal: 15, isSoft: false, isPair: false, dealerUpcard: '10', index: 4,  deviationAction: 'S', basicAction: 'H', direction: 'gte', description: 'Stand on 15 vs 10 (instead of Hit)' },
    { id: 'P22-4',  playerTotal: 12, isSoft: false, isPair: false, dealerUpcard: '4',  index: 2,  deviationAction: 'S', basicAction: 'H', direction: 'gte', description: 'Stand on 12 vs 4 (instead of Hit)' },
    { id: 'P22-5',  playerTotal: 12, isSoft: false, isPair: false, dealerUpcard: '5',  index: 1,  deviationAction: 'S', basicAction: 'H', direction: 'gte', description: 'Stand on 12 vs 5 (instead of Hit)' },
    { id: 'P22-6',  playerTotal: 12, isSoft: false, isPair: false, dealerUpcard: '6',  index: 0,  deviationAction: 'S', basicAction: 'H', direction: 'gte', description: 'Stand on 12 vs 6 (instead of Hit)' },
    { id: 'P22-7',  playerTotal: 13, isSoft: false, isPair: false, dealerUpcard: '2',  index: 1,  deviationAction: 'S', basicAction: 'H', direction: 'gte', description: 'Stand on 13 vs 2 (instead of Hit)' },
    { id: 'P22-8',  playerTotal: 13, isSoft: false, isPair: false, dealerUpcard: '3',  index: 0,  deviationAction: 'S', basicAction: 'H', direction: 'gte', description: 'Stand on 13 vs 3 (instead of Hit)' },
    { id: 'P22-9',  playerTotal: 10, isSoft: false, isPair: false, dealerUpcard: '10', index: 4,  deviationAction: 'D', basicAction: 'H', direction: 'gte', description: 'Double 10 vs 10 (instead of Hit)' },
    { id: 'P22-10', playerTotal: 10, isSoft: false, isPair: false, dealerUpcard: 'A',  index: 4,  deviationAction: 'D', basicAction: 'H', direction: 'gte', description: 'Double 10 vs A (instead of Hit)' },
    { id: 'P22-11', playerTotal: 11, isSoft: false, isPair: false, dealerUpcard: 'A',  index: 1,  deviationAction: 'D', basicAction: 'H', direction: 'gte', description: 'Double 11 vs A (instead of Hit)' },
];

// ─── Lookup Function ───────────────────────────────────────────────────────

/**
 * Find a matching deviation for the current hand situation.
 *
 * @param playerTotal  Hard/soft total of the player's hand
 * @param isSoft       Whether the hand is soft
 * @param isPair       Whether the hand is a pair (for split deviations)
 * @param dealerUpcard Normalized dealer upcard ('2'-'10', 'A')
 * @param trueCount    Current Hi-Lo true count
 * @param dealerHitsS17 Whether dealer hits soft 17 (selects H17 vs S17 table)
 * @param allowSurrender Whether the room allows surrender
 * @returns The matching Deviation, or null if basic strategy applies
 */
export function getDeviation(
    playerTotal: number,
    isSoft: boolean,
    isPair: boolean,
    dealerUpcard: string,
    trueCount: number,
    dealerHitsS17: boolean,
    allowSurrender: boolean,
    roomId: string = 'classic',
    system: CountingSystem = 'Hi-Lo',
): Deviation | null {
    let allDeviations: Deviation[] = [];

    if (roomId === 'iberian_21') {
        allDeviations = system === 'Katarina Walker' ? IBERIAN_WALKER : IBERIAN_HILO;
    } else if (roomId === 'free_action') {
        allDeviations = PUSH_22_DEVIATIONS;
    } else if (roomId === 'uk') {
        allDeviations = I18_UK;
    } else if (roomId === 'european') {
        allDeviations = I18_EUROPEAN;
    } else {
        const i18Table = dealerHitsS17 ? I18_H17 : I18_S17;
        allDeviations = [...i18Table, ...FAB_4];
    }

    for (const dev of allDeviations) {
        // Skip insurance (playerTotal === 0) — handled separately
        if (dev.playerTotal === 0) continue;

        // Match hand situation
        if (dev.playerTotal !== playerTotal) continue;
        if (dev.isSoft !== isSoft) continue;
        if (dev.isPair !== isPair) continue;
        if (dev.dealerUpcard !== dealerUpcard) continue;

        // Check if true count crosses the threshold
        const fires = dev.direction === 'gte'
            ? trueCount >= dev.index
            : trueCount < dev.index;

        if (!fires) continue;

        // Handle surrender downgrade when room doesn't allow it
        if (dev.deviationAction === 'SU' && !allowSurrender) {
            const alternateDeviation = allDeviations.find((candidate) => {
                if (candidate.id === dev.id || candidate.deviationAction === 'SU') return false;
                if (candidate.playerTotal !== dev.playerTotal) return false;
                if (candidate.isSoft !== dev.isSoft) return false;
                if (candidate.isPair !== dev.isPair) return false;
                if (candidate.dealerUpcard !== dev.dealerUpcard) return false;

                return candidate.direction === 'gte'
                    ? trueCount >= candidate.index
                    : trueCount < candidate.index;
            });

            if (!alternateDeviation || alternateDeviation.deviationAction === alternateDeviation.basicAction) {
                continue;
            }

            return alternateDeviation;
        }

        return dev;
    }

    return null;
}

/**
 * Check if insurance deviation fires (I18-1).
 * Insurance is +EV when true count >= +3 (same for S17 and H17).
 */
export function getInsuranceIndex(
    roomId: string = 'classic',
    system: CountingSystem = 'Hi-Lo',
): number {
    if (roomId === 'iberian_21') {
        return system === 'Katarina Walker' ? 7 : 7;
    }

    if (roomId === 'free_action') {
        return 7;
    }

    return 3;
}

export function shouldTakeInsurance(
    trueCount: number,
    roomId: string = 'classic',
    system: CountingSystem = 'Hi-Lo',
): boolean {
    return trueCount >= getInsuranceIndex(roomId, system);
}
