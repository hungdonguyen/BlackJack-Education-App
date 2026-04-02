import { Card, TutorialStep, GameState } from '@/types/game';
import { Rank, Suit, GamePhase } from '@/types/enums';
import { TutorialLesson } from './types';

export const COUNTING_TUTORIAL_LESSONS: TutorialLesson[] = [
    {
        round: 0,
        title: "What is Card Counting?",
        // Player 20 vs the Dealer's 4 bust with many low cards. Focus: open modal, counting panel.
        // P1(10), DFace(4), P2(10->20), DHole(2->6), DHit1(3->9), DHit2(5->14), DHit3(K->24 BUST)
        // Hi-Lo: 10(-1), 4(+1), 10(-1), 2(+1), 3(+1), 5(+1), K(-1) = +1 cumulative
        forcedCards: [
             { rank: Rank.KING, suit: Suit.DIAMONDS, value: 10, isHidden: false }, // Dealer Hit3 -> 24 BUST
             { rank: Rank.FIVE, suit: Suit.HEARTS, value: 5, isHidden: false },    // Dealer Hit2 -> 14
             { rank: Rank.THREE, suit: Suit.CLUBS, value: 3, isHidden: false },    // Dealer Hit1 -> 9
             { rank: Rank.TWO, suit: Suit.HEARTS, value: 2, isHidden: true },      // Dealer Hole (2) -> 6
             { rank: Rank.TEN, suit: Suit.CLUBS, value: 10, isHidden: false },     // Player 2nd (10) -> 20
             { rank: Rank.FOUR, suit: Suit.SPADES, value: 4, isHidden: false },    // Dealer Face (4)
             { rank: Rank.TEN, suit: Suit.HEARTS, value: 10, isHidden: false },    // Player 1st (10)
        ],
        steps: [
            {
                id: 0,
                message: "Card Counting allows you to track the ratio of high to low cards remaining in the deck, giving you a strategic advantage. Let's explore the tools. Tap 'Rule & Strategy' below.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING,
                targetElementId: 'strategy-button',
                position: 'bottom'
            },
            {
                id: 1,
                message: "Now tap the 'COUNTING' tab at the top to review the deviation charts and count indices. Tap here when done.",
                condition: (s: any) => s.gamePhase === GamePhase.BETTING && s.isStrategyModalOpen,
                targetElementId: 'tab-counting',
                position: 'left',
                requiresClick: true
            },
            {
                id: 2,
                message: "This is your Counting reference — containing Hi-Lo tags, Illustrious 18 deviations, and bet sizing guidelines. Close the modal with âœ•.",
                condition: (s: any) => s.gamePhase === GamePhase.BETTING && s.isStrategyModalOpen,
                targetElementId: 'strategy-close-btn',
                position: 'left'
            },
            {
                id: 3,
                message: "The panel on the RIGHT tracks your live counts. The Hand Advisor on the LEFT will highlight strategic deviations when they occur! Now, select the $100 chip to start.",
                condition: (s: any) => s.gamePhase === GamePhase.BETTING && !s.isStrategyModalOpen && s.seats[2].hands[0].betAmount === 0,
                targetElementId: 'chip-100',
                position: 'bottom'
            },
            {
                id: 4,
                message: "Place your bet on Seat 3.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.selectedChipValue === 100 && s.seats[2].hands[0].betAmount === 0,
                targetElementId: 'seat-3',
                position: 'bottom'
            },
            {
                id: 5,
                message: "Tap 'DEAL' to deploy your bet.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.seats[2].hands[0].betAmount > 0,
                targetElementId: 'action-button-deal',
                position: 'bottom'
            },
            {
                id: 6,
                message: "Observe the Card Counting Panel! You have a solid 20 against the Dealer's weak 4. There's no strategic reason to hit. Tap 'STAND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 7,
                message: "The Dealer busted by drawing multiple low cards (4, 2, 3, 5). Each low card added +1 to the count. A positive Running Count means more 10s and Aces remain. Tap 'NEW ROUND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            }
        ]
    },
    {
        round: 1,
        title: "The Hi-Lo System — Tagging Cards",
        // Player 3+5=8, hits 10->18. Dealer 6+5=11, hits Q->21. Dealer wins.
        // Hi-Lo: 3(+1), 6(+1), 5(+1), 5(+1), 10(-1), Q(-1) = +2. Cumulative: +1+2 = +3
        forcedCards: [
             { rank: Rank.QUEEN, suit: Suit.HEARTS, value: 10, isHidden: false },  // Dealer Hit -> 21
             { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: false },  // Player Hit -> 18
             { rank: Rank.FIVE, suit: Suit.CLUBS, value: 5, isHidden: true },      // Dealer Hole (5) -> 11
             { rank: Rank.FIVE, suit: Suit.SPADES, value: 5, isHidden: false },    // Player 2nd (5) -> 8
             { rank: Rank.SIX, suit: Suit.HEARTS, value: 6, isHidden: false },     // Dealer Face (6)
             { rank: Rank.THREE, suit: Suit.DIAMONDS, value: 3, isHidden: false },  // Player 1st (3)
        ],
        steps: [
            {
                id: 0,
                message: "The Hi-Lo system assigns values to cards: 2�6 are +1, 7�9 are 0, and 10�Ace are âˆ’1. The panel tracks this automatically for you. Select the $100 chip.",
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
                message: "The cards shown are 3 (+1), the Dealer's 6 (+1), and 5 (+1). Every low card pushes the count up. With a total of 8, the strategic play is to draw. Tap 'HIT'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[s.currentSeatIndex].hands[0].cards.length === 2,
                targetElementId: 'action-hit',
                position: 'player'
            },
            {
                id: 4,
                message: "You drew a 10 (âˆ’1), bringing your hand to 18. This is a strong holding, so securing your position is best. Tap 'STAND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[s.currentSeatIndex].hands[0].cards.length === 3,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 5,
                message: "The Dealer hit to 21 and won. Although you lost, notice the Running Count remains high due to multiple low cards played. This is valuable intel for upcoming hands! Tap 'NEW ROUND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            }
        ]
    },
    {
        round: 2,
        title: "The Running Count in Action",
        // Player 12 vs the Dealer's 4. Positive cumulative count (+3 from R0+R1). Strategy: Stand. Dealer busts.
        // P1(7), D1(4), P2(5->12), D2(8->12), DHit(K->22 BUST)
        // Hi-Lo: 7(0), 4(+1), 5(+1), 8(0), K(-1) = +1. Cumulative: +3+1 = +4
        forcedCards: [
             { rank: Rank.KING, suit: Suit.SPADES, value: 10, isHidden: false }, // Dealer Hit -> 22 BUST
             { rank: Rank.EIGHT, suit: Suit.HEARTS, value: 8, isHidden: true },   // Dealer Hole (8) -> 12
             { rank: Rank.FIVE, suit: Suit.CLUBS, value: 5, isHidden: false },    // Player 2nd (5) -> 12
             { rank: Rank.FOUR, suit: Suit.DIAMONDS, value: 4, isHidden: false }, // Dealer Face (4)
             { rank: Rank.SEVEN, suit: Suit.HEARTS, value: 7, isHidden: false },  // Player 1st (7)
        ],
        steps: [
            {
                id: 0,
                message: "The Running Count is now POSITIVE because many low cards were dealt earlier. A positive count means the shoe is rich in tens and Aces.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING,
                position: 'center',
                requiresClick: true
            },
            {
                id: 1,
                message: "Select the $100 chip to capitalize on this advantage.",
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
                message: "You have a 12 against the Dealer's 4. A positive count means the Dealer is more likely to draw 10s and bust. The Hand Advisor highlights this tactical change.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                position: 'center',
                requiresClick: true
            },
            {
                id: 5,
                message: "Given the high probability of a Dealer bust, the correct strategic deviation is to hold your hand. Tap 'STAND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 6,
                message: "The Dealer busted! The positive count accurately predicted the presence of high cards, forcing the Dealer over 21. Tap 'NEW ROUND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            }
        ]
    },
    {
        round: 3,
        title: "True Count — The Real Signal",
        // Player 20 vs the Dealer's 5 -> bust. Simple win, focus on True Count explanation with 2 decks.
        // P1(10), D1(5), P2(10->20), D2(8 hidden->13). Dealer hits 13 -> K -> 23 BUST.
        forcedCards: [
             { rank: Rank.KING, suit: Suit.CLUBS, value: 10, isHidden: false },    // Dealer Hit -> 23 BUST
             { rank: Rank.EIGHT, suit: Suit.DIAMONDS, value: 8, isHidden: true },  // Dealer Hole (8) -> 13
             { rank: Rank.TEN, suit: Suit.HEARTS, value: 10, isHidden: false },    // Player 2nd (10) -> 20
             { rank: Rank.FIVE, suit: Suit.SPADES, value: 5, isHidden: false },    // Dealer Face (5)
             { rank: Rank.TEN, suit: Suit.SPADES, value: 10, isHidden: false },    // Player 1st (10)
        ],
        steps: [
            {
                id: 0,
                message: "The Running Count is just the first step. To find the TRUE COUNT, divide the Running Count by the number of decks remaining. This adjusts your advantage rating based on the exact depth of the shoe.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING,
                position: 'center',
                requiresClick: true
            },
            {
                id: 1,
                message: "A shoe with fewer decks makes the True Count swing faster. For example, a Running Count of +4 with 1.5 decks left yields a True Count of +2.6, highly favorable for the Player.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING,
                position: 'center',
                requiresClick: true
            },
            {
                id: 2,
                message: "The Card Counting Panel displays both metrics live. The True Count is your actual betting signal: you should increase your bet when the True Count is +2 or higher. Select the $100 chip.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.selectedChipValue !== 100,
                targetElementId: 'chip-100',
                position: 'bottom'
            },
            {
                id: 3,
                message: "Place your bet on Seat 3.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.selectedChipValue === 100 && s.seats[2].hands[0].betAmount === 0,
                targetElementId: 'seat-3',
                position: 'bottom'
            },
            {
                id: 4,
                message: "Tap 'DEAL'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.seats[2].hands[0].betAmount > 0,
                targetElementId: 'action-button-deal',
                position: 'bottom'
            },
            {
                id: 5,
                message: "You have 20, and the Dealer shows 5. This is a very strong hand. The strategic play is unequivocally to STAND.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 6,
                message: "The Dealer busted again! In real play, you would increase your bet in these high True Count scenarios to maximize expected value. Tap 'NEW ROUND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            }
        ]
    },
    {
        round: 4,
        title: "Deviations & the Illustrious 18",
        forcedCards: [
             { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: false },  // Dealer hit -> 26 BUST
             { rank: Rank.SIX, suit: Suit.DIAMONDS, value: 6, isHidden: true },    // Dealer Hole (6) -> 16
             { rank: Rank.SIX, suit: Suit.CLUBS, value: 6, isHidden: false },      // Player 2nd (6) -> 16
             { rank: Rank.TEN, suit: Suit.HEARTS, value: 10, isHidden: false },    // Dealer Face (10)
             { rank: Rank.TEN, suit: Suit.SPADES, value: 10, isHidden: false },    // Player 1st (10)
        ],
        steps: [
            {
                id: 0,
                message: "Advanced card counters do not just change bet sizes — they alter playing decisions based on the True Count. These strategic shifts are known as 'Deviations', primarily drawn from the Illustrious 18.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING,
                position: 'center',
                requiresClick: true
            },
            {
                id: 1,
                message: "The Illustrious 18 represents the most profitable play deviations. For instance, with Hard 16 vs the Dealer's 10, Basic Strategy dictates hitting. However, when the True Count is >= +0, the deviation is to STAND.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING,
                position: 'center',
                requiresClick: true
            },
            {
                id: 2,
                message: "The Hand Advisor (left panel) highlights these Illustrious 18 special cases with a â¡ deviation badge when applicable. Select the $100 chip.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.selectedChipValue !== 100,
                targetElementId: 'chip-100',
                position: 'bottom'
            },
            {
                id: 3,
                message: "Place your bet on Seat 3.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.selectedChipValue === 100 && s.seats[2].hands[0].betAmount === 0,
                targetElementId: 'seat-3',
                position: 'bottom'
            },
            {
                id: 4,
                message: "Tap 'DEAL'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.seats[2].hands[0].betAmount > 0,
                targetElementId: 'action-button-deal',
                position: 'bottom'
            },
            {
                id: 5,
                message: "Here, you have a Hard 16 against the Dealer's 10, and the True Count is elevated. The Hand Advisor confirms that STANDING is mathematically superior.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                position: 'center',
                requiresClick: true
            },
            {
                id: 6,
                message: "Tap 'STAND', strictly adhering to the Illustrious 18 deviation for this high True Count situation.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 7,
                message: "The Dealer revealed 16 and drew a 10 to bust! By following the True Count deviation and STANDING, you secured a victory that strictly following Basic Strategy would have lost. Advanced Tutorial Complete! Tap 'FINISH TUTORIAL'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'finish-tutorial-button',
                position: 'player'
            }
        ]
    }
];


// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// PAIR SPLITTING MASTERY
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
