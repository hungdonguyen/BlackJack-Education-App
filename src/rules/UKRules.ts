import { Hand, Card, HandValue } from '@/types/game';
import { HandStatus, Rank } from '@/types/enums';
import { IRules, ActionValidity, PayoutResult } from './types';
import { isBlackjack } from '@/utils/hand';

export class UKRules implements IRules {
    blackjackPayoutMultiplier = 1.5; // 3:2

    canDoubleDown(hand: Hand): ActionValidity {
        // UK Standard Rules:
        // - Can double down on ANY first two cards
        // - DAS (Double After Split) is ALLOWED
        const allowed =
            hand.cards.length === 2 &&
            hand.status === HandStatus.PLAYING;

        return {
            allowed,
            isFree: false,
            cost: hand.betAmount,
        };
    }

    canSplit(hand: Hand, seatHandsLength: number): ActionValidity {
        // UK Rules: Split equal value cards up to 4 hands.
        // Split is by equal VALUE, including mixed 10-value cards (some places restrict but user says equal value).
        // Aces receive only 1 card and cannot be resplit.
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

    canSurrender(_hand: Hand): ActionValidity {
        // UK Casino Blackjack typically prohibits surrender.
        return { allowed: false, isFree: false, cost: 0 };
    }

    evaluateHand(
        playerHand: Hand,
        playerValue: HandValue,
        dealerCards: Card[],
        dealerValue: HandValue,
        handIndex?: number,
        numSeatHands?: number
    ): PayoutResult {
        const playerHasBlackjack = playerHand.status === HandStatus.BLACKJACK;
        const dealerHasBlackjack = isBlackjack(dealerCards);
        const dealerBust = dealerValue.total > 21;
        const playerBust = playerValue.total > 21;

        if (playerBust) {
            return { status: HandStatus.LOST, payoutMultiplier: -1 };
        }

        // --- ENHC with OBO (Original Bets Only) Logic ---
        // To refund the EXTRA bet for OBO, we return a fractional multiplier.
        // A doubled hand has 2x the original bet, so it should only lose 1x.
        if (dealerHasBlackjack && !playerHasBlackjack) {
            if (playerHand.isDoubleDown) {
                return { status: HandStatus.LOST, payoutMultiplier: -0.5 }; // Lose half of the 2x bet
            }
            // For split hands, the original bet is the first hand (handIndex 0).
            // Any subsequent hands (handIndex > 0) are extra bets and should be refunded (pushed).
            if (handIndex !== undefined && handIndex > 0) {
                return { status: HandStatus.PUSH, payoutMultiplier: 0 }; // Refund the split bet
            }
            return { status: HandStatus.LOST, payoutMultiplier: -1 };
        }

        // If BOTH have blackjack, it's a push.
        if (playerHasBlackjack) {
            if (dealerHasBlackjack) {
                return { status: HandStatus.PUSH, payoutMultiplier: 0 };
            }
            return { status: HandStatus.BLACKJACK, payoutMultiplier: this.blackjackPayoutMultiplier };
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
