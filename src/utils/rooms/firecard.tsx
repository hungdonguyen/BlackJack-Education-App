import React from 'react';
import { Flame } from 'lucide-react';
import { FireCardRules } from '@/rules/FireCardRules';
import { RoomConfig } from './types';

export const firecard: RoomConfig = {
    id: 'firecard_21',
    name: 'Fire Card 21',
    subtitle: 'Burn the 2nd Card',
    description: 'Fire Card Blackjack — Not happy with your second card? Burn it for 0.5x your bet! This high-variance room pays 1:1 for Natural Blackjacks but features massive "Burn Bonuses" if your discarded card is an Ace. Double After Split is permitted.',
    feltGradient: 'radial-gradient(ellipse 90% 85% at 50% 60%, #450a0a 0%, #7f1d1d 25%, #991b1b 50%, #b91c1c 80%, #dc2626 100%)',
    bgGradient: 'radial-gradient(ellipse 120% 100% at 50% 40%, #2a0000 0%, #3f0000 50%, #5a0000 100%)',
    borderColor: 'rgba(248, 113, 113, 0.4)',
    rules: {
        blackjackPays: 'Blackjack Pays 1:1',
        insurancePays: 'Insurance Pays 2 to 1',
        dealerStands: 'Dealer hits soft 17',
    },
    gameRules: {
        numberOfDecks: 6,
        dealerHitsSoft17: true,
        allowSurrender: false,
    },
    blackjackMultiplier: 1.0,
    betRange: [1, 1_000_000_000],
    rtp: '99.46%',
    icon: <Flame className="w-5 h-5 drop-shadow-md text-orange-500 fill-orange-400" />,
    accentColor: '#f97316',
    isBeta: true,
    logoPath: '/images/logo/rooms/firecard21.png',
    strategyType: 'firecard_21',
    deviationsSet: 'firecard_21',
    strategySource: 'Custom Strategy for Fire Card 21',
    rulesClass: FireCardRules,
    strategyModalContent: {
        overview: "Fire Card Blackjack allows you to 'Burn' a bad 2nd card for a fee, while offering massive bonuses for Burned Aces.",
        highlights: [
            { eyebrow: "Feature", title: "Burn Card", detail: "Discard your 2nd card for 0.5x bet fee and get a new one.", tone: 'warn' },
            { eyebrow: "Bonus", title: "Ace Fever", detail: "Receive an immediate payout up to 8:1 if the card you BURN is an Ace.", tone: 'good' },
            { eyebrow: "Payout", title: "Blackjack 1:1", detail: "Natural Blackjacks pay even money.", tone: 'warn' }
        ],
        playerOptions: {
            title: "Player Options",
            items: [
                "Burn: Replace 2nd card (Costs 50% of bet)",
                "Double Down: Allowed",
                "Split: Allowed",
                "Double After Split: Allowed"
            ]
        },
        payouts: {
            title: "Payouts",
            items: [
                "Blackjack: 1 to 1",
                "Burn Bonus (Other Ace): 3 to 1 relative to Burn Fee",
                "Burn Bonus (Ace of Spades): 8 to 1 relative to Burn Fee",
                "Insurance: 2 to 1"
            ]
        },
        dealerFlow: {
            title: "Dealer Rules",
            items: [
                "Soft 17: Dealer HITS",
                "Hard 17+: Dealer STANDS"
            ]
        },
        strategyNotes: {
            title: "Strategy Notes",
            items: [
                "Only Burn if your hand is very weak (15-16) and the dealer is strong (7-A).",
                "Burned Aces provide an immediate windfall regardless of the hand's final outcome."
            ]
        }
    },
    strategyTableManual: {
        hard: {
            title: "Hard Totals",
            summary: "Fire Card Basic Strategy",
            bullets: [
                "Burn 15-16 vs 7-A.",
                "Double 11 vs any card.",
                "Stand on 13+ vs 2-6."
            ]
        },
        soft: {
            title: "Soft Totals",
            summary: "Hands with an Ace counting as 11",
            bullets: [
                "Never Burn a Soft hand.",
                "Double Soft 13-18 vs 4-6.",
                "Stand on Soft 19+."
            ]
        },
        pairs: {
            title: "Pairs",
            summary: "Splitting Strategy",
            bullets: [
                "Always split Aces and 8s.",
                "Split 2s, 3s, 7s vs 2-7.",
                "Never split 10s."
            ]
        }
    }
};
