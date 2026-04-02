import { Card, TutorialStep, GameState } from '@/types/game';
import { Rank, Suit, GamePhase } from '@/types/enums';
import { TutorialLesson } from './types';

export const DOUBLE_TUTORIAL_LESSONS: TutorialLesson[] = [
    {
        round: 0,
        title: "The Power of 11",
        // P1(6), D1(6), P2(5->11), D2(10). Player Double -> 9 (20). Dealer (16) -> Hit 10 -> Bust.
        forcedCards: [
             { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: false }, // Dealer Hit -> 26 BUST
             { rank: Rank.NINE, suit: Suit.HEARTS, value: 9, isHidden: false },   // Player Double Card -> 20
             { rank: Rank.TEN, suit: Suit.CLUBS, value: 10, isHidden: true },     // Dealer Hole (10)
             { rank: Rank.FIVE, suit: Suit.CLUBS, value: 5, isHidden: false },    // Player 2nd (5)
             { rank: Rank.SIX, suit: Suit.HEARTS, value: 6, isHidden: false },    // Dealer Face (6)
             { rank: Rank.SIX, suit: Suit.SPADES, value: 6, isHidden: false },    // Player 1st (6)
        ],
        steps: [
            {
                id: 0,
                message: "Welcome to the Double Down tutorial! Doubling allows you to double your bet (x2) but you only get ONE card and must stand.",
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
                message: "You have 11 (6+5) versus the Dealer's 6. This is the BEST time to Double Down.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                position: 'center',
                requiresClick: true
            },
            {
                id: 5,
                message: "Tap 'DOUBLE' to bet 2x. You will receive exactly 1 card and your turn will end automatically. It costs $100 (your original bet) to Double Down.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                targetElementId: 'action-double',
                position: 'player'
            },
            {
                id: 6,
                message: "You received your one card (9) and stood on 20. The Dealer busted. You won big!",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            }
        ]
    },
    {
        round: 1,
        title: "Doubling Hard 10",
        // P1(5), D1(9), P2(5->10), D2(8). Player Double -> 10 (20). Dealer (17) -> Stands.
        // Stack Order (LIFO): P1, D1, P2, D2(Hole), DoubleCard
        forcedCards: [
             { rank: Rank.TEN, suit: Suit.CLUBS, value: 10, isHidden: false },    // Double Card -> 20 (Last Pop)
             { rank: Rank.EIGHT, suit: Suit.DIAMONDS, value: 8, isHidden: true }, // Dealer Hole (8) (2nd Last Pop) 
             { rank: Rank.FIVE, suit: Suit.HEARTS, value: 5, isHidden: false },   // Player 2nd (5)
             { rank: Rank.NINE, suit: Suit.SPADES, value: 9, isHidden: false },   // Dealer Face (9)
             { rank: Rank.FIVE, suit: Suit.SPADES, value: 5, isHidden: false },   // Player 1st (5) (First Pop)
        ],
        steps: [
            {
                id: 0,
                message: "Another chance. Doubling costs another 100% of your bet and limits you to ONE more card only. Select the $100 chip.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.selectedChipValue !== 100,
                targetElementId: 'chip-100',
                position: 'bottom'
            },
            {
                id: 1,
                message: "Place your bet on Seat 3.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.selectedChipValue === 100 && s.seats[2].hands[0].betAmount === 0,
                targetElementId: 'seat-3',
                position: 'bottom'
            },
            {
                id: 2,
                message: "Tap 'DEAL'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.seats[2].hands[0].betAmount > 0,
                targetElementId: 'action-button-deal',
                position: 'bottom'
            },
            {
                id: 3,
                message: "You have 10 against the Dealer's 9. Dealer is strong, but you are likely to get a 20.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                position: 'center',
                requiresClick: true
            },
            {
                id: 4,
                message: "Be aggressive! Tap 'DOUBLE' (Get 1 card & Stand).",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                targetElementId: 'action-double',
                position: 'player'
            },
            {
                id: 5,
                message: "You nailed it with a 20. The Dealer had 17. Big win!",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            }
        ]
    },
    {
        round: 2,
        title: "The Risk of Doubling",
        // P1(6), D1(10), P2(5->11), D2(8). Player Double -> 3 (14). Dealer (18). Player Loses 2x.
        forcedCards: [
             { rank: Rank.THREE, suit: Suit.CLUBS, value: 3, isHidden: false },   // Double Card -> 14 (Last Pop)
             { rank: Rank.EIGHT, suit: Suit.DIAMONDS, value: 8, isHidden: true }, // Dealer Hole (8) (2nd Last Pop)
             { rank: Rank.FIVE, suit: Suit.HEARTS, value: 5, isHidden: false },   // Player 2nd (5)
             { rank: Rank.TEN, suit: Suit.SPADES, value: 10, isHidden: false },   // Dealer Face (10)
             { rank: Rank.SIX, suit: Suit.SPADES, value: 6, isHidden: false },    // Player 1st (6) (First Pop)
        ],
        steps: [
            {
                id: 0,
                message: "Doubling is powerful, but risky. You lose TWICE as much and are STUCK with just 1 card. Select the $100 chip.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.selectedChipValue !== 100,
                targetElementId: 'chip-100',
                position: 'bottom'
            },
            {
                id: 1,
                message: "Place your bet on Seat 3.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.selectedChipValue === 100 && s.seats[2].hands[0].betAmount === 0,
                targetElementId: 'seat-3',
                position: 'bottom'
            },
            {
                id: 2,
                message: "Tap 'DEAL'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.seats[2].hands[0].betAmount > 0,
                targetElementId: 'action-button-deal',
                position: 'bottom'
            },
            {
                id: 3,
                message: "You have 11 against the Dealer's 10. Aggressive play says Double, but Dealer is strong.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                position: 'center',
                requiresClick: true
            },
            {
                id: 4,
                message: "Tap 'DOUBLE'. Remember: You get exactly ONE card, good or bad.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                targetElementId: 'action-double',
                position: 'player'
            },
            {
                id: 5,
                message: "A 3! You're stuck at 14 because you Doubled. Dealer wins. Ouch!",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                position: 'center',
                requiresClick: true
            },
            {
                id: 6,
                message: "Remember: Double Down increases variance. High risk, high reward. Tap 'NEW ROUND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            }
        ]
    },
    {
        round: 3,
        title: "Soft Doubles",
        // P1(A), D1(5), P2(6->Soft17), D2(10). Player Double -> 4 (21). Dealer (15) -> Hit 10 -> Bust.
        forcedCards: [
             { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: false }, // Dealer Hit -> 25 BUST
             { rank: Rank.FOUR, suit: Suit.CLUBS, value: 4, isHidden: false },    // Player Double Card -> 21
             { rank: Rank.TEN, suit: Suit.HEARTS, value: 10, isHidden: true },    // Dealer Hole (10)
             { rank: Rank.SIX, suit: Suit.DIAMONDS, value: 6, isHidden: false },  // Player 2nd (6)
             { rank: Rank.FIVE, suit: Suit.SPADES, value: 5, isHidden: false },   // Dealer Face (5)
             { rank: Rank.ACE, suit: Suit.CLUBS, value: 11, isHidden: false },    // Player 1st (Ace)
        ],
        steps: [
            {
                id: 0,
                message: "Last lesson: Soft hands (Ace + Number). Select the $100 chip.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.selectedChipValue !== 100,
                targetElementId: 'chip-100',
                position: 'bottom'
            },
            {
                id: 1,
                message: "Place your bet on Seat 3.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.selectedChipValue === 100 && s.seats[2].hands[0].betAmount === 0,
                targetElementId: 'seat-3',
                position: 'bottom'
            },
            {
                id: 2,
                message: "Tap 'DEAL'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.seats[2].hands[0].betAmount > 0,
                targetElementId: 'action-button-deal',
                position: 'bottom'
            },
            {
                id: 3,
                message: "You have Ace + 6 (Soft 17). Against the Dealer's 5, this is a great Double opportunity.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                position: 'center',
                requiresClick: true
            },
            {
                id: 4,
                message: "Tap 'DOUBLE' to try for a 21.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                targetElementId: 'action-double',
                position: 'player'
            },
            {
                id: 5,
                message: "Perfect 21! That concludes the Double Down tutorial. Tap 'FINISH TUTORIAL'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'finish-tutorial-button',
                position: 'player'
            }
        ]
    }
];
