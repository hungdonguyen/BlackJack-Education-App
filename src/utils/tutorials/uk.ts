import { Card, TutorialStep, GameState } from '@/types/game';
import { Rank, Suit, GamePhase } from '@/types/enums';
import { TutorialLesson } from './types';

export const UK_TUTORIAL_LESSONS: TutorialLesson[] = [
    {
        round: 0,
        title: 'Original Bets Only (OBO)',
        forcedCards: [
            { rank: Rank.ACE, suit: Suit.DIAMONDS, value: 11, isHidden: false },   // Dealer 2nd card -> Blackjack
            { rank: Rank.NINE, suit: Suit.CLUBS, value: 9, isHidden: false },      // Hand 2 after split -> 17
            { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: false },   // Hand 1 after split -> 18
            { rank: Rank.EIGHT, suit: Suit.CLUBS, value: 8, isHidden: false },     // Player 2nd -> 8
            { rank: Rank.TEN, suit: Suit.SPADES, value: 10, isHidden: false },     // Dealer face -> 10
            { rank: Rank.EIGHT, suit: Suit.HEARTS, value: 8, isHidden: false },    // Player 1st -> 8
        ],
        steps: [
            {
                id: 0,
                message: "UK Rules use ENHC (no hole card) but add OBO — extra split/double bets are refunded if the dealer later shows Blackjack.",
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
                message: "Pair of 8s vs dealer 10. With OBO, splitting is safe because extra bets are protected. Tap SPLIT.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands.length === 1,
                targetElementId: 'action-split',
                position: 'player'
            },
            {
                id: 5,
                message: "First hand drew a 10 for 18. Tap STAND.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands.length === 2 && s.seats[2].currentHandIndex === 0,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 6,
                message: "Second hand drew a 9 for 17. Tap STAND.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands.length === 2 && s.seats[2].currentHandIndex === 1,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 7,
                message: "Dealer finally reveals the hole card... an Ace for Blackjack.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                position: 'center',
                requiresClick: true
            },
            {
                id: 8,
                message: "OBO kicks in: your original hand loses, but the split hand is REFUNDED. This is why splitting 8s vs 10 is OK in UK rules. Tap NEW ROUND.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            }
        ]
    },
    {
        round: 1,
        title: 'Soft Double Freedom',
        forcedCards: [
            { rank: Rank.TWO, suit: Suit.CLUBS, value: 2, isHidden: false },       // Dealer Hit -> 17
            { rank: Rank.THREE, suit: Suit.DIAMONDS, value: 3, isHidden: false },  // Player Double Card -> 21
            { rank: Rank.NINE, suit: Suit.SPADES, value: 9, isHidden: true },      // Dealer Hole -> 15
            { rank: Rank.SEVEN, suit: Suit.HEARTS, value: 7, isHidden: false },    // Player 2nd -> soft 18
            { rank: Rank.SIX, suit: Suit.CLUBS, value: 6, isHidden: false },       // Dealer Face -> 6
            { rank: Rank.ACE, suit: Suit.SPADES, value: 11, isHidden: false },     // Player 1st -> Ace
        ],
        steps: [
            {
                id: 0,
                message: "UK lets you double on ANY two cards, including soft hands. This is a major difference from European blackjack.",
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
                message: "Tap 'DEAL'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.seats[2].hands[0].betAmount > 0,
                targetElementId: 'action-button-deal',
                position: 'bottom'
            },
            {
                id: 4,
                message: "Soft 18 against a 6 is a strong UK double. Tap DOUBLE.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 2,
                targetElementId: 'action-double',
                position: 'player'
            },
            {
                id: 5,
                message: "You drew a 3 and reached 21. UK allows this soft double. Tap 'NEW ROUND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            }
        ]
    },
    {
        round: 2,
        title: 'Double After Split',
        forcedCards: [
            { rank: Rank.TEN, suit: Suit.HEARTS, value: 10, isHidden: false },     // Dealer Hit -> 25 bust
            { rank: Rank.TEN, suit: Suit.CLUBS, value: 10, isHidden: false },      // Hand 2 Double Card -> 21
            { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: false },   // Hand 1 Double Card -> 20
            { rank: Rank.NINE, suit: Suit.SPADES, value: 9, isHidden: true },      // Dealer Hole -> 15
            { rank: Rank.THREE, suit: Suit.CLUBS, value: 3, isHidden: false },     // Hand 2 Split Card -> 11
            { rank: Rank.TWO, suit: Suit.HEARTS, value: 2, isHidden: false },      // Hand 1 Split Card -> 10
            { rank: Rank.SIX, suit: Suit.DIAMONDS, value: 6, isHidden: false },    // Dealer Face -> 6
            { rank: Rank.EIGHT, suit: Suit.CLUBS, value: 8, isHidden: false },     // Player 2nd -> pair
            { rank: Rank.EIGHT, suit: Suit.SPADES, value: 8, isHidden: false },    // Player 1st -> pair
        ],
        steps: [
            {
                id: 0,
                message: "UK also allows double after split. We'll split 8s, then press the advantage on both new hands.",
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
                message: "Tap 'DEAL'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.seats[2].hands[0].betAmount > 0,
                targetElementId: 'action-button-deal',
                position: 'bottom'
            },
            {
                id: 4,
                message: "Pair of 8s vs a 6. Split them, then use the new hands aggressively. Tap SPLIT.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands.length === 1,
                targetElementId: 'action-split',
                position: 'player'
            },
            {
                id: 5,
                message: "Hand 1 is now 10. In UK, you can double after a split. Tap DOUBLE.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands.length === 2 && s.seats[2].currentHandIndex === 0,
                targetElementId: 'action-double',
                position: 'player'
            },
            {
                id: 6,
                message: "Hand 2 is now 11. Double that one too. Tap DOUBLE.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands.length === 2 && s.seats[2].currentHandIndex === 1,
                targetElementId: 'action-double',
                position: 'player'
            },
            {
                id: 7,
                message: "Both split hands improved, and the dealer busted. That's split-and-double freedom in UK rules. Tap 'FINISH TUTORIAL'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'finish-tutorial-button',
                position: 'player'
            }
        ]
    }
];
