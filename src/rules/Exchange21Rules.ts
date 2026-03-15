import { Hand, Card, Seat, HandValue } from '@/types/game';
import { HandStatus } from '@/types/enums';
import { IRules, ActionValidity, PayoutResult } from './types';
import { ClassicRules } from './ClassicRules';
import { isBlackjack } from '@/utils/hand';

export class Exchange21Rules extends ClassicRules {
    // In Exchange 21 (Switch), natural Blackjacks pay 1:1, not 3:2
    blackjackPayoutMultiplier = 1;

    // Redefining canSplit so we don't allow too many hands.
    // Classic blocks at 2, but Exchange 21 starts with 2. We allow up to 4.
    canSplit(hand: Hand, seatHandsLength: number): ActionValidity {
        const allowed =
            hand.cards.length === 2 &&
            hand.status === HandStatus.PLAYING &&
            hand.cards[0].value === hand.cards[1].value &&
            seatHandsLength < 4 &&
            !hand.isAceSplit;

        return {
            allowed,
            isFree: false,
            cost: hand.betAmount,
        };
    }
    
    canSwitch(seat: Seat): ActionValidity {
        const h0 = seat.hands[0];
        const h1 = seat.hands[1];

        const allowed =
            seat.hands.length === 2 &&
            !seat.hasSwitched &&
            h0.cards.length === 2 &&
            h1.cards.length === 2 &&
            !h0.isSplit && !h1.isSplit &&
            // Allow switch as long as at least one hand is PLAYING or BLACKJACK
            (h0.status === HandStatus.PLAYING || h0.status === HandStatus.BLACKJACK ||
             h1.status === HandStatus.PLAYING || h1.status === HandStatus.BLACKJACK);

        return {
            allowed: allowed,
            isFree: true,
            cost: 0
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

        // Switched blackjacks are NOT natural blackjacks, so playerHand.status won't be BLACKJACK.
        // It will just be a total of 21. So this branch only runs for natural blackjacks.
        if (playerHasBlackjack) {
            if (dealerHasBlackjack) {
                return { status: HandStatus.PUSH, payoutMultiplier: 0 };
            }
            return { status: HandStatus.BLACKJACK, payoutMultiplier: this.blackjackPayoutMultiplier };
        }

        if (dealerHasBlackjack) {
            return { status: HandStatus.LOST, payoutMultiplier: -1 };
        }

        // Exchange 21 rule: Dealer 22 pushes all non-busted player hands
        // Note: natural blackjacks already won in the branch above.
        if (dealerValue.total === 22) {
            return { status: HandStatus.PUSH, payoutMultiplier: 0 };
        }

        if (dealerBust) {
            return { status: HandStatus.WON, payoutMultiplier: 1 };
        }

        if (playerValue.total > dealerValue.total) {
            return { status: HandStatus.WON, payoutMultiplier: 1 };
        } else if (playerValue.total === dealerValue.total) {
            return { status: HandStatus.PUSH, payoutMultiplier: 0 };
        } else {
            return { status: HandStatus.LOST, payoutMultiplier: -1 };
        }
    }
}
