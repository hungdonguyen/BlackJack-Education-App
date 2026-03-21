// ============================================
// Settings Slice — user preferences
// ============================================

import { StateCreator } from 'zustand';
import { GameStore } from '@/types/game';
import type { SwitchAdviceEngine } from '@/utils/exchangeSwitchAdvice';

export type DealerSpeed = 'normal' | 'fast';

export interface SettingsSlice {
  // State
  dealerSpeed: DealerSpeed;
  soundEnabled: boolean;
  musicEnabled: boolean;
  musicVolume: number; // 0.0 to 1.0
  soundVolume: number; // 0.0 to 1.0
  musicTrackOverride: string | null; // Path to manually selected track
  showHandAdvisor: boolean;
  showCardCounting: boolean;
  countSystem: 'Hi-Lo' | 'Katarina Walker';
  showSpecialCases: boolean;
  showSwitchAdvice: boolean;
  switchAdviceEngine: SwitchAdviceEngine;
  showStrategyModal: boolean;

  // Actions
  setDealerSpeed: (speed: DealerSpeed) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setMusicEnabled: (enabled: boolean) => void;
  setMusicVolume: (volume: number) => void;
  setSoundVolume: (volume: number) => void;
  setMusicTrackOverride: (trackPath: string | null) => void;
  setShowHandAdvisor: (show: boolean) => void;
  setShowCardCounting: (show: boolean) => void;
  setCountSystem: (sys: 'Hi-Lo' | 'Katarina Walker') => void;
  setShowSpecialCases: (show: boolean) => void;
  setShowSwitchAdvice: (show: boolean) => void;
  setSwitchAdviceEngine: (engine: SwitchAdviceEngine) => void;
  setShowStrategyModal: (show: boolean) => void;
}

/** Delay maps keyed by dealer speed */
export const SPEED_DELAYS = {
  normal: {
    dealCard: 800,    // ms between dealt cards
    postDeal: 500,    // ms after all cards dealt before BJ check
    dealerHit: 1000,  // ms between dealer draw cards
    prePayout: 1000,  // ms before payout phase
    flipCard: 800,    // ms to pause after revealing hole card
  },
  fast: {
    dealCard: 50,
    postDeal: 50,
    dealerHit: 50,
    prePayout: 50,
    flipCard: 50,
  },
} as const;

export const createSettingsSlice: StateCreator<GameStore, [], [], SettingsSlice> = (set) => ({
  dealerSpeed: 'normal',
  soundEnabled: true,
  musicEnabled: true,
  musicVolume: 0.5,
  soundVolume: 0.7,
  musicTrackOverride: null,
  showHandAdvisor: true,
  showCardCounting: true,
  countSystem: 'Katarina Walker',
  showSpecialCases: true,
  showSwitchAdvice: true,
  switchAdviceEngine: 'cindy_advanced',
  showStrategyModal: false,

  setDealerSpeed: (speed) => set({ dealerSpeed: speed }),
  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
  setMusicEnabled: (enabled) => set({ musicEnabled: enabled }),
  setMusicVolume: (volume) => set({ musicVolume: Math.max(0, Math.min(1, volume)) }),
  setSoundVolume: (volume) => set({ soundVolume: Math.max(0, Math.min(1, volume)) }),
  setMusicTrackOverride: (trackPath: string | null) => set({ musicTrackOverride: trackPath }),
  setShowHandAdvisor: (show: boolean) => set({ showHandAdvisor: show }),
  setShowCardCounting: (show: boolean) => set({ showCardCounting: show }),
  setCountSystem: (sys: 'Hi-Lo' | 'Katarina Walker') => set({ countSystem: sys }),
  setShowSpecialCases: (show: boolean) => set({ showSpecialCases: show }),
  setShowSwitchAdvice: (show: boolean) => set({ showSwitchAdvice: show }),
  setSwitchAdviceEngine: (engine: SwitchAdviceEngine) => set({ switchAdviceEngine: engine }),
  setShowStrategyModal: (show: boolean) => set({ showStrategyModal: show }),
});
