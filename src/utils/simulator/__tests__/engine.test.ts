import { describe, expect, it } from 'vitest';
import { createSimulatorEngine } from '../engine';
import type { SimulatorConfig } from '@/types/simulator';

const baseConfig: SimulatorConfig = {
  roomId: 'classic',
  seatCount: 1,
  initialBankroll: 5000,
  baseUnit: 50,
  targetMultiplier: 10,
  stopLoss: 0,
  maxHands: 25,
  bettingSystem: 'flat',
  bettingParams: {},
  playDecisionSource: 'basic_strategy',
  customRiskLevel: 'balanced',
};

describe('Simulator engine', () => {
  it('stops exactly at maxHands when other stops are far away', () => {
    const engine = createSimulatorEngine(baseConfig);

    let done = false;
    let steps = 0;
    while (!done && steps < 200) {
      const tick = engine.step();
      done = tick.done;
      steps += 1;
    }

    const result = engine.finish();
    expect(result.handCount).toBe(baseConfig.maxHands);
    expect(result.equityCurve.length).toBe(result.handCount + 1);
  });

  it('stops immediately when bankroll already below stop loss', () => {
    const engine = createSimulatorEngine({
      ...baseConfig,
      initialBankroll: 100,
      stopLoss: 200,
      maxHands: 100,
    });

    const tick = engine.step();
    expect(tick.done).toBe(true);

    const result = engine.finish();
    expect(result.handCount).toBe(0);
    expect(result.riskOfRuinEstimate).toBe(1);
  });

  it('returns bounded rates and non-negative drawdown', () => {
    const engine = createSimulatorEngine({
      ...baseConfig,
      maxHands: 40,
      bettingSystem: '1326',
      playDecisionSource: 'strategy_advice',
    });

    let done = false;
    let guard = 0;
    while (!done && guard < 300) {
      const tick = engine.step();
      done = tick.done;
      guard += 1;
    }

    const result = engine.finish();
    expect(result.winRate).toBeGreaterThanOrEqual(0);
    expect(result.winRate).toBeLessThanOrEqual(1);
    expect(result.pushRate).toBeGreaterThanOrEqual(0);
    expect(result.pushRate).toBeLessThanOrEqual(1);
    expect(result.maxDrawdown).toBeGreaterThanOrEqual(0);
  });

  it('applies Exchange 21 switch advice flow in simulator mode', () => {
    const engine = createSimulatorEngine({
      ...baseConfig,
      roomId: 'exchange_21',
      playDecisionSource: 'strategy_advice',
      maxHands: 1,
      baseUnit: 25,
      initialBankroll: 5000,
    });

    let done = false;
    let guard = 0;
    while (!done && guard < 50) {
      const tick = engine.step();
      done = tick.done;
      guard += 1;
    }

    const result = engine.finish();
    expect(result.handCount).toBe(1);
    expect(result.averageBet).toBeGreaterThanOrEqual(50);
    expect(result.eventLog.some((line) => line.toLowerCase().includes('exchange switch'))).toBe(true);
  });
});
