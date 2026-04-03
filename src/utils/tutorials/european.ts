import { GameState } from '@/types/game';
import { Rank, Suit, GamePhase } from '@/types/enums';
import { TutorialLesson } from './types';

export const EUROPEAN_TUTORIAL_LESSONS: TutorialLesson[] = [
    {
        round: 0,
        title: 'Hard 11 Double Spot',
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
        title: 'ENHC — Hit Instead of Double',
        forcedCards: [
               { rank: Rank.NINE, suit: Suit.HEARTS, value: 9, isHidden: false },   // Hit card -> 20
               { rank: Rank.TEN, suit: Suit.HEARTS, value: 10, isHidden: true },    // Dealer hole -> Blackjack
               { rank: Rank.FIVE, suit: Suit.DIAMONDS, value: 5, isHidden: false }, // Player 2nd -> 11
               { rank: Rank.ACE, suit: Suit.SPADES, value: 11, isHidden: false },   // Dealer Face -> Ace
               { rank: Rank.SIX, suit: Suit.CLUBS, value: 6, isHidden: false },     // Player 1st -> 6
           ],
        steps: [
            {
                id: 0,
                message: "No Hole Card (ENHC): dealer takes the second card last. On 11 vs Ace, European strategy avoids DOUBLE and prefers HIT.",
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
                message: "You have 11 vs Dealer Ace. In European basic strategy this is a HIT, not a Double, because ENHC risk is high. Tap HIT.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 2,
                targetElementId: 'action-hit',
                position: 'player'
            },
            {
                id: 6,
                message: "Dealer's second card is 10 - late Blackjack under ENHC. You lose only the original bet, which is why this spot is HIT instead of DOUBLE. Tap 'NEW ROUND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            }
        ]
    },
    {
        round: 2,
        title: 'One Split Only: 8,8 Flow',
        forcedCards: [
               { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: false },    // Dealer hit -> 25 (bust)
               { rank: Rank.NINE, suit: Suit.CLUBS, value: 9, isHidden: false },       // Hand 2 split card -> 17
               { rank: Rank.TEN, suit: Suit.HEARTS, value: 10, isHidden: false },      // Hand 1 split card -> 18
               { rank: Rank.NINE, suit: Suit.SPADES, value: 9, isHidden: true },       // Dealer hole -> 15
               { rank: Rank.EIGHT, suit: Suit.DIAMONDS, value: 8, isHidden: false },   // Player 2nd -> pair 8,8
               { rank: Rank.SIX, suit: Suit.SPADES, value: 6, isHidden: false },       // Dealer Face -> 6
               { rank: Rank.EIGHT, suit: Suit.SPADES, value: 8, isHidden: false },     // Player 1st -> pair 8,8
        ],
        steps: [
            {
                id: 0,
                message: "European allows only one split, with no re-split and no double after split (no DAS). We will play 8,8 vs dealer 6.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING,
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
                message: "Pair of 8s vs dealer 6: split once to escape hard 16. Tap SPLIT.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands.length === 1,
                targetElementId: 'action-split',
                position: 'player'
            },
            {
                id: 5,
                message: "Hand 1 is 18 after split. Play it clean and tap STAND.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands.length === 2 && s.seats[2].currentHandIndex === 0,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 6,
                message: "Hand 2 is 17. No DAS here, so just lock it in. Tap STAND.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands.length === 2 && s.seats[2].currentHandIndex === 1,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 7,
                message: "Dealer busts and both split hands survive. One split only in European, so each split decision must be precise. Tap 'FINISH TUTORIAL'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'finish-tutorial-button',
                position: 'player'
            }
        ]
    }
];
