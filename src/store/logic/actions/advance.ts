import { GameStore, GamePhase } from '@/types/game';
import { HandStatus } from '@/types/enums';

export const advanceToNextHandLogic = (set: any, get: () => GameStore) => {
    const state = get();
    // Do not run if game is no longer in PLAYER_TURN phase (prevents fast double-click freeze)
    if (state.gamePhase !== GamePhase.PLAYER_TURN) return;

    const currentSeat = state.seats[state.currentSeatIndex];

    if (!currentSeat) {
      set({ gamePhase: GamePhase.DEALER_TURN });
      setTimeout(() => get().dealerPlay(), 0);
      return;
    }

    let foundNextHand = false;
    for (let hIdx = currentSeat.currentHandIndex + 1; hIdx < currentSeat.hands.length; hIdx++) {
      const nextHand = currentSeat.hands[hIdx];
      if (nextHand.betAmount > 0 && nextHand.status === HandStatus.PLAYING) {
        set((s: any) => ({
          seats: s.seats.map((seat: any, idx: number) =>
            idx === state.currentSeatIndex
              ? { ...seat, currentHandIndex: hIdx }
              : seat
          ),
        }));
        foundNextHand = true;
        break;
      }
    }
    if (foundNextHand) return;

    for (let i = state.currentSeatIndex + 1; i < state.seats.length; i++) {
        const seat = state.seats[i];
        if (seat.isActive && seat.hands.some((h) => h.betAmount > 0 && h.status === HandStatus.PLAYING)) {
          set({
            currentSeatIndex: i,
            seats: state.seats.map((s, idx) =>
              idx === i ? { ...s, currentHandIndex: 0 } : s
            ),
          });
          return;
        }
    }

    set({ gamePhase: GamePhase.DEALER_TURN });
    setTimeout(() => get().dealerPlay(), 0);
};
