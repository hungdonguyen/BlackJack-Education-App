import React from 'react';
import { FastForward } from 'lucide-react';
import { Madness21Rules } from '@/rules/Madness21Rules';
import { RoomConfig } from './types';

export const madness: RoomConfig = {
    id: 'madness_21',
    name: 'Infinity Double Down',
    subtitle: 'Inspired by Double Down Madness',
    description: 'Start with 1 card! Double down as many times as you like. Suited Blackjacks pay 2:1, but Beware: Dealer pushing on 22!',
    feltGradient: 'radial-gradient(ellipse 90% 85% at 50% 60%, #4c1d95 0%, #3b0764 25%, #2e1065 50%, #1e1b4b 80%, #0f172a 100%)',
    bgGradient: 'radial-gradient(ellipse 120% 100% at 50% 40%, #000000 0%, #111827 50%, #312e81 100%)',
    borderColor: 'rgba(124, 58, 237, 0.4)',
    rules: {
        blackjackPays: 'Suited BJ Pays 2:1, Unsuited 3:2',
        insurancePays: 'Insurance Pays 2 to 1',
        dealerStands: 'Dealer pushes on 22',
    },
    gameRules: {
        numberOfDecks: 8,
        dealerHitsSoft17: true,
        allowSurrender: false,
        allowDoubleDownRescue: false,
        allowInfiniteDouble: true,
        playerInitialCards: 1, // Only get 1 card to start
    },
    hasSideBet: true,
    sideBetType: 'push_22',
    blackjackMultiplier: 1.5, // Base unsuited
    betRange: [1, 1_000_000_000],
    rtp: '99.12%',
    baseGameRtp: '99.12%',
    sideBetRtp: '88.17%',
    icon: <FastForward className="w-5 h-5 drop-shadow-md text-purple-400 fill-purple-500" />,
    accentColor: '#8b5cf6',
    isBeta: true,
    logoPath: '/images/logo/rooms/infinity_double_down.png',
    strategyType: 'madness_21',
    deviationsSet: 'madness_21',
    strategySource: 'Michael Shackleford (Wizard of Odds)',
    rulesClass: Madness21Rules,
    strategyModalContent: {
        overview: "Start with just 1 card! You can Hit or Double Down repeatedly. Perfect for massive payouts if you have the bankroll.",
        highlights: [
            { eyebrow: "Feature", title: "Only 1 Card", detail: "You are dealt 1 card. Hit or Double to get your 2nd card.", tone: 'warn' },
            { eyebrow: "Feature", title: "Infinite Double", detail: "Double down on ANY number of cards.", tone: 'good' },
            { eyebrow: "Dealer", title: "Push on 22", detail: "Dealer 22 pushes all non-busted player hands.", tone: 'warn' },
            { eyebrow: "Payout", title: "Suited BJ", detail: "Get a 2-card 21 of the same suit for a huge 2:1 payout.", tone: 'good' },
            { eyebrow: "Side Bet", title: "Push 22", detail: "Win 11:1 if the dealer busts with exactly 22!", tone: 'accent' }
        ],
        playerOptions: {
            title: "Player Options",
            items: [
                "Double Down: On ANY number of cards",
                "Infinite Doubling: You can Double Down multiple times on the same hand",
                "Surrender: Allowed"
            ]
        },
        payouts: {
            title: "Payouts",
            items: [
                "Suited Blackjack (2-card 21): 2 to 1",
                "Unsuited Blackjack: 3 to 2",
                "Dealer 22: Pushes all player hands",
                "Push 22 Side Bet: 11 to 1"
            ]
        },
        dealerFlow: {
            title: "Dealer Rules",
            items: [
                "Soft 17: Dealer HITS",
                "Hard 17+: Dealer STANDS",
                "Special: Dealer 22 pushes the table"
            ]
        },
        strategyNotes: {
            title: "Strategy Notes",
            items: [
                "Be aggressive with Double Downs when the dealer shows weak cards (4, 5, 6).",
                "If you start with a 10 or Ace, strongly consider doubling!"
            ]
        }
    },
    strategyTableManual: {
        hard: {
            title: "Hard Totals",
            summary: "Madness Strategy",
            bullets: [
                "Double often because you can!",
                "Always Double starting 10 or 11.",
                "Hit until hard 17 vs Dealer 7+."
            ]
        },
        soft: {
            title: "Soft Totals",
            summary: "Hands with an Ace counting as 11",
            bullets: [
                "Double soft hands aggressively vs Dealer 4-6.",
                "Hit soft 17 or less."
            ]
        }
    }
};