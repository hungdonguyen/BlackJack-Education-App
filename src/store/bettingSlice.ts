// ============================================
// Betting Slice — handles chip selection, placing/clearing bets, seat toggling
// ============================================

import { StateCreator } from 'zustand';
import { GameStore } from '@/types/game';
import { GamePhase, HandStatus } from '@/types/enums';
import { CHIP_VALUES, DEFAULT_BANKROLL } from '@/utils/constants';

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
  insufficientFundsWarning: boolean;

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
}

export const createBettingSlice: StateCreator<GameStore, [], [], BettingSlice> = (set, get) => ({
  bankroll: DEFAULT_BANKROLL,
  selectedChipValue: CHIP_VALUES[0],
  betHistory: [],
  lastDailyClaim: 0,
  dailyClaimCount: 0,
  currentRoom: 'classic',
  previousBets: [],
  insufficientFundsWarning: false,

  selectChip: (value: number) => {
    set({ selectedChipValue: value });
  },

  placeBet: (seatId: number, amount: number) => {
    const state = get();
    if (state.gamePhase !== GamePhase.BETTING) return;
    if (amount > state.bankroll) {
      get().triggerInsufficientFunds();
      return;
    }

    set((s) => ({
      bankroll: s.bankroll - amount,
      betHistory: [...s.betHistory, { seatId, amount }],
      seats: s.seats.map((seat) => {
        if (seat.id !== seatId) return seat;
        if (!seat.isActive) return seat;

        const updatedHands = seat.hands.map((hand) => ({
          ...hand,
          betAmount: hand.betAmount + amount,
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

    set((s) => ({
      bankroll: s.bankroll + lastBet.amount,
      betHistory: s.betHistory.slice(0, -1),
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

    const refund = seat.hands.reduce((sum, hand) => sum + hand.betAmount, 0);

    set((s) => ({
      bankroll: s.bankroll + refund,
      betHistory: s.betHistory.filter((b: { seatId: number; amount: number }) => b.seatId !== seatId),
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

    const totalRefund = state.seats.reduce(
      (sum, seat) => sum + seat.hands.reduce((s, h) => s + h.betAmount, 0),
      0
    );

    set((s) => ({
      bankroll: s.bankroll + totalRefund,
      betHistory: [],
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

    const previousTotal = state.previousBets.reduce((sum, b) => sum + b.amount, 0);
    if (previousTotal > state.bankroll) {
        get().triggerInsufficientFunds();
        return;
    }

    set((s) => ({
      bankroll: s.bankroll - previousTotal,
      betHistory: [...s.betHistory, ...state.previousBets],
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

    set((s) => ({
      seats: s.seats.map((seat) => {
        if (seat.id !== seatId) return seat;

        // If deactivating, refund any bets
        if (seat.isActive) {
          const refund = seat.hands.reduce((sum, hand) => sum + hand.betAmount, 0);
          return {
            ...seat,
            isActive: false,
            hands: [createEmptyHand(seatId, 0)],
          };
        }

        return { ...seat, isActive: true };
      }),
      // Refund bet when deactivating
      bankroll:
        s.bankroll +
        (s.seats.find((st) => st.id === seatId)?.isActive
          ? s.seats.find((st) => st.id === seatId)?.hands.reduce((sum, h) => sum + h.betAmount, 0) ?? 0
          : 0),
    }));
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
    const ONE_HOUR = 60 * 60 * 1000;
    if (now - state.lastDailyClaim < ONE_HOUR) return false;

    const isBonusClaim = (state.dailyClaimCount + 1) % 3 === 0;
    const claimAmount = isBonusClaim ? 1000 : 500;

    set((s) => ({
      bankroll: s.bankroll + claimAmount,
      lastDailyClaim: now,
      dailyClaimCount: s.dailyClaimCount + 1,
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
