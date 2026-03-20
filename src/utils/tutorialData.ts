import { Card, TutorialStep, GameState } from '@/types/game';
import { Rank, Suit, GamePhase } from '@/types/enums';

export interface TutorialLesson {
    round: number;
    title: string;
    forcedCards: Card[];
    steps: TutorialStep[];
}

export const BEGINNER_TUTORIAL_LESSONS: TutorialLesson[] = [
    {
        round: 0,
        title: "The Basics",
        // LIFO order for pop()
        forcedCards: [
             { rank: Rank.TEN, suit: Suit.SPADES, value: 10, isHidden: false },   // Dealer Final Hit -> BUST
             { rank: Rank.FOUR, suit: Suit.DIAMONDS, value: 4, isHidden: false }, // Player Hit -> 20
             { rank: Rank.SIX, suit: Suit.SPADES, value: 6, isHidden: false },    // Dealer Hole Card (6)
             { rank: Rank.SIX, suit: Suit.CLUBS, value: 6, isHidden: false },     // Player 2nd Card (6)
             { rank: Rank.TEN, suit: Suit.HEARTS, value: 10, isHidden: false },   // Dealer Face (10)
             { rank: Rank.TEN, suit: Suit.CLUBS, value: 10, isHidden: false },    // Player 1st Card (10)
        ],
        steps: [
            {
                id: 0,
                message: "Welcome! The goal of Blackjack is to beat the Dealer by getting a hand value closer to 21 without going over.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.selectedChipValue !== 100,
                position: 'center',
                requiresClick: true
            },
            {
                id: 1,
                message: "Let's start your first round. Tap on the $100 chip.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.selectedChipValue !== 100,
                targetElementId: 'chip-100',
                position: 'bottom'
            },
            {
                id: 2,
                message: "Place your bet on the middle seat (Seat 3).",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.selectedChipValue === 100 && s.seats[2].hands[0].betAmount === 0,
                targetElementId: 'seat-3',
                position: 'bottom'
            },
            {
                id: 3,
                message: "Tap 'DEAL' to see your cards.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.seats[2].hands[0].betAmount > 0,
                targetElementId: 'deal-button',
                position: 'bottom'
            },
            {
                id: 4,
                message: "You have 16 against Dealer's 10. This is risky. Tap 'HIT' to draw another card.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[s.currentSeatIndex].hands[0].cards.length === 2,
                targetElementId: 'action-hit',
                position: 'player'
            },
            {
                id: 5,
                message: "You hit 20! A very strong hand. Tap 'STAND' to keep it and end your turn.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[s.currentSeatIndex].hands[0].cards.length === 3,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 6,
                message: "The dealer busted (went over 21)! You won. Tap 'NEW ROUND' to continue.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            }
        ]
    },
    {
        round: 1,
        title: "Handling a Loss",
        forcedCards: [
             { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: false }, // Dealer Hole (10) -> 20
             { rank: Rank.EIGHT, suit: Suit.HEARTS, value: 8, isHidden: false },  // Player 2nd Card (8) -> 18
             { rank: Rank.TEN, suit: Suit.SPADES, value: 10, isHidden: false },   // Dealer Face (10)
             { rank: Rank.TEN, suit: Suit.CLUBS, value: 10, isHidden: false },    // Player 1st Card (10)
        ],
        steps: [
            {
                id: 0,
                message: "Let's play another round. Place your bet and tap 'DEAL'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING,
                position: 'bottom'
            },
            {
                id: 1,
                message: "You have 18 vs Dealer's 10. 18 is a good hand, so tap 'STAND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 2,
                message: "The dealer had 20. Sometimes you lose, but that's part of the game. Tap 'NEW ROUND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            }
        ]
    },
    {
        round: 2,
        title: "The Magic of Aces",
        forcedCards: [
             { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: false },  // Pop 6: Dealer Final Hit -> Bust
             { rank: Rank.TEN, suit: Suit.HEARTS, value: 10, isHidden: false },    // Pop 5: Player Hit -> 10
             { rank: Rank.SIX, suit: Suit.SPADES, value: 6, isHidden: false },     // Pop 4: Dealer Hole Card (6)
             { rank: Rank.SIX, suit: Suit.CLUBS, value: 6, isHidden: false },      // Pop 3: Player 2nd Card (6)
             { rank: Rank.TEN, suit: Suit.HEARTS, value: 10, isHidden: false },    // Pop 2: Dealer Face (10)
             { rank: Rank.ACE, suit: Suit.SPADES, value: 11, isHidden: false },    // Pop 1: Player 1st Card (Ace)
        ],
        steps: [
            {
                id: 0,
                message: "Now, let's learn a new card combination. Place your bet and tap 'DEAL'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING,
                position: 'bottom'
            },
            {
                id: 1,
                message: "Aces count as 1 or 11. You have an Ace and a 6. This is a 'Soft 17' (meaning it can also be a 7).",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[s.currentSeatIndex].hands[0].cards.length === 2,
                position: 'center',
                requiresClick: true
            },
            {
                id: 2,
                message: "A Soft hand is very safe to hit! Tap 'HIT'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[s.currentSeatIndex].hands[0].cards.length === 2,
                targetElementId: 'action-hit',
                position: 'player'
            },
            {
                id: 3,
                message: "You drew a 10. Instead of busting (27), your Ace automatically drops to a 1. Your total is now Hard 17. Tap 'STAND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[s.currentSeatIndex].hands[0].cards.length === 3,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 4,
                message: "You survived and won because the dealer busted! Aces give you great flexibility. Tap 'NEW ROUND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            }
        ]
    },
    {
        round: 3,
        title: "The Ultimate Goal - Blackjack",
        forcedCards: [
             { rank: Rank.SEVEN, suit: Suit.DIAMONDS, value: 7, isHidden: false }, // Dealer Hole (7) -> 17
             { rank: Rank.TEN, suit: Suit.HEARTS, value: 10, isHidden: false },    // Player 2nd (10) -> BJ
             { rank: Rank.TEN, suit: Suit.SPADES, value: 10, isHidden: false },    // Dealer Face (10)
             { rank: Rank.ACE, suit: Suit.CLUBS, value: 11, isHidden: false },     // Player 1st Card (Ace)
        ],
        steps: [
            {
                id: 0,
                message: "Place your bet for the next round.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING,
                position: 'bottom'
            },
            {
                id: 1,
                message: "You got a Natural Blackjack (21)! Since 21 is the maximum points, your turn automatically ends.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                position: 'center',
                requiresClick: true
            },
            {
                id: 2,
                message: "This pays 3 to 2 automatically. Beautiful! Tap 'NEW ROUND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            }
        ]
    },
    {
        round: 4,
        title: "Dealer's Blackjack",
        forcedCards: [
             { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: false }, // Dealer Hole (10) -> BJ
             { rank: Rank.NINE, suit: Suit.HEARTS, value: 9, isHidden: false },   // Player 2nd (9) -> 19
             { rank: Rank.ACE, suit: Suit.SPADES, value: 11, isHidden: false },   // Dealer Face (Ace)
             { rank: Rank.TEN, suit: Suit.CLUBS, value: 10, isHidden: false },    // Player 1st Card (10)
        ],
        steps: [
            {
                id: 0,
                message: "Ready for the next scenario? Bet and tap 'DEAL'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING,
                position: 'bottom'
            },
            {
                id: 1,
                message: "Dealer shows an Ace. They offer Insurance. For this lesson, we will decline. Tap 'NO THANKS'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.INSURANCE,
                targetElementId: 'insurance-decline',
                position: 'center'
            },
            {
                id: 2,
                message: "The dealer had a natural Blackjack in the hole. There was nothing you could do. Tap 'NEW ROUND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'dealer'
            }
        ]
    },
    {
        round: 5,
        title: "Insurance - Protecting your Hand",
        forcedCards: [
             { rank: Rank.EIGHT, suit: Suit.DIAMONDS, value: 8, isHidden: false }, // Dealer Hole (8) -> 19
             { rank: Rank.TEN, suit: Suit.HEARTS, value: 10, isHidden: false },    // Player 2nd (10) -> 20
             { rank: Rank.ACE, suit: Suit.SPADES, value: 11, isHidden: false },    // Dealer Face (Ace)
             { rank: Rank.TEN, suit: Suit.CLUBS, value: 10, isHidden: false },     // Player 1st Card (10)
        ],
        steps: [
            {
                id: 0,
                message: "Another round. Place your bet and tap 'DEAL'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING,
                position: 'bottom'
            },
            {
                id: 1,
                message: "Dealer shows an Ace again. Let's tap 'DECLINE' again.",
                condition: (s: GameState) => s.gamePhase === GamePhase.INSURANCE,
                targetElementId: 'insurance-decline',
                position: 'center'
            },
            {
                id: 2,
                message: "Since the dealer didn't have Blackjack, the game continues normally.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                position: 'center',
                requiresClick: true
            },
            {
                id: 3,
                message: "You have 20. A very strong hand. Tap 'STAND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 4,
                message: "Dealer had 19. You won! Insurance is usually a bad bet statistically. Next round.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            }
        ]
    },
    {
        round: 6,
        title: "Splitting Pairs",
        forcedCards: [
             { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: false }, // 7. Dealer Final -> BUST (26)
             { rank: Rank.NINE, suit: Suit.HEARTS, value: 9, isHidden: false },   // 6. Hand 2 Split Card (9) -> 17
             { rank: Rank.TEN, suit: Suit.CLUBS, value: 10, isHidden: false },    // 5. Hand 1 Split Card (10) -> 18
             { rank: Rank.SIX, suit: Suit.HEARTS, value: 6, isHidden: false },    // 4. Dealer Hole (6)
             { rank: Rank.EIGHT, suit: Suit.SPADES, value: 8, isHidden: false },  // 3. Player 2nd (8) -> Pair
             { rank: Rank.TEN, suit: Suit.CLUBS, value: 10, isHidden: false },    // 2. Dealer Face (10)
             { rank: Rank.EIGHT, suit: Suit.CLUBS, value: 8, isHidden: false },   // 1. Player 1st Card (8)
        ],
        steps: [
            {
                id: 0,
                message: "Ready for an advanced move? Bet and tap 'DEAL'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING,
                position: 'bottom'
            },
            {
                id: 1,
                message: "You got a pair of 8s (16 total)! Splitting costs an extra $100 bet, turning one hand into two. Tap 'SPLIT'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[s.currentSeatIndex].hands.length === 1,
                targetElementId: 'action-split',
                position: 'bottom'
            },
            {
                id: 2,
                message: "Hand 1 drew a 10 for a total of 18. This is a strong hand. Tap 'STAND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[s.currentSeatIndex].hands.length === 2 && s.seats[s.currentSeatIndex].currentHandIndex === 0,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 3,
                message: "Hand 2 drew a 9 for a total of 17. Safe option. Tap 'STAND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[s.currentSeatIndex].hands.length === 2 && s.seats[s.currentSeatIndex].currentHandIndex === 1,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 4,
                message: "You won both hands because the dealer busted! Splitting turned a bad 16 into two winning hands.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                position: 'center',
                requiresClick: true
            },
            {
                id: 5,
                message: "You have successfully finished the entire tutorial! Tap 'FINISH TUTORIAL'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'finish-tutorial-button',
                position: 'player'
            }
        ]
    }
];

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
                message: "Start by placing a bet and dealing.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING,
                position: 'bottom'
            },
            {
                id: 2,
                message: "You have 11 (6+5) versus a Dealer 6. This is the BEST time to Double Down.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                position: 'center',
                requiresClick: true
            },
            {
                id: 3,
                message: "Tap 'DOUBLE' to bet 2x. You will receive exactly 1 card and your turn will end automatically. It cost 100$ (your original bet) to double down.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                targetElementId: 'action-double',
                position: 'player'
            },
            {
                id: 4,
                message: "You received your one card (9) and stood on 20. Dealer busted. You won big!",
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
                message: "Another chance. Doubling costs another 100% of your bet and limits you to ONE more card only.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING,
                position: 'bottom'
            },
            {
                id: 1,
                message: "You have 10 against a Dealer 9. Dealer is strong, but you are likely to get a 20.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                position: 'center',
                requiresClick: true
            },
            {
                id: 2,
                message: "Be aggressive! Tap 'DOUBLE' (Get 1 card & Stand).",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                targetElementId: 'action-double',
                position: 'player'
            },
            {
                id: 3,
                message: "You nailed it with a 20. Dealer had 17. Big win!",
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
                message: "Doubling is powerful, but risky. You lose TWICE as much and are STUCK with just 1 card.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING,
                position: 'bottom'
            },
            {
                id: 1,
                message: "You have 11 against Dealer 10. Aggressive play says Double, but Dealer is strong.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                position: 'center',
                requiresClick: true
            },
            {
                id: 2,
                message: "Tap 'DOUBLE'. Remember: You get exactly ONE card, good or bad.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                targetElementId: 'action-double',
                position: 'player'
            },
            {
                id: 3,
                message: "A 3! You're stuck at 14 because you Doubled. Dealer wins. Ouch!",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                position: 'center',
                requiresClick: true
            },
            {
                id: 4,
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
                message: "Last lesson: Soft hands (Ace + Number).",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING,
                position: 'bottom'
            },
            {
                id: 1,
                message: "You have Ace + 6 (Soft 17). Against Dealer 5, this is a great Double opportunity.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                position: 'center',
                requiresClick: true
            },
            {
                id: 2,
                message: "Tap 'DOUBLE' to try for a 21.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                targetElementId: 'action-double',
                position: 'player'
            },
            {
                id: 3,
                message: "Perfect 21! That concludes the Double Down tutorial.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'finish-tutorial-button',
                position: 'player'
            }
        ]
    }
];

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
                message: "Before we bet, let's explore the strategy data. Click 'Rule & Strategy' below.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && !s.showStrategyModal,
                targetElementId: 'strategy-button',
                position: 'bottom'
            },
            {
                id: 2,
                message: "This is the Hard Totals section. Use this when you don't have an Ace or a Pair.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.showStrategyModal,
                targetElementId: 'tab-hard',
                position: 'dealer',
                requiresClick: true
            },
            {
                id: 3,
                message: "This is Soft Totals (hands with Aces). Very important for flexible plays.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.showStrategyModal,
                targetElementId: 'tab-soft',
                position: 'dealer',
                requiresClick: true
            },
            {
                id: 4,
                message: "This is Pairs. Tells you when to Split (like 8s and Aces).",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.showStrategyModal,
                targetElementId: 'tab-pairs',
                position: 'dealer',
                requiresClick: true
            },
            {
                id: 5,
                message: "Great! You can always check this during the game. Close it now to place your bet.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.showStrategyModal,
                targetElementId: 'strategy-close-btn',
                position: 'bottom'
            },
            {
                id: 6,
                message: "Now select the $100 chip.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && !s.showStrategyModal && s.seats[2].hands[0].betAmount === 0,
                targetElementId: 'chip-100',
                position: 'bottom'
            },
            {
                id: 7,
                message: "Place a bet on Seat 3 to start the round.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && !s.showStrategyModal && s.selectedChipValue === 100 && s.seats[2].hands[0].betAmount === 0,
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
                message: "You have 16 against Dealer 5. The chart says to STAND on this weak dealer card.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 10,
                message: "Dealer busted! Basic Strategy saved you from risking a bust yourself. Tap 'NEW ROUND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            }
        ]
    },
    {
        round: 1,
        title: "Trusting the Math (Hard 16)",
        // Player 16 vs Dealer 7. Strategy: Hit.
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
                message: "Sometimes Strategy feels risky. Let's try a tough hand.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING,
                position: 'bottom'
            },
            {
                id: 1,
                message: "You have 16 against Dealer 7. Your gut might say 'Stand' to avoid busting.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                position: 'center',
                requiresClick: true
            },
            {
                id: 2,
                message: "But the math says HIT! Why? Because Dealer 7 will likely make a 17. You need to improve.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                targetElementId: 'strategy-module',
                position: 'player'
            },
            {
                id: 3,
                message: "Tap 'HIT'. Trust the math.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[s.currentSeatIndex].hands[0].cards.length === 2,
                targetElementId: 'action-hit',
                position: 'player'
            },
            {
                id: 4,
                message: "You got a 5 for 21! If you stood, the Dealer would have beaten you with their 17. Tap 'STAND' now.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[s.currentSeatIndex].hands[0].cards.length === 3,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 5,
                message: "You won! Following strategy maximizes your chances in tough spots. Tap 'NEW ROUND'.",
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
                message: "One final lesson: Strategy is about probability, not certainty.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING,
                position: 'bottom'
            },
            {
                id: 1,
                message: "You have 20. Dealer has 10. Strategy clearly says STAND. You have a great hand.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                position: 'center',
                requiresClick: true
            },
            {
                id: 2,
                message: "Tap 'STAND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 3,
                message: "The Dealer drew to 21 and won.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                position: 'center',
                requiresClick: true
            },
             {
                id: 4,
                message: "It happens! Strategy gives you the best odds (<0.5% house edge), but you can still lose hands.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                position: 'center',
                requiresClick: true
            },
            {
                id: 5,
                message: "Master Basic Strategy to minimize losses and maximize wins over time! Tutorial Complete.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'finish-tutorial-button',
                position: 'player'
            }
        ]
    }
];
