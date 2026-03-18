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
