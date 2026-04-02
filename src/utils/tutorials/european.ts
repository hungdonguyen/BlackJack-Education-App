import { Card, TutorialStep, GameState } from '@/types/game';
import { Rank, Suit, GamePhase } from '@/types/enums';
import { TutorialLesson } from './types';

export const EUROPEAN_TUTORIAL_LESSONS: TutorialLesson[] = [
    {
        round: 0,
        title: 'Hard 11 — the only double',
        forcedCards: [
             { rank: Rank.NINE, suit: Suit.SPADES, value: 9, isHidden: false },    // Dealer Hit -> 24 (bust)
             { rank: Rank.NINE, suit: Suit.CLUBS, value: 9, isHidden: true },      // Dealer hole -> 15
             { rank: Rank.TEN, suit: Suit.HEARTS, value: 10, isHidden: false },    // Double card -> 21
             { rank: Rank.SIX, suit: Suit.DIAMONDS, value: 6, isHidden: false },   // Player 2nd -> 11
             { rank: Rank.SIX, suit: Suit.CLUBS, value: 6, isHidden: false },      // Dealer Face -> 6
             { rank: Rank.FIVE, suit: Suit.HEARTS, value: 5, isHidden: false },    // Player 1st -> 5
        ],
        steps: [
            {
                id: 0,
                message: "European blackjack only lets you DOUBLE on hard 9, 10, or 11. Let's use the perfect 11 vs a weak 6.",
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
                message: "Hard 11 vs dealer 6 — this is exactly when you ARE allowed to double in European. Tap DOUBLE DOWN.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 2,
                targetElementId: 'action-double',
                position: 'player'
            },
            {
                id: 5,
                message: "You hit 21. Dealer pulls to 24 and busts. Restricted doubles still pay when used correctly. Tap NEW ROUND.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            }
        ]
    },
    {
        round: 1,
        title: 'ENHC — avoid bad doubles',
           forcedCards: [
               { rank: Rank.TEN, suit: Suit.HEARTS, value: 10, isHidden: true },   // Dealer hole -> Blackjack
               { rank: Rank.EIGHT, suit: Suit.CLUBS, value: 8, isHidden: false },  // Player Hit -> 20
               { rank: Rank.TWO, suit: Suit.DIAMONDS, value: 2, isHidden: false }, // Player 2nd -> 12
               { rank: Rank.ACE, suit: Suit.SPADES, value: 11, isHidden: false },  // Dealer Face -> Ace
               { rank: Rank.TEN, suit: Suit.CLUBS, value: 10, isHidden: false },   // Player 1st -> 10
           ],
        steps: [
            {
                id: 0,
                message: "No Hole Card (ENHC): the dealer waits to draw the 2nd card. Against an Ace you must play first — risky for doubles/splits.",
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
                message: "Decline insurance.",
                condition: (s: GameState) => s.gamePhase === GamePhase.INSURANCE,
                targetElementId: 'insurance-decline',
                position: 'center'
            },
            {
                id: 5,
                message: "You have 12 vs Dealer Ace. ENHC basic strategy: HIT (do not double/split into a possible dealer Blackjack). Tap HIT.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 2,
                targetElementId: 'action-hit',
                position: 'player'
            },
            {
                id: 6,
                message: "Great — 20. Tap STAND.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 3,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 7,
                message: "Dealer's second card is a 10 — Blackjack revealed late. Because you didn't double, you only lost the original bet. Tap FINISH TUTORIAL.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'finish-tutorial-button',
                position: 'player'
            }
        ]
    }
];
