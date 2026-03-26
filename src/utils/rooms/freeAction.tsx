import React from 'react';
import { Zap } from 'lucide-react';
import { FreeActionRules } from '@/rules/FreeActionRules';
import { RoomConfig } from './types';

export const freeAction: RoomConfig = {
    id: 'free_action',
    name: 'Free Action Blackjack',
    subtitle: 'Golden Rewards & Free Actions',
    description: 'Free Action Rules — 6 decks. Blackjack pays 3 to 2. Dealer hits soft 17 and stands on hard 17 and above. Free doubles apply to hard 9, 10, and 11 at no extra cost. Free splits apply to every pair except 10-value cards. Dealer 22 pushes all non-blackjack hands. Multi Action Bonus side bet available. No surrender.',
    feltGradient: 'radial-gradient(ellipse 90% 85% at 50% 60%, #2a1f0a 0%, #1f170a 25%, #151005 50%, #0a0802 80%, #050401 100%)',
    bgGradient: 'radial-gradient(ellipse 120% 100% at 50% 40%, #1a1408 0%, #0f0c05 50%, #080602 100%)',
    borderColor: 'rgba(234, 179, 8, 0.18)',
    rules: {
        blackjackPays: 'Blackjack Pays 3 to 2',
        insurancePays: 'Insurance Pays 2 to 1',
        dealerStands: 'Dealer hits soft 17 and stands on hard 17 and above',
    },
    gameRules: {
        numberOfDecks: 6,
        dealerHitsSoft17: true,
        allowSurrender: false,
    },
    blackjackMultiplier: 1.5,
    betRange: [1, 1_000_000_000],
    rtp: '98.96%',
    baseGameRtp: '98.96%',
    sideBetRtp: '91.37%',
    icon: React.createElement(Zap, { className: "w-5 h-5 drop-shadow-md text-yellow-400 fill-yellow-400" }),
    accentColor: '#eab308',
    hasSideBet: true,
    sideBetType: 'multi_action',
    isFreeAction: true,
    isBeta: true,
    logoPath: '/images/logo/rooms/freeaction.png',
    strategyType: 'free_action',
    deviationsSet: 'free_action',
    strategySource: 'Michael Shackleford (Wizard of Odds)',
    rulesClass: FreeActionRules,
    strategyModalContent: {
        overview: "Free Action Blackjack (similar to Free Bet) offers free Double Downs and Splits in exchange for the Dealer pushing on 22.",
        highlights: [
            { eyebrow: "Free Action", title: "Free Double", detail: "Double for free on hard 9, 10, 11.", tone: 'good' },
            { eyebrow: "Free Action", title: "Free Split", detail: "Split all pairs (except 10s) for free.", tone: 'good' },
            { eyebrow: "Dealer", title: "Push on 22", detail: "Dealer 22 pushes all live player hands.", tone: 'warn' }
        ],
        playerOptions: {
            title: "Player Options",
            items: [
                "Free Double: Hard 9, 10, 11 (Initial 2 cards)",
                "Free Split: All pairs except 10, J, Q, K",
                "Normal Double/Split: Still available for other hands",
                "Double After Split: Allowed (including Free Splits)"
            ]
        },
        payouts: {
            title: "Payouts",
            items: [
                "Blackjack: 3 to 2",
                "Insurance: 2 to 1",
                "Dealer 22: Pushes all player hands (except BJ)"
            ]
        },
        dealerFlow: {
            title: "Dealer Rules",
            items: [
                "Soft 17: Dealer HITS",
                "Hard 17+: Dealer STANDS",
                "Special: Dealer 22 is NOT a bust"
            ]
        },
        strategyNotes: {
            title: "Strategy Notes",
            items: [
                "Take every Free Action offered — it's always mathematically correct.",
                "Be more aggressive with splitting since it's free."
            ]
        }
    },
    strategyTableManual: {
        hard: {
            title: "Hard Totals",
            summary: "Free Action Basic Strategy",
            bullets: [
                "Free Double 9, 10, 11 vs any dealer card.",
                "Standard Double 10 vs 2-9 (if not free).",
                "Always Stand on 13+ vs 3-6."
            ]
        },
        soft: {
            title: "Soft Totals",
            summary: "Hands with an Ace counting as 11",
            bullets: [
                "Double Soft 16-18 vs 6.",
                "Double Soft 17-18 vs 5.",
                "Stand on Soft 18 vs 2-8, otherwise Hit."
            ]
        },
        pairs: {
            title: "Pairs",
            summary: "Free Splitting Strategy",
            bullets: [
                "Free Split ALL pairs (2s thru 9s and Aces) vs any card.",
                "Split 10s: NEVER.",
                "Standard Split rules apply if money is required (rare in this mode)."
            ]
        }
    }
};
