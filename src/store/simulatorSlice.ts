import { StateCreator } from 'zustand';
import { GameStore } from '@/types/game';
import type { SimulatorConfig, SimulatorRunState, SimulatorSlice, SimulatorWorkerOutput } from '@/types/simulator';
import { buildPreRunRiskSnapshot, buildRiskConclusion } from '@/app/simulator/utils/formatters';

const WEB_SIMULATOR_HISTORY_LIMIT = 120;
const TAURI_SIMULATOR_HISTORY_LIMIT = 500;
const WEB_MAX_HANDS_LIMIT = 10000;
const TAURI_MAX_HANDS_LIMIT = 50000;

function isTauriRuntime(): boolean {
  if (typeof window === 'undefined') return false;
  const hasTauriGlobals = '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
  const hasTauriUserAgent = typeof navigator !== 'undefined' && navigator.userAgent.includes('Tauri');
  return hasTauriGlobals || hasTauriUserAgent;
}

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
    fibonacciMaxSteps: 10,
    dAlembertUnit: 1,
    regressionTargetSteps: 3,
  },
  playDecisionSource: 'strategy_advice',
  exchangeSwitchEngine: 'cindy_advanced',
  delayMs: 70,
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

let workerRef: Worker | null = null;

function clampMaxHands(value: number, tauriRuntime: boolean): number {
  const safe = Number.isFinite(value) ? value : DEFAULT_CONFIG.maxHands;
  const limit = tauriRuntime ? TAURI_MAX_HANDS_LIMIT : WEB_MAX_HANDS_LIMIT;
  return Math.min(limit, Math.max(1, safe));
}

function clampSeatCount(value: number): number {
  const safe = Number.isFinite(value) ? value : DEFAULT_CONFIG.seatCount;
  return Math.min(5, Math.max(1, safe));
}

function clearWorker() {
  if (workerRef) {
    workerRef.terminate();
    workerRef = null;
  }
}

function appendWithHistoryLimit<T>(items: T[], nextItem: T, limit: number): T[] {
  if (limit <= 0) return [];
  if (items.length < limit) return [...items, nextItem];
  const next = [...items];
  next.shift();
  next.push(nextItem);
  return next;
}

export const createSimulatorSlice: StateCreator<GameStore, [], [], SimulatorSlice> = (set, get) => {
  return {
    simulatorConfig: DEFAULT_CONFIG,
    simulatorRunState: DEFAULT_RUN_STATE,
    simulatorResult: null,
    simulatorEquityCurve: [DEFAULT_CONFIG.initialBankroll],
    simulatorEventLog: [],
    simulatorHistory: [],
    simulatorPresets: [],

    setSimulatorConfig: (patch) => {
      const tauriRuntime = isTauriRuntime();
      const current = get().simulatorConfig;
      const next = {
        ...current,
        ...patch,
        bettingParams: {
          ...current.bettingParams,
          ...(patch.bettingParams ?? {}),
        },
      };
      next.maxHands = clampMaxHands(next.maxHands, tauriRuntime);
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
      clearWorker();
      const tauriRuntime = isTauriRuntime();
      const cfg = {
        ...get().simulatorConfig,
        maxHands: clampMaxHands(get().simulatorConfig.maxHands, tauriRuntime),
        seatCount: clampSeatCount(get().simulatorConfig.seatCount),
      };
      set({ simulatorConfig: cfg });

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
        simulatorEventLog: ['Simulation queued in Web Worker...'],
      });

      workerRef = new Worker(new URL('@/utils/simulator/simulator.worker.ts', import.meta.url));
      workerRef.onmessage = (e: MessageEvent<SimulatorWorkerOutput>) => {
        const payload = e.data;
        const currentState = get();

        if (payload.type === 'PROGRESS') {
           const prog = payload.payload;
           set({
               simulatorRunState: {
                   ...currentState.simulatorRunState,
                   status: prog.status,
                   currentHandIndex: prog.currentHandIndex,
                   bankrollCurrent: prog.bankrollCurrent,
                   peak: prog.peak,
                   trough: prog.trough,
                   streakWin: prog.streakWin,
                   streakLose: prog.streakLose,
                   summary: prog.summary
               },
               // Cập nhật EquityCurve theo Real-time nếu muốn!
               simulatorEquityCurve: [...currentState.simulatorEquityCurve, prog.equityCurveLastPoint]
           });
        } else if (payload.type === 'DONE') {
           const result = payload.payload;
           
           const preRunSnapshot = buildPreRunRiskSnapshot(get().simulatorConfig);
           const verdict = buildRiskConclusion(preRunSnapshot, {
               bankrollAtRiskPct: result.bankrollAtRiskPct,
               riskOfRuinEstimate: result.riskOfRuinEstimate,
               roi: result.roi
           });

           if (result.simulatorHistoryRecord && result.simulatorHistoryRecord.simulatorSummary) {
               result.simulatorHistoryRecord.simulatorSummary.systemVerdict = verdict;
           }

           const runtimeHistoryLimit = isTauriRuntime()
             ? TAURI_SIMULATOR_HISTORY_LIMIT
             : WEB_SIMULATOR_HISTORY_LIMIT;
           const history = result.simulatorHistoryRecord
             ? appendWithHistoryLimit(currentState.simulatorHistory, result.simulatorHistoryRecord, runtimeHistoryLimit)
             : currentState.simulatorHistory;

           set({
               simulatorRunState: { ...currentState.simulatorRunState, status: 'done' },
               simulatorResult: result,
               simulatorEquityCurve: result.equityCurve,
               simulatorEventLog: result.eventLog.slice(-300),
               simulatorHistory: history,
           });
           clearWorker();
        } else if (payload.type === 'ERROR') {
           console.error('Simulator Worker Error:', payload.error);
           set({
               simulatorRunState: { ...currentState.simulatorRunState, status: 'idle' },
               simulatorEventLog: [...currentState.simulatorEventLog, `[ERROR] Worker crashed: ${payload.error}`]
           });
           clearWorker();
        }
      };
      
      workerRef.postMessage({ type: 'START', config: cfg });
    },

    pauseSimulatorRun: () => {
      const current = get().simulatorRunState;
      if (current.status !== 'running') return;
      if (workerRef) workerRef.postMessage({ type: 'PAUSE' });
      set({
        simulatorRunState: {
          ...current,
          status: 'paused',
        },
      });
    },

    resumeSimulatorRun: () => {
      const current = get().simulatorRunState;
      if (current.status !== 'paused' || !workerRef) return;
      workerRef.postMessage({ type: 'RESUME' });
      set({
        simulatorRunState: {
          ...current,
          status: 'running',
        },
      });
    },

    stopSimulatorRun: () => {
      const current = get().simulatorRunState;
      if ((current.status !== 'running' && current.status !== 'paused') || !workerRef) return;

      workerRef.postMessage({ type: 'STOP' });
      set({
        simulatorEventLog: [...get().simulatorEventLog, '[STOP] Manual early-stop requested. Finalizing current run...'].slice(-300),
      });
    },

    resetSimulatorRun: () => {
      clearWorker();
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

    clearSimulatorHistory: () => {
      set({ simulatorHistory: [] });
    },

    deleteSimulatorHistoryRun: (runId) => {
      if (!runId) return;
      const state = get();
      set({ simulatorHistory: state.simulatorHistory.filter((entry) => entry.id !== runId) });
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
