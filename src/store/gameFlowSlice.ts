// ============================================
// Game Flow Slice — dealing, player actions, dealer logic, payouts
// ============================================

import { StateCreator } from 'zustand';
import { GameStore, Card, MatchRecord } from '@/types/game';
import { GamePhase } from '@/types/enums';
import { getRoomConfig } from '@/utils/rooms';
import { createEmptyHand } from './bettingSlice';
import { initializeShoeLogic, startDealLogic, resetRoundLogic } from './logic/dealing';
import { 
  hitLogic, 
  standLogic, 
  doubleDownLogic, 
  splitLogic, 
  surrenderLogic, 
  zapLogic, 
  burnLogic, 
  switchCardsLogic,
  advanceToNextHandLogic,
  acceptInsuranceLogic,
  declineInsuranceLogic
} from './logic/playerActions';
import { dealerPlayLogic } from './logic/dealerLogic';
import { calculatePayoutsLogic } from './logic/payouts';

export interface GameFlowSlice {
  // State
  shoe: Card[];
  savedShoes: Record<string, Card[]>;
  gamePhase: GamePhase;
  hoveredAction: 'switch' | 'burn' | 'zap' | null;
  seats: GameStore['seats'];
  dealerHand: GameStore['dealerHand'];
  currentSeatIndex: number;
  matchHistory: MatchRecord[];
  insuranceBets: Record<number, number>;
  actionCounter: number;
  
  // Actions
  setHoveredAction: (action: 'switch' | 'burn' | 'zap' | null) => void;
  initializeShoe: () => void;
  startDeal: () => void;
  hit: () => void;
  stand: () => void;
  doubleDown: () => void;
  split: () => void;
  surrender: () => void;
  acceptInsurance: () => void;
  declineInsurance: () => void;
  advanceToNextHand: () => void;
  dealerPlay: () => Promise<void>;
  calculatePayouts: () => void;
  resetRound: () => void;
  zap: () => void;
  switchCards: () => void;
  burn: () => void;

  // History
  setMatchHistory: (records: MatchRecord[]) => void;

  // Utilities
  canAfford: (amount: number) => boolean;
}

export const createGameFlowSlice: StateCreator<GameStore, [], [], GameFlowSlice> = (set, get) => ({
  shoe: [],
  savedShoes: {},
  gamePhase: GamePhase.BETTING,
  hoveredAction: null,
  seats: Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    isActive: i === 2, // Middle seat active by default
    hands: [createEmptyHand(i + 1, 0)],
    currentHandIndex: 0,
  })),
  dealerHand: { cards: [] },
  currentSeatIndex: 0,
  matchHistory: [],
  insuranceBets: {},
  actionCounter: 0,

  canAfford: (amount: number) => {
    const state = get();
    const isTutorial = getRoomConfig(state.currentRoom).isTutorial;
    return (isTutorial ? (state.tutorialBalance ?? 0) : state.bankroll) >= amount;
  },

  setHoveredAction: (action) => set({ hoveredAction: action }),

  initializeShoe: () => initializeShoeLogic(set, get),
  startDeal: () => startDealLogic(set, get),
  
  hit: () => hitLogic(set, get),
  stand: () => standLogic(set, get),
  doubleDown: () => doubleDownLogic(set, get),
  split: () => splitLogic(set, get),
  surrender: () => surrenderLogic(set, get),
  zap: () => zapLogic(set, get),
  burn: () => burnLogic(set, get),
  switchCards: () => switchCardsLogic(set, get),
  
  advanceToNextHand: () => advanceToNextHandLogic(set, get),
  dealerPlay: () => dealerPlayLogic(set, get),
  calculatePayouts: () => calculatePayoutsLogic(set, get),
  resetRound: () => resetRoundLogic(set, get),

  acceptInsurance: () => acceptInsuranceLogic(set, get),
  declineInsurance: () => declineInsuranceLogic(set, get),

  setMatchHistory: (records: MatchRecord[]) => {
    set({ matchHistory: records });
  },
});