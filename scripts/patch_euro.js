const fs = require('fs');

const euroContent = `import { Card, TutorialStep, GameState } from '@/types/game';
import { Rank, Suit, GamePhase } from '@/types/enums';
import { TutorialLesson } from './types';

export const EUROPEAN_TUTORIAL_LESSONS: TutorialLesson[] = [
    {
        round: 0,
        title: 'Restricted Doubles',
        forcedCards: [
             { rank: Rank.TEN, suit: Suit.HEARTS, value: 10, isHidden: false }, // Dealer Hit -> BUST
             { rank: Rank.EIGHT, suit: Suit.DIAMONDS, value: 8, isHidden: true },  // Dealer Hole -> 14
             { rank: Rank.SEVEN, suit: Suit.CLUBS, value: 7, isHidden: false }, // Player 2nd -> Soft 18
             { rank: Rank.SIX, suit: Suit.SPADES, value: 6, isHidden: false },  // Dealer Face -> 6
             { rank: Rank.ACE, suit: Suit.HEARTS, value: 11, isHidden: false },   // Player 1st -> Ace
        ],
        steps: [
            {
                id: 0,
                message: "European rules are strict: you can ONLY Double Down on hard 9, 10, or 11. Let's see how this changes strategy.",
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
                message: "You have Soft 18 (A+7) vs Dealer's 6. In Classic rules, this is a clear DOUBLE DOWN.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 2,
                position: 'center',
                requiresClick: true
            },
            {
                id: 5,
                message: "But European rules BLOCK that — because it's a soft hand, not a hard 9-11. You're forced to STAND. Tap STAND.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 2,
                targetElementId: 'action-stand',
                position: 'player'
            },
            {
                id: 6,
                message: "Dealer had 14, and busted with a 10! You win — but missed extra profit. Tap NEW ROUND.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            }
        ]
    },`;

let text = fs.readFileSync('src/utils/tutorials/european.ts', 'utf8');
const rest = text.substring(text.indexOf('{', text.indexOf('round: 1')));
fs.writeFileSync('src/utils/tutorials/european.ts', euroContent + '\n    {' + rest, 'utf8');
console.log('euro patched');
