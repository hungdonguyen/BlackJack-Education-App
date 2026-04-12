import { describe, expect, it } from 'vitest';
import { Rank, Suit } from '@/types/enums';
import { createDecisionPolicy } from '../decisionPolicy';

function card(rank: Rank, value: number) {
  return { rank, value, suit: Suit.HEARTS, isHidden: false };
}

describe('Simulator decision policy', () => {
  it('maps strategy advice actions into simulator actions', () => {
    const policy = createDecisionPolicy('strategy_advice');
    const action = policy.decideAction({
      cards: [card(Rank.EIGHT, 8), card(Rank.EIGHT, 8)],
      dealerUpcard: card(Rank.SIX, 6),
      roomId: 'classic',
      trueCount: 0,
      canDouble: true,
      canSplit: true,
      canSurrender: true,
      canBurn: false,
      canZap: false,
    });

    expect(action).toBe('SP');
  });

  it('uses basic strategy policy when selected', () => {
    const policy = createDecisionPolicy('basic_strategy');
    const action = policy.decideAction({
      cards: [card(Rank.SEVEN, 7), card(Rank.SIX, 6)],
      dealerUpcard: card(Rank.TEN, 10),
      roomId: 'classic',
      trueCount: 0,
      canDouble: true,
      canSplit: false,
      canSurrender: false,
      canBurn: false,
      canZap: false,
    });

    expect(action).toBe('H');
  });

  it('applies counting deviations only in strategy advice mode', () => {
    const basic = createDecisionPolicy('basic_strategy');
    const advice = createDecisionPolicy('strategy_advice');

    const basicAction = basic.decideAction({
      cards: [card(Rank.TEN, 10), card(Rank.SIX, 6)],
      dealerUpcard: card(Rank.TEN, 10),
      roomId: 'classic',
      trueCount: 1,
      canDouble: false,
      canSplit: false,
      canSurrender: false,
      canBurn: false,
      canZap: false,
    });

    const adviceAction = advice.decideAction({
      cards: [card(Rank.TEN, 10), card(Rank.SIX, 6)],
      dealerUpcard: card(Rank.TEN, 10),
      roomId: 'classic',
      trueCount: 1,
      canDouble: false,
      canSplit: false,
      canSurrender: false,
      canBurn: false,
      canZap: false,
    });

    expect(basicAction).toBe('H');
    expect(adviceAction).toBe('S');
  });
});
