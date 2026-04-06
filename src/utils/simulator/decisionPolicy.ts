import type { Card } from '@/types/game';
import type { SimulatorPlayDecisionSource } from '@/types/simulator';
import { calculateHandValue } from '@/utils/hand';
import { getDeviation, type Deviation } from '@/utils/countingDeviations';
import { getRoomConfig } from '@/utils/rooms';
import { getStrategyAction, normRank, type StrategyAction } from '@/utils/strategyAdvisor';

export type SimulatorAction = 'H' | 'S' | 'D' | 'SP' | 'SU' | 'B' | 'Z';

export interface DecisionContext {
  cards: Card[];
  dealerUpcard: Card;
  roomId: string;
  trueCount: number;
  canDouble: boolean;
  canSplit: boolean;
  canSurrender: boolean;
  canBurn: boolean;
  canZap: boolean;
}

export interface DecisionPolicy {
  decideAction: (ctx: DecisionContext) => SimulatorAction;
}

function normalizeToSimulatorAction(
  action: StrategyAction,
  ctx: DecisionContext,
  total: number,
  enableSpecialCases: boolean,
): SimulatorAction {
  if (action === 'H') return 'H';
  if (action === 'S' || action === 'S4' || action === 'S5' || action === 'S6') return 'S';

  if (action === 'SP' || action === 'FSP' || action === 'PS') {
    return ctx.canSplit ? 'SP' : 'H';
  }

  if (action === 'SU' || action === 'RS' || action === 'RH' || action === 'R') {
    return ctx.canSurrender ? 'SU' : 'H';
  }

  if (action === 'D' || action === 'FD') {
    return ctx.canDouble ? 'D' : 'H';
  }

  if (action === 'DS') {
    if (ctx.canDouble) return 'D';
    return enableSpecialCases ? 'S' : 'H';
  }

  if (action === 'D3' || action === 'D4' || action === 'D5' || action === 'D6') {
    if (ctx.canDouble) return 'D';
    return 'H';
  }

  if (action === 'Z') {
    if (enableSpecialCases && ctx.canZap) return 'Z';
    return 'H';
  }

  if (action === 'B') {
    return enableSpecialCases && ctx.canBurn ? 'B' : 'H';
  }

  return 'H';
}

function applyDeviationIfAny(baseAction: StrategyAction, ctx: DecisionContext): StrategyAction {
  const room = getRoomConfig(ctx.roomId);
  const { total, isSoft } = calculateHandValue(ctx.cards);
  const isPair = ctx.cards.length === 2 && ctx.cards[0].value === ctx.cards[1].value;
  const deviation = getDeviation(
    total,
    isSoft,
    isPair,
    normRank(ctx.dealerUpcard.rank),
    ctx.trueCount,
    room.gameRules.dealerHitsSoft17,
    room.gameRules.allowSurrender,
    room.deviationsSet,
    'Hi-Lo',
  );

  if (!deviation) return baseAction;

  return mapDeviationToAction(deviation);
}

function mapDeviationToAction(deviation: Deviation): StrategyAction {
  const action = deviation.deviationAction;
  if (action === 'H' || action === 'S' || action === 'D' || action === 'SP' || action === 'SU') {
    return action;
  }
  if (action === 'B') {
    return 'B';
  }
  return deviation.basicAction as StrategyAction;
}

class BasicStrategyPolicy implements DecisionPolicy {
  decideAction(ctx: DecisionContext): SimulatorAction {
    const { total, isSoft } = calculateHandValue(ctx.cards);
    const strategyAction = getStrategyAction(
      ctx.cards,
      total,
      isSoft,
      ctx.dealerUpcard.rank,
      getRoomConfig(ctx.roomId).strategyType,
      ctx.canDouble,
      ctx.canSplit,
      ctx.canSurrender,
      { resolveConditions: false, canZap: false, canBurn: false },
    );

    return normalizeToSimulatorAction(strategyAction, ctx, total, false);
  }
}

class StrategyAdvicePolicy implements DecisionPolicy {
  decideAction(ctx: DecisionContext): SimulatorAction {
    const { total, isSoft } = calculateHandValue(ctx.cards);
    const baseStrategyAction = getStrategyAction(
      ctx.cards,
      total,
      isSoft,
      ctx.dealerUpcard.rank,
      ctx.roomId,
      ctx.canDouble,
      ctx.canSplit,
      ctx.canSurrender,
      { resolveConditions: true, canZap: ctx.canZap, canBurn: ctx.canBurn },
    );

    const strategyAction = applyDeviationIfAny(baseStrategyAction, ctx);
    return normalizeToSimulatorAction(strategyAction, ctx, total, true);
  }
}

export function createDecisionPolicy(
  source: SimulatorPlayDecisionSource
): DecisionPolicy {
  if (source === 'strategy_advice') {
    return new StrategyAdvicePolicy();
  }
  return new BasicStrategyPolicy();
}