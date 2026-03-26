import { Card, Seat } from '@/types/game';
import {
    calculateTrueCountFromShoe,
    CountingSystem,
    getCardsPerDeck,
} from '@/utils/cardCounting';

export interface BettingAdvice {
    label: string;
    desc: string;
    color: string;
    bgColor: string;
}

export interface CardCountingAnalysis {
    activeSystem: CountingSystem;
    runningCount: number;
    trueCount: number;
    decksRemaining: number;
    cardsDealt: number;
    cardsRemaining: number;
    advice: BettingAdvice;
    playerEdge: number;
    visibleThisRound: number;
    adviceTrueCount: number;
}

function getAllVisibleCards(seats: Seat[], dealerCards: Card[]): Card[] {
    const visible: Card[] = [];

    for (const seat of seats) {
        if (!seat.hands.some((hand) => hand.betAmount > 0)) continue;

        for (const hand of seat.hands) {
            for (const card of hand.cards) {
                if (!card.isHidden) visible.push(card);
            }
        }
    }

    for (const card of dealerCards) {
        if (!card.isHidden) visible.push(card);
    }

    return visible;
}

export function getActiveCountingSystem(
    roomId: string,
    userSystem: CountingSystem,
): CountingSystem {
    return roomId === 'iberian_21' ? userSystem : 'Hi-Lo';
}

function getAdviceTrueCount(
    trueCount: number,
    system: CountingSystem,
    omitTens: boolean,
): number {
    const baselineTc = system === 'Hi-Lo' && omitTens ? -4 : 0;
    return trueCount - baselineTc;
}

function getBettingAdvice(adviceTrueCount: number): BettingAdvice {
    if (adviceTrueCount >= 5) {
        return {
            label: 'MAX BET',
            desc: 'Extremely favorable deck — Huge player edge. Increase bet 5-8× minimum',
            color: '#fcd34d',
            bgColor: 'rgba(234,179,8,0.15)',
        };
    }

    if (adviceTrueCount >= 3) {
        return {
            label: 'HIGH BET',
            desc: 'Very favorable — Strong player advantage. Increase bet 3-5× minimum',
            color: '#86efac',
            bgColor: 'rgba(34,197,94,0.15)',
        };
    }

    if (adviceTrueCount >= 1) {
        return {
            label: 'RAISE BET',
            desc: 'Slightly favorable — Increase bet 2-3× minimum',
            color: '#93c5fd',
            bgColor: 'rgba(59,130,246,0.15)',
        };
    }

    if (adviceTrueCount >= -1) {
        return {
            label: 'FLAT BET',
            desc: 'Neutral deck — Bet minimum. No significant edge for either side',
            color: 'rgba(255,255,255,0.5)',
            bgColor: 'rgba(255,255,255,0.05)',
        };
    }

    if (adviceTrueCount >= -3) {
        return {
            label: 'MIN BET',
            desc: 'Unfavorable — House edge is higher. Bet minimum or sit out',
            color: '#fca5a5',
            bgColor: 'rgba(239,68,68,0.12)',
        };
    }

    return {
        label: 'SIT OUT',
        desc: 'Very unfavorable deck — Strong house advantage. Bet minimum and wait for reshuffle',
        color: '#f87171',
        bgColor: 'rgba(239,68,68,0.18)',
    };
}

export async function getCardCountingAnalysis({
    roomId,
    numDecks,
    seats,
    dealerCards,
    shoe,
    userSystem,
}: {
    roomId: string;
    numDecks: number;
    seats: Seat[];
    dealerCards: Card[];
    shoe: Card[];
    userSystem: CountingSystem;
}): Promise<CardCountingAnalysis> {
    const activeSystem = getActiveCountingSystem(roomId, userSystem);
    const omitTens = roomId === 'iberian_21';
    const totalCards = numDecks * getCardsPerDeck(omitTens);
    const cardsRemaining = shoe.length;
    const cardsDealt = totalCards - cardsRemaining;
    const visibleCards = getAllVisibleCards(seats, dealerCards);
    const countAnalysis = await calculateTrueCountFromShoe(
        shoe,
        dealerCards,
        seats,
        numDecks,
        activeSystem,
        omitTens,
    );
    const adviceTrueCount = getAdviceTrueCount(
        countAnalysis.trueCount,
        activeSystem,
        omitTens,
    );

    return {
        activeSystem,
        runningCount: countAnalysis.runningCount,
        trueCount: countAnalysis.trueCount,
        decksRemaining: countAnalysis.decksRemaining,
        cardsDealt,
        cardsRemaining,
        advice: getBettingAdvice(adviceTrueCount),
        playerEdge: (adviceTrueCount * 0.5) - 0.5,
        visibleThisRound: visibleCards.length,
        adviceTrueCount,
    };
}