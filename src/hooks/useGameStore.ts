// ============================================
// Store Hook
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { useGameStoreBase } from '@/store/gameStore';
import { GameStore } from '@/types/game';

/**
 * Thin wrapper around the base Zustand store.
 *
 * The app uses `output: "export"` (static export) — there is no SSR,
 * so per-call hydration guards are unnecessary overhead. Hydration safety
 * is handled once at the component level via `useStoreHydration()` which
 * shows a loading screen until Zustand's persist middleware has finished
 * rehydrating from localStorage.
 *
 * Usage:
 *   const bankroll = useGameStore((s) => s.bankroll);
 *   const hit = useGameStore((s) => s.hit);
 */
export function useGameStore<T>(selector: (state: GameStore) => T): T {
  return useGameStoreBase(selector);
}

/**
 * Hook to check if the store has been hydrated from localStorage.
 * Useful for showing loading states while persisted data is being restored.
 */
export function useStoreHydration(): boolean {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Check if Zustand's persist middleware has finished rehydrating
    const unsubFinishHydration = useGameStoreBase.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    // If already hydrated (e.g., navigating between pages)
    if (useGameStoreBase.persist.hasHydrated()) {
      setIsHydrated(true);
    }

    return () => {
      unsubFinishHydration();
    };
  }, []);

  return isHydrated;
}
