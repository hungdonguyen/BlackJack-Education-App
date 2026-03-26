import { Hand, Card, HandValue } from '@/types/game';
import { HandStatus, Suit } from '@/types/enums';
import { IRules, ActionValidity, PayoutResult } from './types';
import { isBlackjack } from '@/utils/hand';

export class Madness21Rules implements IRules {
    blackjackPayoutMultiplier = 1.5; // default, but overridden in evaluateHand

    canDoubleDown(hand: Hand): ActionValidity {
        // Can double down on ANY number of cards, ANY time
        const allowed = hand.status === HandStatus.PLAYING;
        return {
            allowed,
            isFree: false,
            cost: hand.betAmount, // Normal cost
        };
    }

    canSplit(hand: Hand, seatHandsLength: number): ActionValidity {
        // Splitting not allowed in Double Down Madness
        return {
            allowed: false,
            isFree: false,
            cost: 0,
        };
    }

    canSurrender(hand: Hand): ActionValidity {
        // Can only surrender if it's the first card
        const allowed = hand.cards.length === 1 && hand.status === HandStatus.PLAYING;
        return { allowed, isFree: false, cost: 0 };
    }

    evaluateHand(
        playerHand: Hand,
        playerValue: HandValue,
        dealerCards: Card[],
        dealerValue: HandValue
    ): PayoutResult {
        // Madness custom BJ logic (Any 2-card 21 since they start with 1, but not on split hands)
        const isPlayerBJ = playerHand.cards.length === 2 && playerValue.total === 21 && !playerHand.isSplit;
        const isDealerBJ = isBlackjack(dealerCards);
        
        const dealerBust = dealerValue.total > 21;
        const playerBust = playerValue.total > 21;

        if (playerBust) {
            return { status: HandStatus.LOST, payoutMultiplier: -1 };
        }

        // Push 22 rule
        const dealerPush22 = dealerValue.total === 22;

        if (isPlayerBJ) {
            if (isDealerBJ) {
                return { status: HandStatus.PUSH, payoutMultiplier: 0 };
            }
            // Suited BJ check
            const isSuitedBJ = playerHand.cards[0].suit === playerHand.cards[1].suit;
            const multiplier = isSuitedBJ ? 2.0 : 1.5;
            
            return { 
                status: HandStatus.BLACKJACK, 
                payoutMultiplier: multiplier,
                metadata: { isSuitedBJ }
            };
        }

        if (isDealerBJ) {
            return { status: HandStatus.LOST, payoutMultiplier: -1 };
        }

        if (dealerPush22) {
            return { 
                status: HandStatus.PUSH, 
                payoutMultiplier: 0,
                metadata: { dealerPush22: true }
            };
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
