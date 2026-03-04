// ============================================
// Store Hook
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { useGameStoreBase } from '@/store/gameStore';
import { GameStore } from '@/types/game';
import { isTauriEnv, readSaveFile, writeSaveFile } from '@/utils/saveFile';

/**
 * Thin wrapper around the base Zustand store.
 *
 * Usage:
 *   const bankroll = useGameStore((s) => s.bankroll);
 *   const hit = useGameStore((s) => s.hit);
 */
export function useGameStore<T>(selector: (state: GameStore) => T): T {
  return useGameStoreBase(selector);
}

/**
 * Hook to check if the store has been hydrated.
 *
 * In Tauri mode, this also:
 *  1. Explicitly reads save.json and applies the saved bankroll/claims
 *     (bypasses Zustand persist async timing issues).
 *  2. Subscribes to bankroll/claim changes and writes them to save.json
 *     so the data is always persisted reliably.
 */
export function useStoreHydration(): boolean {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    /** After Zustand's own hydration, explicitly load from Tauri save.json */
    async function applyTauriSave() {
      if (!isTauriEnv()) return;
      try {
        const content = await readSaveFile();
        if (content && !cancelled) {
          const parsed = JSON.parse(content);
          if (parsed?.state) {
            const patch: Partial<GameStore> = {};
            if (parsed.state.bankroll !== undefined) patch.bankroll = parsed.state.bankroll;
            if (parsed.state.lastDailyClaim !== undefined) patch.lastDailyClaim = parsed.state.lastDailyClaim;
            if (parsed.state.dailyClaimCount !== undefined) patch.dailyClaimCount = parsed.state.dailyClaimCount;
            useGameStoreBase.setState(patch);
          }
        }
      } catch (err) {
        console.warn('[useStoreHydration] Failed to load Tauri save:', err);
      }
    }

    const onFinish = () => {
      if (isTauriEnv()) {
        applyTauriSave().finally(() => {
          if (!cancelled) setIsHydrated(true);
        });
      } else {
        if (!cancelled) setIsHydrated(true);
      }
    };

    const unsubFinishHydration = useGameStoreBase.persist.onFinishHydration(onFinish);

    if (useGameStoreBase.persist.hasHydrated()) {
      onFinish();
    }

    // ── Explicit Tauri auto-save subscriber ──────────────────────────
    // Writes save.json whenever bankroll or daily-claim state changes.
    // This is more reliable than relying solely on Zustand persist's
    // async setItem, which can silently fail if isTauriEnv() was false
    // at the moment Zustand's internal subscriber first evaluated it.
    let unsubState: (() => void) | undefined;
    if (isTauriEnv()) {
      unsubState = useGameStoreBase.subscribe((state, prevState) => {
        if (
          state.bankroll !== prevState.bankroll ||
          state.lastDailyClaim !== prevState.lastDailyClaim ||
          state.dailyClaimCount !== prevState.dailyClaimCount
        ) {
          writeSaveFile(JSON.stringify({
            state: {
              bankroll: state.bankroll,
              lastDailyClaim: state.lastDailyClaim,
              dailyClaimCount: state.dailyClaimCount,
            },
            version: 0,
          }));
        }
      });
    }

    return () => {
      cancelled = true;
      unsubFinishHydration();
      unsubState?.();
    };
  }, []);

  return isHydrated;
}
