// ============================================
// Tutorial Slice — specialized logic for tutorial flow
// ============================================

import { StateCreator } from 'zustand';
import { GameStore, Card } from '@/types/game';
import { BEGINNER_TUTORIAL_LESSONS } from '@/utils/tutorialData';
import { createEmptyHand } from './bettingSlice';
import { GamePhase } from '@/types/enums';

export interface TutorialSlice {
  // State
  tutorialStep: number;
  tutorialRound: number;
  forcedShoe: Card[] | null;
  tutorialCompleted: boolean;
  tutorialBalance: number;
  tutorialWarning: string | null;

  // Actions
  resetTutorialProgress: () => void;
  advanceTutorialRound: () => void;
  setTutorialStep: (step: number) => void;
  showTutorialWarning: (message: string) => void;
  hideTutorialWarning: () => void;
}

export const createTutorialSlice: StateCreator<GameStore, [], [], TutorialSlice> = (set, get) => ({
  tutorialStep: 0,
  tutorialRound: 0,
  forcedShoe: null,
  tutorialCompleted: false,
  tutorialBalance: 1000,
  tutorialWarning: null as string | null,

  resetTutorialProgress: () => {
    const lesson0 = BEGINNER_TUTORIAL_LESSONS[0];
    const state = get();
    set({
      // Tutorial-specific
      tutorialRound: 0,
      tutorialStep: 0,
      tutorialBalance: 1000,
      tutorialCompleted: false,
      forcedShoe: lesson0 ? [...lesson0.forcedCards] : null,
      // Full game state reset
      gamePhase: GamePhase.BETTING,
      dealerHand: { cards: [] },
      betHistory: [],
      insuranceBets: {},
      sideBets: {},
      seats: state.seats.map((seat) => ({
        ...seat,
        isActive: seat.id === 3, // Only seat 3 active in tutorial
        hands: [createEmptyHand(seat.id, 0)],
        currentHandIndex: 0,
        freeActionTokens: 0,
        sideBetAmount: 0,
        hasSwitched: false,
      })),
    });
  },

  advanceTutorialRound: () => {
    const state = get();
    const nextRound = state.tutorialRound + 1;
    const isCompleted = nextRound >= BEGINNER_TUTORIAL_LESSONS.length;

    let nextForcedShoe: Card[] | null = null;
    if (!isCompleted) {
      const lesson = BEGINNER_TUTORIAL_LESSONS[nextRound];
      if (lesson) {
        nextForcedShoe = [...lesson.forcedCards];
      }
    }

    set({
      tutorialRound: nextRound,
      tutorialCompleted: isCompleted,
      forcedShoe: nextForcedShoe,
      tutorialStep: 0,
    });
  },

  setTutorialStep: (step: number) => {
    set({ tutorialStep: step, tutorialWarning: null });
  },

  showTutorialWarning: (message: string) => {
    set({ tutorialWarning: message });
  },

  hideTutorialWarning: () => {
    set({ tutorialWarning: null });
  },
});
