import { Hand, Card, HandValue } from '@/types/game';
import { HandStatus } from '@/types/enums';
import { IRules, ActionValidity, PayoutResult } from './types';
import { isBlackjack } from '@/utils/hand';

export class ClassicRules implements IRules {
    blackjackPayoutMultiplier = 1.5; // 3:2

    canDoubleDown(hand: Hand): ActionValidity {
        const allowed = hand.cards.length === 2 && hand.status === HandStatus.PLAYING;
        return {
            allowed,
            isFree: false,
            cost: hand.betAmount,
        };
    }

    canSplit(hand: Hand, seatHandsLength: number): ActionValidity {
        // Classic rule: Split up to 4 hands total (3 splits). Same value cards.
        const allowed =
            hand.cards.length === 2 &&
            hand.status === HandStatus.PLAYING &&
            hand.cards[0].value === hand.cards[1].value &&
            seatHandsLength < 4;

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
