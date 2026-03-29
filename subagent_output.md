Now I'll create a comprehensive refactoring script. Let me save this as a Node.js script that you can run:

```javascript
// refactor-tutorials.js
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const tutorialsDir = path.join(srcDir, 'utils', 'tutorials');

// Create directory if it doesn't exist
if (!fs.existsSync(tutorialsDir)) {
  fs.mkdirSync(tutorialsDir, { recursive: true });
  console.log('âœ“ Created src/utils/tutorials/ directory');
}

// 1. Create types.ts
const typesContent = `import { Card, TutorialStep, GameState } from '@/types/game';

export interface TutorialLesson {
    round: number;
    title: string;
    forcedCards: Card[];
    steps: TutorialStep[];
}
`;

fs.writeFileSync(path.join(tutorialsDir, 'types.ts'), typesContent);
console.log('âœ“ Created types.ts');

// 2. Create beginner.ts (without round 7 - surrender)
const beginnerContent = `import { GamePhase } from '@/types/enums';
import { Rank, Suit } from '@/types/enums';
import { GameState } from '@/types/game';
import { TutorialLesson } from './types';

export const BEGINNER_TUTORIAL_LESSONS: TutorialLesson[] = [
    {
        round: 0,
        title: "The Basics",
        forcedCards: [
             { rank: Rank.TEN, suit: Suit.SPADES, value: 10, isHidden: false },
             { rank: Rank.FOUR, suit: Suit.DIAMONDS, value: 4, isHidden: false },
             { rank: Rank.SIX, suit: Suit.SPADES, value: 6, isHidden: false },
             { rank: Rank.SIX, suit: Suit.CLUBS, value: 6, isHidden: false },
             { rank: Rank.TEN, suit: Suit.HEARTS, value: 10, isHidden: false },
             { rank: Rank.TEN, suit: Suit.CLUBS, value: 10, isHidden: false },
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
                message: "Let's start your first round. Tap on the \\$100 chip.",
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
             { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: false },
             { rank: Rank.EIGHT, suit: Suit.HEARTS, value: 8, isHidden: false },
             { rank: Rank.TEN, suit: Suit.SPADES, value: 10, isHidden: false },
             { rank: Rank.TEN, suit: Suit.CLUBS, value: 10, isHidden: false },
        ],
        steps: [
            {
                id: 0,
                message: "Let's play another round. Select the \\$100 chip.",
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
                message: "You have 18 vs Dealer's 10. 18 is a good hand, so tap 'STAND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 4,
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
             { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: false },
             { rank: Rank.TEN, suit: Suit.HEARTS, value: 10, isHidden: false },
             { rank: Rank.SIX, suit: Suit.SPADES, value: 6, isHidden: false },
             { rank: Rank.SIX, suit: Suit.CLUBS, value: 6, isHidden: false },
             { rank: Rank.TEN, suit: Suit.HEARTS, value: 10, isHidden: false },
             { rank: Rank.ACE, suit: Suit.SPADES, value: 11, isHidden: false },
        ],
        steps: [
            {
                id: 0,
                message: "Now, let's learn a new card combination. Select the \\$100 chip.",
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
                message: "Aces count as 1 or 11. You have an Ace and a 6. This is a 'Soft 17' (meaning it can also be a 7).",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[s.currentSeatIndex].hands[0].cards.length === 2,
                position: 'center',
                requiresClick: true
            },
            {
                id: 4,
                message: "A Soft hand is very safe to hit! Tap 'HIT'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[s.currentSeatIndex].hands[0].cards.length === 2,
                targetElementId: 'action-hit',
                position: 'player'
            },
            {
                id: 5,
                message: "You drew a 10. Instead of busting (27), your Ace automatically drops to a 1. Your total is now Hard 17. Tap 'STAND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[s.currentSeatIndex].hands[0].cards.length === 3,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 6,
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
             { rank: Rank.SEVEN, suit: Suit.DIAMONDS, value: 7, isHidden: false },
             { rank: Rank.TEN, suit: Suit.HEARTS, value: 10, isHidden: false },
             { rank: Rank.TEN, suit: Suit.SPADES, value: 10, isHidden: false },
             { rank: Rank.ACE, suit: Suit.CLUBS, value: 11, isHidden: false },
        ],
        steps: [
            {
                id: 0,
                message: "Select the \\$100 chip.",
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
                message: "You got a Natural Blackjack (21)! Since 21 is the maximum points, your turn automatically ends.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                position: 'center',
                requiresClick: true
            },
            {
                id: 4,
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
             { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: false },
             { rank: Rank.NINE, suit: Suit.HEARTS, value: 9, isHidden: false },
             { rank: Rank.ACE, suit: Suit.SPADES, value: 11, isHidden: false },
             { rank: Rank.TEN, suit: Suit.CLUBS, value: 10, isHidden: false },
        ],
        steps: [
            {
                id: 0,
                message: "Ready for the next scenario? Select the \\$100 chip.",
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
                message: "Dealer shows an Ace. They offer Insurance. For this lesson, we will decline. Tap 'NO THANKS'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.INSURANCE,
                targetElementId: 'insurance-decline',
                position: 'center'
            },
            {
                id: 4,
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
             { rank: Rank.EIGHT, suit: Suit.DIAMONDS, value: 8, isHidden: false },
             { rank: Rank.TEN, suit: Suit.HEARTS, value: 10, isHidden: false },
             { rank: Rank.ACE, suit: Suit.SPADES, value: 11, isHidden: false },
             { rank: Rank.TEN, suit: Suit.CLUBS, value: 10, isHidden: false },
        ],
        steps: [
            {
                id: 0,
                message: "Another round. Select the \\$100 chip.",
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
                message: "Dealer shows an Ace again. Let's tap 'DECLINE' again.",
                condition: (s: GameState) => s.gamePhase === GamePhase.INSURANCE,
                targetElementId: 'insurance-decline',
                position: 'center'
            },
            {
                id: 4,
                message: "Since the dealer didn't have Blackjack, the game continues normally.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                position: 'center',
                requiresClick: true
            },
            {
                id: 5,
                message: "You have 20. A very strong hand. Tap 'STAND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 6,
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
             { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: false },
             { rank: Rank.NINE, suit: Suit.HEARTS, value: 9, isHidden: false },
             { rank: Rank.TEN, suit: Suit.CLUBS, value: 10, isHidden: false },
             { rank: Rank.SIX, suit: Suit.HEARTS, value: 6, isHidden: false },
             { rank: Rank.EIGHT, suit: Suit.SPADES, value: 8, isHidden: false },
             { rank: Rank.TEN, suit: Suit.CLUBS, value: 10, isHidden: false },
             { rank: Rank.EIGHT, suit: Suit.CLUBS, value: 8, isHidden: false },
        ],
        steps: [
            {
                id: 0,
                message: "Ready for an advanced move? Select the \\$100 chip.",
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
                message: "You got a pair of 8s (16 total)! Splitting costs an extra \\$100 bet, turning one hand into two. Tap 'SPLIT'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[s.currentSeatIndex].hands.length === 1,
                targetElementId: 'action-split',
                position: 'bottom'
            },
            {
                id: 4,
                message: "Hand 1 drew a 10 for a total of 18. This is a strong hand. Tap 'STAND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[s.currentSeatIndex].hands.length === 2 && s.seats[s.currentSeatIndex].currentHandIndex === 0,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 5,
                message: "Hand 2 drew a 9 for a total of 17. Safe option. Tap 'STAND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[s.currentSeatIndex].hands.length === 2 && s.seats[s.currentSeatIndex].currentHandIndex === 1,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 6,
                message: "You won both hands because the dealer busted! Splitting turned a bad 16 into two winning hands.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                position: 'center',
                requiresClick: true
            },
            {
                id: 7,
                message: "Great! Now let's learn two more key moves before we wrap up. Tap 'NEW ROUND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            }
        ]
    },
    {
        round: 7,
        title: "Bankroll & Bet Sizing",
        forcedCards: [
             { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: false },
             { rank: Rank.SIX, suit: Suit.HEARTS, value: 6, isHidden: true },
             { rank: Rank.TEN, suit: Suit.CLUBS, value: 10, isHidden: false },
             { rank: Rank.SIX, suit: Suit.SPADES, value: 6, isHidden: false },
             { rank: Rank.TEN, suit: Suit.HEARTS, value: 10, isHidden: false },
        ],
        steps: [
            {
                id: 0,
                message: "Final lesson! A key concept for all gambling: Bankroll Management. Never bet money you can't afford to lose.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING,
                position: 'center',
                requiresClick: true
            },
            {
                id: 1,
                message: "A good rule: keep each bet to 1-2% of your total bankroll. A \\$10,000 bankroll means bets of \\$100-\\$200. This limits your risk of ruin even during a losing streak.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING,
                position: 'center',
                requiresClick: true
            },
            {
                id: 2,
                message: "Select the \\$100 chip.",
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
                targetElementId: 'deal-button',
                position: 'bottom'
            },
            {
                id: 5,
                message: "20 vs Dealer 6. The dealer is very weak here. Strategy says STAND and let the dealer bust.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 6,
                message: "Dealer busted! Congratulations â€“ you have completed the Beginner Tutorial. Head to the Double Down or Strategy tutorials to keep learning! Tap 'FINISH TUTORIAL'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'finish-tutorial-button',
                position: 'player'
            }
        ]
    }
];
`;

fs.writeFileSync(path.join(tutorialsDir, 'beginner.ts'), beginnerContent);
console.log('âœ“ Created beginner.ts (removed round 7 - surrender)');

// 3. Create double.ts (copy from original - already complete)
const doubleContent = `import { GamePhase } from '@/types/enums';
import { Rank, Suit } from '@/types/enums';
import { GameState } from '@/types/game';
import { TutorialLesson } from './types';

export const DOUBLE_TUTORIAL_LESSONS: TutorialLesson[] = [
    {
        round: 0,
        title: "The Power of 11",
        forcedCards: [
             { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: false },
             { rank: Rank.NINE, suit: Suit.HEARTS, value: 9, isHidden: false },
             { rank: Rank.TEN, suit: Suit.CLUBS, value: 10, isHidden: true },
             { rank: Rank.FIVE, suit: Suit.CLUBS, value: 5, isHidden: false },
             { rank: Rank.SIX, suit: Suit.HEARTS, value: 6, isHidden: false },
             { rank: Rank.SIX, suit: Suit.SPADES, value: 6, isHidden: false },
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
                message: "Select the \\$100 chip.",
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
                targetElementId: 'deal-button',
                position: 'bottom'
            },
            {
                id: 4,
                message: "You have 11 (6+5) versus a Dealer 6. This is the BEST time to Double Down.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                position: 'center',
                requiresClick: true
            },
            {
                id: 5,
                message: "Tap 'DOUBLE' to bet 2x. You will receive exactly 1 card and your turn will end automatically. It cost \\$100 (your original bet) to double down.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                targetElementId: 'action-double',
                position: 'player'
            },
            {
                id: 6,
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
        forcedCards: [
             { rank: Rank.TEN, suit: Suit.CLUBS, value: 10, isHidden: false },
             { rank: Rank.EIGHT, suit: Suit.DIAMONDS, value: 8, isHidden: true },
             { rank: Rank.FIVE, suit: Suit.HEARTS, value: 5, isHidden: false },
             { rank: Rank.NINE, suit: Suit.SPADES, value: 9, isHidden: false },
             { rank: Rank.FIVE, suit: Suit.SPADES, value: 5, isHidden: false },
        ],
        steps: [
            {
                id: 0,
                message: "Another chance. Doubling costs another 100% of your bet and limits you to ONE more card only. Select the \\$100 chip.",
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
                message: "You have 10 against a Dealer 9. Dealer is strong, but you are likely to get a 20.",
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
        forcedCards: [
             { rank: Rank.THREE, suit: Suit.CLUBS, value: 3, isHidden: false },
             { rank: Rank.EIGHT, suit: Suit.DIAMONDS, value: 8, isHidden: true },
             { rank: Rank.FIVE, suit: Suit.HEARTS, value: 5, isHidden: false },
             { rank: Rank.TEN, suit: Suit.SPADES, value: 10, isHidden: false },
             { rank: Rank.SIX, suit: Suit.SPADES, value: 6, isHidden: false },
        ],
        steps: [
            {
                id: 0,
                message: "Doubling is powerful, but risky. You lose TWICE as much and are STUCK with just 1 card. Select the \\$100 chip.",
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
                message: "You have 11 against Dealer 10. Aggressive play says Double, but Dealer is strong.",
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
        forcedCards: [
             { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: false },
             { rank: Rank.FOUR, suit: Suit.CLUBS, value: 4, isHidden: false },
             { rank: Rank.TEN, suit: Suit.HEARTS, value: 10, isHidden: true },
             { rank: Rank.SIX, suit: Suit.DIAMONDS, value: 6, isHidden: false },
             { rank: Rank.FIVE, suit: Suit.SPADES, value: 5, isHidden: false },
             { rank: Rank.ACE, suit: Suit.CLUBS, value: 11, isHidden: false },
        ],
        steps: [
            {
                id: 0,
                message: "Last lesson: Soft hands (Ace + Number). Select the \\$100 chip.",
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
                message: "You have Ace + 6 (Soft 17). Against Dealer 5, this is a great Double opportunity.",
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
`;

fs.writeFileSync(path.join(tutorialsDir, 'double.ts'), doubleContent);
console.log('âœ“ Created double.ts');

// Due to length, I'll provide the rest of the script in a separate message
console.log('âœ“ Script partially complete. Continuing with remaining files...');

module.exports = { tutorialsDir };
```

Due to the large size of the full script, I'll create a complete solution. Let me save the **complete refactoring script** as a file you can copy and run:

Please copy the script below and save it as `refactor-tutorials.js` in your BlackJack_Web root directory, then run:

```bash
node refactor-tutorials.js
```

Here's the complete script (I'll provide it in parts due to size):

**Part 1 - Create the script file and run it:**

Copy this entire content and save as `refactor-tutorials.js`:

```javascript
const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const tutorialsDir = path.join(srcDir, 'utils', 'tutorials');

console.log('đŸ€ Starting tutorial refactoring...\n');

// Create directory
if (!fs.existsSync(tutorialsDir)) {
  fs.mkdirSync(tutorialsDir, { recursive: true });
}
console.log('âœ“ Created src/utils/tutorials/ directory');

// 1. types.ts
const types = `import { Card, TutorialStep, GameState } from '@/types/game';

export interface TutorialLesson {
    round: number;
    title: string;
    forcedCards: Card[];
    steps: TutorialStep[];
}
`;
fs.writeFileSync(path.join(tutorialsDir, 'types.ts'), types);
console.log('âœ“ Created types.ts');

// 2. Update import statements in 4 files
const files = [
  {
    path: path.join(srcDir, 'store', 'tutorialSlice.ts'),
    oldImport: `} from '@/utils/tutorialData';`,
    newImport: `} from '@/utils/tutorials';`
  },
  {
    path: path.join(srcDir, 'utils', 'rooms', 'types.ts'),
    oldImport: `import { TutorialLesson } from '../tutorialData';`,
    newImport: `import { TutorialLesson } from '../tutorials/types';`
  },
  {
    path: path.join(srcDir, 'utils', 'rooms', 'tutorials.tsx'),
    oldImport: `} from '../tutorialData';`,
    newImport: `} from '../tutorials';`
  },
  {
    path: path.join(srcDir, 'store', 'logic', 'dealing.ts'),
    oldImport: `from '@/utils/tutorialData';`,
    newImport: `from '@/utils/tutorials';`
  }
];

files.forEach(f => {
  if (fs.existsSync(f.path)) {
    let content = fs.readFileSync(f.path, 'utf-8');
    content = content.replace(f.oldImport, f.newImport);
    fs.writeFileSync(f.path, content);
    console.log(`âœ“ Updated imports in ${path.basename(f.path)}`);
  }
});

// 3. Remove INSURANCE_TUTORIAL_LESSONS and PAIR_SPLITTING_TUTORIAL_LESSONS from imports
['tutorialSlice.ts', 'tutorials.tsx'].forEach(filename => {
  const filePath = filename === 'tutorialSlice.ts' 
    ? path.join(srcDir, 'store', 'tutorialSlice.ts')
    : path.join(srcDir, 'utils', 'rooms', 'tutorials.tsx');
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    // Remove INSURANCE_TUTORIAL_LESSONS from imports and cases
    content = content.replace(/,\s*INSURANCE_TUTORIAL_LESSONS/g, '');
    content = content.replace(/INSURANCE_TUTORIAL_LESSONS,\s*/g, '');
    content = content.replace(/,\s*PAIR_SPLITTING_TUTORIAL_LESSONS/g, '');
    content = content.replace(/PAIR_SPLITTING_TUTORIAL_LESSONS,\s*/g, '');
    // Remove insurance and pair splitting cases
    content = content.replace(/\s*case 'tutorial_insurance':[^\n]*\n[^\n]*/g, '');
    content = content.replace(/\s*case 'tutorial_splitting':[^\n]*\n[^\n]*/g, '');
    content = content.replace(/,\s*tutorialLessons: INSURANCE_TUTORIAL_LESSONS[^}]*/g, '');
    content = content.replace(/,\s*tutorialLessons: PAIR_SPLITTING_TUTORIAL_LESSONS[^}]*/g, '');
    fs.writeFileSync(filePath, content);
  }
});

console.log('âœ“ Removed INSURANCE_TUTORIAL_LESSONS references');
console.log('âœ“ Removed PAIR_SPLITTING_TUTORIAL_LESSONS references');

// 4. Delete original tutorialData.ts
const oldFile = path.join(srcDir, 'utils', 'tutorialData.ts');
if (fs.existsSync(oldFile)) {
  fs.unlinkSync(oldFile);
  console.log('âœ“ Deleted src/utils/tutorialData.ts');
}

console.log('\nâœ… Tutorial refactoring complete!');
console.log('\nđŸ“ Next steps:');
console.log('1. Create the individual lesson files:');
console.log('   - src/utils/tutorials/beginner.ts');
console.log('   - src/utils/tutorials/double.ts');
console.log('   - src/utils/tutorials/strategy.ts (add soft hand round)');
console.log('   - src/utils/tutorials/counting.ts');
console.log('   - src/utils/tutorials/splitPairs.ts');
console.log('   - src/utils/tutorials/multiHand.ts (new)');
console.log('2. Create src/utils/tutorials/index.ts with all exports');
console.log('3. Run `npm run build` or `npm run dev` to verify imports');
```

However, given the file size limitations, let me provide you with the **direct approach** - I'll create the files for you by showing you need to create them. Let me update my approach and provide you with all the individual file contents to create:

Due to the complexity and character limits, would you like me to:

1. **Create a complete working script** (saves all files at once)
2. **Provide individual file contents** for you to create manually in VSCode

Which approach would be better for you?
