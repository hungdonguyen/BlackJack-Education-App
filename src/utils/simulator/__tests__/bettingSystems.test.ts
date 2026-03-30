import { describe, expect, it } from 'vitest';
import { createBettingSystem, type BettingSystemState } from '../bettingSystems';

const baseState: BettingSystemState = {
  baseUnit: 10,
  previousBet: 10,
  previousOutcome: null,
  progressionIndex: 0,
};

const ctx = {
  bankroll: 500,
  tableMin: 10,
  tableMax: 200,
};

describe('Simulator betting systems', () => {
  it('flat betting always returns base unit', () => {
    const system = createBettingSystem('flat');
    expect(system.getNextBet(baseState, ctx)).toBe(10);
    const lossState = system.onLoss(baseState);
    expect(system.getNextBet(lossState, ctx)).toBe(10);
  });

  it('martingale doubles after each loss then resets on win', () => {
    const system = createBettingSystem('martingale', { martingaleMaxSteps: 4 });
    let state = { ...baseState };

    expect(system.getNextBet(state, ctx)).toBe(10);
    state = system.onLoss(state);
    expect(system.getNextBet(state, ctx)).toBe(20);
    state = system.onLoss(state);
    expect(system.getNextBet(state, ctx)).toBe(40);
    state = system.onWin(state);
    expect(system.getNextBet(state, ctx)).toBe(10);
  });

  it('parlay increases on win and resets on loss', () => {
    const system = createBettingSystem('parlay', { parlayMaxSteps: 3, parlayMultiplier: 2 });
    let state = { ...baseState };

    expect(system.getNextBet(state, ctx)).toBe(10);
    state = system.onWin(state);
    expect(system.getNextBet(state, ctx)).toBe(20);
    state = system.onWin(state);
    expect(system.getNextBet(state, ctx)).toBe(40);
    state = system.onLoss(state);
    expect(system.getNextBet(state, ctx)).toBe(10);
  });

  it('1326 follows sequence and resets after complete cycle', () => {
    const system = createBettingSystem('1326');
    let state = { ...baseState };

    expect(system.getNextBet(state, ctx)).toBe(10);
    state = system.onWin(state);
    expect(system.getNextBet(state, ctx)).toBe(30);
    state = system.onWin(state);
    expect(system.getNextBet(state, ctx)).toBe(20);
    state = system.onWin(state);
    expect(system.getNextBet(state, ctx)).toBe(60);
    state = system.onWin(state);
    expect(system.getNextBet(state, ctx)).toBe(10);
  });

  it('respects bankroll and table limits', () => {
    const system = createBettingSystem('martingale', { martingaleMaxSteps: 6 });
    const state = { ...baseState, progressionIndex: 5 };
    const constrained = system.getNextBet(state, {
      bankroll: 55,
      tableMin: 10,
      tableMax: 500,
    });

    expect(constrained).toBe(55);
  });
});
