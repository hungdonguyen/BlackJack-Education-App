import React from 'react';
import { Spade } from 'lucide-react';
import { ClassicRules } from '@/rules/ClassicRules';
import { RoomConfig } from './types';

export const classic: RoomConfig = {
    id: 'classic',
    name: 'Classic Online Rule',
    subtitle: 'Live Dealer Standard',
    description: 'Classic Online Rule — 8 decks. Blackjack pays 3 to 2. Dealer stands on soft 17 and hard 17. Peek on Ace and 10. Double on any two cards. Double after split allowed. Split equal-value cards once only for a maximum of 2 hands, including mixed 10-value cards. Split aces receive 1 card only. No surrender.',
    feltGradient: 'radial-gradient(ellipse 90% 85% at 50% 60%, #8b1a1a 0%, #6a1414 25%, #4a0e0e 50%, #2a0808 80%, #1a0505 100%)',
    bgGradient: 'radial-gradient(ellipse 120% 100% at 50% 40%, #301a10 0%, #1a0e0a 50%, #0d0705 100%)',
    borderColor: 'rgba(212, 168, 67, 0.12)',
    rules: {
        blackjackPays: 'Blackjack Pays 3 to 2',
        insurancePays: 'Insurance Pays 2 to 1',
        dealerStands: 'Dealer stands on soft 17 and hard 17',
    },
    gameRules: {
        numberOfDecks: 8,
        dealerHitsSoft17: false,
        allowSurrender: false,
        reshuffleThreshold: 0.5,
    },
    blackjackMultiplier: 1.5,
    betRange: [1, 1_000_000_000],
    rtp: '99.47%',
    icon: <Spade className="w-5 h-5 fill-red-500 stroke-red-500 drop-shadow-md" />,
    accentColor: '#ef4444',
    logoPath: '/images/logo/rooms/classic.png',
    strategyType: 'classic',
    deviationsSet: 'standard',
    rulesClass: ClassicRules,
    strategyModalContent: {
        overview: "The Classic Online Rule follows the standard Blackjack template but is played with 8 decks and higher house penetration.",
        highlights: [
            { eyebrow: "Decks", title: "8 Deck Shoe", detail: "Standard online/live dealer configuration.", tone: 'accent' },
            { eyebrow: "Dealer", title: "S17", detail: "Dealer stands on all 17s, which is player-favorable.", tone: 'good' },
            { eyebrow: "Surrender", title: "None", detail: "Late surrender is not offered in this variant.", tone: 'warn' }
        ],
        playerOptions: {
            title: "Player Options",
            items: [
                "Double Down: On any two initial cards",
                "Double After Split (DAS): Allowed",
                "Split: Once (Total 2 hands)",
                "Split Aces: Receive 1 card only",
                "Resplit Aces: Not allowed"
            ]
        },
        payouts: {
            title: "Payouts",
            items: [
                "Blackjack: 3 to 2",
                "Insurance: 2 to 1",
                "Even Money: Available for Blackjack vs Dealer Ace"
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
                "The House Edge is approximately 0.47% with 8 decks.",
                "Basic strategy assumes infinite deck logic but is slightly adjusted for the S17 rule."
            ]
        }
    },
    strategyTableManual: {
        hard: {
            title: "Hard Totals",
            summary: "Standard 8-Deck S17 Basic Strategy",
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
                "Split 6s vs 2-6."
            ]
        }
    }
};
