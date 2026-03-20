import React from 'react';
import { Zap } from 'lucide-react';
import { ZapOut21Rules } from '@/rules/ZapOut21Rules';
import { RoomConfig } from './types';

export const zapout: RoomConfig = {
    id: 'zapout_21',
    name: 'Zap Out 21',
    subtitle: 'Zappit Blackjack Variant',
    description: 'Zap Out 21 — Zap away bad hands! Trade any hard 15-18 for two new cards (once per hand). Dealer hitting 22 pushes all non-busted player hands except natural Blackjacks. Natural Blackjacks pay 3:2, Zapped Blackjacks pay 1:1. Double on any two cards. Can split once.',
    feltGradient: 'radial-gradient(ellipse 90% 85% at 50% 60%, #1e3a8a 0%, #1e40af 25%, #1d4ed8 50%, #2563eb 80%, #3b82f6 100%)',
    bgGradient: 'radial-gradient(ellipse 120% 100% at 50% 40%, #000000 0%, #111827 50%, #1f2937 100%)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    rules: {
        blackjackPays: 'Natural Blackjack Pays 3:2, Zapped Blackjack Pays 1:1',
        insurancePays: 'Insurance Pays 2 to 1',
        dealerStands: 'Dealer pushes on 22',
    },
    gameRules: {
        numberOfDecks: 6,
        dealerHitsSoft17: true,
        allowSurrender: false,
    },
    blackjackMultiplier: 1.5,
    betRange: [1, 1_000_000_000],
    rtp: '98.87%',
    icon: <Zap className="w-5 h-5 drop-shadow-md text-blue-400 fill-blue-500" />,
    accentColor: '#3b82f6',
    isBeta: true,
    logoPath: '/images/logo/rooms/zapout21.png',
    strategyType: 'zapout_21',
    deviationsSet: 'zapout_21',
    rulesClass: ZapOut21Rules,
    strategyModalContent: {
        overview: "Zap Out 21 (Zappit) allows you to swap bad hands (15-18) for new cards, but costs you in Dealer Pushes on 22.",
        highlights: [
            { eyebrow: "Feature", title: "Zappit", detail: "Swap any hard 15, 16, 17, or 18 for a new hand.", tone: 'good' },
            { eyebrow: "Dealer", title: "Push on 22", detail: "Dealer 22 pushes all non-busted player hands.", tone: 'warn' },
            { eyebrow: "Payout", title: "Zap BJ", detail: "Blackjacks received after a Zap pay 1:1 instead of 3:2.", tone: 'warn' }
        ],
        playerOptions: {
            title: "Player Options",
            items: [
                "Zappit: Replace 15-18 (Initial 2 cards) with two new cards",
                "Double Down: On any two initial cards",
                "Double After Split (DAS): Allowed",
                "Split: Up to 3 times"
            ]
        },
        payouts: {
            title: "Payouts",
            items: [
                "Natural Blackjack: 3 to 2",
                "Zapped Blackjack: 1 to 1",
                "Dealer 22: Pushes all player hands (except Natural BJ)"
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
                "Always Zap any 15-18, especially vs strong dealer cards.",
                "The ability to escape the 'death zone' (15-16) is the main draw of this variant."
            ]
        }
    },
    strategyTableManual: {
        hard: {
            title: "Hard Totals",
            summary: "Zap Out Basic Strategy",
            bullets: [
                "Zap ALL 15, 16, 17, 18 hands.",
                "Always Double 11 vs any card.",
                "Double 10 vs 2-9."
            ]
        },
        soft: {
            title: "Soft Totals",
            summary: "Hands with an Ace counting as 11",
            bullets: [
                "Double Soft 13-14 vs 5-6.",
                "Double Soft 15-16 vs 4-6.",
                "Double Soft 17-18 vs 3-6."
            ]
        },
        pairs: {
            title: "Pairs",
            summary: "Splitting Strategy",
            bullets: [
                "Always split Aces and 8s.",
                "Split 2s, 3s, 7s vs 2-7.",
                "Split 6s vs 2-6."
            ]
        }
    }
};
