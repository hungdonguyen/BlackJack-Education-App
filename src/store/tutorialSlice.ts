// ============================================
// Tutorial Slice — specialized logic for tutorial flow
// ============================================

import { StateCreator } from 'zustand';
import { GameStore, Card } from '@/types/game';
import {
  BEGINNER_TUTORIAL_LESSONS,
  DOUBLE_TUTORIAL_LESSONS,
  STRATEGY_TUTORIAL_LESSONS,
  COUNTING_TUTORIAL_LESSONS,
  PAIR_SPLITTING_TUTORIAL_LESSONS,
  MULTI_HAND_TUTORIAL_LESSONS,
  TutorialLesson
} from '@/utils/tutorials';
import { createEmptyHand } from './bettingSlice';
import { GamePhase } from '@/types/enums';

export const getLessons = (roomId: string): TutorialLesson[] => {
  switch (roomId) {
    case 'tutorial_double':    return DOUBLE_TUTORIAL_LESSONS;
    case 'tutorial_strategy':  return STRATEGY_TUTORIAL_LESSONS;
    case 'tutorial_counting':  return COUNTING_TUTORIAL_LESSONS;
    case 'tutorial_splitting': return PAIR_SPLITTING_TUTORIAL_LESSONS;
    case 'tutorial_multihand': return MULTI_HAND_TUTORIAL_LESSONS;
    default:                   return BEGINNER_TUTORIAL_LESSONS;
  }
};

export interface TutorialSlice {
  // State
  tutorialStep: number;
  tutorialRound: number;
  forcedShoe: Card[] | null;
  tutorialCompleted: boolean;
  tutorialBalance: number;
  tutorialWarning: string | null;

  // Actions
  resetTutorialProgress: (roomId?: string) => void;
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

  resetTutorialProgress: (roomOverride?: string) => {
    const state = get();
    const roomToUse = roomOverride || state.currentRoom;
    const lessons = getLessons(roomToUse);
    const lesson0 = lessons[0];

    // Force settings for Tutorials
    const isStrategyTutorial  = roomToUse === 'tutorial_strategy';
    const isCountingTutorial  = roomToUse === 'tutorial_counting';
    const isSplittingTutorial = roomToUse === 'tutorial_splitting';
    const isInsuranceTutorial = roomToUse === 'tutorial_multihand';
    const isTutorial = roomToUse && roomToUse.startsWith('tutorial_');
    
    const settingsOverrides = isTutorial ? {
        showHandAdvisor:  isStrategyTutorial || isCountingTutorial || isSplittingTutorial || isInsuranceTutorial,
        showCardCounting: isCountingTutorial || isSplittingTutorial || isInsuranceTutorial,
        showSpecialCases: isCountingTutorial,
    } : {};

    set({
      // Tutorial-specific
      tutorialRound: 0,
      tutorialStep: 0,
      tutorialBalance: 1000,
      tutorialCompleted: false,
      tutorialWarning: null,
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
      ...settingsOverrides,
    });
  },

  advanceTutorialRound: () => {
    const state = get();
    const lessons = getLessons(state.currentRoom);
    const nextRound = state.tutorialRound + 1;
    const isCompleted = nextRound >= lessons.length;

    let nextForcedShoe: Card[] | null = null;
    if (!isCompleted) {
      const lesson = lessons[nextRound];
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
