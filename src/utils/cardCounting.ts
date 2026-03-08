import { Rank } from '@/types/enums';

export type CountingSystem = 'Hi-Lo' | 'Katarina Walker';

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
