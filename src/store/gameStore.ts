// ============================================
// Main Game Store — combines slices with Zustand persist middleware
// ============================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameStore } from '@/types/game';
import { createBettingSlice } from './bettingSlice';
import { createGameFlowSlice } from './gameFlowSlice';
import { createSettingsSlice } from './settingsSlice';
import { createDevToolsSlice } from './devToolsSlice';
import { createAchievementSlice } from './achievementSlice';
import { createTutorialSlice } from './tutorialSlice';
import { createDailyClaimSlice } from './dailyClaimSlice';
import { createSimulatorSlice } from './simulatorSlice';

const WEB_MATCH_HISTORY_LIMIT = 120;
const WEB_SIMULATOR_HISTORY_LIMIT = 80;
const WEB_SIMULATOR_CHART_POINTS_LIMIT = 240;

function isTauriRuntime(): boolean {
  if (typeof window === 'undefined') return false;
  const hasTauriGlobals = '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
  const hasTauriUserAgent = typeof navigator !== 'undefined' && navigator.userAgent.includes('Tauri');
  return hasTauriGlobals || hasTauriUserAgent;
}

function trimSimulatorChart<T extends { simulatorChart?: { equityCurve: number[]; drawdownCurve: number[] } }>(record: T): T {
  if (!record.simulatorChart) return record;
  return {
    ...record,
    simulatorChart: {
      equityCurve: record.simulatorChart.equityCurve.slice(-WEB_SIMULATOR_CHART_POINTS_LIMIT),
      drawdownCurve: record.simulatorChart.drawdownCurve.slice(-WEB_SIMULATOR_CHART_POINTS_LIMIT),
    },
  };
}

export const useGameStoreBase = create<GameStore>()(
  persist(
    (...a) => ({
      ...createBettingSlice(...a),
      ...createGameFlowSlice(...a),
      ...createSettingsSlice(...a),
      ...createDevToolsSlice(...a),
      ...createAchievementSlice(...a),
      ...createTutorialSlice(...a),
      ...createDailyClaimSlice(...a),
      ...createSimulatorSlice(...a),
    }),
    {
      name: 'blackjack-storage',
      // Only persist specific state to avoid bloat and issues with complex objects
      partialize: (state) => {
        const tauri = isTauriRuntime();
        const persistedMatchHistory = tauri
          ? state.matchHistory
          : state.matchHistory.slice(-WEB_MATCH_HISTORY_LIMIT).map(trimSimulatorChart);
        const persistedSimulatorHistory = (tauri
          ? state.simulatorHistory
          : state.simulatorHistory.slice(-WEB_SIMULATOR_HISTORY_LIMIT)
        ).map((h) => trimSimulatorChart({ ...h, simulatorHandHistory: [] }));

        return {
        bankroll: state.bankroll,
        matchHistory: persistedMatchHistory,
        simulatorHistory: persistedSimulatorHistory,
        lastDailyClaim: state.lastDailyClaim,
        dailyClaimStreak: state.dailyClaimStreak,
        dailyClaimCount: state.dailyClaimCount,
        totalBetSinceLastClaim: state.totalBetSinceLastClaim,
        insuranceClaimsToday: state.insuranceClaimsToday,
        lastInsuranceReset: state.lastInsuranceReset,
        totalClaimedAmount: state.totalClaimedAmount,
        mysteryClaimCount: state.mysteryClaimCount,
        lastMysteryClaimAt: state.lastMysteryClaimAt,
        lastMysteryReward: state.lastMysteryReward,
        claimedTutorialRewards: state.claimedTutorialRewards,
        // Settings
        dealerSpeed: state.dealerSpeed,
        soundEnabled: state.soundEnabled,
        musicEnabled: state.musicEnabled,
        soundVolume: state.soundVolume,
        musicVolume: state.musicVolume,
        musicTrackOverride: state.musicTrackOverride,
        showHandAdvisor: state.showHandAdvisor,
        showCardCounting: state.showCardCounting,
        countSystem: state.countSystem,
        showSpecialCases: state.showSpecialCases,
        showSwitchAdvice: state.showSwitchAdvice,
        switchAdviceEngine: state.switchAdviceEngine,
        keyboardMapping: state.keyboardMapping,
        gamepadMapping: state.gamepadMapping,
        purchasedDecks: state.purchasedDecks,
        activeDeck: state.activeDeck,
        // Achievements
        unlockedAchievements: state.unlockedAchievements,
        achievementProgress: state.achievementProgress,
        // Tutorial progress
        completedTutorials: state.completedTutorials,
        // Simulator config
        simulatorConfig: state.simulatorConfig,
        simulatorPresets: state.simulatorPresets,
      };
      },
    }
  )
);
