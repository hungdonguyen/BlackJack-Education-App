// ============================================
// Store Hook
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { useGameStoreBase } from '@/store/gameStore';
import { GameStore } from '@/types/game';
import { DealerSpeed } from '@/store/settingsSlice';
import { isTauriEnv, readSaveFile, writeSaveFile, loadHistory, writeHistoryFile } from '@/utils/saveFile';

export function useGameStore<T>(selector: (state: GameStore) => T): T {
  return useGameStoreBase(selector);
}

/**
 * Hook that:
 *  - In browser/dev: waits for Zustand's localStorage hydration then returns true.
 *  - In Tauri:       reads save.json directly on mount, applies saved state,
 *                    then subscribes to write any changes back to save.json.
 *
 * Zustand persist only uses localStorage in both modes (see gameStore.ts).
 * save.json in Tauri is managed exclusively here — no conflict.
 */
export function useStoreHydration(): boolean {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // ── Tauri mode: read save.json directly, no dependency on Zustand hydration ──
    if (isTauriEnv()) {
      Promise.all([readSaveFile(), loadHistory()])
        .then(([content, history]) => {
          if (cancelled) return;
          const patch: Partial<GameStore> = {};
          
          if (history && history.length > 0) {
            patch.matchHistory = history;
          }

          if (content) {
            try {
              const parsed = JSON.parse(content);
              // save.json format: { state: { bankroll, lastDailyClaim, dailyClaimCount }, version, legalAgreed? }
              if (parsed?.state) {
                if (typeof parsed.state.bankroll === 'number')
                  patch.bankroll = parsed.state.bankroll;
                if (typeof parsed.state.lastDailyClaim === 'number')
                  patch.lastDailyClaim = parsed.state.lastDailyClaim;
                if (typeof parsed.state.dailyClaimCount === 'number')
                  patch.dailyClaimCount = parsed.state.dailyClaimCount;
                // Settings
                if (parsed.state.dealerSpeed === 'normal' || parsed.state.dealerSpeed === 'fast')
                  patch.dealerSpeed = parsed.state.dealerSpeed as DealerSpeed;
                if (typeof parsed.state.soundEnabled === 'boolean')
                  patch.soundEnabled = parsed.state.soundEnabled;
                if (typeof parsed.state.showHandAdvisor === 'boolean')
                  patch.showHandAdvisor = parsed.state.showHandAdvisor;
                if (typeof parsed.state.showCardCounting === 'boolean')
                  patch.showCardCounting = parsed.state.showCardCounting;
              }
            } catch (err) {
              console.warn('[useStoreHydration] Failed to parse save.json:', err);
            }
          }
          
          if (Object.keys(patch).length > 0) {
            useGameStoreBase.setState(patch);
          }
        })
        .catch((err) => {
          console.warn('[useStoreHydration] Failed to read save.json:', err);
        })
        .finally(() => {
          if (!cancelled) setIsHydrated(true);
        });

      // Debounce utility to prevent rapid I/O causing race conditions
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const debounce = <F extends (...args: any[]) => void>(func: F, waitFor: number) => {
        let timeout: NodeJS.Timeout | null = null;
        return (...args: Parameters<F>) => {
          if (timeout) clearTimeout(timeout);
          timeout = setTimeout(() => func(...args), waitFor);
        };
      };

      const saveState = async (state: GameStore) => {
        try {
          // Merge with any extra fields (e.g. legalAgreed) already in the file
          const existing = await readSaveFile();
          const base = existing ? JSON.parse(existing) : {};
          base.state = {
            ...(base.state || {}),
            bankroll: state.bankroll,
            lastDailyClaim: state.lastDailyClaim,
            dailyClaimCount: state.dailyClaimCount,
            dealerSpeed: state.dealerSpeed,
            soundEnabled: state.soundEnabled,
            showHandAdvisor: state.showHandAdvisor,
            showCardCounting: state.showCardCounting,
          };
          base.version = 0;
          await writeSaveFile(JSON.stringify(base));
        } catch (err) {
          // fallback: write without merge
          await writeSaveFile(
            JSON.stringify({
              state: {
                bankroll: state.bankroll,
                lastDailyClaim: state.lastDailyClaim,
                dailyClaimCount: state.dailyClaimCount,
                dealerSpeed: state.dealerSpeed,
                soundEnabled: state.soundEnabled,
                showHandAdvisor: state.showHandAdvisor,
                showCardCounting: state.showCardCounting,
              },
              version: 0,
            })
          );
        }
      };

      const debouncedSave = debounce(saveState, 500);
      const debouncedHistorySave = debounce(writeHistoryFile, 1500); // 1.5s debounce for history to avoid rapid writes

      // Subscribe: write to save.json whenever bankroll/claims change
      const unsubState = useGameStoreBase.subscribe((state, prevState) => {
        if (
          state.bankroll !== prevState.bankroll ||
          state.lastDailyClaim !== prevState.lastDailyClaim ||
          state.dailyClaimCount !== prevState.dailyClaimCount ||
          state.dealerSpeed !== prevState.dealerSpeed ||
          state.soundEnabled !== prevState.soundEnabled ||
          state.showHandAdvisor !== prevState.showHandAdvisor ||
          state.showCardCounting !== prevState.showCardCounting
        ) {
          debouncedSave(state);
        }

        // Check if history changed
        if (state.matchHistory !== prevState.matchHistory) {
          debouncedHistorySave(state.matchHistory);
        }
      });

      return () => {
        cancelled = true;
        unsubState();
      };
    } else {
      // Not a Tauri Env, just load app instantly in browser
      setIsHydrated(true);
    }
  }, []);

  return isHydrated;
}

