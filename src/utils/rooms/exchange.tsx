import React from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { Exchange21Rules } from '@/rules/Exchange21Rules';
import { RoomConfig } from './types';

export const exchange: RoomConfig = {
    id: 'exchange_21',
    name: 'Exchange 21',
    subtitle: 'Switch Your Cards',
    description: 'Exchange 21 — Must play 2 hands with equal bets. You can swap the second card dealt to each hand. Dealer hitting 22 pushes all non-busted player hands except natural Blackjacks. Natural blackjacks pay 1:1. Double on any two cards. Can split once.',
    feltGradient: 'radial-gradient(ellipse 90% 85% at 50% 60%, #1e293b 0%, #334155 25%, #475569 50%, #64748b 80%, #94a3b8 100%)',
    bgGradient: 'radial-gradient(ellipse 120% 100% at 50% 40%, #020617 0%, #0f172a 50%, #1e293b 100%)',
    borderColor: 'rgba(148, 163, 184, 0.4)',
    rules: {
        blackjackPays: 'Blackjack Pays 1:1',
        insurancePays: 'Insurance Pays 2 to 1',
        dealerStands: 'Dealer pushes on 22',
    },
    gameRules: {
        numberOfDecks: 6,
        dealerHitsSoft17: true,
        allowSurrender: false,
    },
    blackjackMultiplier: 1.0,
    betRange: [1, 1_000_000_000],
    rtp: '99.58%',
    icon: <ArrowLeftRight className="w-5 h-5 drop-shadow-md text-slate-300" />,
    accentColor: '#94a3b8',
    isBeta: true,
    logoPath: '/images/logo/rooms/exchange21.png',
    strategyType: 'exchange_21',
    deviationsSet: 'exchange_21',
    strategySource: 'Blackjack Exchange Strategy',
    rulesClass: Exchange21Rules,
    strategyModalContent: {
        overview: "Exchange 21 (Blackjack Switch) requires playing two hands and allows swapping the top cards between them.",
        highlights: [
            { eyebrow: "Feature", title: "Switch", detail: "Swap the second card of Hand 1 with Hand 2.", tone: 'good' },
            { eyebrow: "Dealer", title: "Push on 22", detail: "Dealer 22 pushes all non-busted player hands.", tone: 'warn' },
            { eyebrow: "Payout", title: "Blackjack 1:1", detail: "All Blackjacks pay even money.", tone: 'warn' }
        ],
        playerOptions: {
            title: "Player Options",
            items: [
                "Switch: Swap the 2nd cards of your two hands",
                "Double Down: On any two cards",
                "Double After Split (DAS): Allowed",
                "Split: Up to 3 times"
            ]
        },
        payouts: {
            title: "Payouts",
            items: [
                "Blackjack: 1 to 1",
                "Dealer 22: Pushes all player hands (except BJ)"
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
                "Switching strategy is complex: prioritize making one strong hand or two decent ones over one 'super' hand.",
                "Always switch to make a Blackjack or a strong double opportunity."
            ]
        }
    },
    strategyTableManual: {
        hard: {
            title: "Hard Totals",
            summary: "Exchange 21 Basic Strategy",
            bullets: [
                "Double 11 vs any card.",
                "Double 10 vs 2-9.",
                "Stand on 13+ vs 3-6."
            ]
        },
        soft: {
            title: "Soft Totals",
            summary: "Exchange 21 Basic Strategy",
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
                "Never split 5s or 10s."
            ]
        }
    }
};
