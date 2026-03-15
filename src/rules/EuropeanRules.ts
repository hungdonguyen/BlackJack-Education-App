import { Hand, Card, HandValue } from '@/types/game';
import { HandStatus, Rank } from '@/types/enums';
import { IRules, ActionValidity, PayoutResult } from './types';
import { isBlackjack } from '@/utils/hand';

export class EuropeanRules implements IRules {
    blackjackPayoutMultiplier = 1.5; // 3:2

    canDoubleDown(hand: Hand): ActionValidity {
        // ENHC Rules:
        // - Can double down ONLY on Hard 9, 10, or 11
        // - NDAS (No Double After Split)
        const total = hand.cards.reduce((sum, c) => sum + Math.min(c.value, 10), 0);
        const hasAce = hand.cards.some((c) => c.rank === Rank.ACE);
        
        let hardTotal = total;
        let isSoft = false;
        if (hasAce) {
            if (total + 10 <= 21) {
                isSoft = true;
            }
        }

        const isHard9To11 = !isSoft && (hardTotal === 9 || hardTotal === 10 || hardTotal === 11);

        const allowed =
            hand.cards.length === 2 &&
            hand.status === HandStatus.PLAYING &&
            !hand.isSplit && // NDAS
            isHard9To11;

        return {
            allowed,
            isFree: false,
            cost: hand.betAmount,
        };
    }

    canSplit(hand: Hand, seatHandsLength: number): ActionValidity {
        // European Rules: Split only once (max 2 hands per seat).
        // Split is by equal VALUE, including mixed 10-value cards.
        // Aces receive only 1 card.
        const allowed =
            hand.cards.length === 2 &&
            hand.status === HandStatus.PLAYING &&
            hand.cards[0].value === hand.cards[1].value &&
            seatHandsLength < 2 &&
            !hand.isAceSplit;

        return {
            allowed,
            isFree: false,
            cost: hand.betAmount,
        };
    }

    canSurrender(_hand: Hand): ActionValidity {
        // European Blackjack: No surrender allowed.
        return { allowed: false, isFree: false, cost: 0 };
    }

    evaluateHand(
        playerHand: Hand,
        playerValue: HandValue,
        dealerCards: Card[],
        dealerValue: HandValue,
        _handIndex?: number,
        _numSeatHands?: number
    ): PayoutResult {
        const playerHasBlackjack = playerHand.status === HandStatus.BLACKJACK;
        
        // Wait, under ENHC, if dealer gets Blackjack, player loses original bet UNLESS they doubled/split.
        // Wait, ENHC standard penalty: Player loses TOTAL amount wagered if dealer gets blackjack on their turn.
        // Wait, standard ENHC means no OBO (Original Bets Only), player loses EVERYTHING (splits, doubles) against dealer BJ.
        // We already naturally deduct funds upon splitting and doubling down, 
        // and calculate payouts returns -1 multiplier which is ignored if hand.status == WON etc.
        // In our `calculatePayouts`, if `evaluation.status === LOST`, it doesn't add to `totalPayout`. 
        // So the player simply loses the extra bets. That's exactly correct for standard ENHC without OBO.

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
