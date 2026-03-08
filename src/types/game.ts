// ============================================
// Blackjack Game Type Definitions
// ============================================

import { Suit, Rank, HandStatus, GamePhase } from './enums';
import { SettingsSlice } from '@/store/settingsSlice';

/** A single playing card */
export interface Card {
  suit: Suit;
  rank: Rank;
  /** Numeric value: face cards = 10, Ace = 11 (adjusted dynamically) */
  value: number;
  /** Whether the card is face-down (dealer's hole card) */
  isHidden: boolean;
}

/** The shoe — an array of cards from multiple decks */
export type Shoe = Card[];

/** A single hand of blackjack (a seat can have multiple hands after splitting) */
export interface Hand {
  id: string;
  cards: Card[];
  betAmount: number;
  status: HandStatus;
  isFreeActionDouble?: boolean;
  isFreeActionSplit?: boolean;
  freeActionBetAmount?: number;
  isAceSplit?: boolean;
  isSurrendered?: boolean;
  isSplit?: boolean;
  isDoubleDown?: boolean;
}

/** A seat / betting box at the table (1-5) */
export interface Seat {
  id: number;
  isActive: boolean;
  hands: Hand[];
  currentHandIndex: number;
  /** Multi Action Bonus side bet amount */
  sideBetAmount?: number;
  /** Free Action tokens collected this round */
  freeActionTokens?: number;
}

/** The dealer's hand */
export interface DealerHand {
  cards: Card[];
}

/** A record of a completed round for match history */
export interface MatchRecord {
  id: string;
  timestamp: number;
  roomId: string;
  seats: {
    seatId: number;
    insuranceCost?: number;
    insurancePayout?: number;
    sideBetAmount?: number;
    sideBetPayout?: number;
    freeActionTokens?: number;
    hands: {
      betAmount: number;
      freeActionBetAmount?: number;
      result: HandStatus;
      payout: number;
      isSplit?: boolean;
      isFreeActionSplit?: boolean;
      isDoubleDown?: boolean;
      isFreeActionDouble?: boolean;
      cards: { suit: Suit; rank: Rank }[];
    }[];
  }[];
  dealerCards: { suit: Suit; rank: Rank }[];
  bankrollBefore: number;
  bankrollAfter: number;
}

/** Hand value calculation result */
export interface HandValue {
  total: number;
  isSoft: boolean;
}

// ============================================
// Zustand Store Types
// ============================================

/** The complete game state shape */
export interface GameState {
  // Core
  bankroll: number;
  shoe: Shoe;
  gamePhase: GamePhase;
  currentRoom: string;

  // Table
  seats: Seat[];
  dealerHand: DealerHand;

  // Turn tracking
  currentSeatIndex: number;
  actionCounter: number;

  // Betting
  selectedChipValue: number;
  betHistory: { seatId: number; amount: number }[];
  previousBets: { seatId: number; amount: number }[];
  previousSideBets: Record<number, number>;

  // History
  matchHistory: MatchRecord[];

  // Daily claim
  lastDailyClaim: number;
  dailyClaimCount: number;

  // UI Warnings
  insufficientFundsWarning: boolean;

  // Insurance
  insuranceBets: Record<number, number>; // seatId -> insurance bet amount

  // Side bets (Free Action room)
  sideBets: Record<number, number>; // seatId -> side bet amount
}

/** All actions available on the game store */
export interface GameActions {
  // Shoe
  initializeShoe: () => void;

  // Seat management
  toggleSeat: (seatId: number) => void;

  // Betting phase
  placeBet: (seatId: number, amount: number) => void;
  undoBet: () => void;
  clearBet: (seatId: number) => void;
  clearAllBets: () => void;
  selectChip: (value: number) => void;
  rebet: () => void;

  // Side bets
  placeSideBet: (seatId: number, amount: number) => void;
  clearSideBet: (seatId: number) => void;

  // Game flow
  startDeal: () => void;
  hit: () => void;
  stand: () => void;
  doubleDown: () => void;
  split: () => void;
  surrender: () => void;
  acceptInsurance: () => void;
  declineInsurance: () => void;

  // Dealer
  dealerPlay: () => void;

  // Payout
  calculatePayouts: () => void;

  // Round management
  resetRound: () => void;

  // Utility
  addFunds: (amount: number) => void;
  claimDaily: () => boolean;
  setCurrentRoom: (roomId: string) => void;
  triggerInsufficientFunds: () => void;
  clearInsufficientFunds: () => void;

  // Advance turn: move to the next hand/seat
  advanceToNextHand: () => void;

  // Dev tools
  forceBlackjack: () => void;
  forceBust: () => void;
  forceSplitScenario: () => void;
  forceAceSplitScenario: () => void;
  forcePush: () => void;
  forceDealerBust: () => void;
  forceInsurance: () => void;
  forceDoubleSetup: () => void;
  setBankroll: (amount: number) => void;

  // History
  setMatchHistory: (records: MatchRecord[]) => void;
}

/** Combined store type */
export type GameStore = GameState & GameActions & SettingsSlice;
