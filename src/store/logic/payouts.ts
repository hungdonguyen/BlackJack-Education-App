import { GameStore, GamePhase, MatchRecord } from '@/types/game';
import { HandStatus } from '@/types/enums';
import { getRoomConfig } from '@/utils/rooms';
import { calculateHandValue, isBlackjack } from '@/utils/hand';
import { getRules } from '@/rules';
import { evaluateSideBets } from './sideBets';

const SIDE_BET_PAYOUTS: Record<number, number> = {
    1: 3, 2: 10, 3: 40, 4: 100, 5: 150, 6: 250, 7: 250, 8: 250,
};

export const calculatePayoutsLogic = (set: any, get: () => GameStore) => {
    const state = get();
    if (state.gamePhase !== GamePhase.PAYOUT) return;

    const dealerValue = calculateHandValue(state.dealerHand.cards);
    
    let totalStaked = 0;
    let totalBurnPayout = 0;
    state.seats.forEach(seat => {
      if (!seat.isActive) return;
      seat.hands.forEach(hand => {
        totalStaked += (hand.betAmount - (hand.freeActionBetAmount || 0));
        if (hand.burnWagerAmount) totalStaked += hand.burnWagerAmount;
        if (hand.burnWagerPayout) totalBurnPayout += hand.burnWagerPayout;
      });
      if (state.insuranceBets[seat.id]) totalStaked += state.insuranceBets[seat.id];
      if (state.sideBets[seat.id]) totalStaked += state.sideBets[seat.id];
    });

    const bankrollBefore = state.bankroll + totalStaked - totalBurnPayout;
    let totalPayout = 0;
    const rules = getRules(state.currentRoom);
    
    const insuranceBets = state.insuranceBets;
    const dealerBlackjack = isBlackjack(state.dealerHand.cards);
    const insurancePayouts: Record<number, number> = {};
    if (dealerBlackjack) {
      for (const [seatIdStr, amount] of Object.entries(insuranceBets)) {
        const seatId = Number(seatIdStr);
        const payout = amount * 3;
        totalPayout += payout;
        insurancePayouts[seatId] = payout;
      }
    }

    const updatedSeats = state.seats.map((seat) => {
      if (!seat.isActive) return seat;
      return {
        ...seat,
        hands: seat.hands.map((hand, handIdx) => {
          if (hand.betAmount === 0) return hand;
          const playerValue = calculateHandValue(hand.cards);
          const freeBet = hand.freeActionBetAmount || 0;

          if (hand.status === HandStatus.BUST || hand.status === HandStatus.WON || hand.status === HandStatus.SURRENDERED) {
            if (hand.status === HandStatus.WON) {
              const evaluation = rules.evaluateHand(hand, playerValue, state.dealerHand.cards, dealerValue, handIdx, seat.hands.length);
              totalPayout += (hand.betAmount - freeBet) + (hand.betAmount * evaluation.payoutMultiplier);
            }
            return {
              ...hand,
              status: hand.status === HandStatus.BUST ? HandStatus.LOST
                : hand.status === HandStatus.SURRENDERED ? HandStatus.SURRENDERED
                : HandStatus.WON,
            };
          }

          const evaluation = rules.evaluateHand(hand, playerValue, state.dealerHand.cards, dealerValue, handIdx, seat.hands.length);
          if (evaluation.status === HandStatus.WON || evaluation.status === HandStatus.BLACKJACK) {
            totalPayout += (hand.betAmount - freeBet) + (hand.betAmount * evaluation.payoutMultiplier);
          } else if (evaluation.status === HandStatus.PUSH) {
            totalPayout += (hand.betAmount - freeBet);
          }
          return { ...hand, status: evaluation.status };
        }),
      };
    });

    const sideBetPayouts = evaluateSideBets(state, updatedSeats, dealerValue);
    for (const payout of Object.values(sideBetPayouts)) {
        totalPayout += payout;
    }

    const bankrollAfter = state.bankroll + totalPayout;

    const dealerPush22 = rules.evaluateHand({ cards: [], betAmount: 0, status: HandStatus.PLAYING } as any, { total: 0, isSoft: false }, state.dealerHand.cards, dealerValue).metadata?.dealerPush22;

    const matchRecord: MatchRecord = {
      id: `match-${Date.now()}`,
      timestamp: Date.now(),
      roomId: state.currentRoom,
      dealerPush22,
      seats: updatedSeats
        .filter((s) => s.isActive)
        .map((seat) => ({
          seatId: seat.id,
          insuranceCost: state.insuranceBets[seat.id],
          insurancePayout: insurancePayouts[seat.id],
          sideBetAmount: state.sideBets[seat.id],
          sideBetPayout: sideBetPayouts[seat.id],
          freeActionTokens: seat.freeActionTokens,
          hands: seat.hands
            .filter((h) => h.betAmount > 0)
            .map((hand, handIdx) => {
              const freeAmt = hand.freeActionBetAmount || 0;
              const playerValue = calculateHandValue(hand.cards);
              const evaluation = hand.status === HandStatus.SURRENDERED
                ? null
                : rules.evaluateHand(hand, playerValue, state.dealerHand.cards, dealerValue, handIdx, seat.hands.length);
              return {
                betAmount: (hand.betAmount - freeAmt) + (hand.burnWagerAmount || 0),
                freeActionBetAmount: freeAmt,
                result: hand.status,
                payout:
                  (hand.status === HandStatus.WON || hand.status === HandStatus.BLACKJACK
                    ? hand.betAmount * (evaluation?.payoutMultiplier ?? 1)
                    : hand.status === HandStatus.PUSH
                    ? 0
                    : hand.status === HandStatus.SURRENDERED
                    ? -(hand.betAmount / 2)
                    : -(hand.betAmount - freeAmt)),
                isSplit: hand.isSplit,
                isFreeActionSplit: hand.isFreeActionSplit,
                isDoubleDown: hand.isDoubleDown,
                doubleCount: hand.doubleCount,
                isSuitedBJ: evaluation?.metadata?.isSuitedBJ,
                isFreeActionDouble: hand.isFreeActionDouble,
                isSwitched: hand.isSwitched,
                cards: hand.cards.map((c) => ({ suit: c.suit, rank: c.rank })),
                zappedCards: hand.zappedCards?.map((c) => ({ suit: c.suit, rank: c.rank })),
                isBurned: hand.isBurned,
                burnedCard: hand.burnedCard ? { suit: hand.burnedCard.suit, rank: hand.burnedCard.rank } : undefined,
                burnWagerAmount: hand.burnWagerAmount,
                burnWagerPayout: hand.burnWagerPayout,
              };
            }),
        })),
      dealerCards: state.dealerHand.cards.map((c) => ({
        suit: c.suit,
        rank: c.rank,
      })),
      bankrollBefore,
      bankrollAfter,
    };
    
    const isTutorial = getRoomConfig(state.currentRoom).isTutorial;
    
    const MAX_STORE_HISTORY = 500;
    const newHistory = isTutorial ? state.matchHistory : [...state.matchHistory, matchRecord];
    if (newHistory.length > MAX_STORE_HISTORY) {
        newHistory.splice(0, newHistory.length - MAX_STORE_HISTORY);
    }

    set({
      seats: updatedSeats,
      bankroll: isTutorial ? state.bankroll : bankrollAfter,
      tutorialBalance: isTutorial ? state.tutorialBalance + totalPayout : state.tutorialBalance,
      matchHistory: newHistory,
      lastCompletedMatch: matchRecord,
      totalBetSinceLastClaim: isTutorial ? (state.totalBetSinceLastClaim || 0) : (state.totalBetSinceLastClaim || 0) + totalStaked,
    });

    get().checkAchievements(matchRecord);
};


