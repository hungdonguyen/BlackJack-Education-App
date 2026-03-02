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
  currentRoom: string;

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
}

export const createBettingSlice: StateCreator<GameStore, [], [], BettingSlice> = (set, get) => ({
  bankroll: DEFAULT_BANKROLL,
  selectedChipValue: CHIP_VALUES[0],
  betHistory: [],
  lastDailyClaim: 0,
  currentRoom: 'classic',

  selectChip: (value: number) => {
    set({ selectedChipValue: value });
  },

  placeBet: (seatId: number, amount: number) => {
    const state = get();
    if (state.gamePhase !== GamePhase.BETTING) return;
    if (amount > state.bankroll) return;

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

  claimDaily: () => {
    const state = get();
    const now = Date.now();
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    if (now - state.lastDailyClaim < TWO_HOURS) return false;
    set((s) => ({
      bankroll: s.bankroll + 200,
      lastDailyClaim: now,
    }));
    return true;
  },

  setCurrentRoom: (roomId: string) => {
    set({ currentRoom: roomId });
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
