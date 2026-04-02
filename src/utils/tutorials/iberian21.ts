import { Card, TutorialStep, GameState } from '@/types/game';
import { Rank, Suit, GamePhase } from '@/types/enums';
import { TutorialLesson } from './types';

export const IBERIAN_TUTORIAL_LESSONS: TutorialLesson[] = [
    {
        round: 0,
        title: 'The Missing Tens',
         forcedCards: [
             { rank: Rank.TWO, suit: Suit.DIAMONDS, value: 2, isHidden: false },  // Double card -> 13
             { rank: Rank.QUEEN, suit: Suit.CLUBS, value: 10, isHidden: true },   // Dealer Hole -> 20
             { rank: Rank.SIX, suit: Suit.CLUBS, value: 6, isHidden: false },     // Player 2nd -> 11
             { rank: Rank.TEN, suit: Suit.SPADES, value: 10, isHidden: false },   // Dealer Face -> 10
             { rank: Rank.FIVE, suit: Suit.HEARTS, value: 5, isHidden: false },   // Player 1st -> 5
         ],
        steps: [
            {
                id: 0,
                message: "48 cards instead of 52! Iberian 21 removes ALL four 10-spot cards from the deck — only J, Q, K remain as face cards. This completely changes the math!",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.selectedChipValue !== 100,
                position: 'center',
                requiresClick: true
            },
            {
                id: 1,
                message: "Select the $100 chip.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.selectedChipValue !== 100,
                targetElementId: 'chip-100',
                position: 'bottom'
            },
            {
                id: 2,
                message: "Place your bet on Seat 3.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.selectedChipValue === 100 && s.seats[2].hands[0].betAmount === 0,
                targetElementId: 'seat-3',
                position: 'bottom'
            },
            {
                id: 3,
                message: "Tap 'DEAL' to start.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.seats[2].hands[0].betAmount > 0,
                targetElementId: 'action-button-deal',
                position: 'bottom'
            },
            {
                id: 4,
                message: "Hard 11 vs Dealer 10 is a classic Iberian double. Tap DOUBLE DOWN.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 2,
                targetElementId: 'action-double',
                position: 'player'
            },
            {
                id: 5,
                message: "Ouch, you drew a 2 — now 13 vs a dealer 10. Use Double Down Rescue to drop the double.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 3,
                position: 'center',
                requiresClick: true
            },
            {
                id: 6,
                message: "Tap SURRENDER to recover your original bet and forfeit only the extra double chip.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 3,
                targetElementId: 'action-surrender',
                position: 'player'
            },
            {
                id: 7,
                message: "Dealer stood on 20. Rescue saved you from losing the doubled stake. Tap NEW ROUND.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            }
        ]
    },
    {
        round: 1,
        title: 'The Lucky Sevens',
        forcedCards: [
               { rank: Rank.SEVEN, suit: Suit.CLUBS, value: 7, isHidden: false },    // Player Hit -> 21!
               { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: true },   // Dealer Hole -> 16
               { rank: Rank.SEVEN, suit: Suit.SPADES, value: 7, isHidden: false },   // Player 2nd -> 14
               { rank: Rank.SIX, suit: Suit.HEARTS, value: 6, isHidden: false },     // Dealer Face -> 6
               { rank: Rank.SEVEN, suit: Suit.HEARTS, value: 7, isHidden: false },    // Player 1st -> 7
        ],
        steps: [
            {
                id: 0,
                message: "Iberian 21 compensates for the missing 10s with bonus payouts. The most valuable: three 7s pays an instant 3:2!",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.selectedChipValue !== 100,
                position: 'center',
                requiresClick: true
            },
            {
                id: 1,
                message: "Select the $100 chip.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.selectedChipValue !== 100,
                targetElementId: 'chip-100',
                position: 'bottom'
            },
            {
                id: 2,
                message: "Place your bet on Seat 3.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.selectedChipValue === 100 && s.seats[2].hands[0].betAmount === 0,
                targetElementId: 'seat-3',
                position: 'bottom'
            },
            {
                id: 3,
                message: "Tap 'DEAL' to start.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.seats[2].hands[0].betAmount > 0,
                targetElementId: 'action-button-deal',
                position: 'bottom'
            },
            {
                id: 4,
                message: "A pair of 7s! Normally you might split or stand vs a 6. But in Iberian 21, three 7s = instant bonus...",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 2,
                position: 'center',
                requiresClick: true
            },
            {
                id: 5,
                message: "Chase the 7-7-7! Tap HIT.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 2,
                targetElementId: 'action-hit',
                position: 'player'
            },
            {
                id: 6,
                message: "7-7-7! Instant 3:2 payout! Iberian 21 is all about hunting these bonuses to offset the missing 10s.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                position: 'center',
                requiresClick: true
            },
            {
                id: 7,
                message: "The missing 10s hurt, but the bonuses fight back. Tap 'FINISH TUTORIAL'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'finish-tutorial-button',
                position: 'player'
            }
        ]
    }
];

