// ============================================
// Room Configuration — Different table variants
// ============================================

export interface RoomConfig {
    id: string;
    name: string;
    subtitle: string;
    description: string;
    /** Table felt gradient */
    feltGradient: string;
    /** Ambient background gradient */
    bgGradient: string;
    /** Table border color */
    borderColor: string;
    /** Payout rules text */
    rules: {
        blackjackPays: string;
        insurancePays: string;
        dealerStands: string;
    };
    /** Engine rules for game logic */
    gameRules: {
        numberOfDecks: number;
        dealerHitsSoft17: boolean;
        allowSurrender: boolean;
        /** Fraction of shoe remaining when reshuffle triggers. Default: 0.25 */
        reshuffleThreshold?: number;
        /** If true, 10s are removed from the deck (Iberian 21 style) */
        omitTens?: boolean;
        /** If true, allows surrender after double down */
        allowDoubleDownRescue?: boolean;
        /** European No Hole Card rule */
        enhc?: boolean;
    };
    /** Blackjack payout multiplier (e.g. 1.5 for 3:2) */
    blackjackMultiplier: number;
    /** Min/Max bet range */
    betRange: [number, number];
    /** Theoretical Return to Player % */
    rtp: string;
    /** Theoretical RTP for the base game only (without side bets) */
    baseGameRtp?: string;
    /** Theoretical RTP for the side bet */
    sideBetRtp?: string;
    /** Room icon component */
    icon: React.ReactNode;
    /** Accent color for UI elements */
    accentColor: string;
    /** Whether this room has a side bet */
    hasSideBet?: boolean;
    /** Whether this room is a Free Action variant */
    isFreeAction?: boolean;
    /** Path to the room logo image */
    logoPath: string;
}

import React from 'react';
import { Spade, Ticket, Anchor, Zap, Crown } from 'lucide-react';

