import { GameStore, Hand } from '@/types/game';

/** Get the current active hand being played */
export function getCurrentHand(state: GameStore): Hand | null {
  const seat = state.seats[state.currentSeatIndex];
  if (!seat || !seat.isActive) return null;
  return seat.hands[seat.currentHandIndex] ?? null;
}
