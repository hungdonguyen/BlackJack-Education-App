import { Hand, Card, HandValue } from '@/types/game';
import { HandStatus } from '@/types/enums';
import { IRules, ActionValidity, PayoutResult } from './types';
import { isBlackjack } from '@/utils/hand';

export class AtlanticCityRules implements IRules {
    blackjackPayoutMultiplier = 1.5; // 3:2

    canDoubleDown(hand: Hand): ActionValidity {
        // Double Down allowed on any two cards, EXCEPT if this hand is from splitting Aces.
        const allowed =
            hand.cards.length === 2 &&
            hand.status === HandStatus.PLAYING &&
            !hand.isAceSplit &&
            !hand.isSplit;

        return {
            allowed,
            isFree: false,
            cost: hand.betAmount,
        };
    }

    canSplit(hand: Hand, seatHandsLength: number): ActionValidity {
        // Max 3 splits (4 hands total).
        // Aces cannot be RE-SPLIT (if isAceSplit is true, forbid) — No RSA.
        // Any 10-valued cards can be split (e.g., J and K can be split — mixed 10s).
        const allowed =
            hand.cards.length === 2 &&
            hand.status === HandStatus.PLAYING &&
            hand.cards[0].value === hand.cards[1].value && // Value must match (10 & 10, Ace & Ace)
            seatHandsLength < 4 &&
            !hand.isAceSplit; // Forbid re-splitting Aces

        return {
            allowed,
            isFree: false,
            cost: hand.betAmount,
        };
    }

    canSurrender(hand: Hand): ActionValidity {
        // Late Surrender: allowed on initial 2 cards only, while hand is PLAYING.
        // Surrender is offered AFTER dealer has peeked and confirmed no Blackjack.
        // Cannot surrender split hands or ace-split hands.
        const allowed =
            hand.cards.length === 2 &&
            hand.status === HandStatus.PLAYING &&
            !hand.isAceSplit;

        return {
            allowed,
            isFree: false,
            cost: 0, // No additional cost — player loses half their existing bet
        };
    }

    evaluateHand(
        playerHand: Hand,
        playerValue: HandValue,
        dealerCards: Card[],
        dealerValue: HandValue
    ): PayoutResult {
        const playerHasBlackjack = playerHand.status === HandStatus.BLACKJACK;
        const dealerHasBlackjack = isBlackjack(dealerCards);
        const dealerBust = dealerValue.total > 21;
        const playerBust = playerValue.total > 21;

        // Surrendered hands are already resolved (50% refund handled in game flow)
        if (playerHand.status === HandStatus.SURRENDERED) {
            return { status: HandStatus.SURRENDERED, payoutMultiplier: -0.5 };
        }

        if (playerBust) {
            return { status: HandStatus.LOST, payoutMultiplier: -1 };
        }

        // Player Blackjack
        if (playerHasBlackjack) {
            if (dealerHasBlackjack) {
                return { status: HandStatus.PUSH, payoutMultiplier: 0 };
            }
            return { status: HandStatus.BLACKJACK, payoutMultiplier: this.blackjackPayoutMultiplier };
        }

        // Dealer Blackjack beats all non-blackjack hands
        if (dealerHasBlackjack) {
            return { status: HandStatus.LOST, payoutMultiplier: -1 };
        }

        // Dealer busted — player wins
        if (dealerBust) {
            return { status: HandStatus.WON, payoutMultiplier: 1 };
        }

        // Compare values
        if (playerValue.total > dealerValue.total) {
            return { status: HandStatus.WON, payoutMultiplier: 1 };
        } else if (playerValue.total === dealerValue.total) {
            return { status: HandStatus.PUSH, payoutMultiplier: 0 };
        } else {
            return { status: HandStatus.LOST, payoutMultiplier: -1 };
        }
    }
}
