import { Hand, Card, HandValue } from '@/types/game';
import { HandStatus } from '@/types/enums';
import { IRules, ActionValidity, PayoutResult } from './types';
import { isBlackjack } from '@/utils/hand';

export class ClassicRules implements IRules {
    blackjackPayoutMultiplier = 1.5; // 3:2

    canDoubleDown(hand: Hand): ActionValidity {
        // DAS allowed on regular splits; NOT on Ace splits (Ace split receives only 1 card).
        const allowed =
            hand.cards.length === 2 &&
            hand.status === HandStatus.PLAYING &&
            !hand.isAceSplit;
        return {
            allowed,
            isFree: false,
            cost: hand.betAmount,
        };
    }

    canSplit(hand: Hand, seatHandsLength: number): ActionValidity {
        // Classic Online rule: Split only once (max 2 hands per seat).
        // Must be same RANK (same face: J-J, 10-10), not just same value.
        // (J and K both = 10 but cannot be split in Classic Online)
        // Aces cannot be re-split.
        const allowed =
            hand.cards.length === 2 &&
            hand.status === HandStatus.PLAYING &&
            hand.cards[0].rank === hand.cards[1].rank &&
            seatHandsLength < 2 &&
            !hand.isAceSplit;

        return {
            allowed,
            isFree: false,
            cost: hand.betAmount,
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
