import { StateCreator } from 'zustand';
import { GameStore } from '@/types/game';
import type { SimulatorConfig, SimulatorRunState, SimulatorSlice } from '@/types/simulator';
import { createSimulatorEngine, type SimulatorEngine } from '@/utils/simulator/engine';

const FIXED_SIMULATION_SPEED = 30;

const DEFAULT_CONFIG: SimulatorConfig = {
  roomId: 'classic',
  seatCount: 1,
  initialBankroll: 10000,
  baseUnit: 100,
  targetMultiplier: 1.5,
  stopLoss: 0,
  maxHands: 500,
  bettingSystem: 'flat',
  bettingParams: {
    martingaleMaxSteps: 6,
    parlayMaxSteps: 4,
    parlayMultiplier: 2,
  },
  playDecisionSource: 'strategy_advice',
  customRiskLevel: 'balanced',
};

const EMPTY_SUMMARY = {
  winRate: 0,
  evPerHand: 0,
  profit: 0,
  maxDrawdown: 0,
  longestLosingStreak: 0,
  averageBet: 0,
  bankrollAtRiskPct: 0,
  variancePerHand: 0,
  profitFactor: 0,
};

const DEFAULT_RUN_STATE: SimulatorRunState = {
  status: 'idle',
  currentHandIndex: 0,
  bankrollCurrent: DEFAULT_CONFIG.initialBankroll,
  peak: DEFAULT_CONFIG.initialBankroll,
  trough: DEFAULT_CONFIG.initialBankroll,
  streakWin: 0,
  streakLose: 0,
  summary: EMPTY_SUMMARY,
};

let engineRef: SimulatorEngine | null = null;
let timerRef: ReturnType<typeof setTimeout> | null = null;

function clampMaxHands(value: number): number {
  const safe = Number.isFinite(value) ? value : DEFAULT_CONFIG.maxHands;
  return Math.min(5000, Math.max(1, safe));
}

function clampSeatCount(value: number): number {
  const safe = Number.isFinite(value) ? value : DEFAULT_CONFIG.seatCount;
  return Math.min(5, Math.max(1, safe));
}

function clearTick() {
  if (timerRef) {
    clearTimeout(timerRef);
    timerRef = null;
  }
}

