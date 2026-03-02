import { Hand, Card, HandValue } from '@/types/game';
import { HandStatus } from '@/types/enums';
import { IRules, ActionValidity, PayoutResult } from './types';
import { isBlackjack, calculateHandValue } from '@/utils/hand';

export class FreeBetRules implements IRules {
    blackjackPayoutMultiplier = 1.5; // 3:2

    canDoubleDown(hand: Hand): ActionValidity {
        if (hand.cards.length !== 2 || hand.status !== HandStatus.PLAYING) {
            return { allowed: false, isFree: false, cost: 0 };
        }

        // Free Double on hard 9, 10, 11
        const hv = calculateHandValue(hand.cards);
        const isFree = !hv.isSoft && [9, 10, 11].includes(hv.total);

        return {
            allowed: true,
            isFree,
            cost: isFree ? 0 : hand.betAmount,
        };
    }

    canSplit(hand: Hand, seatHandsLength: number): ActionValidity {
        if (hand.cards.length !== 2 || hand.status !== HandStatus.PLAYING || seatHandsLength >= 4) {
            return { allowed: false, isFree: false, cost: 0 };
        }

        const isPair = hand.cards[0].value === hand.cards[1].value;
        if (!isPair) {
            return { allowed: false, isFree: false, cost: 0 };
        }

        // Free Split on all pairs EXCEPT 10-value cards (10, J, Q, K)
        const isFree = hand.cards[0].value !== 10;

        return {
            allowed: true,
            isFree,
            cost: isFree ? 0 : hand.betAmount,
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
        const dealer22 = dealerValue.total === 22;

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

        // Free Bet Rule: Dealer rolling exactly 22 pushes all non-busted player hands (except Blackjack, which is handled above)
        if (dealer22) {
            return { status: HandStatus.PUSH, payoutMultiplier: 0 };
        }

        // Dealer busts (23 or more) — player wins
        if (dealerBust) { // We already checked for exactly 22 above
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