export const ROOMS: Record<string, RoomConfig> = {
    classic: {
        id: 'classic',
        name: 'Classic Blackjack Online',
        subtitle: 'Live Dealer Standard',
        description: 'Classic Online — 8 decks. Blackjack pays 3 to 2. Dealer stands on soft 17 and hard 17. Peek on Ace and 10. Double on any two cards. Double after split allowed. Split equal-value cards once only for a maximum of 2 hands, including mixed 10-value cards. Split aces receive 1 card only. No surrender.',
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
            dealerHitsSoft17: false,  // Classic Online: dealer stands on Soft 17 (S17)
            allowSurrender: false,
            reshuffleThreshold: 0.5, // Cut 50% of shoe — standard anti-counting penetration
        },
        blackjackMultiplier: 1.5,
        betRange: [1, 1_000_000],
        rtp: '99.47%',
        icon: <Spade className="w-5 h-5 fill-red-500 stroke-red-500 drop-shadow-md" />,
        accentColor: '#ef4444',
        logoPath: '/images/logo/rooms/classic.png',
    },
    vegas_strip: {
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
        betRange: [1, 1_000_000],
        rtp: '99.63%',
        icon: <Ticket className="w-5 h-5 drop-shadow-md text-purple-400" />,
        accentColor: '#8b5cf6',
        logoPath: '/images/logo/rooms/vegas_strip.png',
    },
    vegas_downtown: {
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
        betRange: [1, 1_000_000],
        rtp: '99.54%',
        icon: <Ticket className="w-5 h-5 drop-shadow-md text-sky-400" />,
        accentColor: '#38bdf8',
        logoPath: '/images/logo/rooms/vegas_downtown.png',
    },
    free_action: {
        id: 'free_action',
        name: 'Free Action Blackjack',
        subtitle: 'Golden Rewards & Free Actions',
        description: 'Free Action Rules — 6 decks. Blackjack pays 3 to 2. Dealer hits soft 17 and stands on hard 17 and above. Free doubles apply to hard 9, 10, and 11 at no extra cost. Free splits apply to every pair except 10-value cards. Dealer 22 pushes all non-blackjack hands. Multi Action Bonus side bet available. No surrender.',
        feltGradient: 'radial-gradient(ellipse 90% 85% at 50% 60%, #2a1f0a 0%, #1f170a 25%, #151005 50%, #0a0802 80%, #050401 100%)',
        bgGradient: 'radial-gradient(ellipse 120% 100% at 50% 40%, #1a1408 0%, #0f0c05 50%, #080602 100%)',
        borderColor: 'rgba(234, 179, 8, 0.18)',
        rules: {
            blackjackPays: 'Blackjack Pays 3 to 2',
            insurancePays: 'Insurance Pays 2 to 1',
            dealerStands: 'Dealer hits soft 17 and stands on hard 17 and above',
        },
        gameRules: {
            numberOfDecks: 6,
            dealerHitsSoft17: true,
            allowSurrender: false,
        },
        blackjackMultiplier: 1.5,
        betRange: [1, 1_000_000],
        rtp: '98.96%',
        baseGameRtp: '98.96%',
        sideBetRtp: '91.37%',
        icon: <Zap className="w-5 h-5 drop-shadow-md text-yellow-400 fill-yellow-400" />,
        accentColor: '#eab308',
        hasSideBet: true,
        isFreeAction: true,
        logoPath: '/images/logo/rooms/freeaction.png',
    },
    atlantic_city: {
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
        betRange: [1, 1_000_000],
        rtp: '99.64%',
        icon: <Anchor className="w-5 h-5 drop-shadow-md text-teal-400" />,
        accentColor: '#14b8a6',
        logoPath: '/images/logo/rooms/atlantic.png',
    },
    iberian_21: {
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
        betRange: [1, 1_000_000],
        rtp: '99.24%',
        icon: <Spade className="w-5 h-5 drop-shadow-md text-red-500 fill-red-600" />,
        accentColor: '#be123c',
        logoPath: '/images/logo/rooms/iberian21.png',
    },
    uk: {
        id: 'uk',
        name: 'United Kingdom',
        subtitle: 'UK Casino Standards',
        description: 'UK Rules — 6 decks. European No Hole Card (ENHC) applies, but Original Bets Only (OBO) protects your doubles and splits against late dealer Blackjacks. Dealer stands on all 17s. Double down on ANY two cards. Double after split allowed. Split any equal value to 4 hands. No surrender.',
        feltGradient: 'radial-gradient(ellipse 90% 85% at 50% 60%, #1e1b4b 0%, #151433 25%, #0f1026 50%, #070817 80%, #02020a 100%)',
        bgGradient: 'radial-gradient(ellipse 120% 100% at 50% 40%, #161A26 0%, #0C0F16 50%, #05060A 100%)',
        borderColor: 'rgba(99, 102, 241, 0.25)', // Indigo-silver border accent
        rules: {
            blackjackPays: 'Blackjack Pays 3 to 2',
            insurancePays: 'Insurance Pays 2 to 1',
            dealerStands: 'Dealer stands on soft 17 and hard 17',
        },
        gameRules: {
            numberOfDecks: 6,
            dealerHitsSoft17: false, // Stands on Soft 17
            allowSurrender: false,
            enhc: true, // ENHC applies, but our UKRules engine handles the OBO refund logic
        },
        blackjackMultiplier: 1.5,
        betRange: [1, 1_000_000],
        rtp: '99.55%', // Higher RTP than standard European due to DAS, OBO, and double any 2 cards
        icon: <Crown className="w-5 h-5 drop-shadow-md text-indigo-400" />,
        accentColor: '#6366f1',
        logoPath: '/images/logo/rooms/uk_logo.png',
    },
    european: {
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
            dealerHitsSoft17: false, // Stands on Soft 17
            allowSurrender: false,
            enhc: true, // European No Hole Card
        },
        blackjackMultiplier: 1.5,
        betRange: [1, 1_000_000],
        rtp: '99.38%',
        icon: <Ticket className="w-5 h-5 drop-shadow-md text-green-400" />,
        accentColor: '#22c55e',
        logoPath: '/images/logo/rooms/european.png',
    },
};

export function getRoomConfig(roomId: string): RoomConfig {
    return ROOMS[roomId] ?? ROOMS.classic;
}
