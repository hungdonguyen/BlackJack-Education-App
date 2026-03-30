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
      partialize: (state) => ({
        bankroll: state.bankroll,
        matchHistory: state.matchHistory,
        simulatorHistory: state.simulatorHistory,
        lastDailyClaim: state.lastDailyClaim,
        dailyClaimCount: state.dailyClaimCount,
        totalBetSinceLastClaim: state.totalBetSinceLastClaim,
        insuranceClaimsToday: state.insuranceClaimsToday,
        lastInsuranceReset: state.lastInsuranceReset,
        totalClaimedAmount: state.totalClaimedAmount,
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
        // Achievements
        unlockedAchievements: state.unlockedAchievements,
        achievementProgress: state.achievementProgress,
        // Simulator config
        simulatorConfig: state.simulatorConfig,
        simulatorPresets: state.simulatorPresets,
      }),
    }
  )
);
