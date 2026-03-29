import { Card, TutorialStep, GameState } from '@/types/game';
import { Rank, Suit, GamePhase } from '@/types/enums';
import { TutorialLesson } from './types';

export const STRATEGY_TUTORIAL_LESSONS: TutorialLesson[] = [
    {
        round: 0,
        title: "Introduction to Basic Strategy",
        forcedCards: [
               { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: false }, // Dealer Hit 2 -> Bust (25)
               { rank: Rank.FOUR, suit: Suit.HEARTS, value: 4, isHidden: false },   // Dealer Hit 1 -> 15
             { rank: Rank.SIX, suit: Suit.CLUBS, value: 6, isHidden: true },      // Dealer Hole (6)
             { rank: Rank.SIX, suit: Suit.DIAMONDS, value: 6, isHidden: false },  // Player 2nd (6)
             { rank: Rank.FIVE, suit: Suit.SPADES, value: 5, isHidden: false },   // Dealer Face (5)
             { rank: Rank.TEN, suit: Suit.CLUBS, value: 10, isHidden: false },    // Player 1st (10)
        ],
        steps: [
            {
                id: 0,
                message: "Welcome! Basic Strategy is a mathematical chart that tells you the best move for every hand.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING,
                position: 'center',
                requiresClick: true
            },
            {
                id: 1,
                message: "Before we bet, let's explore the strategy data. Tap 'Rule & Strategy' below.",
                condition: (s: any) => s.gamePhase === GamePhase.BETTING,
                targetElementId: 'strategy-button',
                position: 'bottom'
            },
            {
                id: 2,
                message: "This is the Hard Totals section. Use this when your hand doesn't contain an Ace or a Pair. Tap the HARD tab.",
                condition: (s: any) => s.gamePhase === GamePhase.BETTING && s.isStrategyModalOpen,
                targetElementId: 'tab-hard',
                position: 'center',
                requiresClick: true
            },
            {
                id: 3,
                message: "This is the Soft Totals section, for hands containing an Ace. These are very important for flexible plays. Tap the SOFT tab.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING,
                targetElementId: 'tab-soft',
                position: 'center',
                requiresClick: true
            },
            {
                id: 4,
                message: "This is the Pairs section. It tells you when to Split (like 8s and Aces). Tap the PAIRS tab.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING,
                targetElementId: 'tab-pairs',
                position: 'center',
                requiresClick: true
            },
            {
                id: 5,
                message: "Great! You can always reopen this chart during the game. Now close the modal — tap the âœ• button.",
                condition: (s: any) => s.gamePhase === GamePhase.BETTING,
                targetElementId: 'strategy-close-btn',
                position: 'center'
            },
            {
                id: 6,
                message: "Now, select the $100 chip.",
                condition: (s: any) => s.gamePhase === GamePhase.BETTING && !s.isStrategyModalOpen && s.seats[2].hands[0].betAmount === 0,
                targetElementId: 'chip-100',
                position: 'bottom'
            },
            {
                id: 7,
                message: "Place a bet on Seat 3 to start the round.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.selectedChipValue === 100 && s.seats[2].hands[0].betAmount === 0,
                targetElementId: 'seat-3',
                position: 'bottom'
            },
            {
                id: 8,
                message: "Tap 'DEAL' to see your cards.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.seats[2].hands[0].betAmount > 0,
                targetElementId: 'deal-button',
                position: 'bottom'
            },
            {
                id: 9,
                message: "You have a 16 against the Dealer's 5. The chart says to STAND against this weak Dealer card.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 10,
                message: "The Dealer busted! Basic Strategy saved you from risking a bust yourself. Tap 'NEW ROUND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            }
        ]
    },
    {
        round: 1,
        title: "Trusting the Math (Hard 16)",
        // Player 16 vs the Dealer's 7. Strategy: Hit.
        // P1(10), D1(7), P2(6), D2(10). Player Hit -> 5 (21). Dealer -> Stand 17.
        forcedCards: [
             { rank: Rank.FIVE, suit: Suit.DIAMONDS, value: 5, isHidden: false }, // Player Hit -> 21
             { rank: Rank.TEN, suit: Suit.HEARTS, value: 10, isHidden: true },    // Dealer Hole (10)
             { rank: Rank.SIX, suit: Suit.CLUBS, value: 6, isHidden: false },     // Player 2nd (6)
             { rank: Rank.SEVEN, suit: Suit.SPADES, value: 7, isHidden: false },  // Dealer Face (7)
             { rank: Rank.TEN, suit: Suit.CLUBS, value: 10, isHidden: false },    // Player 1st (10)
        ],
        steps: [
            {
                id: 0,
                message: "Sometimes Basic Strategy feels risky. Let's try a tough hand. Select the $100 chip.",
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
                targetElementId: 'deal-button',
                position: 'bottom'
            },
            {
                id: 3,
                message: "You have a 16 against the Dealer's 7. Your gut might tell you to 'STAND' to avoid busting.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                position: 'center',
                requiresClick: true
            },
            {
                id: 4,
                message: "But the math says HIT! Why? Because a Dealer showing a 7 will likely make a 17. You need to improve your hand.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                targetElementId: 'strategy-module',
                position: 'player'
            },
            {
                id: 5,
                message: "Tap 'HIT'. Trust the math.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[s.currentSeatIndex].hands[0].cards.length === 2,
                targetElementId: 'action-hit',
                position: 'player'
            },
            {
                id: 6,
                message: "You got a 5 for a total of 21! If you had chosen to STAND, the Dealer would have beaten you with their 17. Tap 'STAND' now.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[s.currentSeatIndex].hands[0].cards.length === 3,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 7,
                message: "You won! Following Basic Strategy maximizes your chances in tough spots. Tap 'NEW ROUND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            }
        ]
    },
    {
        round: 2,
        title: "Variance & Probability",
        // Strategy implies optimal *long term*, not guaranteed win.
        // P(20), D(10). Player Stands. Dealer hole 6 -> 16 -> Hit 5 -> 21. Dealer wins.
        forcedCards: [
             { rank: Rank.FIVE, suit: Suit.DIAMONDS, value: 5, isHidden: false }, // Dealer Hit -> 21
             { rank: Rank.SIX, suit: Suit.HEARTS, value: 6, isHidden: true },     // Dealer Hole (6)
             { rank: Rank.TEN, suit: Suit.CLUBS, value: 10, isHidden: false },    // Player 2nd (10)
             { rank: Rank.TEN, suit: Suit.SPADES, value: 10, isHidden: false },   // Dealer Face (10)
             { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: false }, // Player 1st (10)
        ],
        steps: [
            {
                id: 0,
                message: "One final lesson: Basic Strategy is about probability, not certainty. Select the $100 chip.",
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
                targetElementId: 'deal-button',
                position: 'bottom'
            },
            {
                id: 3,
                message: "You have a 20. The Dealer is showing a 10. Basic Strategy clearly says to STAND. You have a great hand.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                position: 'center',
                requiresClick: true
            },
            {
                id: 4,
                message: "Tap 'STAND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 5,
                message: "The Dealer drew to a 21 and won.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                position: 'center',
                requiresClick: true
            },
             {
                id: 6,
                message: "It happens! Basic Strategy gives you the best odds (<0.5% house edge), but you can still lose hands.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                position: 'center',
                requiresClick: true
            },
            {
                id: 7,
                message: "Master Basic Strategy to minimize losses and maximize wins over time! Tap 'FINISH TUTORIAL'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'finish-tutorial-button',
                position: 'player'
            }
        ]
    },
    {
        round: 3,
        title: "Soft Hand Strategy",
        // Player has A, 7 (Soft 18). Dealer has 9. Strategy: Hit!
        forcedCards: [
             { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: false }, // Player Hit -> 28(18) = 18? A+7+T = 18
             { rank: Rank.NINE, suit: Suit.HEARTS, value: 9, isHidden: true },    // Dealer Hole (9) -> 18
             { rank: Rank.SEVEN, suit: Suit.SPADES, value: 7, isHidden: false },  // Player 2nd (7)
             { rank: Rank.NINE, suit: Suit.SPADES, value: 9, isHidden: false },   // Dealer Face (9)
             { rank: Rank.ACE, suit: Suit.CLUBS, value: 11, isHidden: false },    // Player 1st Card (A)
        ],
        steps: [
            {
                id: 0,
                message: "Now let's look at a 'Soft Hand'. This is any hand containing an Ace counted as 11.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING,
                position: 'center'
            },
            {
                id: 1,
                message: "Place a bet of $100 to continue.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.seats[1].hands[0].betAmount === 0,
                targetElementId: 'seat-2',
                position: 'bottom'
            },
            {
                id: 2,
                message: "Tap 'DEAL'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.seats[1].hands[0].betAmount > 0,
                targetElementId: 'deal-button',
                position: 'bottom'
            },
            {
                id: 3,
                message: "You have a Soft 18 (Ace and 7). The Dealer shows a 9. Many players would STAND here.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[1].hands[0].cards.length === 2,
                position: 'player'
            },
            {
                id: 4,
                message: "However, Basic Strategy says to HIT! Your 18 isn't strong enough against a Dealer's 9, and the Ace gives you a free shot without busting. Tap 'HIT'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[1].hands[0].cards.length === 2,
                targetElementId: 'action-hit',
                position: 'player'
            },
            {
                id: 5,
                message: "You hit a 10. You still have an 18 (1 + 7 + 10), but now it's a Hard 18. Tap 'STAND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[1].hands[0].cards.length === 3,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 6,
                message: "Great! You maximized your odds. The Dealer made an 18. It's a PUSH, and your bet is returned.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            },
            {
                id: 7,
                message: "Master Basic Strategy to minimize losses and maximize wins over time! Tap 'FINISH TUTORIAL'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'finish-tutorial-button',
                position: 'player'
            }
        ]
    }
];
