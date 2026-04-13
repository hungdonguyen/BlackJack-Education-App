import { MatchRecord } from './game';
import { Rank, Suit } from './enums';

export type SimulatorBettingSystem = 'flat' | 'martingale' | 'parlay' | '1326' | 'fibonacci' | 'd_alembert' | 'regression';

export type SimulatorPlayDecisionSource =
  | 'strategy_advice'
  | 'basic_strategy';

export type SimulatorRunStatus = 'idle' | 'running' | 'paused' | 'done';

export interface SimulatorBettingParams {
  martingaleMaxSteps?: number;
  parlayMaxSteps?: number;
  parlayMultiplier?: number;
  fibonacciMaxSteps?: number;
  dAlembertUnit?: number;
  regressionTargetSteps?: number;
}

export interface SimulatorConfig {
  roomId: string;
  seatCount: number;
  initialBankroll: number;
  baseUnit: number;
  targetMultiplier: number;
  stopLoss: number;
  maxHands: number;
  bettingSystem: SimulatorBettingSystem;
  bettingParams: SimulatorBettingParams;
  playDecisionSource: SimulatorPlayDecisionSource;
  exchangeSwitchEngine?: 'cindy_basic' | 'cindy_advanced' | 'arnold_snyder';
  delayMs?: number;
}

export interface SimulatorCardView {
  rank: Rank;
  suit: Suit;
  value: number;
  isHidden?: boolean;
}

export interface SimulatorSpecialEventView {
  code:
    | 'DOUBLE_COST'
    | 'FREE_DOUBLE_GRANT'
    | 'SPLIT_COST'
    | 'FREE_SPLIT_GRANT'
    | 'BURN_COST'
    | 'ZAP_COST'
    | 'FREE_ZAP_GRANT';
  amount: number;
}

export interface SimulatorHandView {
  seatNumber: number;
  handNumber: number;
  total: number;
  surrendered: boolean;
  cards: SimulatorCardView[];
  outcome?: 'win' | 'loss' | 'push' | 'playing';
  profit?: number;
  bet?: number;
  paidBet?: number;
  freeBet?: number;
  advisorNotes?: string[];
  isSuitedBJ?: boolean;
  isIberianBonus?: boolean;
  specialEvents?: SimulatorSpecialEventView[];
  discardedCards?: Array<{
    card: SimulatorCardView;
    reason: 'BURN' | 'ZAP';
  }>;
}

export interface SimulatorSummaryMetrics {
  winRate: number;
  evPerHand: number;
  profit: number;
  maxDrawdown: number;
  longestLosingStreak: number;
  averageBet: number;
  bankrollAtRiskPct: number;
  variancePerHand: number;
  profitFactor: number;
}

export interface SimulatorHandHistoryEntry {
  handNumber: number;
  outcome: 'win' | 'loss' | 'push';
  bet: number;
  profit: number;
  bankrollAfter: number;
  dealerTotal: number;
  playerTotals: number[];
  blackjacks: number;
  actions: string[];
  dealerCards: SimulatorCardView[];
  playerHands: SimulatorHandView[];
}

export interface SimulatorRunState {
  status: SimulatorRunStatus;
  currentHandIndex: number;
  bankrollCurrent: number;
  peak: number;
  trough: number;
  streakWin: number;
  streakLose: number;
  summary: SimulatorSummaryMetrics;
}

export interface SimulatorResult {
  endingBankroll: number;
  pnl: number;
  roi: number;
  handCount: number;
  reachedTarget: boolean;
  busted: boolean;
  winRate: number;
  pushRate: number;
  blackjackRate: number;
  maxDrawdown: number;
  volatilityProxy: number;
  riskOfRuinEstimate: number;
  averageBet: number;
  averageProfitPerHand: number;
  variancePerHand: number;
  profitFactor: number;
  bankrollAtRiskPct: number;
  longestLosingStreak: number;
  equityCurve: number[];
  drawdownCurve: number[];
  eventLog: string[];
  handHistory: SimulatorHandHistoryEntry[];
  simulatorHistoryRecord?: MatchRecord;
}

export interface SimulatorPreset {
  id: string;
  name: string;
  config: SimulatorConfig;
  createdAt: number;
  updatedAt: number;
}

export interface SimulatorSlice {
  simulatorConfig: SimulatorConfig;
  simulatorRunState: SimulatorRunState;
  simulatorResult: SimulatorResult | null;
  simulatorEquityCurve: number[];
  simulatorEventLog: string[];
  simulatorHistory: MatchRecord[];
  simulatorPresets: SimulatorPreset[];

  setSimulatorConfig: (patch: Partial<SimulatorConfig>) => void;
  startSimulatorRun: () => void;
  pauseSimulatorRun: () => void;
  resumeSimulatorRun: () => void;
  stopSimulatorRun: () => void;
  resetSimulatorRun: () => void;
  clearSimulatorHistory: () => void;
  deleteSimulatorHistoryRun: (runId: string) => void;
  saveSimulatorPreset: (name: string) => void;
  applySimulatorPreset: (presetId: string) => void;
  deleteSimulatorPreset: (presetId: string) => void;
  importSimulatorPreset: (name: string, config: SimulatorConfig) => void;
}

export interface SimulatorWorkerProgress {
  status: SimulatorRunStatus;
  currentHandIndex: number;
  bankrollCurrent: number;
  peak: number;
  trough: number;
  streakWin: number;
  streakLose: number;
  summary: SimulatorSummaryMetrics;
  equityCurveLastPoint: number;
}

export type SimulatorWorkerInput = 
  | { type: 'START'; config: SimulatorConfig }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'STOP' };

export type SimulatorWorkerOutput = 
  | { type: 'PROGRESS'; payload: SimulatorWorkerProgress }
  | { type: 'DONE'; payload: SimulatorResult }
  | { type: 'ERROR'; error: string };
