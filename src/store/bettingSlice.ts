// ============================================
// Betting Slice — handles chip selection, placing/clearing bets, seat toggling
// ============================================

import { StateCreator } from 'zustand';
import { GameStore } from '@/types/game';
import { GamePhase, HandStatus } from '@/types/enums';
import { CHIP_VALUES, DEFAULT_BANKROLL } from '@/utils/constants';
import { getRoomConfig } from '@/utils/rooms';

/** A record of a single bet placement for undo */
export interface BetRecord {
  seatId: number;
  amount: number;
}

export interface BettingSlice {
  // State
  bankroll: number;
  selectedChipValue: number;
  betHistory: BetRecord[];
  lastDailyClaim: number;
  dailyClaimCount: number;
  currentRoom: string;
  previousBets: { seatId: number; amount: number }[];
  previousSideBets: Record<number, number>;
  insufficientFundsWarning: boolean;
  sideBets: Record<number, number>;

  // Actions
  selectChip: (value: number) => void;
  placeBet: (seatId: number, amount: number) => void;
  undoBet: () => void;
  clearBet: (seatId: number) => void;
  clearAllBets: () => void;
  toggleSeat: (seatId: number) => void;
  addFunds: (amount: number) => void;
  claimDaily: () => boolean;
  setCurrentRoom: (roomId: string) => void;
  rebet: () => void;
  triggerInsufficientFunds: () => void;
  clearInsufficientFunds: () => void;
  setBankroll: (amount: number) => void;
  placeSideBet: (seatId: number, amount: number) => void;
  clearSideBet: (seatId: number) => void;
}

