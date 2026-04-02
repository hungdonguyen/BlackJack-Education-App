import { Card, TutorialStep, GameState } from '@/types/game';
import { Rank, Suit, GamePhase } from '@/types/enums';
import { TutorialLesson } from './types';

export const FIRECARD_TUTORIAL_LESSONS: TutorialLesson[] = [
    {
        round: 0,
        title: 'Burning Bad Cards',
        forcedCards: [
             { rank: Rank.TEN, suit: Suit.CLUBS, value: 10, isHidden: false }, // Player replacement -> 20
             { rank: Rank.EIGHT, suit: Suit.DIAMONDS, value: 8, isHidden: true }, // Dealer hole -> 18
             { rank: Rank.SIX, suit: Suit.CLUBS, value: 6, isHidden: false }, // Player 2nd -> 16
             { rank: Rank.TEN, suit: Suit.SPADES, value: 10, isHidden: false }, // Dealer Face -> 10
             { rank: Rank.TEN, suit: Suit.HEARTS, value: 10, isHidden: false }, // Player 1st -> 10
        ],
        steps: [
            {
                id: 0,
                message: "Got a bad second card? BURN lets you INCINERATE your 2nd card and replace it with a new one — for half your bet!",
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
                message: "You have 16 vs a 10 — usually hopeless. But you can BURN that 6 away! Tap BURN!",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && !s.seats[2].hands[0].isBurned,
                targetElementId: 'action-burn',
                position: 'player'
            },
            {
                id: 5,
                message: "The 6 burns away... replaced by a 10! You now have a solid 20. Tap STAND.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && !!s.seats[2].hands[0].isBurned,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 6,
                message: "Dealer had 18. Your new 20 wins the hand!",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                position: 'center',
                requiresClick: true
            },
            {
                id: 7,
                message: "You paid a small tax to dodge a bullet and walked away with a win. Tap 'NEW ROUND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            }
        ]
    },
    {
        round: 1,
        title: 'Burning an Ace for Bonus',
           forcedCards: [
               { rank: Rank.KING, suit: Suit.SPADES, value: 10, isHidden: false },  // Replacement -> 19
               { rank: Rank.NINE, suit: Suit.CLUBS, value: 9, isHidden: true },     // Dealer Hole -> 18
               { rank: Rank.ACE, suit: Suit.HEARTS, value: 11, isHidden: false },   // Player 2nd (burned Ace)
               { rank: Rank.NINE, suit: Suit.DIAMONDS, value: 9, isHidden: false }, // Dealer Face -> 9
               { rank: Rank.NINE, suit: Suit.SPADES, value: 9, isHidden: false },   // Player 1st -> 9
           ],
        steps: [
            {
                id: 0,
                message: "Burning an Ace pays a BONUS. Non-spade Aces pay 3x the burn cost. Let's grab that payout.",
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
                message: "Your second card is an Ace. Burning it triggers a bonus! Tap BURN to cash in and redraw.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && !s.seats[2].hands[0].isBurned,
                targetElementId: 'action-burn',
                position: 'player'
            },
            {
                id: 5,
                message: "New card gives you 19. Lock it — tap STAND.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && !!s.seats[2].hands[0].isBurned,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 6,
                message: "Dealer stops at 18. You win the hand AND collected the 3x burn-bonus for tossing that Ace.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                position: 'center',
                requiresClick: true
            },
            {
                id: 7,
                message: "Ace burns can be profitable. Tap 'NEW ROUND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            }
        ]
    },
    {
        round: 2,
        title: 'Ace of Spades Jackpot',
        forcedCards: [
             { rank: Rank.QUEEN, suit: Suit.HEARTS, value: 10, isHidden: false }, // Replacement -> 19
             { rank: Rank.EIGHT, suit: Suit.CLUBS, value: 8, isHidden: true },    // Dealer Hole -> 17
             { rank: Rank.ACE, suit: Suit.SPADES, value: 11, isHidden: false },   // Player 2nd (burned Ace of Spades)
             { rank: Rank.NINE, suit: Suit.HEARTS, value: 9, isHidden: false },   // Dealer Face -> 9
             { rank: Rank.NINE, suit: Suit.DIAMONDS, value: 9, isHidden: false }, // Player 1st -> 9
        ],
        steps: [
            {
                id: 0,
                message: "Burning the ACE OF SPADES pays a huge 8x bonus on the burn fee. Let's trigger it.",
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
                message: "Ace of Spades in the 2nd slot — burn it to trigger the 8x bonus! Tap BURN.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && !s.seats[2].hands[0].isBurned,
                targetElementId: 'action-burn',
                position: 'player'
            },
            {
                id: 5,
                message: "Replacement card sets you up with 19. Tap STAND.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && !!s.seats[2].hands[0].isBurned,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 6,
                message: "Dealer lands on 17. You win plus the massive 8x burn bonus from tossing the Ace of Spades.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                position: 'center',
                requiresClick: true
            },
            {
                id: 7,
                message: "Ace of Spades burns are premium. Tap 'FINISH TUTORIAL'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'finish-tutorial-button',
                position: 'player'
            }
        ]
    }
];