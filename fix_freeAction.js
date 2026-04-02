const fs = require('fs');
const path = './src/utils/tutorials/freeAction.ts';
let code = fs.readFileSync(path, 'utf8');

const newRound = `            {
                id: 8,
                message: "...But you ONLY lost your original $100 bet! The Free Split and Free Double chips vanish harmlessly. Math favors the free bet. Tap 'NEW ROUND'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            }
        ]
    },
    {
        round: 2,
        title: 'The Free Win',
        forcedCards: [
            { rank: Rank.NINE, suit: Suit.CLUBS, value: 9, isHidden: false },
            { rank: Rank.EIGHT, suit: Suit.DIAMONDS, value: 8, isHidden: true },
            { rank: Rank.FIVE, suit: Suit.SPADES, value: 5, isHidden: false },
            { rank: Rank.NINE, suit: Suit.HEARTS, value: 9, isHidden: false },
            { rank: Rank.SIX, suit: Suit.CLUBS, value: 6, isHidden: false }
        ],
        steps: [
            {
                id: 0,
                message: "Let's see that Free Double in action when it wins! You risk nothing extra, but get double the reward.",
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
                message: "Tap 'DEAL'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.seats[2].hands[0].betAmount > 0,
                targetElementId: 'action-button-deal',
                position: 'bottom'
            },
            {
                id: 4,
                message: "You have an 11. It's a Free Double! Tap DOUBLE DOWN.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN,
                targetElementId: 'action-double',
                position: 'player'
            },
            {
                id: 5,
                message: "You get a 20! Dealer has 17. The Free Double pays off like a real chip. You win $200! Enjoy the free bets. Tap 'COMPLETE TUTORIAL'.",
                condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT,
                targetElementId: 'new-round-button',
                position: 'player'
            }
        ]
    }
];`;

code = code.replace(/            \{\s+id: 8,[\s\S]*?position: 'player'\s+\}\s+\]\s+\}\s+\];/g, newRound);
fs.writeFileSync(path, code);