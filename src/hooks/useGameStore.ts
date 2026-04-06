// ============================================
// Store Hook
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { useGameStoreBase } from '@/store/gameStore';
import { GameStore } from '@/types/game';
import { DealerSpeed } from '@/store/settingsSlice';
import {
  isTauriEnv,
  readSaveFile,
  writeSaveFile,
  loadHistory,
  writeHistoryFile,
  loadSimulatorHistory,
  writeSimulatorHistoryFile,
  hasHistoryFile,
  hasSimulatorHistoryFile,
} from '@/utils/saveFile';

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
  const [isHydrated, setIsHydrated] = useState(() => !isTauriEnv());

  useEffect(() => {
    let cancelled = false;
    let readyForFileSync = false;

    // ── Tauri mode: read save.json directly, no dependency on Zustand hydration ──
    if (isTauriEnv()) {
      Promise.all([
        readSaveFile(),
        loadHistory(),
        loadSimulatorHistory(),
        hasHistoryFile(),
        hasSimulatorHistoryFile(),
      ])
        .then(([content, history, simulatorHistoryFromFile, hasHistoryOnDisk, hasSimulatorHistoryOnDisk]) => {
          if (cancelled) return;
          const patch: Partial<GameStore> = {};

          const normalHistory = history.filter((record) => !record.simulator);
          const simulatorHistoryFromLegacy = history.filter((record) => Boolean(record.simulator));

          const simulatorHistory = simulatorHistoryFromFile.length > 0
            ? simulatorHistoryFromFile
            : simulatorHistoryFromLegacy;

          if (normalHistory.length > 0) {
            patch.matchHistory = normalHistory;
          } else if (!hasHistoryOnDisk && useGameStoreBase.getState().matchHistory.length > 0) {
            writeHistoryFile(useGameStoreBase.getState().matchHistory);
          }

          if (simulatorHistory.length > 0) {
            patch.simulatorHistory = simulatorHistory;
          } else if (!hasSimulatorHistoryOnDisk && useGameStoreBase.getState().simulatorHistory.length > 0) {
            writeSimulatorHistoryFile(useGameStoreBase.getState().simulatorHistory);
          }

          // One-time migration: if simulator history still lives in old history.json, split files.
          if (simulatorHistoryFromLegacy.length > 0 && simulatorHistoryFromFile.length === 0) {
            void writeSimulatorHistoryFile(simulatorHistoryFromLegacy);
            void writeHistoryFile(normalHistory);
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
                if (typeof parsed.state.dailyClaimStreak === 'number')
                  patch.dailyClaimStreak = parsed.state.dailyClaimStreak;
                if (typeof parsed.state.mysteryClaimCount === 'number')
                  patch.mysteryClaimCount = parsed.state.mysteryClaimCount;
                if (typeof parsed.state.lastMysteryClaimAt === 'number')
                  patch.lastMysteryClaimAt = parsed.state.lastMysteryClaimAt;
                if (typeof parsed.state.lastMysteryReward === 'number')
                  patch.lastMysteryReward = parsed.state.lastMysteryReward;
                if (parsed.state.claimedTutorialRewards && typeof parsed.state.claimedTutorialRewards === 'object')
                  patch.claimedTutorialRewards = parsed.state.claimedTutorialRewards;
                // Settings
                if (parsed.state.dealerSpeed === 'normal' || parsed.state.dealerSpeed === 'fast')
                  patch.dealerSpeed = parsed.state.dealerSpeed as DealerSpeed;
                if (typeof parsed.state.soundEnabled === 'boolean')
                  patch.soundEnabled = parsed.state.soundEnabled;
                if (typeof parsed.state.musicEnabled === 'boolean')
                  patch.musicEnabled = parsed.state.musicEnabled;
                if (typeof parsed.state.soundVolume === 'number')
                  patch.soundVolume = parsed.state.soundVolume;
                if (typeof parsed.state.musicVolume === 'number')
                  patch.musicVolume = parsed.state.musicVolume;
                if (typeof parsed.state.musicTrackOverride === 'string' || parsed.state.musicTrackOverride === null)
                  patch.musicTrackOverride = parsed.state.musicTrackOverride;
                if (typeof parsed.state.showHandAdvisor === 'boolean')
                  patch.showHandAdvisor = parsed.state.showHandAdvisor;
                if (typeof parsed.state.showCardCounting === 'boolean')
                  patch.showCardCounting = parsed.state.showCardCounting;
                if (parsed.state.countSystem === 'Hi-Lo' || parsed.state.countSystem === 'Katarina Walker')
                  patch.countSystem = parsed.state.countSystem;
                
                // Achievements
                if (parsed.state.unlockedAchievements)
                  patch.unlockedAchievements = parsed.state.unlockedAchievements;
                if (parsed.state.achievementProgress)
                  patch.achievementProgress = parsed.state.achievementProgress;
                if (parsed.state.completedTutorials && typeof parsed.state.completedTutorials === 'object')
                  patch.completedTutorials = parsed.state.completedTutorials;
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
          readyForFileSync = true;
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
            dailyClaimStreak: state.dailyClaimStreak,
            dailyClaimCount: state.dailyClaimCount,
            mysteryClaimCount: state.mysteryClaimCount,
            lastMysteryClaimAt: state.lastMysteryClaimAt,
            lastMysteryReward: state.lastMysteryReward,
            claimedTutorialRewards: state.claimedTutorialRewards,
            dealerSpeed: state.dealerSpeed,
            soundEnabled: state.soundEnabled,
            musicEnabled: state.musicEnabled,
            soundVolume: state.soundVolume,
            musicVolume: state.musicVolume,
            musicTrackOverride: state.musicTrackOverride,
            showHandAdvisor: state.showHandAdvisor,
            showCardCounting: state.showCardCounting,
            countSystem: state.countSystem,
            unlockedAchievements: state.unlockedAchievements,
            achievementProgress: state.achievementProgress,
            completedTutorials: state.completedTutorials,
          };
          base.version = 0;
          await writeSaveFile(JSON.stringify(base));
        } catch {
          // fallback: write without merge
          await writeSaveFile(
            JSON.stringify({
              state: {
                bankroll: state.bankroll,
                lastDailyClaim: state.lastDailyClaim,
                dailyClaimStreak: state.dailyClaimStreak,
                dailyClaimCount: state.dailyClaimCount,
                mysteryClaimCount: state.mysteryClaimCount,
                lastMysteryClaimAt: state.lastMysteryClaimAt,
                lastMysteryReward: state.lastMysteryReward,
                claimedTutorialRewards: state.claimedTutorialRewards,
                dealerSpeed: state.dealerSpeed,
                soundEnabled: state.soundEnabled,
                musicEnabled: state.musicEnabled,
                soundVolume: state.soundVolume,
                musicVolume: state.musicVolume,
                musicTrackOverride: state.musicTrackOverride,
                showHandAdvisor: state.showHandAdvisor,
                showCardCounting: state.showCardCounting,
                countSystem: state.countSystem,
                unlockedAchievements: state.unlockedAchievements,
                achievementProgress: state.achievementProgress,
                completedTutorials: state.completedTutorials,
              },
              version: 0,
            })
          );
        }
      };

      const debouncedSave = debounce(saveState, 500);

      // Subscribe: write to save.json whenever bankroll/claims change
      const unsubState = useGameStoreBase.subscribe((state, prevState) => {
        if (
          state.bankroll !== prevState.bankroll ||
          state.lastDailyClaim !== prevState.lastDailyClaim ||
          state.dailyClaimStreak !== prevState.dailyClaimStreak ||
          state.dailyClaimCount !== prevState.dailyClaimCount ||
          state.mysteryClaimCount !== prevState.mysteryClaimCount ||
          state.lastMysteryClaimAt !== prevState.lastMysteryClaimAt ||
          state.lastMysteryReward !== prevState.lastMysteryReward ||
          state.claimedTutorialRewards !== prevState.claimedTutorialRewards ||
          state.dealerSpeed !== prevState.dealerSpeed ||
          state.soundEnabled !== prevState.soundEnabled ||
          state.musicEnabled !== prevState.musicEnabled ||
          state.soundVolume !== prevState.soundVolume ||
          state.musicVolume !== prevState.musicVolume ||
          state.musicTrackOverride !== prevState.musicTrackOverride ||
          state.showHandAdvisor !== prevState.showHandAdvisor ||
          state.showCardCounting !== prevState.showCardCounting ||
          state.countSystem !== prevState.countSystem ||
          state.unlockedAchievements !== prevState.unlockedAchievements ||
          state.achievementProgress !== prevState.achievementProgress ||
          state.completedTutorials !== prevState.completedTutorials
        ) {
          debouncedSave(state);
        }

        // Delay history sync until initial Tauri file load completes,
        // so persisted browser snapshots cannot overwrite local desktop files.
        if (!readyForFileSync) {
          return;
        }

        if (state.matchHistory !== prevState.matchHistory) {
          writeHistoryFile(state.matchHistory);
        }

        if (state.simulatorHistory !== prevState.simulatorHistory) {
          writeSimulatorHistoryFile(state.simulatorHistory);
        }
      });

      return () => {
        cancelled = true;
        unsubState();
      };
    }
  }, []);

  return isHydrated;
}

