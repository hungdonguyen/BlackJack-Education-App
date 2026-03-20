import React from 'react';
import { Ticket } from 'lucide-react';
import { EuropeanRules } from '@/rules/EuropeanRules';
import { RoomConfig } from './types';

export const european: RoomConfig = {
    id: 'european',
    name: 'European Blackjack',
    subtitle: 'Standard European Rules',
    description: 'European Rules — 6 decks. Blackjack pays 3 to 2. Dealer takes no hole card (ENHC) and stands on soft 17 and hard 17. Double down allowed on hard 9-11 only. Split once for equal-value cards. No double after split. No surrender.',
    feltGradient: 'radial-gradient(ellipse 90% 85% at 50% 60%, #1a3b1a 0%, #102a10 25%, #051a05 50%, #010a01 80%, #000500 100%)',
    bgGradient: 'radial-gradient(ellipse 120% 100% at 50% 40%, #0f1f0f 0%, #081208 50%, #020502 100%)',
    borderColor: 'rgba(34, 197, 94, 0.15)',
    rules: {
        blackjackPays: 'Blackjack Pays 3 to 2',
        insurancePays: 'Insurance Pays 2 to 1',
        dealerStands: 'Dealer stands on soft 17 and hard 17',
    },
    gameRules: {
        numberOfDecks: 6,
        dealerHitsSoft17: false,
        allowSurrender: false,
        enhc: true,
    },
    blackjackMultiplier: 1.5,
    betRange: [1, 1_000_000_000],
    rtp: '99.38%',
    icon: <Ticket className="w-5 h-5 drop-shadow-md text-green-400" />,
    accentColor: '#22c55e',
    logoPath: '/images/logo/rooms/european.png',
    strategyType: 'european',
    deviationsSet: 'european',
    rulesClass: EuropeanRules,
    strategyModalContent: {
        overview: "European Blackjack is known for its No Hole Card (ENHC) rule, which makes doubling and splitting riskier than American variants.",
        highlights: [
            { eyebrow: "Hole Card", title: "ENHC", detail: "Dealer does not take a second card until all players finish.", tone: 'warn' },
            { eyebrow: "Double Down", title: "Hard 9-11", detail: "Doubling is restricted to hard totals of 9, 10, or 11.", tone: 'warn' },
            { eyebrow: "Splitting", title: "Once Only", detail: "You can only split a hand once per round.", tone: 'warn' }
        ],
        playerOptions: {
            title: "Player Options",
            items: [
                "Double Down: Hard 9, 10, 11 only",
                "Double After Split (DAS): Not allowed",
                "Split: Once (Total 2 hands)",
                "Split Aces: Receive 1 card only"
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
                "No Hole Card: Dealer peeks for BJ only after player turns"
            ]
        },
        strategyNotes: {
            title: "Strategy Notes",
            items: [
                "Be careful splitting vs Dealer Ace/10 because you lose everything if they get BJ.",
                "The restricted double rules increase the house edge slightly compared to Vegas Strip."
            ]
        }
    },
    strategyTableManual: {
        hard: {
            title: "Hard Totals",
            summary: "European 6-Deck S17",
            bullets: [
                "Double 11 vs 2-10.",
                "Double 10 vs 2-9.",
                "Double 9 vs 3-6.",
                "Hit 11 vs Ace."
            ]
        },
        soft: {
            title: "Soft Totals",
            summary: "Hands with an Ace counting as 11",
            bullets: [
                "Never Double Soft hands (not allowed by rules).",
                "Stand on Soft 18 vs 2-8, otherwise Hit.",
                "Always Stand on Soft 19+."
            ]
        },
        pairs: {
            title: "Pairs",
            summary: "Splitting Strategy",
            bullets: [
                "Split Aces vs 2-10 (Hit vs Ace).",
                "Split 8s vs 2-9 (Hit vs 10/Ace).",
                "Never split 4s, 5s, 10s."
            ]
        }
    }
};
