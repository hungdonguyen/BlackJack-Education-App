// ============================================
// Settings Slice — user preferences
// ============================================

import { StateCreator } from 'zustand';
import { GameStore } from '@/types/game';
import type { SwitchAdviceEngine } from '@/utils/exchangeSwitchAdvice';

export type DealerSpeed = 'normal' | 'fast';

export type GamepadMapping = Record<string, number>;
export type KeyboardMapping = Record<string, string>;

export const DEFAULT_KEYBOARD_MAPPING: KeyboardMapping = {
  hit: 'h',
  stand: 's',
  double: 'd',
  split: 'p',
  surrender: 'r',
  zap: 'q',
  switch: 'q',
  burn: 'q',
  deal: 'Enter',
  undo: 'Backspace',
  clear: 'Delete',
  rebet: 't',
};

export const DEFAULT_GAMEPAD_MAPPING: GamepadMapping = {
  hit: 0,       // A
  stand: 1,     // B
  double: 2,    // X
  split: 3,     // Y
  surrender: 6, // LT
  zap: 4,       // LB
  switch: 5,    // RB
  burn: 7,      // RT
  deal: 5,      // RB
  undo: 4,      // LB
  rebet: 7,     // RT
  clear: 8,     // BACK (adding default for clear)
};

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
  keyboardMapping: KeyboardMapping;
  gamepadMapping: GamepadMapping;
  
  // Store & Decks
  purchasedDecks: string[];
  activeDeck: string;

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
  setKeyboardMapping: (action: string, key: string) => void;
  setGamepadMapping: (action: string, button: number) => void;
  resetControlsToDefault: () => void;
  setActiveDeck: (deckId: string) => void;
  purchaseDeck: (deckId: string, cost: number) => void;
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
    dealCard: 300,
    postDeal: 300,
    dealerHit: 500,
    prePayout: 500,
    flipCard: 300,
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
  keyboardMapping: DEFAULT_KEYBOARD_MAPPING,
  gamepadMapping: DEFAULT_GAMEPAD_MAPPING,
  purchasedDecks: ['default'],
  activeDeck: 'default',

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
  setKeyboardMapping: (action, key) => set((state) => ({
    keyboardMapping: { ...state.keyboardMapping, [action]: key }
  })),
  setGamepadMapping: (action, button) => set((state) => ({
    gamepadMapping: { ...state.gamepadMapping, [action]: button }
  })),
  resetControlsToDefault: () => set({
    keyboardMapping: DEFAULT_KEYBOARD_MAPPING,
    gamepadMapping: DEFAULT_GAMEPAD_MAPPING,
  }),
  setActiveDeck: (deckId) => set({ activeDeck: deckId }),
  purchaseDeck: (deckId, cost) => set((s) => ({
    bankroll: s.bankroll - cost,
    purchasedDecks: [...s.purchasedDecks, deckId]
  })),
});
