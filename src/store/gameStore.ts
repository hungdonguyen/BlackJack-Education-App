// ============================================
// Main Game Store — combines slices with Zustand persist middleware
// ============================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GameStore } from '@/types/game';
import { createBettingSlice } from './bettingSlice';
import { createGameFlowSlice } from './gameFlowSlice';
import { isTauriEnv } from '@/utils/saveFile';

/**
 * Main game store combining all slices.
 *
 * Storage strategy:
 * - Zustand persist ALWAYS uses localStorage (both browser dev and Tauri).
 *   This avoids any race condition where Zustand's own setItem overwrites
 *   save.json with default values before the manual load completes.
 *
 * - In Tauri mode, save.json is managed EXCLUSIVELY by useStoreHydration:
 *     • On mount: reads save.json and applies the saved state manually.
 *     • On change: a store subscriber writes updated values to save.json.
 *
 * Match history is managed separately in AppData/history.json.
 */
export const useGameStoreBase = create<GameStore>()(
  persist(
    (...a) => ({
      ...createBettingSlice(...a),
      ...createGameFlowSlice(...a),
    }),
    {
      name: 'blackjack-storage',
      // Always use localStorage — never tauriStorage here.
      // save.json is handled by the manual mechanism in useStoreHydration.
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? {
              getItem: (name: string) => localStorage.getItem(name),
              setItem: (name: string, value: string) => localStorage.setItem(name, value),
              removeItem: (name: string) => localStorage.removeItem(name),
            }
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
      ),
      partialize: (state) => ({
        bankroll: state.bankroll,
        lastDailyClaim: state.lastDailyClaim,
        dailyClaimCount: state.dailyClaimCount,
        ...(!isTauriEnv() && { matchHistory: state.matchHistory }),
      }),
    }
  )
);
