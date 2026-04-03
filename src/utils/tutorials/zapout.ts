import { Card, TutorialStep, GameState } from '@/types/game';
import { Rank, Suit, GamePhase } from '@/types/enums';
import { TutorialLesson } from './types';

export const ZAPOUT_TUTORIAL_LESSONS: TutorialLesson[] = [
    {
        round: 0,
        title: 'Zapping Out a Trap',
        forcedCards: [
            { rank: Rank.TEN, suit: Suit.CLUBS, value: 10, isHidden: false },     // Player Zap 2 -> 20
            { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: false },  // Player Zap 1 -> 20
            { rank: Rank.NINE, suit: Suit.DIAMONDS, value: 9, isHidden: true },   // Dealer Hole -> 19
            { rank: Rank.SIX, suit: Suit.CLUBS, value: 6, isHidden: false },      // Player 2nd -> 16
            { rank: Rank.TEN, suit: Suit.SPADES, value: 10, isHidden: false },    // Dealer Face -> 10
            { rank: Rank.TEN, suit: Suit.HEARTS, value: 10, isHidden: false },    // Player 1st -> 10
        ],
        steps: [
            {
                id: 0,
                message: "Got 2 terrible cards? ZAP OUT lets you discard your ENTIRE hand and draw 2 brand new cards — a power no other table offers!",
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
                message: "Hard 16 vs a 10 — the worst spot in Blackjack. Tap ZAP OUT to throw away both cards and get a fresh hand (you only get one zap per hand).",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 2 && !s.seats[2].hands[0].isZapped,
                targetElementId: 'action-zapout',
                position: 'player'
            },
            {
                id: 5,
                message: "You zapped into a 20! Tap STAND to lock it in.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && !!s.seats[2].hands[0].isZapped,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 6,
                message: "That round shows the upside of a good Zap: weak start, strong finish.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                position: 'center',
                requiresClick: true
            },
            {
                id: 7,
                message: "Use ZAP on the right totals, not every hand. Tap NEW ROUND.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            }
        ]
    },
    {
        round: 1,
        title: 'The Risk of Zapping',
        forcedCards: [
             { rank: Rank.TEN, suit: Suit.HEARTS, value: 10, isHidden: false },    // Player Hit after Zap -> Bust!
             { rank: Rank.FIVE, suit: Suit.CLUBS, value: 5, isHidden: false },     // Player Zap 2 -> 15
             { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: false },  // Player Zap 1 -> 10
             { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: true },   // Dealer Hole -> 18
             { rank: Rank.SIX, suit: Suit.CLUBS, value: 6, isHidden: false },      // Player 2nd -> 15
             { rank: Rank.EIGHT, suit: Suit.SPADES, value: 8, isHidden: false },   // Dealer Face -> 8
             { rank: Rank.NINE, suit: Suit.HEARTS, value: 9, isHidden: false },    // Player 1st -> 9
        ],
        steps: [
            {
                id: 0,
                message: "ZAP OUT isn't magic — it can backfire. Let's see what happens when luck doesn't cooperate.",
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
                message: "Hard 15 vs 8. Still a bad hand — tap ZAP OUT.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 2 && s.seats[2].hands[0].cards[0].rank === Rank.NINE,
                targetElementId: 'action-zapout',
                position: 'player'
            },
            {
                id: 5,
                message: "You zapped into another 15 (10 + 5)! No improvement. You must play it now — tap HIT.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 2 && s.seats[2].hands[0].cards[0].rank === Rank.TEN,
                targetElementId: 'action-hit',
                position: 'player'
            },
            {
                id: 6,
                message: "This time the redraw did not help. Zap changes the hand, but variance still decides the result.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                position: 'center',
                requiresClick: true
            },
            {
                id: 7,
                message: "Focus on long-run decision quality, not one outcome. Tap 'NEW ROUND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            }
        ]
    },
    {
        round: 2,
        title: 'Dealer Pushes on 22',
        forcedCards: [
             { rank: Rank.SIX, suit: Suit.DIAMONDS, value: 6, isHidden: false },   // Dealer hit -> 22 push
             { rank: Rank.KING, suit: Suit.CLUBS, value: 10, isHidden: false },   // Zap new card 2 -> 20
             { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: false }, // Zap new card 1 -> 20
             { rank: Rank.SIX, suit: Suit.HEARTS, value: 6, isHidden: true },     // Dealer Hole -> 16
             { rank: Rank.EIGHT, suit: Suit.CLUBS, value: 8, isHidden: false },   // Player 2nd -> 16
             { rank: Rank.TEN, suit: Suit.SPADES, value: 10, isHidden: false },   // Dealer Face -> 10
             { rank: Rank.EIGHT, suit: Suit.HEARTS, value: 8, isHidden: false },  // Player 1st -> 8
        ],
        steps: [
            {
                id: 0,
                message: "Zap Out is great — until Dealer hits 22 and wipes the table. Let's walk through that push rule.",
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
                message: "Hard 16 vs a Dealer 10 — zap it! Tap ZAP OUT.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 2 && !s.seats[2].hands[0].isZapped,
                targetElementId: 'action-zapout',
                position: 'player'
            },
            {
                id: 5,
                message: "Great — a fresh 20. Tap STAND.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && !!s.seats[2].hands[0].isZapped,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 6,
                message: "Dealer reaches 22. In Zap Out 21, that means a push for non-natural blackjacks.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                position: 'center',
                requiresClick: true
            },
            {
                id: 7,
                message: "Remember: 22 pushes are the cost of Zapping. Tap 'FINISH TUTORIAL'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'finish-tutorial-button',
                position: 'player'
            }
        ]
    }
];
