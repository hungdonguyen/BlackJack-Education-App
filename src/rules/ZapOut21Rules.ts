import { Hand, Card, HandValue } from '@/types/game';
import { HandStatus } from '@/types/enums';
import { IRules, ActionValidity, PayoutResult } from './types';
import { isBlackjack } from '@/utils/hand';

export class ZapOut21Rules implements IRules {
    public readonly blackjackPayoutMultiplier = 1.5; // Natural BJ pays 3:2. Zapped BJ is counted as regular 21 and pays 1:1.

    canDoubleDown(hand: Hand): ActionValidity {
        // Can double on any 2 cards.
        if (hand.cards.length === 2 && hand.status === HandStatus.PLAYING) {
            return { allowed: true, isFree: false, cost: hand.betAmount };
        }
        return { allowed: false, isFree: false, cost: 0 };
    }

    canSplit(hand: Hand, seatHandsLength: number): ActionValidity {
        // Can split to 4 hands.
        if (seatHandsLength >= 4) return { allowed: false, isFree: false, cost: 0 };
        if (hand.cards.length !== 2) return { allowed: false, isFree: false, cost: 0 };
        // Same rank or both 10-value
        if (hand.cards[0].value === hand.cards[1].value) {
            return { allowed: true, isFree: false, cost: hand.betAmount };
        }
        return { allowed: false, isFree: false, cost: 0 };
    }

    canSurrender(): ActionValidity {
        // Zappit blackjack usually allows late surrender, but let's disable it for simplicity unless required. Assume false to prioritize Zapping.
        return { allowed: false, isFree: false, cost: 0 };
    }

    canZap(hand: Hand): ActionValidity {
        // Can Zap if exactly 2 cards, and original hand (not split), and value is hard 15, 16, 17, or 18.
        if (hand.cards.length === 2 && !hand.isSplit && !hand.isZapped) {
            let total = 0;
            let hasAce = false;
            for (const c of hand.cards) {
                total += c.value;
                if (c.value === 11) hasAce = true;
            }
            // Zapping is usually for hard totals 15-18.
            if (!hasAce && total >= 15 && total <= 18) {
                return { allowed: true, isFree: true, cost: 0 }; // Zapping is free
            }
        }
        return { allowed: false, isFree: false, cost: 0 };
    }

    evaluateHand(
        playerHand: Hand,
        playerValue: HandValue,
        dealerCards: Card[],
        dealerValue: HandValue
    ): PayoutResult {
        // Check dealer bust. Wait, Dealer 22 is a Push.
        const dTotal = dealerValue.total;
        
        // Did dealer bust with exactly 22?
        const dealerBustedWith22 = dTotal === 22;
        const dealerBusted = dTotal > 21;

        // Player busted?
        if (playerValue.total > 21) {
            return { status: HandStatus.LOST, payoutMultiplier: -1 };
        }

        // Deal with Player Blackjacks
        const isPlayerBJ = isBlackjack(playerHand.cards);
        const isDealerBJ = isBlackjack(dealerCards, true);

        if (isPlayerBJ && !playerHand.isZapped) {
            if (isDealerBJ) {
                return { status: HandStatus.PUSH, payoutMultiplier: 0 };
            }
            return { status: HandStatus.BLACKJACK, payoutMultiplier: this.blackjackPayoutMultiplier }; 
        }

        if (isDealerBJ) {
            return { status: HandStatus.LOST, payoutMultiplier: -1 };
        }

        // If player has a zapped 2-card 21, it is NOT a blackjack, just 21 total. (Handled natively by calculateHandValue returning 21).

        // If dealer busts with exactly 22, it's a push for all alive hands (that aren't un-zapped BJs, which already paid out).
        if (dealerBustedWith22) {
            return { status: HandStatus.PUSH, payoutMultiplier: 0 };
        }

        if (dealerBusted && dTotal !== 22) {
            return { status: HandStatus.WON, payoutMultiplier: 1 };
        } // Regular dealer bust (not 22)

        // Comparison
        if (playerValue.total > dTotal) {
            return { status: HandStatus.WON, payoutMultiplier: 1 };
        } else if (playerValue.total === dTotal) {
            return { status: HandStatus.PUSH, payoutMultiplier: 0 };
        } else {
            return { status: HandStatus.LOST, payoutMultiplier: -1 };
        }
    }
}
