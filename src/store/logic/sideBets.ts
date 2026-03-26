import { GameStore, HandStatus, Card, HandValue, Suit } from '@/types/game';
import { getRoomConfig } from '@/utils/rooms';
import { calculateHandValue } from '@/utils/hand';

/**
 * Side Bet Payouts Configuration
 * Key: Number of tokens or specific condition
 * Value: Payout MULTIPLIER (e.g., 3 means profit of 3x, so total return is 4x)
 */
const FREE_ACTION_PAYOUTS: Record<number, number> = {
    1: 3, 2: 10, 3: 40, 4: 100, 5: 150, 6: 250, 7: 250, 8: 250,
};

const PUSH_22_PAYOUT_MULTIPLIER = 11; // 11:1 Payout

export function evaluateSideBets(state: GameStore, updatedSeats: any[], dealerValue: HandValue): Record<number, number> {
    const sideBetPayouts: Record<number, number> = {};
    const roomConfig = getRoomConfig(state.currentRoom);

    for (const [seatIdStr, sideBetAmount] of Object.entries(state.sideBets)) {
        const seatId = Number(seatIdStr);
        if (sideBetAmount <= 0) continue;

        const seat = updatedSeats.find(s => s.id === seatId);
        if (!seat || !seat.isActive) continue;

        let payout = 0;

        // Custom evaluation logic based on side bet type
        if (roomConfig.sideBetType === 'push_22') {
            // Push 22: Wins if dealer hits exactly 22
            if (dealerValue.total === 22) {
                payout = sideBetAmount + (sideBetAmount * PUSH_22_PAYOUT_MULTIPLIER);
            }
        } else if (roomConfig.isFreeAction) {
            // Free Action Bonus: Based on tokens collected
            const tokens = seat.freeActionTokens || 0;
            const multiplier = FREE_ACTION_PAYOUTS[tokens] || 0;
            if (multiplier > 0) {
                payout = sideBetAmount + (sideBetAmount * multiplier);
            }
        }

        if (payout > 0) {
            sideBetPayouts[seatId] = payout;
        }
    }

    return sideBetPayouts;
}