export const createBettingSlice: StateCreator<GameStore, [], [], BettingSlice> = (set, get) => ({
  bankroll: DEFAULT_BANKROLL,
  selectedChipValue: 1,
  betHistory: [],
  lastDailyClaim: 0,
  dailyClaimCount: 0,
  currentRoom: 'classic',
  previousBets: [],
  previousSideBets: {},
  insufficientFundsWarning: false,
  sideBets: {},
  totalBetSinceLastClaim: 0,

  selectChip: (value: number) => {
    set({ selectedChipValue: value });
  },

  placeBet: (seatId: number, amount: number) => {
    const state = get();
    if (state.gamePhase !== GamePhase.BETTING) return;
    const multiplier = state.currentRoom === 'exchange_21' ? 2 : 1;
    const totalAmount = amount * multiplier;
    if (totalAmount > state.bankroll) {
      get().triggerInsufficientFunds();
      return;
    }

    set((s) => ({
      bankroll: s.bankroll - totalAmount,
      betHistory: [...s.betHistory, { seatId, amount: totalAmount }],
      seats: s.seats.map((seat) => {
        if (seat.id !== seatId) return seat;
        if (!seat.isActive) return seat;

        const updatedHands = seat.hands.map((hand) => ({
          ...hand,
          betAmount: hand.betAmount + totalAmount,
        }));

        return { ...seat, hands: updatedHands };
      }),
    }));
  },

  undoBet: () => {
    const state = get();
    if (state.gamePhase !== GamePhase.BETTING) return;
    if (state.betHistory.length === 0) return;

    const lastBet = state.betHistory[state.betHistory.length - 1];

    // If this undo will drop the seat's main bet to 0, also return its side bet
    const affectedSeat = state.seats.find(s => s.id === lastBet.seatId);
    const newMainBet = affectedSeat
      ? affectedSeat.hands.reduce((sum, h) => sum + h.betAmount, 0) - lastBet.amount
      : 0;
    const sideRefund = newMainBet <= 0 ? (state.sideBets[lastBet.seatId] || 0) : 0;
    const newSideBets = { ...state.sideBets };
    if (sideRefund > 0) delete newSideBets[lastBet.seatId];

    set((s) => ({
      bankroll: s.bankroll + lastBet.amount + sideRefund,
      betHistory: s.betHistory.slice(0, -1),
      sideBets: newSideBets,
      seats: s.seats.map((seat) => {
        if (seat.id !== lastBet.seatId) return seat;
        return {
          ...seat,
          hands: seat.hands.map((hand) => ({
            ...hand,
            betAmount: Math.max(0, hand.betAmount - lastBet.amount),
          })),
        };
      }),
    }));
  },

  clearBet: (seatId: number) => {
    const state = get();
    if (state.gamePhase !== GamePhase.BETTING) return;

    const seat = state.seats.find((s) => s.id === seatId);
    if (!seat) return;

    const mainRefund = seat.hands.reduce((sum, hand) => sum + hand.betAmount, 0);
    // Also refund any side bet since main bet is gone
    const sideRefund = state.sideBets[seatId] || 0;
    const newSideBets = { ...state.sideBets };
    if (sideRefund > 0) delete newSideBets[seatId];

    set((s) => ({
      bankroll: s.bankroll + mainRefund + sideRefund,
      betHistory: s.betHistory.filter((b: { seatId: number; amount: number }) => b.seatId !== seatId),
      sideBets: newSideBets,
      seats: s.seats.map((st) => {
        if (st.id !== seatId) return st;
        return {
          ...st,
          hands: st.hands.map((hand) => ({ ...hand, betAmount: 0 })),
        };
      }),
    }));
  },

  clearAllBets: () => {
    const state = get();
    if (state.gamePhase !== GamePhase.BETTING) return;

    const mainRefund = state.seats.reduce(
      (sum, seat) => sum + seat.hands.reduce((s, h) => s + h.betAmount, 0),
      0
    );
    const sideRefund = Object.values(state.sideBets).reduce((sum, v) => sum + v, 0);

    set((s) => ({
      bankroll: s.bankroll + mainRefund + sideRefund,
      betHistory: [],
      sideBets: {},
      seats: s.seats.map((seat) => ({
        ...seat,
        hands: seat.hands.map((hand) => ({ ...hand, betAmount: 0 })),
      })),
    }));
  },

  rebet: () => {
    const state = get();
    if (state.gamePhase !== GamePhase.BETTING) return;

    // Determine current total bets on the table
    let currentTotalBet = 0;
    state.seats.forEach((s) => {
      currentTotalBet += s.hands.reduce((sum, h) => sum + h.betAmount, 0);
    });

    // If there are bets, this functions as a "Double" (x2)
    if (currentTotalBet > 0) {
      if (currentTotalBet > state.bankroll) {
        get().triggerInsufficientFunds();
        return; // Not enough funds to double
      }

      set((s) => ({
        bankroll: s.bankroll - currentTotalBet,
        betHistory: [
          ...s.betHistory,
          // We don't record the full list of seats in history for a singular x2 action, 
          // or we could record them iteratively. A simpler approach is just applying the double:
          ...s.seats
            .filter((st) => st.isActive && st.hands.some((h) => h.betAmount > 0))
            .map((st) => ({
              seatId: st.id,
              amount: st.hands.reduce((sum, h) => sum + h.betAmount, 0),
            })),
        ],
        seats: s.seats.map((seat) => {
          if (!seat.isActive) return seat;
          return {
            ...seat,
            hands: seat.hands.map((hand) => ({
              ...hand,
              betAmount: hand.betAmount * 2,
            })),
          };
        }),
      }));
      return;
    }

    // Otherwise, this functions as "Rebet" from the previous round
    if (state.previousBets.length === 0) return;

    const previousSideBetTotal = Object.values(state.previousSideBets).reduce((sum, v) => sum + v, 0);
    const previousTotal = state.previousBets.reduce((sum, b) => sum + b.amount, 0) + previousSideBetTotal;
    if (previousTotal > state.bankroll) {
        get().triggerInsufficientFunds();
        return;
    }

    set((s) => ({
      bankroll: s.bankroll - previousTotal,
      betHistory: [...s.betHistory, ...state.previousBets],
      sideBets: { ...state.previousSideBets },
      seats: s.seats.map((seat) => {
        const prevBet = state.previousBets.find((b) => b.seatId === seat.id);
        if (!prevBet) return seat;
        
        // Ensure seat is active if it had a previous bet
        return {
          ...seat,
          isActive: true,
          hands: seat.hands.map((hand, idx) =>
            idx === 0 ? { ...hand, betAmount: prevBet.amount } : hand
          ),
        };
      }),
    }));
  },

  toggleSeat: (seatId: number) => {
    const state = get();
    if (state.gamePhase !== GamePhase.BETTING) return;

      set((s) => {
        const targetSeat = s.seats.find((seat) => seat.id === seatId);
        if (!targetSeat) return s;

        if (!targetSeat.isActive) {
          return {
            ...s,
            seats: s.seats.map((seat) =>
              seat.id === seatId ? { ...seat, isActive: true } : seat
            ),
          };
        }

        const mainRefund = targetSeat.hands.reduce((sum, hand) => sum + hand.betAmount, 0);
        const sideRefund = s.sideBets[seatId] || 0;
        const nextSideBets = { ...s.sideBets };
        delete nextSideBets[seatId];

        return {
          ...s,
          bankroll: s.bankroll + mainRefund + sideRefund,
          betHistory: s.betHistory.filter((bet) => bet.seatId !== seatId),
          sideBets: nextSideBets,
          seats: s.seats.map((seat) => {
            if (seat.id !== seatId) return seat;

            return {
              ...seat,
              isActive: false,
              hands: [createEmptyHand(seatId, 0)],
              currentHandIndex: 0,
              freeActionTokens: 0,
              sideBetAmount: 0,
            };
          }),
        };
      });
  },

  addFunds: (amount: number) => {
    set((s) => ({ bankroll: s.bankroll + amount }));
  },

  setBankroll: (amount: number) => {
    set({ bankroll: Math.max(0, amount) });
  },

  claimDaily: () => {
    const state = get();
    const now = Date.now();
    const THIRTY_MIN = 30 * 60 * 1000;
    if (now - state.lastDailyClaim < THIRTY_MIN) return false;

    const isBonusClaim = (state.dailyClaimCount + 1) % 3 === 0;
    const baseClaim = isBonusClaim ? 1000 : 500;
    const activityBonus = Math.floor((state.totalBetSinceLastClaim || 0) * 0.1);
    const claimAmount = baseClaim + activityBonus;

    set((s) => ({
      bankroll: s.bankroll + claimAmount,
      lastDailyClaim: now,
      dailyClaimCount: s.dailyClaimCount + 1,
      totalBetSinceLastClaim: 0,
    }));
    return true;
  },

  setCurrentRoom: (roomId: string) => {
    const state = get() as any;
    if (state.currentRoom === roomId) return;

    const currentShoe = state.shoe;
    const savedShoes = state.savedShoes || {};

    set({ 
      currentRoom: roomId,
      savedShoes: { ...savedShoes, [state.currentRoom]: currentShoe },
      shoe: savedShoes[roomId] || []
    } as any);
  },

  triggerInsufficientFunds: () => {
    set({ insufficientFundsWarning: true });
    // Auto-clear the warning after 2.5 seconds
    setTimeout(() => {
      set({ insufficientFundsWarning: false });
    }, 2500);
  },

  clearInsufficientFunds: () => {
    set({ insufficientFundsWarning: false });
  },

  placeSideBet: (seatId: number, amount: number) => {
    const state = get();
    if (state.gamePhase !== GamePhase.BETTING) return;
    const roomCfg = getRoomConfig(state.currentRoom);
    if (!roomCfg.hasSideBet) return;
    // Require a main bet on this seat before placing a side bet
    const seat = state.seats.find(s => s.id === seatId);
    if (!seat || seat.hands.reduce((sum, h) => sum + h.betAmount, 0) === 0) return;
    if (amount > state.bankroll) {
      get().triggerInsufficientFunds();
      return;
    }
    set({
      bankroll: state.bankroll - amount,
      sideBets: { ...state.sideBets, [seatId]: (state.sideBets[seatId] || 0) + amount },
    });
  },

  clearSideBet: (seatId: number) => {
    const state = get();
    if (state.gamePhase !== GamePhase.BETTING) return;
    const refund = state.sideBets[seatId] || 0;
    if (refund <= 0) return;
    const newSideBets = { ...state.sideBets };
    delete newSideBets[seatId];
    set({
      bankroll: state.bankroll + refund,
      sideBets: newSideBets,
    });
  },
});

/** Helper to create an empty hand */
export function createEmptyHand(seatId: number, handIndex: number): GameStore['seats'][0]['hands'][0] {
  return {
    id: `seat-${seatId}-hand-${handIndex}`,
    cards: [],
    betAmount: 0,
    status: HandStatus.PLAYING,
  };
}
