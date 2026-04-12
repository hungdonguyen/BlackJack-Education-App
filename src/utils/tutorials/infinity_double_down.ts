import { GameState } from '@/types/game';
import { Rank, Suit, GamePhase } from '@/types/enums';
import { TutorialLesson } from './types';

export const MADNESS_TUTORIAL_LESSONS: TutorialLesson[] = [
    {
        round: 0,
        title: 'Continuous Double Chain',
        forcedCards: [
             { rank: Rank.TEN, suit: Suit.HEARTS, value: 10, isHidden: false }, // Dealer hit -> 26 bust
             { rank: Rank.TEN, suit: Suit.CLUBS, value: 10, isHidden: false }, // 3rd double -> 21
             { rank: Rank.THREE, suit: Suit.DIAMONDS, value: 3, isHidden: false }, // 2nd double -> 11
             { rank: Rank.SIX, suit: Suit.SPADES, value: 6, isHidden: false }, // 1st double -> 8
             { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: true }, // Dealer hole -> 16
             { rank: Rank.SIX, suit: Suit.SPADES, value: 6, isHidden: false }, // Dealer face -> 6
             { rank: Rank.TWO, suit: Suit.CLUBS, value: 2, isHidden: false }, // Player 1st -> 2
        ],
        steps: [
            { id: 0, message: "Ready for InfinityDoubleDown? You can DOUBLE DOWN repeatedly on the same hand. Let's learn the chain flow first (without starting on an Ace).", condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.selectedChipValue !== 100, position: 'center' },
            { id: 1, message: "Select the $100 chip.", condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.selectedChipValue !== 100, targetElementId: 'chip-100', position: 'bottom' },
            { id: 2, message: "Place your bet on Seat 3.", condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.selectedChipValue === 100 && s.seats[2].hands[0].betAmount === 0, targetElementId: 'seat-3', position: 'bottom' },
            { id: 3, message: "Tap DEAL to start.", condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.seats[2].hands[0].betAmount > 0, targetElementId: 'action-button-deal', position: 'bottom' },
            { id: 4, message: "Single-card 2 vs dealer 6. Start the pressure: tap DOUBLE DOWN.", condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 1, targetElementId: 'action-double', position: 'player' },
            { id: 5, message: "Hand still has momentum. Stack one more time: tap DOUBLE DOWN again.", condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 2, targetElementId: 'action-double', position: 'player' },
            { id: 6, message: "One more build before lock-in. Tap DOUBLE DOWN.", condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 3, targetElementId: 'action-double', position: 'player' },
            { id: 7, message: "That is the InfinityDoubleDown identity: repeat doubles can snowball fast. This time the chain reached 21 and the dealer busted.", condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT, position: 'center', requiresClick: true },
            { id: 8, message: "You now know the chain-double rhythm. Tap NEW ROUND.", condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT, targetElementId: 'new-round-button', position: 'player' }
        ]
    },
    {
        round: 1,
        title: 'Continuous Double (Risk)',
        forcedCards: [
             { rank: Rank.FIVE, suit: Suit.HEARTS, value: 5, isHidden: false }, // Dealer Hit -> 21
             { rank: Rank.FIVE, suit: Suit.DIAMONDS, value: 5, isHidden: false }, // 2nd Double -> 14
             { rank: Rank.SEVEN, suit: Suit.SPADES, value: 7, isHidden: false }, // 1st Double -> 9
             { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: true }, // Dealer Hole -> 16
             { rank: Rank.SIX, suit: Suit.SPADES, value: 6, isHidden: false }, // Dealer Face -> 6
             { rank: Rank.TWO, suit: Suit.DIAMONDS, value: 2, isHidden: false }, // Player 1st -> 2
        ],
        steps: [
            { id: 0, message: "Place a $100 bet on Seat 3.", condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.seats[2].hands[0].betAmount === 0, targetElementId: 'seat-3', position: 'bottom' },
            { id: 1, message: "Tap DEAL.", condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.seats[2].hands[0].betAmount > 0, targetElementId: 'action-button-deal', position: 'bottom' },
            { id: 2, message: "You start on a single 2. Hand Advisor says DOUBLE.", condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 1, targetElementId: 'action-double', position: 'player' },
            { id: 3, message: "You got a 7 (Total 9). Keep building the pot! Tap DOUBLE DOWN.", condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 2, targetElementId: 'action-double', position: 'player' },
            { id: 4, message: "You got a 5 (Total 14). Strategy now switches to STAND vs dealer 6. Tap STAND.", condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 3, targetElementId: 'action-stand', position: 'player' },
            { id: 5, message: "Dealer reaches 21 and beats your stacked hand. This is the downside of building a bigger wager before the stand point.", condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT, position: 'center', requiresClick: true },
            { id: 6, message: "InfinityDoubleDown is high variance: follow the table cutoffs even when the pot feels exciting. Tap NEW ROUND.", condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT, targetElementId: 'new-round-button', position: 'player' }
        ]
    },
    {
        round: 2,
        title: 'Beware of Push 22',
        forcedCards: [
             { rank: Rank.SIX, suit: Suit.HEARTS, value: 6, isHidden: false }, // Dealer Hit -> 22
             { rank: Rank.TEN, suit: Suit.CLUBS, value: 10, isHidden: false }, // Player Hit -> 20
             { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: true }, // Dealer Hole -> 16
             { rank: Rank.SIX, suit: Suit.SPADES, value: 6, isHidden: false }, // Dealer Face -> 6
             { rank: Rank.TEN, suit: Suit.HEARTS, value: 10, isHidden: false }, // Player 1st -> 10
        ],
        steps: [
            { id: 0, message: "There's a catch to these crazy rules: The Dealer doesn't bust on 22! Place your $100 bet on Seat 3.", condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.seats[2].hands[0].betAmount === 0, targetElementId: 'seat-3', position: 'bottom' },
            { id: 1, message: "Tap DEAL.", condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.seats[2].hands[0].betAmount > 0, targetElementId: 'action-button-deal', position: 'bottom' },
            { id: 2, message: "With a single-card 10 vs dealer 6, InfinityDoubleDown strategy is DOUBLE. Tap DOUBLE DOWN to draw your second card.", condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 1, targetElementId: 'action-double', position: 'player' },
            { id: 3, message: "Now you have 20. Tap STAND.", condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 2, targetElementId: 'action-stand', position: 'player' },
            { id: 4, message: "Watch the Dealer... they drew to 22. Normally that's a bust.", condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT, position: 'center', requiresClick: true },
            { id: 5, message: "But in InfinityDoubleDown 21, Dealer 22 forces a PUSH for all non-busted hands. You only get your bet back! Tap NEW ROUND.", condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT, targetElementId: 'new-round-button', position: 'player' }
        ]
    },
    {
        round: 3,
        title: 'Ace Start: One Double + Suited BJ',
        forcedCards: [
             { rank: Rank.SIX, suit: Suit.CLUBS, value: 6, isHidden: false }, // Dealer Hit -> 22
             { rank: Rank.KING, suit: Suit.HEARTS, value: 10, isHidden: false }, // Player Draw -> Suited BJ
             { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: true }, // Dealer Hole -> 16
             { rank: Rank.SIX, suit: Suit.SPADES, value: 6, isHidden: false }, // Dealer Face -> 6
             { rank: Rank.ACE, suit: Suit.HEARTS, value: 11, isHidden: false }, // Player 1st -> A
        ],
        steps: [
            { id: 0, message: "Final lesson: when your FIRST card is an Ace in InfinityDoubleDown, you can only DOUBLE once on that hand.", condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.selectedChipValue !== 100, position: 'center', requiresClick: true },
            { id: 1, message: "Select the $100 chip.", condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.selectedChipValue !== 100, targetElementId: 'chip-100', position: 'bottom' },
            { id: 2, message: "Place your $100 bet on Seat 3 for the final lesson.", condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.seats[2].hands[0].betAmount === 0, targetElementId: 'seat-3', position: 'bottom' },
            { id: 3, message: "Tap DEAL.", condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.seats[2].hands[0].betAmount > 0, targetElementId: 'action-button-deal', position: 'bottom' },
            { id: 4, message: "You start with an Ace of Hearts. This is your one allowed double from an Ace-start hand, so tap DOUBLE DOWN now.", condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 1, targetElementId: 'action-double', position: 'player' },
            { id: 5, message: "Perfect: King of Hearts. You reached a suited 2-card Blackjack, and you will win 2:1 because suited blackjack pays 2:1.", condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT, position: 'center', requiresClick: true },
            { id: 6, message: "Dealer still hits 22, but natural 2-card Blackjacks bypass Push 22 and get paid.", condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT, position: 'center', requiresClick: true },
            { id: 7, message: "Ace-start rule remembered: one double only. Tap FINISH TUTORIAL.", condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT, targetElementId: 'finish-tutorial-button', position: 'player' }
        ]
    }
];

