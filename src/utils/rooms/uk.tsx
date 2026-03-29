import React from 'react';
import { Crown } from 'lucide-react';
import { UKRules } from '@/rules/UKRules';
import { RoomConfig } from './types';

export const uk: RoomConfig = {
    id: 'uk',
    name: 'United Kingdom',
    subtitle: 'UK Casino Standards',
    description: 'UK Rules — 6 decks. European No Hole Card (ENHC) applies, but Original Bets Only (OBO) protects your doubles and splits against late dealer Blackjacks. Dealer stands on all 17s. Double down on ANY two cards. Double after split allowed. Split any equal value to 4 hands. No surrender.',
    feltGradient: 'radial-gradient(ellipse 90% 85% at 50% 60%, #1e1b4b 0%, #151433 25%, #0f1026 50%, #070817 80%, #02020a 100%)',
    bgGradient: 'radial-gradient(ellipse 120% 100% at 50% 40%, #161A26 0%, #0C0F16 50%, #05060A 100%)',
    borderColor: 'rgba(99, 102, 241, 0.25)',
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
    rtp: '99.45%',
    icon: <Crown className="w-5 h-5 drop-shadow-md text-indigo-400" />,
    accentColor: '#6366f1',
    logoPath: '/images/logo/rooms/uk_logo.png',
    strategyType: 'uk',
    deviationsSet: 'uk',
    rulesClass: UKRules,
    strategyModalContent: {
        overview: "UK Rules use European No Hole Card (ENHC) but protect player doubles/splits via Original Bets Only (OBO) logic.",
        highlights: [
            { eyebrow: "Hole Card", title: "No Hole Card", detail: "Dealer does not take a second card until you finish.", tone: 'warn' },
            { eyebrow: "Safety", title: "OBO Protection", detail: "Only your original bet is lost if dealer gets Blackjack.", tone: 'good' },
            { eyebrow: "Dealer", title: "S17", detail: "Dealer stands on all 17s.", tone: 'good' }
        ],
        playerOptions: {
            title: "Player Options",
            items: [
                "Double Down: On any two initial cards",
                "Double After Split (DAS): Allowed",
                "Split: Any equal value cards (up to 4 hands)",
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
                "No Hole Card: Dealer draws 2nd card last"
            ]
        },
        strategyNotes: {
            title: "Strategy Notes",
            items: [
                "Thanks to OBO, you can play standard S17 strategy for doubles and splits.",
                "House edge is lower than standard ENHC because of OBO protection."
            ]
        }
    },
    strategyTableManual: {
        hard: {
            title: "Hard Totals",
            summary: "UK 6-Deck S17 (OBO)",
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
