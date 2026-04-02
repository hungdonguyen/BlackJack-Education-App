const fs = require('fs');
const content = `import { Card, TutorialStep, GameState } from '@/types/game';
import { Rank, Suit, GamePhase } from '@/types/enums';
import { TutorialLesson } from './types';

export const MADNESS_TUTORIAL_LESSONS: TutorialLesson[] = [
    {
        round: 0,
        title: 'Continuous Double (Win)',
        forcedCards: [
             { rank: Rank.TEN, suit: Suit.HEARTS, value: 10, isHidden: false },
             { rank: Rank.TEN, suit: Suit.CLUBS, value: 10, isHidden: false },
             { rank: Rank.TWO, suit: Suit.DIAMONDS, value: 2, isHidden: false },
             { rank: Rank.FOUR, suit: Suit.SPADES, value: 4, isHidden: false },
             { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: true },
             { rank: Rank.TWO, suit: Suit.CLUBS, value: 2, isHidden: false },
             { rank: Rank.SIX, suit: Suit.SPADES, value: 6, isHidden: false },
             { rank: Rank.THREE, suit: Suit.HEARTS, value: 3, isHidden: false },
        ],
        steps: [
            { id: 0, message: 'Ready for Madness? Here you can DOUBLE DOWN on ANY number of cards, continuously! Let\\'s build a massive pot.', condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.selectedChipValue !== 100, position: 'center', requiresClick: true },
            { id: 1, message: 'Select the $100 chip.', condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.selectedChipValue !== 100, targetElementId: 'chip-100', position: 'bottom' },
            { id: 2, message: 'Place your bet on Seat 3.', condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.selectedChipValue === 100 && s.seats[2].hands[0].betAmount === 0, targetElementId: 'seat-3', position: 'bottom' },
            { id: 3, message: 'Tap DEAL to start.', condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.seats[2].hands[0].betAmount > 0, targetElementId: 'action-button-deal', position: 'bottom' },
            { id: 4, message: 'A measly 5 vs Dealer\\'s 6. Normally you hit, but let\\'s double! Tap DOUBLE DOWN. (Cost: $100)', condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 2, targetElementId: 'action-double', position: 'player' },
            { id: 5, message: 'You got a 4 (Total 9). You can STILL Double Down! Tap DOUBLE DOWN again. (Cost: $200)', condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 3, targetElementId: 'action-double', position: 'player' },
            { id: 6, message: 'Total is 11! The perfect spot to double again! Tap DOUBLE DOWN. (Cost: $400)', condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 4, targetElementId: 'action-double', position: 'player' },
            { id: 7, message: 'You caught a 10 for a perfect 21! Notice your bet grew exponentially. And the Dealer busts!', condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT, position: 'center', requiresClick: true },
            { id: 8, message: 'You turned a $100 original bet into a massive $1,600 payout! Tap NEW ROUND.', condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT, targetElementId: 'new-round-button', position: 'player' }
        ]
    },
    {
        round: 1,
        title: 'Continuous Double (Risk)',
        forcedCards: [
             { rank: Rank.FIVE, suit: Suit.HEARTS, value: 5, isHidden: false }, // Dealer Hit -> 21
             { rank: Rank.FOUR, suit: Suit.CLUBS, value: 4, isHidden: false }, // 3rd Double -> 14
             { rank: Rank.THREE, suit: Suit.DIAMONDS, value: 3, isHidden: false }, // 2nd Double -> 10
             { rank: Rank.TWO, suit: Suit.SPADES, value: 2, isHidden: false }, // 1st Double -> 7
             { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: true }, // Dealer Hole -> 16
             { rank: Rank.THREE, suit: Suit.CLUBS, value: 3, isHidden: false }, // Player 2nd -> 5
             { rank: Rank.SIX, suit: Suit.SPADES, value: 6, isHidden: false }, // Dealer Face -> 6
             { rank: Rank.TWO, suit: Suit.HEARTS, value: 2, isHidden: false }, // Player 1st -> 2
        ],
        steps: [
            { id: 0, message: 'Place a $100 bet on Seat 3.', condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.seats[2].hands[0].betAmount === 0, targetElementId: 'seat-3', position: 'bottom' },
            { id: 1, message: 'Tap DEAL.', condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.seats[2].hands[0].betAmount > 0, targetElementId: 'action-button-deal', position: 'bottom' },
            { id: 2, message: 'Let\\'s try that aggressive multiple-double strategy again. Tap DOUBLE DOWN.', condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 2, targetElementId: 'action-double', position: 'player' },
            { id: 3, message: 'You got a 2 (Total 7). Keep building the pot! Tap DOUBLE DOWN.', condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 3, targetElementId: 'action-double', position: 'player' },
            { id: 4, message: 'You got a 3 (Total 10). Let\\'s do it one more time! Tap DOUBLE DOWN.', condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 4, targetElementId: 'action-double', position: 'player' },
            { id: 5, message: 'You pushed it too far and are stuck at 14. Since your bet is huge, Tap STAND and hope the Dealer busts.', condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 5, targetElementId: 'action-stand', position: 'player' },
            { id: 6, message: 'Ouch. The dealer hit 21 and you lost the massive bet. Continuous doubling is high risk! Tap NEW ROUND.', condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT, targetElementId: 'new-round-button', position: 'player' }
        ]
    },
    {
        round: 2,
        title: 'Beware of Push 22',
        forcedCards: [
             { rank: Rank.SIX, suit: Suit.HEARTS, value: 6, isHidden: false }, // Dealer Hit -> 22
             { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: true }, // Dealer Hole -> 16
             { rank: Rank.TEN, suit: Suit.CLUBS, value: 10, isHidden: false }, // Player 2nd -> 20
             { rank: Rank.SIX, suit: Suit.SPADES, value: 6, isHidden: false }, // Dealer Face -> 6
             { rank: Rank.TEN, suit: Suit.HEARTS, value: 10, isHidden: false }, // Player 1st -> 10
        ],
        steps: [
            { id: 0, message: 'There\\'s a catch to these crazy rules: The Dealer doesn\\'t bust on 22! Place your $100 bet on Seat 3.', condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.seats[2].hands[0].betAmount === 0, targetElementId: 'seat-3', position: 'bottom' },
            { id: 1, message: 'Tap DEAL.', condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.seats[2].hands[0].betAmount > 0, targetElementId: 'action-button-deal', position: 'bottom' },
            { id: 2, message: 'You have 20. A solid hand against a 6. Tap STAND.', condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN, targetElementId: 'action-stand', position: 'player' },
            { id: 3, message: 'Watch the Dealer... they drew to 22. Normally that\\'s a bust.', condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT, position: 'center', requiresClick: true },
            { id: 4, message: 'But in Madness 21, Dealer 22 forces a PUSH for all non-busted hands. You only get your bet back! Tap NEW ROUND.', condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT, targetElementId: 'new-round-button', position: 'player' }
        ]
    },
    {
        round: 3,
        title: 'Suited BJ & Immunity',
        forcedCards: [
             { rank: Rank.SIX, suit: Suit.CLUBS, value: 6, isHidden: false },
             { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: true },
             { rank: Rank.KING, suit: Suit.HEARTS, value: 10, isHidden: false },
             { rank: Rank.SIX, suit: Suit.SPADES, value: 6, isHidden: false },
             { rank: Rank.ACE, suit: Suit.HEARTS, value: 11, isHidden: false },
        ],
        steps: [
            { id: 0, message: 'Place your $100 bet on Seat 3 for the final lesson.', condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.seats[2].hands[0].betAmount === 0, targetElementId: 'seat-3', position: 'bottom' },
            { id: 1, message: 'Tap DEAL.', condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.seats[2].hands[0].betAmount > 0, targetElementId: 'action-button-deal', position: 'bottom' },
            { id: 2, message: 'You got a Blackjack — and both cards are Hearts! That\\'s a Suited Blackjack, which pays 2:1 in Madness 21!', condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT, position: 'center', requiresClick: true },
            { id: 3, message: 'The Dealer hit 22 again.', condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT, position: 'center', requiresClick: true },
            { id: 4, message: 'However, Natural Blackjacks BYPASS the Push 22 rule — you still get paid! Now you know the Madness! Tap COMPLETE TUTORIAL.', condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT, targetElementId: 'new-round-button', position: 'player' }
        ]
    }
];
`;
fs.writeFileSync('./src/utils/tutorials/madness.ts', content, 'utf8');