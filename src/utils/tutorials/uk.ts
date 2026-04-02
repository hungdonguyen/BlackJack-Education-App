import { Card, TutorialStep, GameState } from '@/types/game';
import { Rank, Suit, GamePhase } from '@/types/enums';
import { TutorialLesson } from './types';

export const UK_TUTORIAL_LESSONS: TutorialLesson[] = [
    {
        round: 0,
        title: 'Original Bets Only (OBO)',
        forcedCards: [
            { rank: Rank.NINE, suit: Suit.CLUBS, value: 9, isHidden: false },      // Hand 2 after split -> 17
            { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: false },   // Hand 1 after split -> 18
            { rank: Rank.ACE, suit: Suit.DIAMONDS, value: 11, isHidden: true },    // Dealer hole -> Blackjack
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
                message: "OBO kicks in: your original hand loses, but the split hand is REFUNDED. This is why splitting 8s vs 10 is OK in UK rules. Tap FINISH TUTORIAL.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'finish-tutorial-button',
                position: 'player'
            }
        ]
    }
];
