import React from 'react';
import { Ticket } from 'lucide-react';
import { VegasDowntownRules } from '@/rules/VegasDowntownRules';
import { RoomConfig } from './types';

export const vegasDowntown: RoomConfig = {
    id: 'vegas_downtown',
    name: 'Vegas Downtown',
    subtitle: 'Neon Lights & 2-Deck Action',
    description: 'Vegas Downtown Rules — 2 decks. Blackjack pays 3 to 2. Dealer hits soft 17 and stands on hard 17 and above. Double on any two cards. Double after split allowed. Split up to 4 hands. Split aces receive 1 card only. No surrender.',
    feltGradient: 'radial-gradient(ellipse 90% 85% at 50% 60%, #0a2133 0%, #04121d 25%, #02090f 50%, #010408 80%, #000103 100%)',
    bgGradient: 'radial-gradient(ellipse 120% 100% at 50% 40%, #06111a 0%, #03080c 50%, #010305 100%)',
    borderColor: 'rgba(56, 189, 248, 0.15)',
    rules: {
        blackjackPays: 'Blackjack Pays 3 to 2',
        insurancePays: 'Insurance Pays 2 to 1',
        dealerStands: 'Dealer hits soft 17 and stands on hard 17 and above',
    },
    gameRules: {
        numberOfDecks: 2,
        dealerHitsSoft17: true,
        allowSurrender: false,
    },
    blackjackMultiplier: 1.5,
    betRange: [1, 1_000_000_000],
    rtp: '99.54%',
    icon: <Ticket className="w-5 h-5 drop-shadow-md text-sky-400" />,
    accentColor: '#38bdf8',
    logoPath: '/images/logo/rooms/vegas_downtown.png',
    strategyType: 'vegas_downtown',
    deviationsSet: 'standard',
    rulesClass: VegasDowntownRules,
    strategyModalContent: {
        overview: "Vegas Downtown is a 'pitch' style game traditionally, using only 2 decks but allowing the dealer to hit Soft 17.",
        highlights: [
            { eyebrow: "Decks", title: "2 Decks", detail: "Double deck games offer great odds for card counters.", tone: 'good' },
            { eyebrow: "Dealer", title: "H17", detail: "Dealer hits Soft 17, slightly increasing house edge.", tone: 'warn' },
            { eyebrow: "Action", title: "Fast Paced", detail: "Lower deck count means more frequent reshuffles.", tone: 'accent' }
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
                "Soft 17: Dealer HITS",
                "Hard 17+: Dealer STANDS",
                "Hole Card: Dealer peeks for BJ on Aces and 10-value cards"
            ]
        },
        strategyNotes: {
            title: "Strategy Notes",
            items: [
                "The Dealer hitting Soft 17 requires more aggressive doubling on your part.",
                "House edge is roughly 0.46% with Basic Strategy."
            ]
        }
    },
    strategyTableManual: {
        hard: {
            title: "Hard Totals",
            summary: "2-Deck H17 Basic Strategy",
            bullets: [
                "Double 11 vs any card.",
                "Double 10 vs 2-9.",
                "Double 9 vs 2-6.",
                "Stand on 13 vs 2, 12 vs 3."
            ]
        },
        soft: {
            title: "Soft Totals",
            summary: "Hands with an Ace counting as 11",
            bullets: [
                "Double Soft 13-14 vs 4-6.",
                "Double Soft 15-16 vs 4-6.",
                "Double Soft 17 vs 2-6.",
                "Double Soft 18 vs 3-6."
            ]
        },
        pairs: {
            title: "Pairs",
            summary: "Splitting Strategy",
            bullets: [
                "Always split Aces and 8s.",
                "Split 2s and 3s vs 2-7.",
                "Split 4s vs 4-6.",
                "Split 6s vs 2-6."
            ]
        }
    }
};
