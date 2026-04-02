import { Card, TutorialStep, GameState } from '@/types/game';
import { Rank, Suit, GamePhase } from '@/types/enums';
import { TutorialLesson } from './types';

export const FREE_ACTION_TUTORIAL_LESSONS: TutorialLesson[] = [
    {
        round: 0,
        title: 'Push 22 Rule',
        forcedCards: [
            { rank: Rank.SIX, suit: Suit.DIAMONDS, value: 6, isHidden: false },   // Dealer draws second 6 -> 22 Push!
            { rank: Rank.SIX, suit: Suit.HEARTS, value: 6, isHidden: false },     // Dealer draws first 6 -> 16
            { rank: Rank.FOUR, suit: Suit.DIAMONDS, value: 4, isHidden: true },   // Dealer Hole -> 10
            { rank: Rank.SEVEN, suit: Suit.DIAMONDS, value: 7, isHidden: false }, // Player 2nd -> 17
            { rank: Rank.SIX, suit: Suit.SPADES, value: 6, isHidden: false },     // Dealer Face -> 6
            { rank: Rank.TEN, suit: Suit.SPADES, value: 10, isHidden: false },    // Player 1st -> 10 => 17 total
        ],
        steps: [
            {
                id: 0,
                message: "Before getting to the Free Actions, there's a vital catch you must know — if the Dealer hits exactly 22, it's a PUSH instead of a bust!",
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
                message: "You have a hard 17. Tap STAND.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 5,
                message: "Dealer busts with exactly 22! But in Free Action, Dealer 22 means all non-busted hands PUSH instead of winning.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                position: 'center',
                requiresClick: true
            },
            {
                id: 6,
                message: "Frustrating — but that's the price for all the free bets you're about to get. Tap 'NEW ROUND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            }
        ]
    },
    {
        round: 1,
        title: 'The Free Win',
        forcedCards: [
            { rank: Rank.NINE, suit: Suit.CLUBS, value: 9, isHidden: false },
            { rank: Rank.EIGHT, suit: Suit.DIAMONDS, value: 8, isHidden: true },
            { rank: Rank.FIVE, suit: Suit.SPADES, value: 5, isHidden: false },
            { rank: Rank.NINE, suit: Suit.HEARTS, value: 9, isHidden: false },
            { rank: Rank.SIX, suit: Suit.CLUBS, value: 6, isHidden: false }
        ],
        steps: [
            {
                id: 0,
                message: "Double Down on 9, 10, or 11? FREE! Split a pair? FREE! Let's see that Free Double in action.",
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
                message: "Tap 'DEAL'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.seats[2].hands[0].betAmount > 0,
                targetElementId: 'action-button-deal',
                position: 'bottom'
            },
            {
                id: 4,
                message: "You have an 11. It's a Free Double! Tap DOUBLE DOWN. You won't risk extra chips.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                targetElementId: 'action-double',
                position: 'player'
            },
            {
                id: 5,
                message: "You get a 20! Dealer has 17. The Free Double pays off like a real chip. You win $200! Tap 'NEW ROUND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            }
        ]
    },
    {
        round: 2,
        title: 'The Free Split Trap',
        forcedCards: [
            { rank: Rank.FIVE, suit: Suit.HEARTS, value: 5, isHidden: false },    // Hand 2 Double Card -> 16
            { rank: Rank.THREE, suit: Suit.SPADES, value: 3, isHidden: false },   // Hand 2 Split Card -> 11
            { rank: Rank.TEN, suit: Suit.HEARTS, value: 10, isHidden: false },   // Hand 1 Split Card -> 18
            { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: true },   // Dealer Hole -> 20
            { rank: Rank.EIGHT, suit: Suit.CLUBS, value: 8, isHidden: false },    // Player 2nd -> 8
            { rank: Rank.TEN, suit: Suit.SPADES, value: 10, isHidden: false },    // Dealer Face -> 10
            { rank: Rank.EIGHT, suit: Suit.HEARTS, value: 8, isHidden: false },   // Player 1st -> 8
        ],
        steps: [
            {
                id: 0,
                message: "Splitting pairs (except 10s) is completely FREE here. Let's see how that changes your strategy.",
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
                message: "A pair of 8s vs a 10. You should ALWAYS take the Free Split. Tap SPLIT.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands.length === 1,
                targetElementId: 'action-split',
                position: 'player'
            },
            {
                id: 5,
                message: "Hand 1 has 18 vs a 10. A solid hand — tap STAND.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands.length === 2 && s.seats[2].currentHandIndex === 0,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 6,
                message: "Hand 2 has 11 — qualifies for a Free Double! Tap DOUBLE DOWN.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands.length === 2 && s.seats[2].currentHandIndex === 1,
                targetElementId: 'action-double',
                position: 'player'
            },
            {
                id: 7,
                message: "Dealer revealed 20. Both your hands lose...",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                position: 'center',
                requiresClick: true
            },
            {
                id: 8,
                message: "...But you ONLY lost your original $100 bet! The Free Split and Free Double chips vanish harmlessly. Math favors the free bet. Tap 'FINISH TUTORIAL'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'finish-tutorial-button',
                position: 'player'
            }
        ]
    }
];
