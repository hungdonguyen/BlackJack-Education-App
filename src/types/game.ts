// ============================================
// Blackjack Game Type Definitions
// ============================================

import { Suit, Rank, HandStatus, GamePhase } from './enums';
export { Suit, Rank, HandStatus, GamePhase };
import { SettingsSlice } from '@/store/settingsSlice';
// Circular dependency workaround: define a minimal shape or use any, 
// OR move GameStore definition up (but it needs slices).
// For now, let's allow condition to access more than just basic GameState.
// We really want GameStore here but it's defined below.
// Let's use a placeholder that includes Settings.

/** A tutorial step definition */
export interface TutorialStep {
  id: number;
  message: string;
  condition: (state: GameStore) => boolean;
  targetElementId?: string;
  position?: 'top' | 'bottom' | 'center' | 'dealer' | 'player' | 'left' | 'right';
  requiresClick?: boolean;
  hideOn?: (state: GameStore) => boolean;
}

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
  doubleCount?: number;
  isSuitedBJ?: boolean;
  isZapped?: boolean;
  isSwitched?: boolean;
  isBurned?: boolean;
  /** The card that was discarded during the burn action */
  burnedCard?: Card;
  /** The cost of the burn action */
  burnWagerAmount?: number;
  /** The payout from the burn action bonus (Aces) */
  burnWagerPayout?: number;
  zappedCards?: Card[];
}

/** A seat / betting box at the table (1-5) */
export interface Seat {
  id: number;
  isActive: boolean;
  hands: Hand[];
  currentHandIndex: number;
  /** Multi Action Bonus side bet amount */
  sideBetAmount?: number;
  freeActionTokens?: number;
  hasSwitched?: boolean;
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
  simulator?: boolean;
  simulatorSummary?: {
    handCount: number;
    pnl: number;
    roi: number;
    winRate: number;
    maxDrawdown: number;
    bankrollStart?: number;
    bankrollEnd?: number;
    bettingSystem: string;
    playDecisionSource?: string;
    roomName?: string;
    seatCount?: number;
    systemVerdict?: { text: string; type: 'neutral' | 'success' | 'warning' | 'danger' }[];
    evPerHand?: number;
    longestLosingStreak?: number;
    longestLosingStreakStart?: number;
    longestLosingStreakEnd?: number;
  };
  simulatorChart?: {
    equityCurve: number[];
    drawdownCurve: number[];
  };
  simulatorHandHistory?: {
    handNumber: number;
    outcome: 'win' | 'loss' | 'push';
    bet: number;
    profit: number;
    bankrollAfter: number;
    dealerTotal: number;
    playerTotals: number[];
    blackjacks: number;
    actions: string[];
    dealerCards?: { suit: Suit; rank: Rank; value: number; isHidden?: boolean; }[];
    playerHands?: {
      seatNumber: number;
      handNumber: number;
      total: number;
      surrendered: boolean;
      cards: { suit: Suit; rank: Rank; value: number; isHidden?: boolean; }[];
      outcome?: 'win' | 'loss' | 'push' | 'playing';
      profit?: number;
      bet?: number;
      paidBet?: number;
      freeBet?: number;
      advisorNotes?: string[];
      isSuitedBJ?: boolean;
      isIberianBonus?: boolean;
      specialEvents?: {
        code:
          | 'DOUBLE_COST'
          | 'FREE_DOUBLE_GRANT'
          | 'SPLIT_COST'
          | 'FREE_SPLIT_GRANT'
          | 'BURN_COST'
          | 'ZAP_COST'
          | 'FREE_ZAP_GRANT';
        amount: number;
      }[];
      discardedCards?: Array<{
        card: { suit: Suit; rank: Rank; value: number; isHidden?: boolean; };
        reason: 'BURN' | 'ZAP';
      }>;
    }[];
  }[];
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
      doubleCount?: number;
      isFreeActionDouble?: boolean;
      isSuitedBJ?: boolean;
      cards: { suit: Suit; rank: Rank }[];
      zappedCards?: { suit: Suit; rank: Rank }[];
      isSwitched?: boolean;
      /** Whether the player used the Burn action on this hand (Fire Card 21) */
      isBurned?: boolean;
      /** The original 2nd card that was discarded in the burn */
      burnedCard?: { suit: Suit; rank: Rank };
      /** The burn wager paid (half of the initial bet) */
      burnWagerAmount?: number;
      /** Net payout from the burn wager (positive = won bonus, 0 = lost) */
      burnWagerPayout?: number;
    }[];
  }[];
  dealerCards: { suit: Suit; rank: Rank }[];
  bankrollBefore: number;
  bankrollAfter: number;
  dealerPush22?: boolean;
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
  lastCompletedMatch: MatchRecord | null;


