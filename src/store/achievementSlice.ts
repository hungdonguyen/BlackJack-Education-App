// ============================================
// Achievement Slice — Zustand slice for achievement tracking
// ============================================

import { StateCreator } from 'zustand';
import { GameStore, MatchRecord } from '@/types/game';
import { checkNewAchievements, updateProgress } from '@/utils/achievementChecker';
import { AchievementProgress, INITIAL_PROGRESS } from '@/types/achievements';

export interface AchievementSlice {
  // State
  unlockedAchievements: Record<string, number>; // achievementId -> timestamp
  achievementProgress: AchievementProgress;
  /** Queue of achievement IDs to show as toast notifications */
  achievementToastQueue: string[];

  // Actions
  checkAchievements: (match: MatchRecord) => void;
  syncAchievements: () => void;
  dismissAchievementToast: () => void;
}

export const createAchievementSlice: StateCreator<GameStore, [], [], AchievementSlice> = (set, get) => ({
  unlockedAchievements: {},
  achievementProgress: { ...INITIAL_PROGRESS },
  achievementToastQueue: [],

  checkAchievements: (match: MatchRecord) => {
    const state = get();
    const bankroll = state.bankroll;
    const dailyClaimCount = state.dailyClaimCount;

    // First update progress counters
    const updatedProgress = updateProgress(
      state.achievementProgress,
      match,
      bankroll,
    );

    // Then check for newly unlocked achievements
    const newlyUnlocked = checkNewAchievements(
      state.unlockedAchievements,
      updatedProgress,
      match,
      bankroll,
      dailyClaimCount,
    );

    set({ achievementProgress: updatedProgress });
    
    if (newlyUnlocked.length > 0) {
      const now = Date.now();
      set((s) => ({
        unlockedAchievements: {
          ...s.unlockedAchievements,
          ...Object.fromEntries(newlyUnlocked.map(id => [id, now]))
        },
        achievementToastQueue: [...s.achievementToastQueue, ...newlyUnlocked],
      }));
    }
  },

  syncAchievements: () => {
    const state = get();
    const bankroll = state.bankroll;
    const dailyClaimCount = state.dailyClaimCount;

    // Dummy match for state-only checks
    const dummyMatch: MatchRecord = {
      id: 'sync',
      timestamp: Date.now(),
      roomId: state.currentRoom || 'classic',
      seats: [],
      dealerCards: [],
      bankrollBefore: bankroll,
      bankrollAfter: bankroll
    };

    const newlyUnlocked = checkNewAchievements(
      state.unlockedAchievements,
      state.achievementProgress,
      dummyMatch,
      bankroll,
      dailyClaimCount,
    );

    if (newlyUnlocked.length > 0) {
      const now = Date.now();
      set((s) => ({
        unlockedAchievements: {
          ...s.unlockedAchievements,
          ...Object.fromEntries(newlyUnlocked.map(id => [id, now]))
        },
        achievementToastQueue: [...s.achievementToastQueue, ...newlyUnlocked],
      }));
    }
  },

  dismissAchievementToast: () => {
    set((s) => ({
      achievementToastQueue: s.achievementToastQueue.slice(1),
    }));
  },
});
