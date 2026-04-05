import { GameStore, Hand, Card, GamePhase } from '@/types/game';
import { HandStatus } from '@/types/enums';
import { getRoomConfig } from '@/utils/rooms';
import { getRules } from '@/rules';
import { calculateHandValue } from '@/utils/hand';
import { dealCard, dealForcedCard, createShoe, shuffleShoe } from '@/utils/deck';
import { checkTutorialAction } from '@/utils/tutorialInterceptor';

export const splitLogic = (set: any, get: () => GameStore) => {
    const state = get();
    set({ actionCounter: state.actionCounter + 1 });
    if (state.gamePhase !== GamePhase.PLAYER_TURN) return;
    if (!checkTutorialAction(state, 'action-split')) return;

    const seat = state.seats[state.currentSeatIndex];
    if (!seat) return;
    if (seat.hands.length >= 4) return;

    const currentHand = seat.hands[seat.currentHandIndex];
    if (!currentHand || currentHand.status !== HandStatus.PLAYING) return;

    const rules = getRules(state.currentRoom);
    const { allowed, isFree, cost } = rules.canSplit(currentHand, seat.hands.length);

    if (!allowed) return;
    if (!isFree && !state.canAfford(cost)) return;

    const splitBet = currentHand.betAmount;
    let shoe = [...state.shoe];
    let forcedShoe = state.forcedShoe ? [...state.forcedShoe] : null;

    const card1 = currentHand.cards[0];
    const card2 = currentHand.cards[1];

    const dealFromSource = (): Card => {
      if (forcedShoe && forcedShoe.length > 0) return dealForcedCard(shoe, forcedShoe);
      return dealCard(shoe);
    };

    if (!forcedShoe && shoe.length < 2) {
      const roomCfg = getRoomConfig(state.currentRoom);
      const numDecks = roomCfg.gameRules.numberOfDecks;
      const omitTens = roomCfg.gameRules.omitTens;
      const newShoe = shuffleShoe(createShoe(numDecks, omitTens));
      shoe = [...shoe, ...newShoe];
    }

    const newCard1 = dealFromSource();
    const newCard2 = dealFromSource();
    const isSplitAces = card1.value === 11;
    const restrictSplitAces = state.currentRoom !== 'iberian_21';
    const locksAfterSplit = isSplitAces && restrictSplitAces;

    const is21Hand1 = calculateHandValue([card1, newCard1]).total === 21;
    const is21Hand2 = calculateHandValue([card2, newCard2]).total === 21;
    const isIberian = state.currentRoom === 'iberian_21';
    const initialStatus1 = (isIberian && is21Hand1) ? HandStatus.WON : (locksAfterSplit || is21Hand1) ? HandStatus.STAND : HandStatus.PLAYING;
    const initialStatus2 = (isIberian && is21Hand2) ? HandStatus.WON : (locksAfterSplit || is21Hand2) ? HandStatus.STAND : HandStatus.PLAYING;

    const hand1: Hand = {
      ...currentHand,
      id: `seat-${seat.id}-hand-${Date.now()}-1`,
      cards: [card1, newCard1],
      betAmount: splitBet,
      status: initialStatus1,
      isAceSplit: locksAfterSplit,
      isFreeActionSplit: isFree ? true : currentHand.isFreeActionSplit,
      isSplit: true,
    };

    const hand2: Hand = {
      ...currentHand,
      id: `seat-${seat.id}-hand-${Date.now()}-2`,
      cards: [card2, newCard2],
      betAmount: splitBet,
      status: initialStatus2,
      freeActionBetAmount: isFree ? splitBet : currentHand.freeActionBetAmount,
      isAceSplit: locksAfterSplit,
      isFreeActionSplit: isFree ? true : currentHand.isFreeActionSplit,
      isSplit: true,
      burnWagerAmount: undefined,
      burnWagerPayout: undefined,
    };

    const newTokens = isFree ? (seat.freeActionTokens || 0) + 1 : (seat.freeActionTokens || 0);

    const updatedSeats = state.seats.map((s, seatIdx) => {
      if (seatIdx !== state.currentSeatIndex) return s;
      const newHands = [...s.hands];
      newHands.splice(seat.currentHandIndex, 1, hand1, hand2);
      return { ...s, hands: newHands, currentHandIndex: seat.currentHandIndex, freeActionTokens: newTokens };
    });

    const isTutorial = getRoomConfig(state.currentRoom).isTutorial;
    set({
      shoe,
      seats: updatedSeats,
      bankroll: isTutorial || isFree ? state.bankroll : state.bankroll - cost,
      tutorialBalance: isTutorial && !isFree ? state.tutorialBalance - cost : state.tutorialBalance,
      forcedShoe: forcedShoe ? [...forcedShoe] : null,
    });

    if (hand1.status !== HandStatus.PLAYING) {
      setTimeout(() => get().advanceToNextHand(), 0);
    }
};
