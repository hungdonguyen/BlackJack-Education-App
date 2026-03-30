import type { Card } from '@/types/game';
import type { SimulatorConfig, SimulatorPlayDecisionSource } from '@/types/simulator';
import { calculateHandValue } from '@/utils/hand';
import { getDeviation, type Deviation } from '@/utils/countingDeviations';
import { getRoomConfig } from '@/utils/rooms';
import { getStrategyAction, normRank, type StrategyAction } from '@/utils/strategyAdvisor';

export type SimulatorAction = 'H' | 'S' | 'D' | 'SP' | 'SU' | 'B';

export interface DecisionContext {
  cards: Card[];
  dealerUpcard: Card;
  roomId: string;
  trueCount: number;
  canDouble: boolean;
  canSplit: boolean;
  canSurrender: boolean;
  canBurn: boolean;
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
    if (!enableSpecialCases) return 'H';
    if (total === 15 || total === 16) {
      const dealerRank = normRank(ctx.dealerUpcard.rank);
      return ['2', '3', '4', '5', '6'].includes(dealerRank) ? 'S' : 'H';
    }
    if (total === 17 || total === 18) return 'S';
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
      { resolveConditions: true, canZap: false, canBurn: ctx.canBurn },
    );

    const strategyAction = applyDeviationIfAny(baseStrategyAction, ctx);
    return normalizeToSimulatorAction(strategyAction, ctx, total, true);
  }
}

class CustomProfilePolicy implements DecisionPolicy {
  constructor(private readonly customRiskLevel: SimulatorConfig['customRiskLevel']) {}

  decideAction(ctx: DecisionContext): SimulatorAction {
    const { total } = calculateHandValue(ctx.cards);
    if (this.customRiskLevel === 'aggressive') {
      if (total <= 11 && ctx.canDouble) return 'D';
      if (total <= 16) return 'H';
      return 'S';
    }
    if (this.customRiskLevel === 'conservative') {
      if (total >= 13) return 'S';
      return 'H';
    }
    if (total <= 11 && ctx.canDouble) return 'D';
    return total >= 17 ? 'S' : 'H';
  }
}

export function createDecisionPolicy(
  source: SimulatorPlayDecisionSource,
  customRiskLevel: SimulatorConfig['customRiskLevel'],
): DecisionPolicy {
  if (source === 'strategy_advice') {
    return new StrategyAdvicePolicy();
  }
  if (source === 'basic_strategy') {
    return new BasicStrategyPolicy();
  }
  return new CustomProfilePolicy(customRiskLevel);
}