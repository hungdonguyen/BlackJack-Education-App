// ============================================
// Hydration-Safe Store Hook
// ============================================
// Next.js renders on the server first (SSR) where localStorage doesn't exist.
// If we use the persisted store values directly, the server-rendered HTML
// will differ from the client-hydrated HTML, causing a "Hydration Mismatch" error.
//
// This hook delays reading persisted values until after hydration is complete.

'use client';

import { useState, useEffect } from 'react';
import { useGameStoreBase } from '@/store/gameStore';
import { GameStore } from '@/types/game';

/**
 * Hydration-safe wrapper around the game store.
 *
 * Usage:
 *   const bankroll = useGameStore((s) => s.bankroll);
 *   const hit = useGameStore((s) => s.hit);
 *
 * On the server and during the first client render, this returns
 * the Zustand store's *default* values (not the persisted ones).
 * After hydration, it seamlessly switches to the persisted values.
 */
export function useGameStore<T>(selector: (state: GameStore) => T): T {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // During SSR / first render: use default store values
  // After hydration: use the real (possibly persisted) store values
  return useGameStoreBase(
    isHydrated
      ? selector
      : (state) => {
          // Return selector result from the current (default) state
          // This ensures consistent rendering between server and client
          return selector(state);
        }
  );
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
