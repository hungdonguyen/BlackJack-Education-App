import { getRules } from '@/rules';
import { Rank, Suit, HandStatus } from '@/types/enums';
import type { Card, Hand, MatchRecord } from '@/types/game';
import type {
  SimulatorConfig,
  SimulatorHandHistoryEntry,
  SimulatorResult,
  SimulatorRunState,
  SimulatorSummaryMetrics,
} from '@/types/simulator';
import { getRoomConfig } from '@/utils/rooms';
import { calculateHandValue, isBlackjack } from '@/utils/hand';
import { getExchange21Advice } from '@/utils/strategyAdvisor';
import { getCardValue, getCardsPerDeck, getInitialDeckSum } from '@/utils/cardCounting';
import { createBettingSystem, type BettingSystemState } from './bettingSystems';
import { createDecisionPolicy, type DecisionPolicy } from './decisionPolicy';

interface RoundHand {
  cards: Card[];
  bet: number;
  surrendered: boolean;
  isSplit?: boolean;
  isDoubleDown?: boolean;
  isBurned?: boolean;
  isFreeDouble?: boolean;
  isFreeSplit?: boolean;
}

interface RoundSeat {
  seatNumber: number;
  hands: RoundHand[];
  actionTrace: string[];
}

interface EngineMetrics {
  roundsWon: number;
  roundsLost: number;
  roundsPush: number;
  blackjacks: number;
  totalBet: number;
  totalProfit: number;
  grossWinProfit: number;
  grossLossAbs: number;
  longestLosingStreak: number;
  currentLosingStreak: number;
  peak: number;
  maxDrawdown: number;
  profitSquares: number;
}

interface EngineState {
  config: SimulatorConfig;
  random: () => number;
  bankroll: number;
  initialBankroll: number;
  handIndex: number;
  shoe: Card[];
  bettingState: BettingSystemState;
  decisionPolicy: DecisionPolicy;
  metrics: EngineMetrics;
  equityCurve: number[];
  drawdownCurve: number[];
  eventLog: string[];
  handHistory: SimulatorHandHistoryEntry[];
  eventFlags: {
    drawdown10: boolean;
    drawdown25: boolean;
    lowBankrollWarned: boolean;
  };
}

interface RoundResult {
  bankrollAfter: number;
  roundProfit: number;
  roundBet: number;
  outcome: 'win' | 'loss' | 'push';
  blackjackCount: number;
  handHistoryEntry: SimulatorHandHistoryEntry;
}

const CARD_RANKS: Rank[] = [
  Rank.ACE,
  Rank.TWO,
  Rank.THREE,
  Rank.FOUR,
  Rank.FIVE,
  Rank.SIX,
  Rank.SEVEN,
  Rank.EIGHT,
  Rank.NINE,
  Rank.TEN,
  Rank.JACK,
  Rank.QUEEN,
  Rank.KING,
];

const CARD_SUITS: Suit[] = [Suit.CLUBS, Suit.DIAMONDS, Suit.HEARTS, Suit.SPADES];

const RANK_VALUE: Record<Rank, number> = {
  [Rank.ACE]: 11,
  [Rank.TWO]: 2,
  [Rank.THREE]: 3,
  [Rank.FOUR]: 4,
  [Rank.FIVE]: 5,
  [Rank.SIX]: 6,
  [Rank.SEVEN]: 7,
  [Rank.EIGHT]: 8,
  [Rank.NINE]: 9,
  [Rank.TEN]: 10,
  [Rank.JACK]: 10,
  [Rank.QUEEN]: 10,
  [Rank.KING]: 10,
};

export interface SimulatorEngine {
  getState: () => EngineState;
  step: () => { runState: SimulatorRunState; done: boolean };
  finish: () => SimulatorResult;
}

