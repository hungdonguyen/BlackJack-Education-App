// ============================================
// Betting Slice — handles chip selection, placing/clearing bets, seat toggling
// ============================================

import { StateCreator } from 'zustand';
import { GameStore } from '@/types/game';
import { GamePhase, HandStatus } from '@/types/enums';
import { CHIP_VALUES, DEFAULT_BANKROLL } from '@/utils/constants';
import { getRoomConfig } from '@/utils/rooms';
import { checkTutorialAction } from '@/utils/tutorialInterceptor';

/** A record of a single bet placement for undo */
export interface BetRecord {
  seatId: number;
  amount: number;
}

const EXCHANGE_ROOM_ID = 'exchange_21';

function getBettingHandsForRoom(roomId: string, seatId: number): GameStore['seats'][0]['hands'] {
  if (roomId === EXCHANGE_ROOM_ID) {
    return [createEmptyHand(seatId, 0), createEmptyHand(seatId, 1)];
  }
  return [createEmptyHand(seatId, 0)];
}

export interface BettingSlice {
  // State
  bankroll: number;
  selectedChipValue: number;
  betHistory: BetRecord[];
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
  currentRoom: 'classic',
  previousBets: [],
  previousSideBets: {},
  insufficientFundsWarning: false,
  sideBets: {},

  selectChip: (value: number) => {
    const state = get();
    if (!checkTutorialAction(state, `chip-${value}`)) return;
    set({ selectedChipValue: value });
  },

  placeBet: (seatId: number, amount: number) => {
    const state = get();
    if (state.gamePhase !== GamePhase.BETTING) return;
    if (!checkTutorialAction(state, `seat-${seatId}`)) return;
    const isExchangeRoom = state.currentRoom === EXCHANGE_ROOM_ID;
    const multiplier = isExchangeRoom ? 2 : 1;
    const totalAmount = amount * multiplier;
    
    const roomCfg = getRoomConfig(state.currentRoom);
    const balance = roomCfg.isTutorial ? state.tutorialBalance : state.bankroll;

    // In tutorial mode, only seat 3 is allowed
    if (roomCfg.isTutorial && seatId !== 3) return;

    if (totalAmount > balance) {
      get().triggerInsufficientFunds();
      return;
    }

    // In tutorial mode, cap each seat's bet at $100 to ensure the player can afford splits
    if (roomCfg.isTutorial) {
      const seat = state.seats.find(s => s.id === seatId);
      if (seat) {
        const currentBet = seat.hands.reduce((sum, h) => sum + h.betAmount, 0);
        if (currentBet + totalAmount > 100) return;
      }
    }

    set((s) => ({
      bankroll: roomCfg.isTutorial ? s.bankroll : s.bankroll - totalAmount,
      tutorialBalance: roomCfg.isTutorial ? s.tutorialBalance - totalAmount : s.tutorialBalance,
      betHistory: [...s.betHistory, { seatId, amount: totalAmount }],
      totalBetSinceLastClaim: s.totalBetSinceLastClaim + totalAmount,
      seats: s.seats.map((seat) => {
        if (seat.id !== seatId) return seat;
        if (!seat.isActive) return seat;

        const baseHands = isExchangeRoom && seat.hands.length < 2
          ? getBettingHandsForRoom(s.currentRoom, seatId)
          : seat.hands;
        const perHandIncrement = isExchangeRoom ? amount : totalAmount;

        const updatedHands = baseHands.map((hand) => ({
          ...hand,
          betAmount: hand.betAmount + perHandIncrement,
        }));

        return { ...seat, hands: updatedHands };
      }),
    }));
  },

