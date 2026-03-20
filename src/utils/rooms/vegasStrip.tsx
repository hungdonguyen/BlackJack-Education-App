import React from 'react';
import { Ticket } from 'lucide-react';
import { VegasStripRules } from '@/rules/VegasStripRules';
import { RoomConfig } from './types';

export const vegasStrip: RoomConfig = {
    id: 'vegas_strip',
    name: 'Vegas Strip Blackjack',
    subtitle: 'Authentic 4-Deck Rules',
    description: 'Vegas Strip Rules — 4 decks. Blackjack pays 3 to 2. Dealer stands on soft 17 and hard 17. Double on any two cards. Double after split allowed. Split up to 4 hands. Split aces receive 1 card only. No surrender.',
    feltGradient: 'radial-gradient(ellipse 90% 85% at 50% 60%, #170f3f 0%, #0e092b 25%, #080517 50%, #03020b 80%, #010105 100%)',
    bgGradient: 'radial-gradient(ellipse 120% 100% at 50% 40%, #0c0724 0%, #060312 50%, #020108 100%)',
    borderColor: 'rgba(139, 92, 246, 0.12)',
    rules: {
        blackjackPays: 'Blackjack Pays 3 to 2',
        insurancePays: 'Insurance Pays 2 to 1',
        dealerStands: 'Dealer stands on soft 17 and hard 17',
    },
    gameRules: {
        numberOfDecks: 4,
        dealerHitsSoft17: false,
        allowSurrender: false,
    },
    blackjackMultiplier: 1.5,
    betRange: [1, 1_000_000_000],
    rtp: '99.63%',
    icon: <Ticket className="w-5 h-5 drop-shadow-md text-purple-400" />,
    accentColor: '#8b5cf6',
    logoPath: '/images/logo/rooms/vegas_strip.png',
    strategyType: 'vegas_strip',
    deviationsSet: 'standard',
    rulesClass: VegasStripRules,
    strategyModalContent: {
        overview: "Vegas Strip rules are the gold standard for American Blackjack, played with 4 decks and dealer standing on all 17s.",
        highlights: [
            { eyebrow: "Decks", title: "4 Decks", detail: "Provides a lower house edge than 8-deck shoes.", tone: 'good' },
            { eyebrow: "Dealer", title: "S17", detail: "Dealer stands on Soft 17.", tone: 'good' },
            { eyebrow: "Splitting", title: "Up to 4 Hands", detail: "Significant flexibility for pair splitting.", tone: 'accent' }
        ],
        playerOptions: {
            title: "Player Options",
            items: [
                "Double Down: On any two initial cards",
                "Double After Split (DAS): Allowed",
                "Split: Up to 3 times (Total 4 hands)",
                "Split Aces: Receive 1 card only",
                "Resplit Aces: Not allowed"
            ]
        },
        payouts: {
            title: "Payouts",
            items: [
                "Blackjack: 3 to 2",
                "Insurance: 2 to 1"
            ]
        },
        dealerFlow: {
            title: "Dealer Rules",
            items: [
                "Soft 17: Dealer STANDS",
                "Hard 17+: Dealer STANDS",
                "Hole Card: Dealer peeks for BJ on Aces and 10-value cards"
            ]
        },
        strategyNotes: {
            title: "Strategy Notes",
            items: [
                "The House Edge is approximately 0.35% with perfect strategy.",
                "Higher deck penetration and S17 rule make this one of the most player-friendly variants."
            ]
        }
    },
    strategyTableManual: {
        hard: {
            title: "Hard Totals",
            summary: "4-Deck S17 Basic Strategy",
            bullets: [
                "Always Double 11 vs any dealer card.",
                "Double 10 vs 2-9.",
                "Double 9 vs 3-6.",
                "Stand on 12 vs 4-6, otherwise Hit."
            ]
        },
        soft: {
            title: "Soft Totals",
            summary: "Hands with an Ace counting as 11",
            bullets: [
                "Double Soft 13-14 vs 5-6.",
                "Double Soft 15-16 vs 4-6.",
                "Double Soft 17-18 vs 3-6.",
                "Always Stand on Soft 19+."
            ]
        },
        pairs: {
            title: "Pairs",
            summary: "Splitting Strategy",
            bullets: [
                "Always split Aces and 8s.",
                "Never split 5s or 10s.",
                "Split 2s, 3s, 7s vs 2-7.",
                "Split 4s vs 5-6."
            ]
        }
    }
};