// UI states
    hoveredAction: 'hit' | 'stand' | 'double' | 'split' | 'surrender' | 'zap' | 'switch' | 'burn' | 'rebet' | 'deal' | 'clear' | 'undo' | 'insurance-accept' | 'insurance-decline' | 'new-round' | 'finish-tutorial' | null;

    // UI Warnings
  insufficientFundsWarning: boolean;

  // Insurance
  insuranceBets: Record<number, number>; // seatId -> insurance bet amount

  // Modal UI state
  isStrategyModalOpen: boolean;
  isSettingsModalOpen: boolean;
  isControlsModalOpen: boolean;

  // Side bets (Free Action room)
  sideBets: Record<number, number>; // seatId -> side bet amount
  focusedSeatId: number | null;
}

/** All actions available on the game store */
export interface GameActions {
  // General UI
  setHoveredAction: (action: 'hit' | 'stand' | 'double' | 'split' | 'surrender' | 'zap' | 'switch' | 'burn' | 'rebet' | 'deal' | 'clear' | 'undo' | 'insurance-accept' | 'insurance-decline' | 'new-round' | 'finish-tutorial' | null) => void;

  // Shoe
  initializeShoe: () => void;

  // Seat management
  toggleSeat: (seatId: number) => void;
  setFocusedSeatId: (seatId: number | null) => void;

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
  zap: () => void;
  switchCards: () => void;
  burn: () => void;

  // Dealer
  dealerPlay: () => void;

  // Payout
  calculatePayouts: () => void;

  // Round management
  resetRound: () => void;

  // Utility
  addFunds: (amount: number) => void;
  setCurrentRoom: (roomId: string) => void;
  triggerInsufficientFunds: () => void;
  clearInsufficientFunds: () => void;

  // Advance turn: move to the next hand/seat
  advanceToNextHand: () => void;

  setBankroll: (amount: number) => void;

  // History
  setMatchHistory: (records: MatchRecord[]) => void;

  // Helpers
  canAfford: (amount: number) => boolean;

  // UI Modal state
  setStrategyModalOpen: (open: boolean) => void;
  setSettingsModalOpen: (open: boolean) => void;
  setControlsModalOpen: (open: boolean) => void;
}

export interface DailyClaimSlice {
  lastDailyClaim: number;
  dailyClaimStreak: number;
  dailyClaimCount: number;
  totalBetSinceLastClaim: number;
  insuranceClaimsToday: number;
  lastInsuranceReset: number;
  totalClaimedAmount: number;
  mysteryClaimCount: number;
  lastMysteryClaimAt: number;
  lastMysteryReward: number;
  claimPopupAmount: number;
  claimPopupNonce: number;
  claimedTutorialRewards: Record<string, boolean>;

  claimDaily: () => number;
  claimTimedReward: () => number;
  claimMysteryReward: () => number;
  claimRebate: () => number;
  claimInsurance: () => number;
  claimTutorialProgressReward: () => number;
  clearClaimPopup: () => void;
}

import { AchievementSlice } from '@/store/achievementSlice';
import { TutorialSlice } from '@/store/tutorialSlice';
import { SimulatorSlice } from './simulator';

/** Combined store type */
export type GameStore = GameState & GameActions & SettingsSlice & AchievementSlice & TutorialSlice & DailyClaimSlice & SimulatorSlice;
