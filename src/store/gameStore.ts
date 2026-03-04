// ============================================
// Main Game Store — combines slices with Zustand persist middleware
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GameStore } from '@/types/game';
import { createBettingSlice } from './bettingSlice';
import { createGameFlowSlice } from './gameFlowSlice';
import { tauriStorage, isTauriEnv } from '@/utils/saveFile';

/**
 * Main game store combining all slices.
 * - In Tauri (desktop): persists bankroll/claims to AppData/save.json
 * - In browser (dev):   falls back to localStorage
 * Match history is managed separately in AppData/history.json
 */
export const useGameStoreBase = create<GameStore>()(
  persist(
    (...a) => ({
      ...createBettingSlice(...a),
      ...createGameFlowSlice(...a),
    }),
    {
      name: 'blackjack-storage',
      storage: createJSONStorage(() =>
        isTauriEnv() ? tauriStorage : {
          getItem: async (name: string) => localStorage.getItem(name),
          setItem: async (name: string, value: string) => localStorage.setItem(name, value),
          removeItem: async (name: string) => localStorage.removeItem(name),
        }
      ),

      // Persist bankroll and daily claims always.
      // In browser/dev mode (no Tauri), also persist matchHistory to localStorage
      // since we cannot write history.json. In Tauri mode, history is managed
      // separately in AppData/history.json to avoid bloating save.json.
      partialize: (state) => ({
        bankroll: state.bankroll,
        lastDailyClaim: state.lastDailyClaim,
        dailyClaimCount: state.dailyClaimCount,
        ...(!isTauriEnv() && { matchHistory: state.matchHistory }),
      }),
    }
  )
);

