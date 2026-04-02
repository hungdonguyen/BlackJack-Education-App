import { GameState } from '@/types/game';
import { Rank, Suit, GamePhase } from '@/types/enums';
import { TutorialLesson } from './types';

export const MADNESS_TUTORIAL_LESSONS: TutorialLesson[] = [
    {
        round: 0,
        title: 'Continuous Double (Win)',
        forcedCards: [
             { rank: Rank.TEN, suit: Suit.HEARTS, value: 10, isHidden: false }, // Dealer Hit -> BUST
             { rank: Rank.FIVE, suit: Suit.CLUBS, value: 5, isHidden: false }, // 3rd Double -> 21
             { rank: Rank.TWO, suit: Suit.DIAMONDS, value: 2, isHidden: false }, // 2nd Double -> 16
             { rank: Rank.THREE, suit: Suit.SPADES, value: 3, isHidden: false }, // 1st Double -> 14
             { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: true }, // Dealer Hole -> 16
             { rank: Rank.SIX, suit: Suit.SPADES, value: 6, isHidden: false }, // Dealer Face -> 6
             { rank: Rank.ACE, suit: Suit.CLUBS, value: 11, isHidden: false }, // Player 1st -> 11
        ],
        steps: [
            { id: 0, message: "Ready for Madness? Here you can DOUBLE DOWN on ANY number of cards, continuously! Let's build a massive pot.", condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.selectedChipValue !== 100, position: 'center' },
            { id: 1, message: "Select the $100 chip.", condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.selectedChipValue !== 100, targetElementId: 'chip-100', position: 'bottom' },
            { id: 2, message: "Place your bet on Seat 3.", condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.selectedChipValue === 100 && s.seats[2].hands[0].betAmount === 0, targetElementId: 'seat-3', position: 'bottom' },
            { id: 3, message: "Tap DEAL to start.", condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.seats[2].hands[0].betAmount > 0, targetElementId: 'action-button-deal', position: 'bottom' },
            { id: 4, message: "You only start with 1 card in Madness. Your 11 vs Dealer's 6 is a perfect spot to begin: tap DOUBLE DOWN. (Cost: $100)", condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 1, targetElementId: 'action-double', position: 'player' },
            { id: 5, message: "You drew a 3 (Total 14). In Madness strategy, 14 vs dealer 6 is a STAND. Tap STAND.", condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 2, targetElementId: 'action-stand', position: 'player' },
            { id: 6, message: "Dealer busts on 26. This hand shows the table line: start with an aggressive double, then lock a weak total against a weak dealer.", condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT, position: 'center', requiresClick: true },
            { id: 7, message: "Madness allows repeated doubles, but this exact spot is not a chain-double in the strategy table. Tap NEW ROUND.", condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT, targetElementId: 'new-round-button', position: 'player' }
        ]
    },
    {
        round: 1,
        title: 'Continuous Double (Risk)',
        forcedCards: [
             { rank: Rank.FIVE, suit: Suit.HEARTS, value: 5, isHidden: false }, // Dealer Hit -> 21
             { rank: Rank.TEN, suit: Suit.CLUBS, value: 10, isHidden: false }, // 3rd Double -> 25 BUST
             { rank: Rank.THREE, suit: Suit.DIAMONDS, value: 3, isHidden: false }, // 2nd Double -> 15
             { rank: Rank.ACE, suit: Suit.SPADES, value: 1, isHidden: false }, // 1st Double -> 11
             { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: true }, // Dealer Hole -> 16
             { rank: Rank.SIX, suit: Suit.SPADES, value: 6, isHidden: false }, // Dealer Face -> 6
             { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: false }, // Player 1st -> 10
        ],
        steps: [
            { id: 0, message: "Place a $100 bet on Seat 3.", condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.seats[2].hands[0].betAmount === 0, targetElementId: 'seat-3', position: 'bottom' },
            { id: 1, message: "Tap DEAL.", condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.seats[2].hands[0].betAmount > 0, targetElementId: 'action-button-deal', position: 'bottom' },
            { id: 2, message: "You start on a single 10. Hand Advisor says DOUBLE.", condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 1, targetElementId: 'action-double', position: 'player' },
            { id: 3, message: "You got an Ace (Total 11). Keep building the pot! Tap DOUBLE DOWN.", condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 2, targetElementId: 'action-double', position: 'player' },
            { id: 4, message: "You got a 3 (Total 14). Strategy now switches to STAND vs dealer 6. Tap STAND.", condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 3, targetElementId: 'action-stand', position: 'player' },
            { id: 5, message: "Dealer reaches 21 and beats your stacked hand. This is the downside of building a bigger wager before the stand point.", condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT, position: 'center', requiresClick: true },
            { id: 6, message: "Madness is high variance: follow the table cutoffs even when the pot feels exciting. Tap NEW ROUND.", condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT, targetElementId: 'new-round-button', position: 'player' }
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
            { id: 2, message: "With a single-card 10 vs dealer 6, Madness strategy is DOUBLE. Tap DOUBLE DOWN to draw your second card.", condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 1, targetElementId: 'action-double', position: 'player' },
            { id: 3, message: "Now you have 20. Tap STAND.", condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 2, targetElementId: 'action-stand', position: 'player' },
            { id: 4, message: "Watch the Dealer... they drew to 22. Normally that's a bust.", condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT, position: 'center', requiresClick: true },
            { id: 5, message: "But in Madness 21, Dealer 22 forces a PUSH for all non-busted hands. You only get your bet back! Tap NEW ROUND.", condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT, targetElementId: 'new-round-button', position: 'player' }
        ]
    },
    {
        round: 3,
        title: 'Suited BJ & Immunity',
        forcedCards: [
             { rank: Rank.SIX, suit: Suit.CLUBS, value: 6, isHidden: false }, // Dealer Hit -> 22
             { rank: Rank.KING, suit: Suit.HEARTS, value: 10, isHidden: false }, // Player Draw -> Suited BJ
             { rank: Rank.TEN, suit: Suit.DIAMONDS, value: 10, isHidden: true }, // Dealer Hole -> 16
             { rank: Rank.SIX, suit: Suit.SPADES, value: 6, isHidden: false }, // Dealer Face -> 6
             { rank: Rank.ACE, suit: Suit.HEARTS, value: 11, isHidden: false }, // Player 1st -> A
        ],
        steps: [
            { id: 0, message: "Place your $100 bet on Seat 3 for the final lesson.", condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.seats[2].hands[0].betAmount === 0, targetElementId: 'seat-3', position: 'bottom' },
            { id: 1, message: "Tap DEAL.", condition: (s: GameState) => s.gamePhase === GamePhase.BETTING && s.seats[2].hands[0].betAmount > 0, targetElementId: 'action-button-deal', position: 'bottom' },
            { id: 2, message: "You start with an Ace of Hearts. Tap DOUBLE DOWN to draw one card and complete a 2-card hand.", condition: (s: GameState) => s.gamePhase === GamePhase.PLAYER_TURN && s.seats[2].hands[0].cards.length === 1, targetElementId: 'action-double', position: 'player' },
            { id: 3, message: "Perfect: King of Hearts! That's a Suited 2-card Blackjack, which pays 2:1 in Madness 21.", condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT, position: 'center', requiresClick: true },
            { id: 4, message: "The Dealer hit 22 again.", condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT, position: 'center', requiresClick: true },
            { id: 5, message: "Natural 2-card Blackjacks bypass Push 22, so you still get paid. Now you know the Madness! Tap FINISH TUTORIAL.", condition: (s: GameState) => s.gamePhase === GamePhase.PAYOUT, targetElementId: 'finish-tutorial-button', position: 'player' }
        ]
    }
];
