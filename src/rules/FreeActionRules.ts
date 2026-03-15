import { Hand, Card, HandValue } from '@/types/game';
import { HandStatus, Rank } from '@/types/enums';
import { IRules, ActionValidity, PayoutResult } from './types';
import { isBlackjack, calculateHandValue } from '@/utils/hand';

/**
 * Free Action Blackjack Rules
 * 
 * Core Mechanics:
 * - 6 Decks, H17 (Dealer hits Soft 17), Peek on Ace & 10, No Surrender
 * - Blackjack pays 3:2
 * 
 * Free Action Rules:
 * - Free Action Double: Only on hard 9, 10, or 11 (no cost). Other doubles cost real money.
 * - Free Action Split: All pairs EXCEPT 10-value cards (10, J, Q, K). 10-value splits cost real money.
 * - Free Action Double after Free Action Split allowed.
 * - Max 4 hands. Split Aces get 1 card then auto-stand.
 * 
 * Push on 22:
 * - If dealer busts with exactly 22, all surviving non-Blackjack hands push (bet returned).
 * - If dealer busts 23+, player wins normally.
 * - Natural Blackjack always pays 3:2 (immune to Push-on-22).
 */
export class FreeActionRules implements IRules {
    blackjackPayoutMultiplier = 1.5; // 3:2

    canDoubleDown(hand: Hand): ActionValidity {
        // Must be exactly 2 cards and PLAYING, not from an Ace split
        const basicAllowed =
            hand.cards.length === 2 &&
            hand.status === HandStatus.PLAYING &&
            !hand.isAceSplit;

        if (!basicAllowed) {
            return { allowed: false, isFree: false, cost: 0 };
        }

        // Calculate hand value to determine if free
        const handValue = calculateHandValue(hand.cards);
        
        // FREE Action Double: only on HARD 9, 10, or 11
        const isHard = !handValue.isSoft;
        const isFreeable = isHard && [9, 10, 11].includes(handValue.total);

        return {
            allowed: true,
            isFree: isFreeable,
            cost: isFreeable ? 0 : hand.betAmount,
        };
    }

    canSplit(hand: Hand, seatHandsLength: number): ActionValidity {
        // Must be exactly 2 cards, PLAYING, same value, max 4 hands, no re-split Aces
        const basicAllowed =
            hand.cards.length === 2 &&
            hand.status === HandStatus.PLAYING &&
            hand.cards[0].value === hand.cards[1].value &&
            seatHandsLength < 4 &&
            !hand.isAceSplit;

        if (!basicAllowed) {
            return { allowed: false, isFree: false, cost: 0 };
        }

        // FREE Action Split: all pairs EXCEPT 10-value cards (10, J, Q, K)
        const cardValue = hand.cards[0].value;
        const is10Value = cardValue === 10;

        return {
            allowed: true,
            isFree: !is10Value,
            cost: is10Value ? hand.betAmount : 0,
        };
    }

    canSurrender(_hand: Hand): ActionValidity {
        // No surrender allowed in Free Action Blackjack
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
        const dealerHasBlackjack = isBlackjack(dealerCards);
        const dealerBust = dealerValue.total > 21;
        const playerBust = playerValue.total > 21;

        // Player busted — always loses
        if (playerBust) {
            return { status: HandStatus.LOST, payoutMultiplier: -1 };
        }

        // Player Blackjack
        if (playerHasBlackjack) {
            if (dealerHasBlackjack) {
                return { status: HandStatus.PUSH, payoutMultiplier: 0 };
            }
            // Natural Blackjack is IMMUNE to Push-on-22 — always pays 3:2
            return { status: HandStatus.BLACKJACK, payoutMultiplier: this.blackjackPayoutMultiplier };
        }

        // Dealer Blackjack beats all non-blackjack hands
        if (dealerHasBlackjack) {
            return { status: HandStatus.LOST, payoutMultiplier: -1 };
        }

        // ═══ PUSH ON 22 RULE ═══
        // If dealer busts with EXACTLY 22, all surviving non-Blackjack hands PUSH
        if (dealerBust && dealerValue.total === 22) {
            return { status: HandStatus.PUSH, payoutMultiplier: 0 };
        }

        // Dealer busted at 23+ — player wins normally
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
