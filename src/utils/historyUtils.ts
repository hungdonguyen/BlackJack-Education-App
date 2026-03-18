import { MatchRecord } from '@/types/game';
import { getRoomConfig } from './rooms';
import { HandStatus } from '@/types/enums';

/**
 * Calculates detailed statistics for a single match record.
 */
export function calculateMatchStats(match: MatchRecord) {
    let totalBet = 0;
    let totalWin = 0;
    let totalInsuranceCost = 0;
    let totalInsurancePayout = 0;
    let totalSideBetCost = 0;
    let totalSideBetPayout = 0;

    let totalBurnWagerCost = 0;
    let totalBurnWagerPayout = 0;

    match.seats.forEach(s => {
        s.hands.forEach(h => {
            totalBet += h.betAmount;
            totalWin += h.payout;
            if (h.burnWagerAmount) totalBurnWagerCost += h.burnWagerAmount;
            if (h.burnWagerPayout) totalBurnWagerPayout += h.burnWagerPayout;
        });

        if (s.insuranceCost) totalInsuranceCost += s.insuranceCost;
        if (s.insurancePayout) totalInsurancePayout += s.insurancePayout;
        if (s.sideBetAmount) totalSideBetCost += s.sideBetAmount;
        if (s.sideBetPayout) totalSideBetPayout += s.sideBetPayout;
    });

    const netPnl = totalWin 
        - totalInsuranceCost + totalInsurancePayout 
        - totalSideBetCost + totalSideBetPayout
        - totalBurnWagerCost + totalBurnWagerPayout;

    return {
        totalBet: totalBet + totalBurnWagerCost,
        totalWin,
        totalInsuranceCost,
        totalInsurancePayout,
        totalSideBetCost,
        totalSideBetPayout,
        totalBurnWagerCost,
        totalBurnWagerPayout,
        netPnl
    };
}

/**
 * Calculates just the net Profit & Loss for a match record.
 */
export function calculateMatchNetPnl(match: MatchRecord): number {
    return calculateMatchStats(match).netPnl;
}

/**
 * Derives a short display label and the corresponding theme color for a room ID.
 */
export function getRoomBadgeConfig(roomId: string) {
    const room = getRoomConfig(roomId);

    let shortLabel = 'ROOM';
    if (roomId === 'vegas_strip') shortLabel = 'VS';
    else if (roomId === 'vegas_downtown') shortLabel = 'VD';
    else if (roomId === 'atlantic_city') shortLabel = 'AC';
    else if (roomId === 'free_action') shortLabel = 'FA';
    else if (roomId === 'classic') shortLabel = 'CL';
    else if (roomId === 'iberian_21') shortLabel = 'I21';
    else {
        shortLabel = room.id
            .split('_')
            .map((part) => part.replace(/[^a-z0-9]/gi, ''))
            .filter(Boolean)
            .map((part) => part.slice(0, 1).toUpperCase())
            .join('') || 'ROOM';
    }

    return {
        shortLabel,
        color: room.accentColor,
        name: room.name,
    };
}

/**
 * Check if the match resulted in an overall Win, Loss, or Push based on the Net P&L.
 * Also returns the primary hand's status for the label if applicable.
 */
export function getMatchOverallStatus(match: MatchRecord, netPnl: number) {
    const primaryHand = match.seats[0]?.hands[0];
    
    let labelStr = 'T'; // Tie / Push
    let colorClass = 'text-slate-400';

    if (netPnl > 0) {
        labelStr = primaryHand?.result === HandStatus.BLACKJACK ? 'BJ' : 'W';
        colorClass = 'text-emerald-400';
    } else if (netPnl < 0) {
        labelStr = primaryHand?.result === HandStatus.SURRENDERED ? 'SUR' : 'L';
        colorClass = 'text-red-400';
    }

    return {
        labelStr,
        colorClass,
        isWin: netPnl > 0,
        isLoss: netPnl < 0,
        isPush: netPnl === 0
    };
}
