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
    /** Room icon component */
    icon: React.ReactNode;
    /** Accent color for UI elements */
    accentColor: string;
}

import React from 'react';
import { Spade, Ticket } from 'lucide-react';

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
        icon: <Spade className="w-5 h-5 fill-amber-300 stroke-amber-300 drop-shadow-md" />,
        accentColor: '#d4a843',
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
    },
};

export function getRoomConfig(roomId: string): RoomConfig {
    return ROOMS[roomId] ?? ROOMS.classic;
}