export const createSimulatorSlice: StateCreator<GameStore, [], [], SimulatorSlice> = (set, get) => {
  const scheduleTick = () => {
    const state = get();
    if (!engineRef || state.simulatorRunState.status !== 'running') return;

    const delayMs = Math.max(0, Math.round(1000 / Math.max(1, FIXED_SIMULATION_SPEED)));
    timerRef = setTimeout(() => {
      const currentState = get();
      if (!engineRef || currentState.simulatorRunState.status !== 'running') return;

      const { runState, done } = engineRef.step();
      set({
        simulatorRunState: runState,
        simulatorEquityCurve: [...engineRef.getState().equityCurve],
        simulatorEventLog: [...engineRef.getState().eventLog].slice(-200),
      });

      if (done) {
        const result = engineRef.finish();
        const history = result.simulatorHistoryRecord
          ? [...currentState.simulatorHistory, result.simulatorHistoryRecord].slice(-500)
          : currentState.simulatorHistory;
        set({
          simulatorRunState: { ...runState, status: 'done' },
          simulatorResult: result,
          simulatorEquityCurve: result.equityCurve,
          simulatorEventLog: result.eventLog.slice(-300),
          simulatorHistory: history,
        });
        clearTick();
        return;
      }

      scheduleTick();
    }, delayMs);
  };

  return {
    simulatorConfig: DEFAULT_CONFIG,
    simulatorRunState: DEFAULT_RUN_STATE,
    simulatorResult: null,
    simulatorEquityCurve: [DEFAULT_CONFIG.initialBankroll],
    simulatorEventLog: [],
    simulatorHistory: [],
    simulatorPresets: [],

    setSimulatorConfig: (patch) => {
      const current = get().simulatorConfig;
      const next = {
        ...current,
        ...patch,
        bettingParams: {
          ...current.bettingParams,
          ...(patch.bettingParams ?? {}),
        },
      };
      next.maxHands = clampMaxHands(next.maxHands);
      next.seatCount = clampSeatCount(next.seatCount);
      set({
        simulatorConfig: next,
        simulatorRunState:
          get().simulatorRunState.status === 'idle'
            ? {
                ...get().simulatorRunState,
                bankrollCurrent: next.initialBankroll,
                peak: next.initialBankroll,
                trough: next.initialBankroll,
              }
            : get().simulatorRunState,
      });
    },

    startSimulatorRun: () => {
      clearTick();
      const cfg = {
        ...get().simulatorConfig,
        maxHands: clampMaxHands(get().simulatorConfig.maxHands),
        seatCount: clampSeatCount(get().simulatorConfig.seatCount),
      };
      set({ simulatorConfig: cfg });
      engineRef = createSimulatorEngine(cfg);

      const initialRunState: SimulatorRunState = {
        status: 'running',
        currentHandIndex: 0,
        bankrollCurrent: cfg.initialBankroll,
        peak: cfg.initialBankroll,
        trough: cfg.initialBankroll,
        streakWin: 0,
        streakLose: 0,
        summary: EMPTY_SUMMARY,
      };

      set({
        simulatorRunState: initialRunState,
        simulatorResult: null,
        simulatorEquityCurve: [cfg.initialBankroll],
        simulatorEventLog: ['Simulation queued...'],
      });

      scheduleTick();
    },

    pauseSimulatorRun: () => {
      const current = get().simulatorRunState;
      if (current.status !== 'running') return;
      clearTick();
      set({
        simulatorRunState: {
          ...current,
          status: 'paused',
        },
      });
    },

    resumeSimulatorRun: () => {
      const current = get().simulatorRunState;
      if (current.status !== 'paused' || !engineRef) return;
      set({
        simulatorRunState: {
          ...current,
          status: 'running',
        },
      });
      scheduleTick();
    },

    resetSimulatorRun: () => {
      clearTick();
      engineRef = null;
      const cfg = get().simulatorConfig;
      set({
        simulatorRunState: {
          ...DEFAULT_RUN_STATE,
          bankrollCurrent: cfg.initialBankroll,
          peak: cfg.initialBankroll,
          trough: cfg.initialBankroll,
        },
        simulatorResult: null,
        simulatorEquityCurve: [cfg.initialBankroll],
        simulatorEventLog: [],
      });
    },

    saveSimulatorPreset: (name) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const state = get();
      const now = Date.now();
      const existing = state.simulatorPresets.find((preset) => preset.name.toLowerCase() === trimmed.toLowerCase());

      if (existing) {
        set({
          simulatorPresets: state.simulatorPresets.map((preset) =>
            preset.id === existing.id
              ? {
                  ...preset,
                  name: trimmed,
                  config: { ...state.simulatorConfig },
                  updatedAt: now,
                }
              : preset,
          ),
        });
        return;
      }

      const newPreset = {
        id: `sim-preset-${now}-${Math.random().toString(36).slice(2, 8)}`,
        name: trimmed,
        config: { ...state.simulatorConfig, bettingParams: { ...state.simulatorConfig.bettingParams } },
        createdAt: now,
        updatedAt: now,
      };
      set({ simulatorPresets: [...state.simulatorPresets, newPreset].slice(-50) });
    },

    applySimulatorPreset: (presetId) => {
      const state = get();
      const preset = state.simulatorPresets.find((entry) => entry.id === presetId);
      if (!preset) return;
      set({
        simulatorConfig: {
          ...preset.config,
          bettingParams: { ...preset.config.bettingParams },
        },
      });
    },

    deleteSimulatorPreset: (presetId) => {
      const state = get();
      set({ simulatorPresets: state.simulatorPresets.filter((preset) => preset.id !== presetId) });
    },

    importSimulatorPreset: (name, config) => {
      const trimmed = name.trim() || `Imported ${new Date().toLocaleString()}`;
      const now = Date.now();
      const importedConfig = {
        ...config,
        bettingParams: { ...config.bettingParams },
      };
      const importedPreset = {
        id: `sim-preset-${now}-${Math.random().toString(36).slice(2, 8)}`,
        name: trimmed,
        config: importedConfig,
        createdAt: now,
        updatedAt: now,
      };

      const state = get();
      set({
        simulatorConfig: importedConfig,
        simulatorPresets: [...state.simulatorPresets, importedPreset].slice(-50),
      });
    },
  };
};
