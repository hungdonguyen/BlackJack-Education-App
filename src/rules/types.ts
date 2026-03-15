import { Card, Hand, Seat, HandValue } from '@/types/game';
import { HandStatus } from '@/types/enums';

export interface ActionValidity {
    allowed: boolean;
    isFree: boolean;
    cost: number;
}

export interface PayoutResult {
    status: HandStatus;
    payoutMultiplier: number;
}

export interface IRules {
    /** Check if a hand can double down, and if it's free. */
    canDoubleDown(hand: Hand): ActionValidity;

    /** Check if a hand can be split, and if it's free. */
    canSplit(hand: Hand, seatHandsLength: number): ActionValidity;

    /** Check if a hand can surrender (Late Surrender). */
    canSurrender(hand: Hand): ActionValidity;

    /**
     * Evaluate the player's outcome against the dealer's outcome.
     * Returns the resulting HandStatus (WON, LOST, PUSH, BLACKJACK) and the payout multiplier.
     * @param handIndex The index of the hand within the seat's hands array (optional, used for OBO logic)
     * @param numSeatHands The total number of hands the seat currently has (optional, used for OBO logic)
     */
    evaluateHand(
        playerHand: Hand,
        playerValue: HandValue,
        dealerCards: Card[],
        dealerValue: HandValue,
        handIndex?: number,
        numSeatHands?: number
    ): PayoutResult;

    /** How much does blackjack pay? Usually 1.5 (3:2) */
    blackjackPayoutMultiplier: number;
}
