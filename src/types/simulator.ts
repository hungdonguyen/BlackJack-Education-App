import { MatchRecord } from './game';
import { Rank, Suit } from './enums';

export type SimulatorBettingSystem = 'flat' | 'martingale' | 'parlay' | '1326';

export type SimulatorPlayDecisionSource =
  | 'strategy_advice'
  | 'basic_strategy'
  | 'custom_profile';

export type SimulatorRunStatus = 'idle' | 'running' | 'paused' | 'done';

export interface SimulatorBettingParams {
  martingaleMaxSteps?: number;
  parlayMaxSteps?: number;
  parlayMultiplier?: number;
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
  customRiskLevel: 'conservative' | 'balanced' | 'aggressive';
}

export interface SimulatorCardView {
  rank: Rank;
  suit: Suit;
  value: number;
}

export interface SimulatorHandView {
  seatNumber: number;
  handNumber: number;
  total: number;
  surrendered: boolean;
  cards: SimulatorCardView[];
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
  resetSimulatorRun: () => void;
  saveSimulatorPreset: (name: string) => void;
  applySimulatorPreset: (presetId: string) => void;
  deleteSimulatorPreset: (presetId: string) => void;
  importSimulatorPreset: (name: string, config: SimulatorConfig) => void;
}