function createRng(seedInput?: number): () => number {
  let seed = (seedInput ?? Date.now()) % 2147483647;
  if (seed <= 0) seed += 2147483646;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function createShoe(numDecks: number, omitTens: boolean, random: () => number): Card[] {
  const shoe: Card[] = [];
  for (let d = 0; d < numDecks; d += 1) {
    for (const suit of CARD_SUITS) {
      for (const rank of CARD_RANKS) {
        if (omitTens && rank === Rank.TEN) continue;
        shoe.push({ suit, rank, value: RANK_VALUE[rank], isHidden: false });
      }
    }
  }

  for (let i = shoe.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [shoe[i], shoe[j]] = [shoe[j], shoe[i]];
  }

  return shoe;
}

function dealCard(state: EngineState): Card {
  if (state.shoe.length === 0) {
    const room = getRoomConfig(state.config.roomId);
    state.shoe = createShoe(room.gameRules.numberOfDecks, room.gameRules.omitTens ?? false, state.random);
  }
  const card = state.shoe.pop();
  if (!card) {
    throw new Error('Simulator shoe is empty.');
  }
  return card;
}

function shouldReshuffle(state: EngineState): boolean {
  const room = getRoomConfig(state.config.roomId);
  const cardsPerDeck = room.gameRules.omitTens ? 48 : 52;
  const totalCards = room.gameRules.numberOfDecks * cardsPerDeck;
  const threshold = room.gameRules.reshuffleThreshold ?? 0.25;
  return state.shoe.length <= totalCards * threshold;
}

function getTrueCount(state: EngineState, room: ReturnType<typeof getRoomConfig>): number {
  const system = 'Hi-Lo';
  const omitTens = room.gameRules.omitTens ?? false;
  const cardsPerDeck = getCardsPerDeck(omitTens);

  let remainingShoeSum = 0;
  for (const card of state.shoe) {
    remainingShoeSum += getCardValue(card.rank, system);
  }

  const initialShoeSum = room.gameRules.numberOfDecks * getInitialDeckSum(system, omitTens);
  const runningCount = initialShoeSum - remainingShoeSum;
  const decksRemaining = Math.max(state.shoe.length / cardsPerDeck, 0.5);

  return Math.round((runningCount / decksRemaining) * 10) / 10;
}

function playDealer(cards: Card[], dealerHitsSoft17: boolean, draw: () => Card): Card[] {
  while (true) {
    const value = calculateHandValue(cards);
    if (value.total > 21) break;
    if (value.total > 17) break;
    if (value.total === 17 && !value.isSoft) break;
    if (value.total === 17 && value.isSoft && !dealerHitsSoft17) break;
    cards.push(draw());
  }
  return cards;
}

function toRuleHand(cards: Card[], bet: number): Hand {
  const handValue = calculateHandValue(cards, true);
  const isNaturalBlackjack = cards.length === 2 && handValue.total === 21;
  return {
    id: `sim-${Math.random().toString(36).slice(2, 8)}`,
    cards,
    betAmount: bet,
    status: isNaturalBlackjack ? HandStatus.BLACKJACK : HandStatus.PLAYING,
  };
}

function mapCardView(card: Card) {
  return {
    rank: card.rank,
    suit: card.suit,
    value: card.value,
  };
}

function describeAction(code: string): string {
  const map: Record<string, string> = {
    H: 'HIT',
    S: 'STAND',
    D: 'DOUBLE',
    SP: 'SPLIT',
    SU: 'SURRENDER',
    B: 'BURN',
  };
  return map[code] ?? code;
}

function runRound(state: EngineState): RoundResult {
  const room = getRoomConfig(state.config.roomId);
  const rules = getRules(state.config.roomId);
  const isExchange21 = room.id === 'exchange_21';
  const seatCount = Math.min(5, Math.max(1, state.config.seatCount ?? 1));
  if (shouldReshuffle(state)) {
    state.shoe = createShoe(room.gameRules.numberOfDecks, room.gameRules.omitTens ?? false, state.random);
    state.eventLog.push(`[INFO] Hand ${state.handIndex + 1}: reshuffle triggered.`);
  }

  const bettingSystem = createBettingSystem(state.config.bettingSystem, state.config.bettingParams);
  const nextBet = bettingSystem.getNextBet(state.bettingState, {
    bankroll: state.bankroll,
    tableMin: room.betRange[0],
    tableMax: room.betRange[1],
  });

  const openingBetPerSeat = isExchange21 ? nextBet * 2 : nextBet;
  const requiredOpeningBet = openingBetPerSeat * seatCount;

  if (nextBet < room.betRange[0] || requiredOpeningBet > state.bankroll || nextBet <= 0) {
    state.eventLog.push(`[WARN] Hand ${state.handIndex + 1}: cannot place bet, bankroll exhausted.`);
    return {
      bankrollAfter: state.bankroll,
      roundProfit: 0,
      roundBet: 0,
      outcome: 'loss',
      blackjackCount: 0,
      handHistoryEntry: {
        handNumber: state.handIndex + 1,
        outcome: 'loss',
        bet: 0,
        profit: 0,
        bankrollAfter: state.bankroll,
        dealerTotal: 0,
        playerTotals: [],
        blackjacks: 0,
        actions: ['NO_BET'],
        dealerCards: [],
        playerHands: [],
      },
    };
  }

  const bankrollBeforeRound = state.bankroll;
  const handNumber = state.handIndex + 1;
  const seats: RoundSeat[] = Array.from({ length: seatCount }).map((_, index) => ({
    seatNumber: index + 1,
    hands: isExchange21
      ? [
          { cards: [dealCard(state), dealCard(state)], bet: nextBet, surrendered: false },
          { cards: [dealCard(state), dealCard(state)], bet: nextBet, surrendered: false },
        ]
      : [{ cards: [dealCard(state), dealCard(state)], bet: nextBet, surrendered: false }],
    actionTrace: [],
  }));

  const dealerCards: Card[] = [dealCard(state), dealCard(state)];
  state.bankroll -= requiredOpeningBet;

  let totalRoundBet = requiredOpeningBet;
  let blackjacks = 0;

  if (isExchange21 && state.config.playDecisionSource === 'strategy_advice') {
    for (const seat of seats) {
      if (seat.hands.length !== 2) continue;
      if (rules.canSwitch) {
        const canSwitch = rules.canSwitch({
          id: seat.seatNumber,
          isActive: true,
          hands: seat.hands.map((hand, index) => ({
            id: `sim-seat-${seat.seatNumber}-hand-${index + 1}`,
            cards: hand.cards,
            betAmount: hand.bet,
            status: HandStatus.PLAYING,
          })),
          currentHandIndex: 0,
        }).allowed;
        if (!canSwitch) continue;
      }
      const advice = getExchange21Advice(seat.hands[0].cards, seat.hands[1].cards, dealerCards[0].rank, state.config.exchangeSwitchEngine || 'cindy_advanced');
      if (advice?.shouldSwitch) {
        const secondCard0 = seat.hands[0].cards[1];
        const secondCard1 = seat.hands[1].cards[1];
        if (secondCard0 && secondCard1) {
          seat.hands[0].cards = [seat.hands[0].cards[0], secondCard1];
          seat.hands[1].cards = [seat.hands[1].cards[0], secondCard0];
          seat.actionTrace.push(`S${seat.seatNumber}:SWITCH`);
          state.eventLog.push(
            `[INFO] Hand ${state.handIndex + 1}: Seat ${seat.seatNumber} exchange switch executed (${advice.engineLabel}).`,
          );
        }
      } else if (advice) {
        state.eventLog.push(
          `[INFO] Hand ${state.handIndex + 1}: Seat ${seat.seatNumber} exchange switch skipped (${advice.engineLabel}).`,
        );
      }
    }
  }

  for (const seat of seats) {
    for (let idx = 0; idx < seat.hands.length; idx += 1) {
      const hand = seat.hands[idx];
      let finished = false;

      while (!finished) {
        const handValue = calculateHandValue(hand.cards);
        if (handValue.total >= 21) break;

        const doubleValidity = rules.canDoubleDown(toRuleHand(hand.cards, hand.bet));
        const canDouble = doubleValidity.allowed && hand.cards.length === 2;
        const splitValidity = rules.canSplit(toRuleHand(hand.cards, hand.bet), seat.hands.length);
        const canSplit = splitValidity.allowed && hand.cards.length === 2 && seat.hands.length < 4;
        const surrenderValidity = rules.canSurrender(toRuleHand(hand.cards, hand.bet));
        const canSurrender = surrenderValidity.allowed && hand.cards.length === 2;
        const burnValidity = rules.canBurn ? rules.canBurn(toRuleHand(hand.cards, hand.bet)) : { allowed: false, isFree: false, cost: 0 };
        const canBurn = Boolean(rules.canBurn) && burnValidity.allowed;

        const action = state.decisionPolicy.decideAction({
          cards: hand.cards,
          dealerUpcard: dealerCards[0],
          roomId: room.id,
          trueCount: getTrueCount(state, room),
          canDouble,
          canSplit,
          canSurrender,
          canBurn,
        });

        if (action === 'H') {
          seat.actionTrace.push(`S${seat.seatNumber}H${idx + 1}:HIT`);
          hand.cards.push(dealCard(state));
          if (calculateHandValue(hand.cards).total >= 21) {
            finished = true;
          }
          continue;
        }

        if (action === 'S') {
          seat.actionTrace.push(`S${seat.seatNumber}H${idx + 1}:STAND`);
          finished = true;
          continue;
        }

        if (action === 'SU' && canSurrender) {
          seat.actionTrace.push(`S${seat.seatNumber}H${idx + 1}:SURRENDER`);
          hand.surrendered = true;
          finished = true;
          continue;
        }

        if (action === 'SP' && canSplit && state.bankroll >= splitValidity.cost) {
          const splitCard = hand.cards.pop();
          if (!splitCard) {
            finished = true;
            continue;
          }

          if (splitValidity.cost > 0) {
            state.bankroll -= splitValidity.cost;
            totalRoundBet += splitValidity.cost;
          }

          hand.isFreeSplit = splitValidity.isFree;
          hand.isSplit = true;
          const newHand: RoundHand = {
            cards: [splitCard, dealCard(state)],
            bet: hand.bet,
            surrendered: false,
            isSplit: true,
            isFreeSplit: splitValidity.isFree,
          };
          hand.cards.push(dealCard(state));
          seat.hands.push(newHand);
          seat.actionTrace.push(
            `S${seat.seatNumber}H${idx + 1}:${splitValidity.isFree ? 'FREE_SPLIT' : 'SPLIT'}`,
          );
          continue;
        }

        if (action === 'D' && canDouble && state.bankroll >= doubleValidity.cost) {
          if (doubleValidity.cost > 0) {
            state.bankroll -= doubleValidity.cost;
            totalRoundBet += doubleValidity.cost;
            hand.bet += doubleValidity.cost;
          }
          hand.isDoubleDown = true;
          hand.isFreeDouble = doubleValidity.isFree;
          hand.cards.push(dealCard(state));
          seat.actionTrace.push(
            `S${seat.seatNumber}H${idx + 1}:${doubleValidity.isFree ? 'FREE_DOUBLE' : 'DOUBLE'}`,
          );
          
          const postDoubleSurrender = rules.canSurrender(toRuleHand(hand.cards, hand.bet));
          if (postDoubleSurrender.allowed) {
            const hValue = calculateHandValue(hand.cards);
            if (hValue.total <= 21) {
              const rescueAction = state.decisionPolicy.decideAction({
                cards: hand.cards,
                dealerUpcard: dealerCards[0],
                roomId: room.id,
                trueCount: getTrueCount(state, room),
                canDouble: false,
                canSplit: false,
                canSurrender: true,
                canBurn: false,
              });
              if (rescueAction === 'SU') {
                seat.actionTrace.push(`S${seat.seatNumber}H${idx + 1}:RESCUE`);
                hand.surrendered = true;
              }
            }
          }

          finished = true;
          continue;
        }

        if (action === 'B' && canBurn && state.bankroll >= burnValidity.cost && hand.cards.length === 2) {
          const replacementCard = dealCard(state);
          hand.cards[1] = replacementCard;
          hand.isBurned = true;
          if (burnValidity.cost > 0) {
            state.bankroll -= burnValidity.cost;
            totalRoundBet += burnValidity.cost;
          }
          seat.actionTrace.push(`S${seat.seatNumber}H${idx + 1}:BURN`);
          continue;
        }

        seat.actionTrace.push(`S${seat.seatNumber}H${idx + 1}:HIT`);
        hand.cards.push(dealCard(state));
        if (calculateHandValue(hand.cards).total >= 21) {
          finished = true;
        }
      }

      if (isBlackjack(hand.cards, true) && hand.cards.length === 2 && !hand.isBurned) {
        blackjacks += 1;
        seat.actionTrace.push(`S${seat.seatNumber}H${idx + 1}:BLACKJACK`);
      }
    }
  }

  const allHands = seats.flatMap((seat) => seat.hands);
  const allResolvedWithoutDealer = allHands.every((hand) => {
    const total = calculateHandValue(hand.cards).total;
    return hand.surrendered || total > 21;
  });

  const finalDealer = allResolvedWithoutDealer
    ? dealerCards
    : playDealer([...dealerCards], room.gameRules.dealerHitsSoft17, () => dealCard(state));

  const dealerValue = calculateHandValue(finalDealer, true);

  for (const hand of allHands) {
    if (hand.surrendered) {
      state.bankroll += hand.bet / 2;
      continue;
    }

    const playerValue = calculateHandValue(hand.cards, true);
    const ruleHand: Hand = {
      ...toRuleHand(hand.cards, hand.bet),
      isSplit: hand.isSplit,
      isDoubleDown: hand.isDoubleDown,
      isBurned: hand.isBurned,
      isFreeActionDouble: hand.isFreeDouble,
      isFreeActionSplit: hand.isFreeSplit,
      isSurrendered: hand.surrendered,
    };
    const ruleResult = rules.evaluateHand(ruleHand, playerValue, finalDealer, dealerValue);

    if (ruleResult.status === HandStatus.WON || ruleResult.status === HandStatus.BLACKJACK) {
      state.bankroll += hand.bet + hand.bet * ruleResult.payoutMultiplier;
      continue;
    }
    if (ruleResult.status === HandStatus.PUSH) {
      state.bankroll += hand.bet;
    }
  }

  const roundProfit = state.bankroll - bankrollBeforeRound;
  const outcome: RoundResult['outcome'] = roundProfit > 0 ? 'win' : roundProfit < 0 ? 'loss' : 'push';
  const dealerTotal = calculateHandValue(finalDealer, true).total;
  const playerTotals = allHands.map((hand) => {
    if (hand.surrendered) return -1;
    return calculateHandValue(hand.cards, true).total;
  });

  const flattenedActions = seats.flatMap((seat) => seat.actionTrace);

  const playerHands = seats.flatMap((seat) =>
    seat.hands.map((hand, handIdx) => ({
      seatNumber: seat.seatNumber,
      handNumber: handIdx + 1,
      total: hand.surrendered ? -1 : calculateHandValue(hand.cards, true).total,
      surrendered: hand.surrendered,
      cards: hand.cards.map(mapCardView),
    })),
  );

  if (flattenedActions.length === 0 && blackjacks > 0) {
    flattenedActions.push('BLACKJACK');
  }

  if (outcome === 'win') {
    state.bettingState = bettingSystem.onWin(state.bettingState);
  } else if (outcome === 'loss') {
    state.bettingState = bettingSystem.onLoss(state.bettingState);
  } else {
    state.bettingState = bettingSystem.onPush(state.bettingState);
  }

  state.bettingState.previousBet = nextBet;

  return {
    bankrollAfter: state.bankroll,
    roundProfit,
    roundBet: totalRoundBet,
    outcome,
    blackjackCount: blackjacks,
    handHistoryEntry: {
      handNumber,
      outcome,
      bet: totalRoundBet,
      profit: roundProfit,
      bankrollAfter: state.bankroll,
      dealerTotal,
      playerTotals,
      blackjacks,
      actions: flattenedActions,
      dealerCards: finalDealer.map(mapCardView),
      playerHands,
    },
  };
}

function calcSummary(metrics: EngineMetrics, handIndex: number, initialBankroll: number): SimulatorSummaryMetrics {
  const totalRounds = Math.max(1, handIndex);
  const variance = Math.max(0, metrics.profitSquares / totalRounds - (metrics.totalProfit / totalRounds) ** 2);
  const profitFactor = metrics.grossLossAbs === 0
    ? (metrics.grossWinProfit > 0 ? Number.POSITIVE_INFINITY : 0)
    : metrics.grossWinProfit / metrics.grossLossAbs;
  return {
    winRate: metrics.roundsWon / totalRounds,
    evPerHand: metrics.totalProfit / totalRounds,
    profit: metrics.totalProfit,
    maxDrawdown: metrics.maxDrawdown,
    longestLosingStreak: metrics.longestLosingStreak,
    averageBet: metrics.totalBet / totalRounds,
    bankrollAtRiskPct: Math.min(1, metrics.maxDrawdown / Math.max(1, initialBankroll)),
    variancePerHand: variance,
    profitFactor,
  };
}

function createHistoryRecord(state: EngineState, result: SimulatorResult): MatchRecord {
  const outcomeStatus = result.pnl > 0 ? HandStatus.WON : result.pnl < 0 ? HandStatus.LOST : HandStatus.PUSH;
  const room = getRoomConfig(state.config.roomId);
  return {
    id: `sim-${Date.now()}`,
    timestamp: Date.now(),
    roomId: state.config.roomId,
    simulator: true,
    simulatorSummary: {
      handCount: result.handCount,
      pnl: result.pnl,
      roi: result.roi,
      winRate: result.winRate,
      maxDrawdown: result.maxDrawdown,
      bettingSystem: state.config.bettingSystem,
      playDecisionSource: state.config.playDecisionSource,
      roomName: room.name,
      seatCount: state.config.seatCount,
    },
    simulatorHandHistory: result.handHistory,
    seats: [
      {
        seatId: 1,
        hands: [
          {
            betAmount: Math.round(result.averageBet),
            result: outcomeStatus,
            payout: result.pnl,
            cards: [],
          },
        ],
      },
    ],
    dealerCards: [],
    bankrollBefore: state.initialBankroll,
    bankrollAfter: result.endingBankroll,
  };
}

export function createSimulatorEngine(config: SimulatorConfig, seedInput?: number): SimulatorEngine {
  const cappedMaxHands = Math.min(5000, Math.max(1, config.maxHands));
  const effectiveConfig: SimulatorConfig = {
    ...config,
    maxHands: cappedMaxHands,
  };
  const room = getRoomConfig(effectiveConfig.roomId);
  const random = createRng(seedInput);
  const shoe = createShoe(room.gameRules.numberOfDecks, room.gameRules.omitTens ?? false, random);
  const decisionPolicy = createDecisionPolicy(effectiveConfig.playDecisionSource, effectiveConfig.customRiskLevel);

  const state: EngineState = {
    config: effectiveConfig,
    random,
    bankroll: effectiveConfig.initialBankroll,
    initialBankroll: effectiveConfig.initialBankroll,
    handIndex: 0,
    shoe,
    bettingState: {
      baseUnit: effectiveConfig.baseUnit,
      previousBet: effectiveConfig.baseUnit,
      previousOutcome: null,
      progressionIndex: 0,
    },
    decisionPolicy,
    metrics: {
      roundsWon: 0,
      roundsLost: 0,
      roundsPush: 0,
      blackjacks: 0,
      totalBet: 0,
      totalProfit: 0,
      grossWinProfit: 0,
      grossLossAbs: 0,
      longestLosingStreak: 0,
      currentLosingStreak: 0,
      peak: effectiveConfig.initialBankroll,
      maxDrawdown: 0,
      profitSquares: 0,
    },
    equityCurve: [effectiveConfig.initialBankroll],
    drawdownCurve: [0],
    eventLog: [`[INFO] Simulation started in ${room.name}.`, `[INFO] Decision mode: ${effectiveConfig.playDecisionSource}.`],
    handHistory: [],
    eventFlags: {
      drawdown10: false,
      drawdown25: false,
      lowBankrollWarned: false,
    },
  };

  const updateMetrics = (round: RoundResult) => {
    state.handIndex += 1;
    state.metrics.totalBet += round.roundBet;
    state.metrics.totalProfit += round.roundProfit;
    state.metrics.profitSquares += round.roundProfit ** 2;
    state.metrics.blackjacks += round.blackjackCount;
    if (round.roundProfit > 0) {
      state.metrics.grossWinProfit += round.roundProfit;
    }
    if (round.roundProfit < 0) {
      state.metrics.grossLossAbs += Math.abs(round.roundProfit);
    }

    if (round.outcome === 'win') {
      state.metrics.roundsWon += 1;
      state.metrics.currentLosingStreak = 0;
    } else if (round.outcome === 'loss') {
      state.metrics.roundsLost += 1;
      state.metrics.currentLosingStreak += 1;
      state.metrics.longestLosingStreak = Math.max(
        state.metrics.longestLosingStreak,
        state.metrics.currentLosingStreak,
      );
    } else {
      state.metrics.roundsPush += 1;
      state.metrics.currentLosingStreak = 0;
    }

    const previousPeak = state.metrics.peak;
    state.metrics.peak = Math.max(state.metrics.peak, state.bankroll);
    const drawdown = state.metrics.peak - state.bankroll;
    state.metrics.maxDrawdown = Math.max(state.metrics.maxDrawdown, drawdown);

    state.equityCurve.push(state.bankroll);
    state.drawdownCurve.push(drawdown);
    state.handHistory.push(round.handHistoryEntry);

    if (state.metrics.peak > previousPeak) {
      state.eventLog.push(`[MILESTONE] Hand ${state.handIndex}: new equity peak at ${state.bankroll.toFixed(0)}.`);
    }
    if (state.handIndex % 50 === 0) {
      state.eventLog.push(`[MILESTONE] Hand ${state.handIndex}: run checkpoint reached.`);
    }
    if (state.metrics.currentLosingStreak === 3) {
      state.eventLog.push(`[WARN] Hand ${state.handIndex}: losing streak reached 3.`);
    }
    if (round.outcome === 'win' && round.roundProfit > state.config.baseUnit * 4) {
      state.eventLog.push(`[INFO] Hand ${state.handIndex}: strong win +${round.roundProfit.toFixed(0)}.`);
    }

    const drawdownPct = drawdown / Math.max(1, state.initialBankroll);
    if (drawdownPct >= 0.1 && !state.eventFlags.drawdown10) {
      state.eventFlags.drawdown10 = true;
      state.eventLog.push('[WARN] Drawdown breached 10% of initial bankroll.');
    }
    if (drawdownPct >= 0.25 && !state.eventFlags.drawdown25) {
      state.eventFlags.drawdown25 = true;
      state.eventLog.push('[WARN] Drawdown breached 25% of initial bankroll.');
    }
    if (state.bankroll <= state.config.baseUnit * 3 && !state.eventFlags.lowBankrollWarned) {
      state.eventFlags.lowBankrollWarned = true;
      state.eventLog.push('[WARN] Bankroll is below 3 base units.');
    }
  };

  const stopReached = (): boolean => {
    if (state.bankroll <= Math.max(0, state.config.stopLoss)) {
      state.eventLog.push(`[STOP] Bankroll hit stop-loss (${state.config.stopLoss}).`);
      return true;
    }
    if (state.bankroll >= state.initialBankroll * state.config.targetMultiplier) {
      state.eventLog.push(`[STOP] Target multiplier ${state.config.targetMultiplier}x reached.`);
      return true;
    }
    if (state.handIndex >= state.config.maxHands) {
      state.eventLog.push(`[STOP] Max hands (${state.config.maxHands}) reached.`);
      return true;
    }
    const roomCfg = getRoomConfig(state.config.roomId);
    const seatCount = Math.min(5, Math.max(1, state.config.seatCount ?? 1));
    const minSeatOpening = roomCfg.id === 'exchange_21' ? roomCfg.betRange[0] * 2 : roomCfg.betRange[0];
    const minOpeningTotal = minSeatOpening * seatCount;
    if (state.bankroll < Math.max(state.config.baseUnit, minOpeningTotal)) {
      state.eventLog.push('[STOP] Bankroll too low for next hand.');
      return true;
    }
    return false;
  };

  return {
    getState: () => state,
    step: () => {
      if (stopReached()) {
        return {
          runState: {
            status: 'done',
            currentHandIndex: state.handIndex,
            bankrollCurrent: state.bankroll,
            peak: state.metrics.peak,
            trough: Math.min(...state.equityCurve),
            streakWin: 0,
            streakLose: state.metrics.currentLosingStreak,
            summary: calcSummary(state.metrics, state.handIndex, state.initialBankroll),
          },
          done: true,
        };
      }

      const round = runRound(state);
      updateMetrics(round);

      const done = stopReached();

      return {
        runState: {
          status: done ? 'done' : 'running',
          currentHandIndex: state.handIndex,
          bankrollCurrent: state.bankroll,
          peak: state.metrics.peak,
          trough: Math.min(...state.equityCurve),
          streakWin: round.outcome === 'win' ? 1 : 0,
          streakLose: state.metrics.currentLosingStreak,
          summary: calcSummary(state.metrics, state.handIndex, state.initialBankroll),
        },
        done,
      };
    },
    finish: () => {
      const handCount = Math.max(1, state.handIndex);
      const variance = Math.max(0, state.metrics.profitSquares / handCount - (state.metrics.totalProfit / handCount) ** 2);
      const profitFactor = state.metrics.grossLossAbs === 0
        ? (state.metrics.grossWinProfit > 0 ? Number.POSITIVE_INFINITY : 0)
        : state.metrics.grossWinProfit / state.metrics.grossLossAbs;
      const bankrollAtRiskPct = Math.min(1, state.metrics.maxDrawdown / Math.max(1, state.initialBankroll));

      const result: SimulatorResult = {
        endingBankroll: state.bankroll,
        pnl: state.bankroll - state.initialBankroll,
        roi: state.initialBankroll === 0 ? 0 : (state.bankroll - state.initialBankroll) / state.initialBankroll,
        handCount: state.handIndex,
        reachedTarget: state.bankroll >= state.initialBankroll * state.config.targetMultiplier,
        busted: state.bankroll <= state.config.stopLoss || state.bankroll <= 0,
        winRate:
          state.handIndex === 0 ? 0 : state.metrics.roundsWon / Math.max(1, state.metrics.roundsWon + state.metrics.roundsLost + state.metrics.roundsPush),
        pushRate:
          state.handIndex === 0 ? 0 : state.metrics.roundsPush / Math.max(1, state.metrics.roundsWon + state.metrics.roundsLost + state.metrics.roundsPush),
        blackjackRate: state.handIndex === 0 ? 0 : state.metrics.blackjacks / state.handIndex,
        maxDrawdown: state.metrics.maxDrawdown,
        volatilityProxy: Math.sqrt(variance),
        riskOfRuinEstimate: state.bankroll <= state.config.stopLoss ? 1 : Math.min(1, state.metrics.maxDrawdown / Math.max(1, state.initialBankroll)),
        averageBet: state.metrics.totalBet / handCount,
        averageProfitPerHand: state.metrics.totalProfit / handCount,
        variancePerHand: variance,
        profitFactor,
        bankrollAtRiskPct,
        longestLosingStreak: state.metrics.longestLosingStreak,
        equityCurve: [...state.equityCurve],
        drawdownCurve: [...state.drawdownCurve],
        eventLog: [...state.eventLog],
        handHistory: [...state.handHistory],
      };

      result.simulatorHistoryRecord = createHistoryRecord(state, result);
      return result;
    },
  };
}

