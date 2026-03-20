// ============================================
// Tutorial Slice — specialized logic for tutorial flow
// ============================================

import { StateCreator } from 'zustand';
import { GameStore, Card } from '@/types/game';
import { BEGINNER_TUTORIAL_LESSONS, DOUBLE_TUTORIAL_LESSONS, STRATEGY_TUTORIAL_LESSONS, TutorialLesson } from '@/utils/tutorialData';
import { createEmptyHand } from './bettingSlice';
import { GamePhase } from '@/types/enums';

const getLessons = (roomId: string): TutorialLesson[] => {
  if (roomId === 'tutorial_double') return DOUBLE_TUTORIAL_LESSONS;
  if (roomId === 'tutorial_strategy') return STRATEGY_TUTORIAL_LESSONS;
  return BEGINNER_TUTORIAL_LESSONS;
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
    // Only enable Hand Advisor for Strategy Tutorial (Room 3)
    const isStrategyTutorial = roomToUse === 'tutorial_strategy';
    const isTutorial = roomToUse.startsWith('tutorial_');
    
    const settingsOverrides = isTutorial ? {
        showHandAdvisor: isStrategyTutorial, // true for strategy, false for others
        showCardCounting: false,             // always false for tutorials
    } : {};

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
