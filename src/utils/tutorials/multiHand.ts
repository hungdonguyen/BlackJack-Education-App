import { Card, TutorialStep, GameState } from '@/types/game';
import { Rank, Suit, GamePhase } from '@/types/enums';
import { TutorialLesson } from './types';

export const MULTI_HAND_TUTORIAL_LESSONS: TutorialLesson[] = [
    {
        round: 0,
        title: "Multi-Hand Play",
        forcedCards: [
            // LIFO (Rút từ dưới lên trên)
            { rank: Rank.TEN, suit: Suit.CLUBS, value: 10, isHidden: false },     // 7. Dealer Hit -> 26 (BUST)
            { rank: Rank.EIGHT, suit: Suit.HEARTS, value: 8, isHidden: false },   // 6. Player Seat 4 Hit -> 8 (Tổng 18)
            { rank: Rank.SIX, suit: Suit.DIAMONDS, value: 6, isHidden: true },    // 5. Dealer Hole -> 6 (Tổng 10+6=16)
            { rank: Rank.FOUR, suit: Suit.HEARTS, value: 4, isHidden: false },    // 4. Player Seat 4 2nd -> 4 (Tổng 6+4=10 điểm)
            { rank: Rank.ACE, suit: Suit.SPADES, value: 11, isHidden: false },    // 3. Player Seat 2 2nd -> Ace (Tổng 9+A=20 điểm)
            { rank: Rank.TEN, suit: Suit.CLUBS, value: 10, isHidden: false },     // 2. Dealer Face -> 10
            { rank: Rank.SIX, suit: Suit.SPADES, value: 6, isHidden: false },     // 1. Player Seat 4 1st -> 6
            { rank: Rank.NINE, suit: Suit.DIAMONDS, value: 9, isHidden: false },  // 0. Player Seat 2 1st -> 9
        ],
        steps: [
            {
                id: 0,
                message: "Ready to play multiple hands at once? This increases your action. Select the $100 chip.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.selectedChipValue !== 100,
                targetElementId: 'chip-100',
                position: 'bottom'
            },
            {
                id: 1,
                message: "First, click on Seat 2 (left of center) to unlock it.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.selectedChipValue === 100 && !s.seats[1].isActive,
                targetElementId: 'seat-2',
                position: 'bottom'
            },
            {
                id: 2,
                message: "Now place a bet on Seat 2.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.selectedChipValue === 100 && s.seats[1].isActive && s.seats[1].hands[0].betAmount === 0,
                targetElementId: 'seat-2',
                position: 'bottom'
            },
            {
                id: 3,
                message: "Click on Seat 4 (right of center) to unlock it.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.seats[1].hands[0].betAmount > 0 && !s.seats[3].isActive,  
                targetElementId: 'seat-4',
                position: 'bottom'
            },
            {
                id: 4,
                message: "Place a bet on Seat 4.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.seats[3].isActive && s.seats[3].hands[0].betAmount === 0,  
                targetElementId: 'seat-4',
                position: 'bottom'
            },
            {
                id: 5,
                message: "Great! Let's deal.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.seats[1].hands[0].betAmount > 0 && s.seats[3].hands[0].betAmount > 0,    
                targetElementId: 'deal-button',
                position: 'bottom'
            },
            {
                id: 6,
                message: "You are now acting on Seat 2 first. You have a Soft 20 (Ace and 9). A very strong hand. Tap 'STAND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.currentSeatIndex === 1,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 7,
                message: "Now action moves to Seat 4. You have a Hard 10 against the Dealer's 10. Normally you might hit, let's HIT.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.currentSeatIndex === 3 && s.seats[s.currentSeatIndex].hands[0].cards.length === 2,
                targetElementId: 'action-hit',
                position: 'player'
            },
            {
                id: 8,
                message: "You got an 8, giving you 18. Tap 'STAND'.",        
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.currentSeatIndex === 3 && s.seats[s.currentSeatIndex].hands[0].cards.length === 3,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 9,
                message: "Both hands played perfectly! Tap 'NEW ROUND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            }
        ]
    },
    {
        round: 1,
        title: "Free Practice",
        forcedCards: [],
        steps: [
            {
                id: 0,
                message: "Now play a round on your own! Bet on multiple seats to see the flow.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING,
                position: 'center',
                requiresClick: true
            },
            {
                id: 1,
                message: "Place your bets on any active seats and tap 'DEAL'.",
                condition: (s: GameState) => true,
                position: 'bottom',
                hideOn: (s: GameState) => s.gamePhase !== GamePhase.BETTING
            }
        ]
    }
];
