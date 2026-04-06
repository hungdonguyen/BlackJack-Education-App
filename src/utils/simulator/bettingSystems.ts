import type { SimulatorBettingParams, SimulatorBettingSystem } from '@/types/simulator';

export interface BettingSystemState {
  baseUnit: number;
  previousBet: number;
  previousOutcome: 'win' | 'loss' | 'push' | null;
  progressionIndex: number;
}

export interface BettingContext {
  bankroll: number;
  tableMin: number;
  tableMax: number;
}

export interface BettingSystem {
  getNextBet: (state: BettingSystemState, ctx: BettingContext) => number;
  onWin: (state: BettingSystemState) => BettingSystemState;
  onLoss: (state: BettingSystemState) => BettingSystemState;
  onPush: (state: BettingSystemState) => BettingSystemState;
  reset: (state: BettingSystemState) => BettingSystemState;
}

function clampBet(value: number, ctx: BettingContext): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  const bounded = Math.max(ctx.tableMin, Math.min(ctx.tableMax, Math.floor(value)));
  if (bounded > ctx.bankroll) {
    return Math.floor(ctx.bankroll);
  }
  return bounded;
}

function withOutcome(state: BettingSystemState, outcome: BettingSystemState['previousOutcome']): BettingSystemState {
  return {
    ...state,
    previousOutcome: outcome,
  };
}

export function createBettingSystem(
  system: SimulatorBettingSystem,
  params: SimulatorBettingParams = {},
): BettingSystem {
  if (system === 'martingale') {
    const maxSteps = Math.max(1, params.martingaleMaxSteps ?? 6);
    return {
      getNextBet: (state, ctx) => {
        const step = Math.min(state.progressionIndex, maxSteps - 1);
        return clampBet(state.baseUnit * 2 ** step, ctx);
      },
      onWin: (state) => withOutcome({ ...state, progressionIndex: 0, previousBet: state.baseUnit }, 'win'),
      onLoss: (state) => withOutcome({ ...state, progressionIndex: Math.min(state.progressionIndex + 1, maxSteps - 1) }, 'loss'),
      onPush: (state) => withOutcome(state, 'push'),
      reset: (state) => ({ ...state, progressionIndex: 0, previousBet: state.baseUnit, previousOutcome: null }),
    };
  }

  if (system === 'parlay') {
    const maxSteps = Math.max(1, params.parlayMaxSteps ?? 4);
    const multiplier = Math.max(1.1, params.parlayMultiplier ?? 2);
    return {
      getNextBet: (state, ctx) => {
        const staged = state.baseUnit * multiplier ** state.progressionIndex;
        return clampBet(staged, ctx);
      },
      onWin: (state) => {
        const nextStep = Math.min(state.progressionIndex + 1, maxSteps - 1);
        return withOutcome({ ...state, progressionIndex: nextStep }, 'win');
      },
      onLoss: (state) => withOutcome({ ...state, progressionIndex: 0 }, 'loss'),
      onPush: (state) => withOutcome(state, 'push'),
      reset: (state) => ({ ...state, progressionIndex: 0, previousBet: state.baseUnit, previousOutcome: null }),
    };
  }

  if (system === '1326') {
    const sequence = [1, 3, 2, 6] as const;
    return {
      getNextBet: (state, ctx) => {
        const idx = Math.min(state.progressionIndex, sequence.length - 1);
        return clampBet(state.baseUnit * sequence[idx], ctx);
      },
      onWin: (state) => {
        const nextIdx = state.progressionIndex + 1;
        return withOutcome({ ...state, progressionIndex: nextIdx >= sequence.length ? 0 : nextIdx }, 'win');
      },
      onLoss: (state) => withOutcome({ ...state, progressionIndex: 0 }, 'loss'),
      onPush: (state) => withOutcome(state, 'push'),
      reset: (state) => ({ ...state, progressionIndex: 0, previousBet: state.baseUnit, previousOutcome: null }),
    };
  }

  if (system === 'fibonacci') {
    const sequence = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987, 1597];
    const maxSteps = Math.min(sequence.length, Math.max(1, params.fibonacciMaxSteps ?? 10));
    return {
      getNextBet: (state, ctx) => {
        const idx = Math.min(state.progressionIndex, maxSteps - 1);
        return clampBet(state.baseUnit * sequence[idx], ctx);
      },
      onWin: (state) => {
        // Move back 2 steps on win
        const nextIdx = Math.max(0, state.progressionIndex - 2);
        return withOutcome({ ...state, progressionIndex: nextIdx }, 'win');
      },
      onLoss: (state) => {
        // Move forward 1 step on loss
        const nextIdx = Math.min(state.progressionIndex + 1, maxSteps - 1);
        return withOutcome({ ...state, progressionIndex: nextIdx }, 'loss');
      },
      onPush: (state) => withOutcome(state, 'push'),
      reset: (state) => ({ ...state, progressionIndex: 0, previousBet: state.baseUnit, previousOutcome: null }),
    };
  }

  if (system === 'd_alembert') {
    const unitSteps = Math.max(1, params.dAlembertUnit ?? 1);
    return {
      getNextBet: (state, ctx) => {
        // progressionIndex here holds the current multiplier of baseUnit. 
        // We start with 1.
        const mult = Math.max(1, state.progressionIndex + 1); 
        return clampBet(mult * (state.baseUnit * unitSteps), ctx);
      },
      onWin: (state) => {
        // decrease bet by 1 unit
        const nextIdx = Math.max(0, state.progressionIndex - 1);
        return withOutcome({ ...state, progressionIndex: nextIdx }, 'win');
      },
      onLoss: (state) => {
        // increase bet by 1 unit
        const nextIdx = state.progressionIndex + 1;
        return withOutcome({ ...state, progressionIndex: nextIdx }, 'loss');
      },
      onPush: (state) => withOutcome(state, 'push'),
      reset: (state) => ({ ...state, progressionIndex: 0, previousBet: state.baseUnit, previousOutcome: null }),
    };
  }

  if (system === 'regression') {
    const targetSteps = Math.max(2, params.regressionTargetSteps ?? 3);
    return {
      getNextBet: (state, ctx) => {
        const step = state.progressionIndex;
        // Increases bet progressively up to target -> e.g. 1 unit, 2 units... then resets
        return clampBet(state.baseUnit * Math.max(1, step + 1), ctx);
      },
      onWin: (state) => {
        const nextStep = state.progressionIndex + 1;
        if (nextStep >= targetSteps) {
          // Pulled back to start after reaching target
          return withOutcome({ ...state, progressionIndex: 0 }, 'win');
        }
        return withOutcome({ ...state, progressionIndex: nextStep }, 'win');
      },
      onLoss: (state) => withOutcome({ ...state, progressionIndex: 0 }, 'loss'),
      onPush: (state) => withOutcome(state, 'push'),
      reset: (state) => ({ ...state, progressionIndex: 0, previousBet: state.baseUnit, previousOutcome: null }),
    };
  }

  return {
    getNextBet: (state, ctx) => clampBet(state.baseUnit, ctx),
    onWin: (state) => withOutcome({ ...state, progressionIndex: 0 }, 'win'),
    onLoss: (state) => withOutcome({ ...state, progressionIndex: 0 }, 'loss'),
    onPush: (state) => withOutcome({ ...state, progressionIndex: 0 }, 'push'),
    reset: (state) => ({ ...state, progressionIndex: 0, previousBet: state.baseUnit, previousOutcome: null }),
  };
}
