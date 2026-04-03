import { GameState } from '@/types/game';
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
        title: 'Non-Spade Ace: Optional Burn',
           forcedCards: [
               { rank: Rank.EIGHT, suit: Suit.CLUBS, value: 8, isHidden: true },     // Dealer Hole -> 17
               { rank: Rank.ACE, suit: Suit.HEARTS, value: 11, isHidden: false },    // Player 2nd -> Soft 20
               { rank: Rank.NINE, suit: Suit.DIAMONDS, value: 9, isHidden: false },  // Dealer Face -> 9
               { rank: Rank.NINE, suit: Suit.SPADES, value: 9, isHidden: false },    // Player 1st -> 9
           ],
        steps: [
            {
                id: 0,
                message: "Ace policy update: with a non-spade Ace as 2nd card, advisor can show base action/BURN. A-spade remains always-burn.",
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
                message: "You have Soft 20 vs dealer 9. Base chart says STAND, and advisor may show STAND/BURN because your 2nd card is a non-spade Ace. Tap STAND.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && !s.seats[2].hands[0].isBurned && s.seats[2].hands[0].cards.length === 2,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 5,
                message: "Dealer finishes at 17. Your Soft 20 wins without using BURN.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                position: 'center',
                requiresClick: true
            },
            {
                id: 6,
                message: "This round follows base action first. Non-spade Ace can still be played as optional STAND/BURN depending on your line.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            },
        ]
    },
    {
        round: 2,
        title: 'Ace of Spades Burn Bonus',
        forcedCards: [
             { rank: Rank.KING, suit: Suit.CLUBS, value: 10, isHidden: false },   // Replacement after burn -> 19
             { rank: Rank.NINE, suit: Suit.CLUBS, value: 9, isHidden: true },     // Dealer Hole -> 18
             { rank: Rank.ACE, suit: Suit.SPADES, value: 11, isHidden: false },   // Player 2nd (burn target)
             { rank: Rank.NINE, suit: Suit.HEARTS, value: 9, isHidden: false },   // Dealer Face -> 9
             { rank: Rank.NINE, suit: Suit.DIAMONDS, value: 9, isHidden: false }, // Player 1st -> 9
        ],
        steps: [
            {
                id: 0,
                message: "When the second card is any Ace, advisor can show base action/BURN. If it is Ace of Spades, always BURN for premium payout.",
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
                message: "Your second card is A♠. Burn it now to trigger the premium burn bonus. Tap BURN.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && !s.seats[2].hands[0].isBurned,
                targetElementId: 'action-burn',
                position: 'player'
            },
            {
                id: 5,
                message: "Replacement card gives you 19. Tap STAND.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && !!s.seats[2].hands[0].isBurned,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 6,
                message: "Dealer lands on 18. You win the hand and collect the Ace of Spades burn bonus.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                position: 'center',
                requiresClick: true
            },
            {
                id: 7,
                message: "Remember: A-spade second card is always-burn; other Aces can be played as base action/BURN. Tap 'FINISH TUTORIAL'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'finish-tutorial-button',
                position: 'player'
            }
        ]
    }
];