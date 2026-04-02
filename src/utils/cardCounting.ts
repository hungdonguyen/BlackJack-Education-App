import { invoke } from '@tauri-apps/api/core';
import { Card, Seat } from '@/types/game';
import { Rank } from '@/types/enums';

export type CountingSystem = 'Hi-Lo' | 'Katarina Walker';

export function getCardsPerDeck(omitTens: boolean): number {
    return omitTens ? 48 : 52;
}

export function getCardValue(rank: Rank, system: CountingSystem): number {
    if (system === 'Katarina Walker') {
        switch (rank) {
            case Rank.TWO:
            case Rank.THREE:
            case Rank.SIX:
                return +1;
            case Rank.FOUR:
            case Rank.FIVE:
                return +2;
            case Rank.SEVEN:
            case Rank.EIGHT:
                return 0;
            case Rank.NINE:
            case Rank.TEN: // (Even though 10s are removed, if present they'd be -1)
            case Rank.JACK:
            case Rank.QUEEN:
            case Rank.KING:
            case Rank.ACE:
                return -1;
            default:
                return 0;
        }
    } else {
        // Hi-Lo
        switch (rank) {
            case Rank.TWO:
            case Rank.THREE:
            case Rank.FOUR:
            case Rank.FIVE:
            case Rank.SIX:
                return +1;
            case Rank.SEVEN:
            case Rank.EIGHT:
            case Rank.NINE:
                return 0;
            case Rank.TEN:
            case Rank.JACK:
            case Rank.QUEEN:
            case Rank.KING:
            case Rank.ACE:
                return -1;
            default:
                return 0;
        }
    }
}

export function getInitialDeckSum(system: CountingSystem, omitTens: boolean): number {
    if (system === 'Katarina Walker') {
        // Iberian 21 deck (no 10s): +8 per deck
        // Standard deck (with 10s): +8 - 4 = +4
        return omitTens ? 8 : 4;
    } else {
        // Hi-Lo
        // User requested to keep the -24 offset for Hi-Lo in Iberian 21 to highlight the difference.
        // So we return 0 here, making it start at unbalanced sums.
        return 0;
    }
}

export function calculateRunningCountFromShoe(
    shoe: Card[],
    dealerCards: Card[],
    seats: Seat[],
    numDecks: number,
    system: CountingSystem,
    omitTens: boolean,
): number {
    let shoeSum = 0;
    for (const card of shoe) {
        shoeSum += getCardValue(card.rank, system);
    }

    const initialDeckSum = getInitialDeckSum(system, omitTens);
    const initialShoeSum = numDecks * initialDeckSum;
    let runningCount = initialShoeSum - shoeSum;

    for (const card of dealerCards) {
        if (card.isHidden) {
            runningCount -= getCardValue(card.rank, system);
        }
    }

    for (const seat of seats) {
        for (const hand of seat.hands) {
            for (const card of hand.cards) {
                if (card.isHidden) {
                    runningCount -= getCardValue(card.rank, system);
                }
            }
        }
    }

    return runningCount;
}

export interface TrueCountResult {
    runningCount: number;
    decksRemaining: number;
    trueCountRaw: number;
    trueCount: number;
}

export async function calculateTrueCountFromShoe(
    shoe: Card[],
    dealerCards: Card[],
    seats: Seat[],
    numDecks: number,
    system: CountingSystem,
    omitTens: boolean,
): Promise<TrueCountResult> {
    const hasTauri =
        typeof window !== 'undefined' &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        !!(window as any).__TAURI_INTERNALS__;

    try {
        if (hasTauri) {
            const result = await invoke<TrueCountResult>('calculate_true_count_rust', {
                shoe,
                dealerCards,
                seats,
                numDecks,
                system,
                omitTens
            });
            return result;
        }
    } catch (err) {
        console.error('Failed to invoke Rust calculate_true_count. Falling back to JS.', err);
    }

    try {
        const runningCount = calculateRunningCountFromShoe(
            shoe,
            dealerCards,
            seats,
            numDecks,
            system,
            omitTens,
        );

        const decksRemaining = Math.max(shoe.length / getCardsPerDeck(omitTens), 0.5);
        const trueCountRaw = runningCount / decksRemaining;
        const trueCount = Math.round(trueCountRaw * 10) / 10;

        return {
            runningCount,
            decksRemaining,
            trueCountRaw,
            trueCount,
        };
    } catch (err) {
        console.error('Failed JS true count calculation.', err);
        return {
            runningCount: 0,
            decksRemaining: 0.5,
            trueCountRaw: 0,
            trueCount: 0,
        };
    }
}
