// ============================================
// Settings Slice — user preferences
// ============================================

import { StateCreator } from 'zustand';
import { GameStore } from '@/types/game';

export type DealerSpeed = 'normal' | 'fast';

export interface SettingsSlice {
  // State
  dealerSpeed: DealerSpeed;
  soundEnabled: boolean;
  showHandAdvisor: boolean;
  showCardCounting: boolean;

  // Actions
  setDealerSpeed: (speed: DealerSpeed) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setShowHandAdvisor: (show: boolean) => void;
  setShowCardCounting: (show: boolean) => void;
}

/** Delay maps keyed by dealer speed */
export const SPEED_DELAYS = {
  normal: {
    dealCard: 800,    // ms between dealt cards
    postDeal: 500,    // ms after all cards dealt before BJ check
    dealerHit: 1000,  // ms between dealer draw cards
    prePayout: 1000,  // ms before payout phase
  },
  fast: {
    dealCard: 100,
    postDeal: 50,
    dealerHit: 150,
    prePayout: 150,
  },
} as const;

export const createSettingsSlice: StateCreator<GameStore, [], [], SettingsSlice> = (set) => ({
  dealerSpeed: 'normal',
  soundEnabled: true,
  showHandAdvisor: true,
  showCardCounting: true,

  setDealerSpeed: (speed) => set({ dealerSpeed: speed }),
  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
  setShowHandAdvisor: (show) => set({ showHandAdvisor: show }),
  setShowCardCounting: (show) => set({ showCardCounting: show }),
});
