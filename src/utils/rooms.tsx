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
import { Spade, Ticket, Anchor, Zap } from 'lucide-react';

export const ROOMS: Record<string, RoomConfig> = {
    classic: {
        id: 'classic',
        name: 'Classic Blackjack Online',
        subtitle: 'Live Dealer Standard',
        description: 'Classic Online — 8 Decks. Blackjack pays 3 to 2. Dealer stands on all 17s (S17). Peek on Ace & 10. Double any two cards. Double after split (DAS). Split same-rank cards once only (max 2 hands). Split Aces receive 1 card. No Surrender.',
        feltGradient: 'radial-gradient(ellipse 90% 85% at 50% 60%, #8b1a1a 0%, #6a1414 25%, #4a0e0e 50%, #2a0808 80%, #1a0505 100%)',
        bgGradient: 'radial-gradient(ellipse 120% 100% at 50% 40%, #301a10 0%, #1a0e0a 50%, #0d0705 100%)',
        borderColor: 'rgba(212, 168, 67, 0.12)',
        rules: {
            blackjackPays: 'Blackjack Pays 3 to 2',
            insurancePays: 'Insurance Pays 2 to 1',
            dealerStands: 'Dealer stands on all 17s (S17)',
        },
        gameRules: {
            numberOfDecks: 8,
            dealerHitsSoft17: false,  // Classic Online: dealer stands on Soft 17 (S17)
            allowSurrender: false,
            reshuffleThreshold: 0.5, // Cut 50% of shoe — standard anti-counting penetration
        },
        blackjackMultiplier: 1.5,
        betRange: [1, 1_000_000],
        rtp: '99.51%',
        icon: <Spade className="w-5 h-5 fill-red-500 stroke-red-500 drop-shadow-md" />,
        accentColor: '#ef4444',
        logoPath: '/images/logo/rooms/classic.png',
    },
    vegas_strip: {
        id: 'vegas_strip',
        name: 'Vegas Strip Blackjack',
        subtitle: 'Authentic 4-Deck Rules',
        description: 'Vegas Strip Rules — 4 Decks, Dealer stands on all 17s. Double on any two cards. Double after split allowed. Aces split once, one card drawn.',
        feltGradient: 'radial-gradient(ellipse 90% 85% at 50% 60%, #170f3f 0%, #0e092b 25%, #080517 50%, #03020b 80%, #010105 100%)',
        bgGradient: 'radial-gradient(ellipse 120% 100% at 50% 40%, #0c0724 0%, #060312 50%, #020108 100%)',
        borderColor: 'rgba(139, 92, 246, 0.12)',
        rules: {
            blackjackPays: 'Blackjack Pays 3 to 2',
            insurancePays: 'Insurance Pays 2 to 1',
            dealerStands: 'Dealer must stand on all 17s',
        },
        gameRules: {
            numberOfDecks: 4,
            dealerHitsSoft17: false,
            allowSurrender: false,
        },
        blackjackMultiplier: 1.5,
        betRange: [1, 1_000_000],
        rtp: '99.65%',
        icon: <Ticket className="w-5 h-5 drop-shadow-md text-purple-400" />,
        accentColor: '#8b5cf6',
        logoPath: '/images/logo/rooms/vegas_strip.png',
    },
    vegas_downtown: {
        id: 'vegas_downtown',
        name: 'Vegas Downtown',
        subtitle: 'Neon Lights & 2-Deck Action',
        description: 'Vegas Downtown Rules — 2 Decks, Dealer hits Soft 17. Double on any two cards. Double after split allowed. Aces split once, one card drawn.',
        feltGradient: 'radial-gradient(ellipse 90% 85% at 50% 60%, #0a2133 0%, #04121d 25%, #02090f 50%, #010408 80%, #000103 100%)',
        bgGradient: 'radial-gradient(ellipse 120% 100% at 50% 40%, #06111a 0%, #03080c 50%, #010305 100%)',
        borderColor: 'rgba(56, 189, 248, 0.15)',
        rules: {
            blackjackPays: 'Blackjack Pays 3 to 2',
            insurancePays: 'Insurance Pays 2 to 1',
            dealerStands: 'Dealer hits Soft 17, stands on Hard 17+',
        },
        gameRules: {
            numberOfDecks: 2,
            dealerHitsSoft17: true,
            allowSurrender: false,
        },
        blackjackMultiplier: 1.5,
        betRange: [1, 1_000_000],
        rtp: '99.62%',
        icon: <Ticket className="w-5 h-5 drop-shadow-md text-sky-400" />,
        accentColor: '#38bdf8',
        logoPath: '/images/logo/rooms/vegas_downtown.png',
    },
    free_action: {
        id: 'free_action',
        name: 'Free Action Blackjack',
        subtitle: 'Golden Rewards & Free Actions',
        description: 'Free Action Rules — 6 Decks, Dealer hits Soft 17 (H17). Free Double on Hard 9, 10, 11 (no cost). Free Split all pairs except 10-value cards. House 22 Tie Rules. Multi Action Bonus side bet available. Blackjack pays 3 to 2.',
        feltGradient: 'radial-gradient(ellipse 90% 85% at 50% 60%, #2a1f0a 0%, #1f170a 25%, #151005 50%, #0a0802 80%, #050401 100%)',
        bgGradient: 'radial-gradient(ellipse 120% 100% at 50% 40%, #1a1408 0%, #0f0c05 50%, #080602 100%)',
        borderColor: 'rgba(234, 179, 8, 0.18)',
        rules: {
            blackjackPays: 'Blackjack Pays 3 to 2',
            insurancePays: 'Insurance Pays 2 to 1',
            dealerStands: 'Dealer hits Soft 17 (H17)',
        },
        gameRules: {
            numberOfDecks: 6,
            dealerHitsSoft17: true,
            allowSurrender: false,
        },
        blackjackMultiplier: 1.5,
        betRange: [1, 1_000_000],
        rtp: '98.86%',
        baseGameRtp: '99.07%',
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
        description: 'Atlantic City Rules — 8 Decks, Dealer stands on all 17s (S17). Peek on Ace & 10. Double on any two cards. Double after split (DAS). Split up to 4 hands, mixed 10s allowed. Split Aces receive 1 card only, no re-split. Late Surrender allowed.',
        feltGradient: 'radial-gradient(ellipse 90% 85% at 50% 60%, #0f2b2b 0%, #082020 25%, #041515 50%, #020b0b 80%, #010606 100%)',
        bgGradient: 'radial-gradient(ellipse 120% 100% at 50% 40%, #0a1f1f 0%, #051010 50%, #020808 100%)',
        borderColor: 'rgba(20, 184, 166, 0.15)',
        rules: {
            blackjackPays: 'Blackjack Pays 3 to 2',
            insurancePays: 'Insurance Pays 2 to 1',
            dealerStands: 'Dealer stands on all 17s (S17)',
        },
        gameRules: {
            numberOfDecks: 8,
            dealerHitsSoft17: false,
            allowSurrender: true,
        },
        blackjackMultiplier: 1.5,
        betRange: [1, 1_000_000],
        rtp: '99.65%',
        icon: <Anchor className="w-5 h-5 drop-shadow-md text-teal-400" />,
        accentColor: '#14b8a6',
        logoPath: '/images/logo/rooms/atlantic.png',
    },
};

export function getRoomConfig(roomId: string): RoomConfig {
    return ROOMS[roomId] ?? ROOMS.classic;
}
