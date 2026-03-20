import React from 'react';
import { Anchor } from 'lucide-react';
import { AtlanticCityRules } from '@/rules/AtlanticCityRules';
import { RoomConfig } from './types';

export const atlanticCity: RoomConfig = {
    id: 'atlantic_city',
    name: 'Atlantic City',
    subtitle: 'East Coast 8-Deck Classic',
    description: 'Atlantic City Rules — 8 decks. Blackjack pays 3 to 2. Dealer stands on soft 17 and hard 17. Peek on Ace and 10. Double on any two cards. Double after split allowed. Split up to 4 hands, including mixed 10-value cards. Split aces receive 1 card only with no re-split. Late surrender allowed.',
    feltGradient: 'radial-gradient(ellipse 90% 85% at 50% 60%, #0f2b2b 0%, #082020 25%, #041515 50%, #020b0b 80%, #010606 100%)',
    bgGradient: 'radial-gradient(ellipse 120% 100% at 50% 40%, #0a1f1f 0%, #051010 50%, #020808 100%)',
    borderColor: 'rgba(20, 184, 166, 0.15)',
    rules: {
        blackjackPays: 'Blackjack Pays 3 to 2',
        insurancePays: 'Insurance Pays 2 to 1',
        dealerStands: 'Dealer stands on soft 17 and hard 17',
    },
    gameRules: {
        numberOfDecks: 8,
        dealerHitsSoft17: false,
        allowSurrender: true,
    },
    blackjackMultiplier: 1.5,
    betRange: [1, 1_000_000_000],
    rtp: '99.64%',
    icon: <Anchor className="w-5 h-5 drop-shadow-md text-teal-400" />,
    accentColor: '#14b8a6',
    logoPath: '/images/logo/rooms/atlantic.png',
    strategyType: 'atlantic_city',
    deviationsSet: 'standard',
    rulesClass: AtlanticCityRules,
    strategyModalContent: {
        overview: "Atlantic City rules are similar to Vegas Strip but use 8 decks and allow Late Surrender.",
        highlights: [
            { eyebrow: "Surrender", title: "Late Surrender", detail: "Give up half your bet to exit a bad hand.", tone: 'good' },
            { eyebrow: "Dealer", title: "S17", detail: "Dealer stands on Soft 17.", tone: 'good' },
            { eyebrow: "Decks", title: "8 Decks", detail: "Large shoe size slightly increases house edge.", tone: 'warn' }
        ],
        playerOptions: {
            title: "Player Options",
            items: [
                "Double Down: On any two initial cards",
                "Double After Split (DAS): Allowed",
                "Split: Up to 3 times (Total 4 hands)",
                "Late Surrender: Available after dealer peeks for BJ"
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
                "Surrender 16 vs 9, 10, A.",
                "Surrender 15 vs 10.",
                "Standard S17 strategy applies for all other moves."
            ]
        }
    },
    strategyTableManual: {
        hard: {
            title: "Hard Totals",
            summary: "8-Deck S17 with Surrender",
            bullets: [
                "Surrender 16 vs 9, 10, A.",
                "Surrender 15 vs 10.",
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
