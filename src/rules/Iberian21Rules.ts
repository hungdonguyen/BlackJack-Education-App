import { Hand, Card, HandValue } from '@/types/game';
import { HandStatus, Suit } from '@/types/enums';
import { IRules, ActionValidity, PayoutResult } from './types';
import { isBlackjack } from '@/utils/hand';

export class Iberian21Rules implements IRules {
    blackjackPayoutMultiplier = 1.5; // 3:2

    canDoubleDown(hand: Hand): ActionValidity {
        // Double down on ANY number of cards
        // Can't double down if already doubled
        const allowed = 
            hand.status === HandStatus.PLAYING &&
            !hand.isDoubleDown;

        return {
            allowed,
            isFree: false,
            cost: hand.betAmount,
        };
    }

    canSplit(hand: Hand, seatHandsLength: number): ActionValidity {
        // Max 4 hands
        // Any 10-valued cards can be split? No, there are no 10s. But J, Q, K can be split.
        // Aces can be split and hit/doubled.
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

    canSurrender(hand: Hand): ActionValidity {
        // Late Surrender allowed.
        // Double Down Rescue: allowed even if doubled!
        const allowed = hand.status === HandStatus.PLAYING;

        return { allowed, isFree: false, cost: 0 };
    }

    evaluateHand(
        playerHand: Hand,
        playerValue: HandValue,
        dealerCards: Card[],
        dealerValue: HandValue
    ): PayoutResult {
        const playerBust = playerValue.total > 21;
        const dealerBust = dealerValue.total > 21;

        if (playerBust) {
            return { status: HandStatus.LOST, payoutMultiplier: -1 };
        }

        // Iberian 21: Player 21 or Player Blackjack ALWAYS WIN immediately.
        // Even if dealer has Blackjack or 21.

        const playerHasBlackjack = playerHand.status === HandStatus.BLACKJACK;
        if (playerHasBlackjack) {
            // In Iberian 21, Player Blackjack ALWAYS wins (even against Dealer Blackjack)
            return { status: HandStatus.BLACKJACK, payoutMultiplier: this.blackjackPayoutMultiplier };
        }

        if (playerValue.total === 21) {
            // Player 21 ALWAYS wins, no push against dealer 21.

            // Bonus payouts only apply if player hasn't doubled down
            if (!playerHand.isDoubleDown) {
                const numCards = playerHand.cards.length;
                let payoutMultiplier = 1;

                // 21 by number of cards
                if (numCards === 5) {
                    payoutMultiplier = 1.5; // 3:2
                } else if (numCards === 6) {
                    payoutMultiplier = 2; // 2:1
                } else if (numCards >= 7) {
                    payoutMultiplier = 3; // 3:1
                }

                // 6-7-8 and 7-7-7 configurations
                if (numCards === 3) {
                    const sortedRanks = [...playerHand.cards].map(c => c.rank).sort();
                    const is678 = sortedRanks[0] === '6' && sortedRanks[1] === '7' && sortedRanks[2] === '8';
                    const is777 = sortedRanks[0] === '7' && sortedRanks[1] === '7' && sortedRanks[2] === '7';

                    if (is678 || is777) {
                        const suits = playerHand.cards.map(c => c.suit);
                        const allSameSuit = suits[0] === suits[1] && suits[1] === suits[2];
                        const isSpades = allSameSuit && suits[0] === Suit.SPADES;

                        if (isSpades) {
                            payoutMultiplier = Math.max(payoutMultiplier, 3); // 3:1
                        } else if (allSameSuit) {
                            payoutMultiplier = Math.max(payoutMultiplier, 2); // 2:1
                        } else {
                            payoutMultiplier = Math.max(payoutMultiplier, 1.5); // 3:2
                        }
                    }
                }

                return { status: HandStatus.WON, payoutMultiplier };
            }

            return { status: HandStatus.WON, payoutMultiplier: 1 };
        }

        // For non-21 hands:
        const dealerHasBlackjack = isBlackjack(dealerCards);
        
        if (dealerHasBlackjack) {
            return { status: HandStatus.LOST, payoutMultiplier: -1 };
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
