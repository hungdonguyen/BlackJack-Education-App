import { Card, TutorialStep, GameState } from '@/types/game';
import { Rank, Suit, GamePhase } from '@/types/enums';
import { TutorialLesson } from './types';

export const PAIR_SPLITTING_TUTORIAL_LESSONS: TutorialLesson[] = [
    {
        round: 0,
        title: "Always Split Aces",
        // P1(A), D1(6), P2(A->pair), D2(K hidden->16). Split: H1->K(21), H2->9(20). Dealer 16->10=26 BUST.
        forcedCards: [
             { rank: Rank.TEN, suit: Suit.SPADES, value: 10, isHidden: false },   // Dealer Hit -> 26 BUST
             { rank: Rank.NINE, suit: Suit.HEARTS, value: 9, isHidden: false },    // Hand2 split card -> A+9=20
             { rank: Rank.KING, suit: Suit.DIAMONDS, value: 10, isHidden: false }, // Hand1 split card -> A+K=21
             { rank: Rank.KING, suit: Suit.CLUBS, value: 10, isHidden: true },     // Dealer Hole (K) -> 16
             { rank: Rank.ACE, suit: Suit.HEARTS, value: 11, isHidden: false },    // Player 2nd Card (A) -> pair
             { rank: Rank.SIX, suit: Suit.DIAMONDS, value: 6, isHidden: false },   // Dealer Face (6)
             { rank: Rank.ACE, suit: Suit.SPADES, value: 11, isHidden: false },    // Player 1st Card (A)
        ],
        steps: [
            {
                id: 0,
                message: "Welcome to Pair Splitting! The most important rule: ALWAYS split Aces. Two Aces is a terrible hand (either 2 or 12), but split into two separate hands each starting with an Ace is powerful.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING,
                position: 'center',
                requiresClick: true
            },
            {
                id: 1,
                message: "Note: when you split Aces, each hand receives exactly ONE extra card (you can't hit further). Select the $100 chip.",
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
                message: "You have a pair of Aces! Tap 'SPLIT' immediately — Aces are ALWAYS split, no exceptions.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[s.currentSeatIndex].hands.length === 1,
                targetElementId: 'action-split',
                position: 'player'
            },
            {
                id: 5,
                message: "Both hands received exactly one card. Hand 1 got 21 and Hand 2 got 20! Notice the auto-stand. The Dealer busted! This is why you always split Aces.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                position: 'center',
                requiresClick: true
            },
            {
                id: 6,
                message: "Two strong hands from two weak Aces. Tap 'NEW ROUND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            }
        ]
    },
    {
        round: 1,
        title: "Always Split 8s",
        // P1(8), D1(5), P2(8->16), D2(9 hidden->14). Split: H1->10(18 Stand), H2->9(17 Stand). Dealer 14->10=24 BUST.
        forcedCards: [
             { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: false },  // Dealer Hit -> 24 BUST
             { rank: Rank.NINE, suit: Suit.CLUBS, value: 9, isHidden: false },      // Hand2 split card -> 8+9=17
             { rank: Rank.TEN, suit: Suit.HEARTS, value: 10, isHidden: false },     // Hand1 split card -> 8+10=18
             { rank: Rank.NINE, suit: Suit.SPADES, value: 9, isHidden: true },      // Dealer Hole (9) -> 14
             { rank: Rank.EIGHT, suit: Suit.CLUBS, value: 8, isHidden: false },     // Player 2nd Card (8) -> pair
             { rank: Rank.FIVE, suit: Suit.DIAMONDS, value: 5, isHidden: false },   // Dealer Face (5)
             { rank: Rank.EIGHT, suit: Suit.SPADES, value: 8, isHidden: false },    // Player 1st Card (8)
        ],
        steps: [
            {
                id: 0,
                message: "Second rule: ALWAYS split 8s. A total of 16 is the WORST hand in Blackjack. Two separate 8s each have a chance to become 18, 19, or 20.",
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
                message: "Pair of 8s (16 total — terrible). Tap 'SPLIT' to turn this losing hand into two separate chances.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[s.currentSeatIndex].hands.length === 1,
                targetElementId: 'action-split',
                position: 'player'
            },
            {
                id: 5,
                message: "Hand 1 got a 10 for 18. Solid. Tap 'STAND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[s.currentSeatIndex].hands.length === 2 && s.seats[s.currentSeatIndex].currentHandIndex === 0,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 6,
                message: "Hand 2 got a 9 for 17. Decent. Tap 'STAND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[s.currentSeatIndex].hands.length === 2 && s.seats[s.currentSeatIndex].currentHandIndex === 1,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 7,
                message: "The Dealer busted! Two solid hands replaced one terrible 16. Always split those 8s. Tap 'NEW ROUND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            }
        ]
    },
    {
        round: 2,
        title: "Never Split 10s",
        // P1(10), D1(5), P2(10->20), D2(8 hidden->13). Player STANDS on 20. Dealer 13->10=23 BUST.
        forcedCards: [
             { rank: Rank.TEN, suit: Suit.CLUBS, value: 10, isHidden: false },     // Dealer Hit -> 23 BUST
             { rank: Rank.EIGHT, suit: Suit.SPADES, value: 8, isHidden: true },    // Dealer Hole (8) -> 13
             { rank: Rank.TEN, suit: Suit.CLUBS, value: 10, isHidden: false },     // Player 2nd (10) -> 20
             { rank: Rank.FIVE, suit: Suit.DIAMONDS, value: 5, isHidden: false },  // Dealer Face (5)
             { rank: Rank.TEN, suit: Suit.SPADES, value: 10, isHidden: false },    // Player 1st (10)
        ],
        steps: [
            {
                id: 0,
                message: "Third rule: NEVER split 10s (or face cards). 20 is the second-best hand in Blackjack. Why break it up into two uncertain 10s?",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING,
                position: 'center',
                requiresClick: true
            },
            {
                id: 1,
                message: "Beginners are often tempted to split 10s vs a weak Dealer — resist the urge! Select the $100 chip.",
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
                message: "You have 20 against the Dealer's 5. You CAN split, but you absolutely should NOT. Tap 'STAND' and protect your 20.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 5,
                message: "The Dealer busted. Your 20 was already a near-certain winner. Splitting would have turned a guaranteed result into a gamble. Never split 10s! Tap 'NEW ROUND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            }
        ]
    },
    {
        round: 3,
        title: "Never Split 5s — Double Instead",
        // P1(5), D1(4), P2(5->10), D2(Q hidden->14). Player DOUBLES -> K(20). Dealer 14->9=23 BUST.
        forcedCards: [
             { rank: Rank.NINE, suit: Suit.CLUBS, value: 9, isHidden: false },      // Dealer Hit -> 23 BUST
             { rank: Rank.KING, suit: Suit.HEARTS, value: 10, isHidden: false },    // Player Double card -> 20
             { rank: Rank.QUEEN, suit: Suit.SPADES, value: 10, isHidden: true },    // Dealer Hole (Q) -> 14
             { rank: Rank.FIVE, suit: Suit.CLUBS, value: 5, isHidden: false },      // Player 2nd (5) -> 10
             { rank: Rank.FOUR, suit: Suit.DIAMONDS, value: 4, isHidden: false },   // Dealer Face (4)
             { rank: Rank.FIVE, suit: Suit.SPADES, value: 5, isHidden: false },     // Player 1st (5)
        ],
        steps: [
            {
                id: 0,
                message: "Fourth rule: NEVER split 5s. Two 5s = 10, which is a fantastic Double Down hand! Splitting would give you two weak 5s instead.",
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
                message: "5+5 = 10 against the Dealer's 4. This is a great Double Down spot. Skip the split and tap 'DOUBLE' instead.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                targetElementId: 'action-double',
                position: 'player'
            },
            {
                id: 5,
                message: "You got a King for 20! The Dealer busted. Doubling on 10 is far superior to splitting. Tap 'NEW ROUND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            }
        ]
    },
    {
        round: 4,
        title: "Split 9s — Context Matters",
        // P1(9), D1(6), P2(9->18), D2(7 hidden->13). Split: H1->K(19), H2->8(17). Dealer 13->10=23 BUST.
        forcedCards: [
             { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: false },  // Dealer Hit -> 23 BUST
             { rank: Rank.EIGHT, suit: Suit.CLUBS, value: 8, isHidden: false },     // Hand2 split card -> 9+8=17
             { rank: Rank.KING, suit: Suit.HEARTS, value: 10, isHidden: false },    // Hand1 split card -> 9+K=19
             { rank: Rank.SEVEN, suit: Suit.SPADES, value: 7, isHidden: true },     // Dealer Hole (7) -> 13
             { rank: Rank.NINE, suit: Suit.CLUBS, value: 9, isHidden: false },      // Player 2nd (9) -> pair
             { rank: Rank.SIX, suit: Suit.DIAMONDS, value: 6, isHidden: false },    // Dealer Face (6)
             { rank: Rank.NINE, suit: Suit.SPADES, value: 9, isHidden: false },     // Player 1st (9)
        ],
        steps: [
            {
                id: 0,
                message: "Final rule: 9s are context-sensitive. Split 9s against the Dealer's 2-6, 8, or 9 (18 beats Dealer's likely totals). But STAND against 7 (Dealer hits 17 and your 18 wins), 10, or Ace.",
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
                message: "9,9 vs the Dealer's 6. Dealer is weak — splitting turns 18 into two hands likely to beat a busting dealer. Tap 'SPLIT'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[s.currentSeatIndex].hands.length === 1,
                targetElementId: 'action-split',
                position: 'player'
            },
            {
                id: 5,
                message: "Hand 1 drew a King for 19. Strong. Tap 'STAND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[s.currentSeatIndex].hands.length === 2 && s.seats[s.currentSeatIndex].currentHandIndex === 0,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 6,
                message: "Hand 2 drew an 8 for 17. Safe enough against a weakened dealer. Tap 'STAND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[s.currentSeatIndex].hands.length === 2 && s.seats[s.currentSeatIndex].currentHandIndex === 1,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 7,
                message: "Both hands won! Tap 'NEW ROUND' to see one final scenario.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,  
                targetElementId: 'new-round-button',
                position: 'player'
            }
        ]
    },
    {
        round: 5,
        title: "The Risk of Splitting",
        // P(8,8) vs D(10). Split 8s. H1 gets 6 (14), hits 10 (24). H2 gets 5 (13), hits 10 (23).
        forcedCards: [
             { rank: Rank.TEN, suit: Suit.CLUBS, value: 10, isHidden: false },     // H2 hit -> BUST (23)
             { rank: Rank.TEN, suit: Suit.HEARTS, value: 10, isHidden: false },    // H1 hit -> BUST (24)
             { rank: Rank.FIVE, suit: Suit.SPADES, value: 5, isHidden: false },    // Hand2 split card -> 13
             { rank: Rank.SIX, suit: Suit.CLUBS, value: 6, isHidden: false },      // Hand1 split card -> 14
             { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: true },   // Dealer Hole (10) -> 20
             { rank: Rank.EIGHT, suit: Suit.HEARTS, value: 8, isHidden: false },   // Player 2nd (8)
             { rank: Rank.TEN, suit: Suit.SPADES, value: 10, isHidden: false },    // Dealer Face (10)
             { rank: Rank.EIGHT, suit: Suit.SPADES, value: 8, isHidden: false },   // Player 1st (8)
        ],
        steps: [
            {
                id: 0,
                message: "Bonus Rule: You must know that splitting carries risk. Two 8s make 16, a terrible hand. But splitting means doubling your bet, which means you can lose double if you get unlucky...",
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
                message: "8,8 vs the Dealer's 10. You must always split 8s, even against a 10. It takes a losing hand and makes it slightly less losing. Tap 'SPLIT'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[s.currentSeatIndex].hands.length === 1,
                targetElementId: 'action-split',
                position: 'player'
            },
            {
                id: 5,
                message: "Hand 1 drew a 6 for 14. We must hit against a 10. Tap 'HIT'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[s.currentSeatIndex].hands.length === 2 && s.seats[s.currentSeatIndex].currentHandIndex === 0,
                targetElementId: 'action-hit',
                position: 'player'
            },
            {
                id: 6,
                message: "Ouch. Hand 1 busted. Now Hand 2 has 13. You still have to hit against a 10. Tap 'HIT'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[s.currentSeatIndex].hands.length === 2 && s.seats[s.currentSeatIndex].currentHandIndex === 1,
                targetElementId: 'action-hit',
                position: 'player'
            },
            {
                id: 7,
                message: "Both hands busted. You lost twice as much money! This happens sometimes, but in the long run, splitting 8s loses less than standing on 16 or hitting 16. Tap 'FINISH TUTORIAL'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'finish-tutorial-button',
                position: 'center'
            }
        ]
    }
];

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// INSURANCE & EVEN MONEY
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
