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
    /** Blackjack payout multiplier (e.g. 1.5 for 3:2) */
    blackjackMultiplier: number;
    /** Min/Max bet range */
    betRange: [number, number];
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
        name: 'Blackjack VIP',
        subtitle: 'Classic Table',
        description: 'Classic Blackjack with standard rules. Blackjack pays 3 to 2.',
        feltGradient: 'radial-gradient(ellipse 90% 85% at 50% 60%, #8b1a1a 0%, #6a1414 25%, #4a0e0e 50%, #2a0808 80%, #1a0505 100%)',
        bgGradient: 'radial-gradient(ellipse 120% 100% at 50% 40%, #301a10 0%, #1a0e0a 50%, #0d0705 100%)',
        borderColor: 'rgba(212, 168, 67, 0.12)',
        rules: {
            blackjackPays: 'Blackjack Pays 3 to 2',
            insurancePays: 'Insurance Pays 2 to 1',
            dealerStands: 'Dealer must stand on 17 and must draw to 16',
        },
        blackjackMultiplier: 1.5,
        betRange: [1, 1_000_000],
        icon: <Spade className="w-5 h-5 fill-amber-300 stroke-amber-300 drop-shadow-md" />,
        accentColor: '#d4a843',
    },
    freebet: {
        id: 'freebet',
        name: 'Free Bet Blackjack',
        subtitle: 'Free Doubles & Splits',
        description: 'Free Bet Blackjack — free doubles on 9, 10, 11 and free splits on all pairs. Push on dealer 22.',
        feltGradient: 'radial-gradient(ellipse 90% 85% at 50% 60%, #0f6b3a 0%, #0a5a2e 25%, #073d20 50%, #042314 80%, #021509 100%)',
        bgGradient: 'radial-gradient(ellipse 120% 100% at 50% 40%, #0a2e1f 0%, #061a12 50%, #030d09 100%)',
        borderColor: 'rgba(52, 211, 153, 0.12)',
        rules: {
            blackjackPays: 'Blackjack Pays 3 to 2',
            insurancePays: 'Insurance Pays 2 to 1',
            dealerStands: 'Dealer must stand on 17 · Dealer 22 pushes',
        },
        blackjackMultiplier: 1.5,
        betRange: [1, 1_000_000],
        icon: <Ticket className="w-5 h-5 drop-shadow-md text-emerald-400" />,
        accentColor: '#34d399',
    },
};

export function getRoomConfig(roomId: string): RoomConfig {
    return ROOMS[roomId] ?? ROOMS.classic;
}
