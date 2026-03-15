import { IRules, ActionValidity, PayoutResult } from './types';
import { Hand, Seat, Card, HandValue } from '@/types/game';
import { HandStatus } from '@/types/enums';
import { isBlackjack } from '@/utils/hand';

export class FireCardRules implements IRules {
    // Natural Blackjack pays 1:1 — Burned 21 is just 21 (not a natural, evaluated separately)
    blackjackPayoutMultiplier = 1.0;
    private isH17: boolean;
    private maxSplitHands: number;
    private doubleAfterSplit: boolean;

    constructor(
        isH17: boolean = true,
        maxSplitHands: number = 4,
        doubleAfterSplit: boolean = true // Fire Card 21 allows double after split (like 21 Burn)
    ) {
        this.isH17 = isH17;
        this.maxSplitHands = maxSplitHands;
        this.doubleAfterSplit = doubleAfterSplit;
    }

    canDoubleDown(hand: Hand): ActionValidity {
        if (hand.cards.length !== 2) return { allowed: false, isFree: false, cost: 0 };
        // No DAS: if the hand came from a split, double down is not allowed
        if (hand.isSplit && !this.doubleAfterSplit) return { allowed: false, isFree: false, cost: 0 };
        return { allowed: true, isFree: false, cost: hand.betAmount };
    }

    canSplit(hand: Hand, seatHandsLength: number): ActionValidity {
        if (hand.cards.length !== 2) return { allowed: false, isFree: false, cost: 0 };
        if (seatHandsLength >= this.maxSplitHands) return { allowed: false, isFree: false, cost: 0 };

        // Standard equal value split
        const isStandardPair = hand.cards[0].value === hand.cards[1].value;
        if (!isStandardPair) return { allowed: false, isFree: false, cost: 0 };

        return { allowed: true, isFree: false, cost: hand.betAmount };
    }

    canSurrender(hand: Hand): ActionValidity {
        return { allowed: false, isFree: false, cost: 0 }; // Not usually allowed
    }

    canBurn(hand: Hand): ActionValidity {
        // Must be the first 2 cards, not already burned, not a split hand, and not after a double
        if (hand.cards.length !== 2) return { allowed: false, isFree: false, cost: 0 };
        if (hand.isBurned || hand.isSplit || hand.isDoubleDown) return { allowed: false, isFree: false, cost: 0 };

        return { allowed: true, isFree: false, cost: hand.betAmount / 2 };
    }

    evaluateHand(
        playerHand: Hand,
        playerValue: HandValue,
        dealerCards: Card[],
        dealerValue: HandValue,
        _handIndex?: number,
        _numSeatHands?: number
    ): PayoutResult {
        if (playerValue.total > 21) {
            return { status: HandStatus.LOST, payoutMultiplier: -1 };
        }

        if (playerHand.isSurrendered) {
            return { status: HandStatus.SURRENDERED, payoutMultiplier: -0.5 };
        }

        const dealerBusted = dealerValue.total > 21;

        // Note: Burned 21 is just a 21, not a blackjack.
        // Only a hand with status=BLACKJACK that was NOT burned counts as a natural BJ.
        const playerIsActualBJ = playerHand.status === HandStatus.BLACKJACK && !playerHand.isBurned;
        const dealerIsBJ = isBlackjack(dealerCards);

        // Blackjack evaluation: natural BJ pays 1:1 in Fire Card 21
        if (playerIsActualBJ && !dealerIsBJ) {
            return { status: HandStatus.BLACKJACK, payoutMultiplier: this.blackjackPayoutMultiplier };
        }
        if (!playerIsActualBJ && dealerIsBJ) {
            return { status: HandStatus.LOST, payoutMultiplier: -1 };
        }
        if (playerIsActualBJ && dealerIsBJ) {
            return { status: HandStatus.PUSH, payoutMultiplier: 0 };
        }
        
        // At this point neither has blackjack
        if (dealerBusted) {
            return { status: HandStatus.WON, payoutMultiplier: 1 };
        }

        // Compare totals
        if (playerValue.total > dealerValue.total) {
            return { status: HandStatus.WON, payoutMultiplier: 1 };
        } else if (playerValue.total < dealerValue.total) {
            return { status: HandStatus.LOST, payoutMultiplier: -1 };
        } else {
            return { status: HandStatus.PUSH, payoutMultiplier: 0 };
        }
    }
}
