import { GameState } from '@/types/game';
import { Rank, Suit, GamePhase } from '@/types/enums';
import { TutorialLesson } from './types';

export const EXCHANGE_TUTORIAL_LESSONS: TutorialLesson[] = [
    {
        round: 0,
        title: 'The Art of the Switch',
        forcedCards: [
             { rank: Rank.TEN, suit: Suit.SPADES, value: 10, isHidden: false },    // Player 2 Double Hit -> 21
             { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: true },   // Dealer Hole -> 18
             { rank: Rank.TEN, suit: Suit.CLUBS, value: 10, isHidden: false },     // Player 2 2nd -> 10
             { rank: Rank.SIX, suit: Suit.CLUBS, value: 6, isHidden: false },      // Player 1 2nd -> 6
             { rank: Rank.EIGHT, suit: Suit.SPADES, value: 8, isHidden: false },   // Dealer Face -> 8
             { rank: Rank.FIVE, suit: Suit.DIAMONDS, value: 5, isHidden: false },  // Player 2 1st -> 5
             { rank: Rank.TEN, suit: Suit.HEARTS, value: 10, isHidden: false },    // Player 1 1st -> 10
        ],
        steps: [
            {
                id: 0,
                message: "Exchange 21 forces you to play 2 hands at once — but in return, you can SWAP the second card between your hands to create killer combos!",
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
                message: "Place your bet on Seat 3. This one bet will fund TWO hands.",
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
                message: "Hand 1 has a weak 16, Hand 2 has a weak 15. But look — you can SWITCH their second cards! Tap SWITCH!",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands.length === 2 && s.seats[2].hands[0].cards.length === 2 && s.seats[2].hands[0].cards[1].rank === Rank.SIX,
                targetElementId: 'action-switch',
                position: 'player'
            },
            {
                id: 5,
                message: "Hand 1 transforms into a solid 20! Tap STAND.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 2 && s.seats[2].hands[0].cards[1].rank === Rank.TEN && s.currentSeatIndex === 2 && s.seats[2].currentHandIndex === 0,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 6,
                message: "Hand 2 dropped to 11 — the BEST total to Double Down on! Tap DOUBLE DOWN.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.currentSeatIndex === 2 && s.seats[2].currentHandIndex === 1,
                targetElementId: 'action-double',
                position: 'player'
            },
            {
                id: 7,
                message: "Dealer reveals 18. Both of your masterfully crafted hands win! Brilliant execution.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                position: 'center',
                requiresClick: true
            },
            {
                id: 8,
                message: "Two losing hands became a triple-bet win — just by swapping two cards. Tap 'NEW ROUND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            }
        ]
    },
    {
        round: 1,
        title: 'Cruel Variance',
        forcedCards: [
             { rank: Rank.SIX, suit: Suit.HEARTS, value: 6, isHidden: false },     // Dealer hit -> 21
             { rank: Rank.TEN, suit: Suit.SPADES, value: 10, isHidden: false },    // Player 2 Double Hit -> 20
             { rank: Rank.FIVE, suit: Suit.DIAMONDS, value: 5, isHidden: true },   // Dealer Hole -> 15
             { rank: Rank.TEN, suit: Suit.CLUBS, value: 10, isHidden: false },     // Player 2 2nd -> 10
             { rank: Rank.SIX, suit: Suit.CLUBS, value: 6, isHidden: false },      // Player 1 2nd -> 6
             { rank: Rank.TEN, suit: Suit.SPADES, value: 10, isHidden: false },    // Dealer Face -> 10
             { rank: Rank.FOUR, suit: Suit.DIAMONDS, value: 4, isHidden: false },  // Player 2 1st -> 4
             { rank: Rank.TEN, suit: Suit.HEARTS, value: 10, isHidden: false },    // Player 1 1st -> 10
        ],
        steps: [
            {
                id: 0,
                message: "The SWITCH gives you incredible control — but the dealer still has the final say. Let's see a tough beat.",
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
                message: "Place your bet on Seat 3. This one bet will fund TWO hands.",
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
                message: "Two awful hands (16 and 14) against a Dealer 10. A nightmare. Tap SWITCH to reorganize.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands.length === 2 && s.seats[2].hands[0].cards[1].rank === Rank.SIX,
                targetElementId: 'action-switch',
                position: 'player'
            },
            {
                id: 5,
                message: "Instant 20! Tap STAND.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.currentSeatIndex === 2 && s.seats[2].currentHandIndex === 0 && s.seats[2].hands[0].cards[1].rank === Rank.TEN,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 6,
                message: "Hand 2 is now 10 vs dealer 10. Exchange strategy plays this as HIT, not double. Tap HIT.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.currentSeatIndex === 2 && s.seats[2].currentHandIndex === 1,
                targetElementId: 'action-hit',
                position: 'player'
            },
            {
                id: 7,
                message: "You crafted two perfect 20s! But Dealer pulls a 21 out of thin air. Total wipeout.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                position: 'center',
                requiresClick: true
            },
            {
                id: 8,
                message: "Exchange gives you incredible control, but the shoe dictates reality. Tap 'NEW ROUND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            }
        ]
    }
    ,
    {
        round: 2,
        title: 'Push 22 Tax',
        forcedCards: [
             { rank: Rank.SIX, suit: Suit.DIAMONDS, value: 6, isHidden: false },   // Dealer hit -> 22 push
             { rank: Rank.JACK, suit: Suit.CLUBS, value: 10, isHidden: false },   // Player Hand 2 Double -> 20
             { rank: Rank.SIX, suit: Suit.HEARTS, value: 6, isHidden: true },     // Dealer Hole -> 16
             { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: false }, // Player Hand 2 2nd -> 10
             { rank: Rank.TWO, suit: Suit.DIAMONDS, value: 2, isHidden: false },  // Player Hand 1 2nd -> 2
             { rank: Rank.QUEEN, suit: Suit.CLUBS, value: 10, isHidden: false },  // Dealer Face -> 10
             { rank: Rank.EIGHT, suit: Suit.HEARTS, value: 8, isHidden: false },  // Player Hand 2 1st -> 8
             { rank: Rank.TEN, suit: Suit.SPADES, value: 10, isHidden: false },   // Player Hand 1 1st -> 10
        ],
        steps: [
            {
                id: 0,
                message: "Exchange 21 has a hidden tax: Dealer 22 pushes everything. Let's see it in action.",
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
                message: "Place your bet on Seat 3 (powers both hands).",
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
                message: "Switch their second cards to craft a 20 on Hand 1 and a juicy 10 on Hand 2. Tap SWITCH.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards[1].rank === Rank.TWO,
                targetElementId: 'action-switch',
                position: 'player'
            },
            {
                id: 5,
                message: "Hand 1 is now a sturdy 20. Lock it in — tap STAND.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards[1].rank === Rank.TEN && s.currentSeatIndex === 2 && s.seats[2].currentHandIndex === 0,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 6,
                message: "Hand 2 sits at 10 against dealer 10. Table action is HIT. Tap HIT.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.currentSeatIndex === 2 && s.seats[2].currentHandIndex === 1,
                targetElementId: 'action-hit',
                position: 'player'
            },
            {
                id: 7,
                message: "Dealer climbs to 22 — every non-Blackjack hand PUSHES. Even your 20 and 20 (after the double) get returned.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                position: 'center',
                requiresClick: true
            },
            {
                id: 8,
                message: "That's the 22 push tax. Tap 'FINISH TUTORIAL'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'finish-tutorial-button',
                position: 'player'
            }
        ]
    }
];

