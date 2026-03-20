import React from 'react';
import { Spade } from 'lucide-react';
import { Iberian21Rules } from '@/rules/Iberian21Rules';
import { RoomConfig } from './types';

export const iberian21: RoomConfig = {
    id: 'iberian_21',
    name: 'Iberian 21',
    subtitle: 'Iberian 21 No-Ten Blackjack',
    description: 'Common Spanish 21 profile: 6 no-10 decks, H17, late surrender plus rescue, split to 4 hands with re-split aces, and bonus payouts for 5+ card 21s, 6-7-8 / 7-7-7, plus suited 7-7-7 vs dealer 7.',
    feltGradient: 'radial-gradient(ellipse 90% 85% at 50% 60%, #3a0b0b 0%, #2d0707 25%, #1f0404 50%, #0f0101 80%, #050000 100%)',
    bgGradient: 'radial-gradient(ellipse 120% 100% at 50% 40%, #1f0505 0%, #100202 50%, #050000 100%)',
    borderColor: 'rgba(239, 68, 68, 0.15)',
    rules: {
        blackjackPays: 'Blackjack 3:2 • Player 21 Always Wins',
        insurancePays: 'Insurance Pays 2 to 1',
        dealerStands: 'Dealer hits soft 17 and stands on hard 17 and above',
    },
    gameRules: {
        numberOfDecks: 6,
        dealerHitsSoft17: true,
        allowSurrender: true,
        omitTens: true,
        allowDoubleDownRescue: true,
    },
    blackjackMultiplier: 1.5,
    betRange: [1, 1_000_000_000],
    rtp: '99.24%',
    icon: <Spade className="w-5 h-5 drop-shadow-md text-red-500 fill-red-600" />,
    accentColor: '#be123c',
    isBeta: true,
    logoPath: '/images/logo/rooms/iberian21.png',
    strategyType: 'iberian_21',
    deviationsSet: 'iberian_21',
    rulesClass: Iberian21Rules,
    strategyModalContent: {
        overview: "Iberian 21 (Spanish 21) uses a 48-card deck (no 10s) but compensates with massive player-friendly rules and bonuses.",
        highlights: [
            { eyebrow: "Special", title: "No 10s", detail: "All 10-rank cards are removed from the deck.", tone: 'warn' },
            { eyebrow: "Bonus", title: "21 Wins", detail: "Player 21 always wins immediately vs Dealer.", tone: 'good' },
            { eyebrow: "Surrender", title: "Rescue", detail: "Surrender after doubling to save half your total bet.", tone: 'accent' }
        ],
        playerOptions: {
            title: "Player Options",
            items: [
                "Double Down: On any number of cards",
                "Double After Split (DAS): Allowed",
                "Late Surrender: Allowed on initial cards",
                "Double Down Rescue: Surrender after doubling",
                "Re-split Aces: Allowed"
            ]
        },
        payouts: {
            title: "Payouts",
            items: [
                "Blackjack: 3 to 2 (Always wins)",
                "5-Card 21: Pays 3 to 2",
                "6-Card 21: Pays 2 to 1",
                "7+ Card 21: Pays 3 to 1",
                "6-7-8 Mixed: Pays 3 to 2",
                "7-7-7 Suited: Pays 2 to 1 (Super Bonus available)"
            ]
        },
        dealerFlow: {
            title: "Dealer Rules",
            items: [
                "Soft 17: Dealer HITS",
                "Hard 17+: Dealer STANDS",
                "Hole Card: Dealer peeks for BJ"
            ]
        },
        strategyNotes: {
            title: "Strategy Notes",
            items: [
                "Since 10s are missing, you should hit more aggressively.",
                "Always Double 11 vs any card.",
                "Use Rescue if you double and get a low card vs a strong dealer."
            ]
        }
    },
    strategyTableManual: {
        hard: {
            title: "Hard Totals",
            summary: "Iberian 21 Basic Strategy",
            bullets: [
                "Always Hit 12-13 vs any card.",
                "Double 11 vs any card.",
                "Double 10 vs 2-8.",
                "Stand on 14 vs 4-6, otherwise Hit."
            ]
        },
        soft: {
            title: "Soft Totals",
            summary: "Hands with an Ace counting as 11",
            bullets: [
                "Always Hit Soft 13-17.",
                "Double Soft 18 vs 4-6.",
                "Stand on Soft 18 vs 2, 3, 7, 8."
            ]
        },
        pairs: {
            title: "Pairs",
            summary: "Splitting Strategy",
            bullets: [
                "Always split Aces.",
                "Split 2s, 3s, 7s vs 2-7.",
                "Split 6s vs 4-6.",
                "Split 8s vs 2-8."
            ]
        }
    }
};
