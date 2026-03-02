// ============================================
// Main Game Store — combines slices with Zustand persist middleware
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GameStore } from '@/types/game';
import { createBettingSlice } from './bettingSlice';
import { createGameFlowSlice } from './gameFlowSlice';

/**
 * Main game store combining all slices.
 * Uses Zustand's `persist` middleware to automatically sync
 * `bankroll` and `matchHistory` to localStorage.
 */
export const useGameStoreBase = create<GameStore>()(
  persist(
    (...a) => ({
      ...createBettingSlice(...a),
      ...createGameFlowSlice(...a),
    }),
    {
      name: 'blackjack-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),

      // Only persist bankroll and matchHistory — not the game state
      partialize: (state) => ({
        bankroll: state.bankroll,
        matchHistory: state.matchHistory,
        lastDailyClaim: state.lastDailyClaim,
      }),
    }
  )
);