  undoBet: () => {
    const state = get();
    if (state.gamePhase !== GamePhase.BETTING) return;
    if (!checkTutorialAction(state, 'action-undo')) return;
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

    const isTutorial = getRoomConfig(state.currentRoom).isTutorial;
    const perHandRollback = state.currentRoom === EXCHANGE_ROOM_ID ? lastBet.amount / 2 : lastBet.amount;
    set((s) => ({
      bankroll: isTutorial ? s.bankroll : s.bankroll + lastBet.amount + sideRefund,
      tutorialBalance: isTutorial ? s.tutorialBalance + lastBet.amount + sideRefund : s.tutorialBalance,
      betHistory: s.betHistory.slice(0, -1),
      sideBets: newSideBets,
      totalBetSinceLastClaim: Math.max(0, s.totalBetSinceLastClaim - lastBet.amount),
      seats: s.seats.map((seat) => {
        if (seat.id !== lastBet.seatId) return seat;
        return {
          ...seat,
          hands: seat.hands.map((hand) => ({
            ...hand,
            betAmount: Math.max(0, hand.betAmount - perHandRollback),
          })),
        };
      }),
    }));
  },

  clearBet: (seatId: number) => {
    const state = get();
    if (state.gamePhase !== GamePhase.BETTING) return;
    if (!checkTutorialAction(state, `clear-seat-${seatId}`)) return;

    const seat = state.seats.find((s) => s.id === seatId);
    if (!seat) return;

    const mainRefund = seat.hands.reduce((sum, hand) => sum + hand.betAmount, 0);
    // Also refund any side bet since main bet is gone
    const sideRefund = state.sideBets[seatId] || 0;
    const newSideBets = { ...state.sideBets };
    if (sideRefund > 0) delete newSideBets[seatId];

    const isTutorial = getRoomConfig(state.currentRoom).isTutorial;
    set((s) => ({
      bankroll: isTutorial ? s.bankroll : s.bankroll + mainRefund + sideRefund,
      tutorialBalance: isTutorial ? s.tutorialBalance + mainRefund + sideRefund : s.tutorialBalance,
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
    if (!checkTutorialAction(state, 'action-clear')) return;

    const mainRefund = state.seats.reduce(
      (sum, seat) => sum + seat.hands.reduce((s, h) => s + h.betAmount, 0),
      0
    );
    const sideRefund = Object.values(state.sideBets).reduce((sum, v) => sum + v, 0);

    const isTutorial = getRoomConfig(state.currentRoom).isTutorial;
    set((s) => ({
      bankroll: isTutorial ? s.bankroll : s.bankroll + mainRefund + sideRefund,
      tutorialBalance: isTutorial ? s.tutorialBalance + mainRefund + sideRefund : s.tutorialBalance,
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
    if (!checkTutorialAction(state, 'action-rebet')) return;
    const isTutorial = getRoomConfig(state.currentRoom).isTutorial;
    const balance = isTutorial ? state.tutorialBalance : state.bankroll;

    // Determine current total bets on the table
    let currentTotalBet = 0;
    state.seats.forEach((s) => {
      currentTotalBet += s.hands.reduce((sum, h) => sum + h.betAmount, 0);
    });

    // If there are bets, this functions as a "Double" (x2)
    if (currentTotalBet > 0) {
      if (currentTotalBet > balance) {
        get().triggerInsufficientFunds();
        return; // Not enough funds to double
      }

      set((s) => ({
        bankroll: isTutorial ? s.bankroll : s.bankroll - currentTotalBet,
        tutorialBalance: isTutorial ? s.tutorialBalance - currentTotalBet : s.tutorialBalance,
        betHistory: [
          ...s.betHistory,
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
    if (previousTotal > balance) {
        get().triggerInsufficientFunds();
        return;
    }

    set((s) => ({
      bankroll: isTutorial ? s.bankroll : s.bankroll - previousTotal,
      tutorialBalance: isTutorial ? s.tutorialBalance - previousTotal : s.tutorialBalance,
      betHistory: [...s.betHistory, ...state.previousBets],
      sideBets: { ...state.previousSideBets },
      seats: s.seats.map((seat) => {
        const prevBet = state.previousBets.find((b) => b.seatId === seat.id);
        if (!prevBet) return seat;
        const isExchangeRoom = state.currentRoom === EXCHANGE_ROOM_ID;
        const baseHands = isExchangeRoom ? getBettingHandsForRoom(state.currentRoom, seat.id) : seat.hands;
        const perHandBet = isExchangeRoom ? prevBet.amount / 2 : prevBet.amount;
        
        return {
          ...seat,
          isActive: true,
          hands: baseHands.map((hand) => ({ ...hand, betAmount: perHandBet })),
        };
      }),
    }));
  },

  toggleSeat: (seatId: number) => {
    const state = get();
    if (state.gamePhase !== GamePhase.BETTING) return;
    if (!checkTutorialAction(state, `toggle-seat-${seatId}`)) return;

      set((s) => {
        const roomCfg = getRoomConfig(s.currentRoom);
        // In tutorial mode, only seat 3 can be toggled (and must stay active)
        if (roomCfg.isTutorial) return s;

        const targetSeat = s.seats.find((seat) => seat.id === seatId);
        if (!targetSeat) return s;

        if (!targetSeat.isActive) {
          return {
            ...s,
            seats: s.seats.map((seat) =>
              seat.id === seatId
                ? {
                    ...seat,
                    isActive: true,
                    hands: getBettingHandsForRoom(s.currentRoom, seatId),
                    currentHandIndex: 0,
                    hasSwitched: false,
                  }
                : seat
            ),
          };
        }

        const mainRefund = targetSeat.hands.reduce((sum, hand) => sum + hand.betAmount, 0);
        const sideRefund = s.sideBets[seatId] || 0;
        const nextSideBets = { ...s.sideBets };
        delete nextSideBets[seatId];

        const isTutorial = getRoomConfig(s.currentRoom).isTutorial;
        return {
          ...s,
          bankroll: isTutorial ? s.bankroll : s.bankroll + mainRefund + sideRefund,
          tutorialBalance: isTutorial ? s.tutorialBalance + mainRefund + sideRefund : s.tutorialBalance,
          betHistory: s.betHistory.filter((bet) => bet.seatId !== seatId),
          sideBets: nextSideBets,
          seats: s.seats.map((seat) => {
            if (seat.id !== seatId) return seat;

            return {
              ...seat,
              isActive: false,
              hands: getBettingHandsForRoom(s.currentRoom, seatId),
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


  setCurrentRoom: (roomId: string) => {
    const state = get() as any;
    if (state.currentRoom === roomId) return;

    const currentShoe = state.shoe;
    const savedShoes = state.savedShoes || {};
    const isExchangeRoom = roomId === EXCHANGE_ROOM_ID;

    set({ 
      currentRoom: roomId,
      savedShoes: { ...savedShoes, [state.currentRoom]: currentShoe },
      shoe: savedShoes[roomId] || [],
      selectedChipValue: roomId === 'tutorial_double' ? 100 : 1,
      betHistory: [],
      seats: state.seats.map((seat: GameStore['seats'][0]) => {
        const totalBet = seat.hands.reduce((sum: number, hand: GameStore['seats'][0]['hands'][0]) => sum + hand.betAmount, 0);
        const baseHands = getBettingHandsForRoom(roomId, seat.id);
        const perHandBet = isExchangeRoom ? totalBet / 2 : totalBet;

        return {
          ...seat,
          hands: baseHands.map((hand) => ({ ...hand, betAmount: perHandBet })),
          currentHandIndex: 0,
          hasSwitched: false,
        };
      }),
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
    const isTutorial = roomCfg.isTutorial;
    const balance = isTutorial ? state.tutorialBalance : state.bankroll;
    if (amount > balance) {
      get().triggerInsufficientFunds();
      return;
    }
    set((s) => ({
      bankroll: isTutorial ? s.bankroll : s.bankroll - amount,
      tutorialBalance: isTutorial ? s.tutorialBalance - amount : s.tutorialBalance,
      sideBets: { ...s.sideBets, [seatId]: (s.sideBets[seatId] || 0) + amount },
    }));
  },

  clearSideBet: (seatId: number) => {
    const state = get();
    if (state.gamePhase !== GamePhase.BETTING) return;
    const refund = state.sideBets[seatId] || 0;
    if (refund <= 0) return;
    const newSideBets = { ...state.sideBets };
    delete newSideBets[seatId];
    const isTutorial = getRoomConfig(state.currentRoom).isTutorial;
    set((s) => ({
      bankroll: isTutorial ? s.bankroll : s.bankroll + refund,
      tutorialBalance: isTutorial ? s.tutorialBalance + refund : s.tutorialBalance,
      sideBets: newSideBets,
    }));
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
