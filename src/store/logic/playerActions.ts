import { GameStore, Hand, Card, GamePhase } from '@/types/game';
import { HandStatus, Rank, Suit } from '@/types/enums';
import { getRoomConfig } from '@/utils/rooms';
import { getRules } from '@/rules';
import { calculateHandValue, isBust, isBlackjack } from '@/utils/hand';
import { dealCard, createShoe, shuffleShoe } from '@/utils/deck';
import { checkTutorialAction } from '@/utils/tutorialInterceptor';
import { getCurrentHand } from './utils';

export const advanceToNextHandLogic = (set: any, get: () => GameStore) => {
    const state = get();
    const currentSeat = state.seats[state.currentSeatIndex];

    if (!currentSeat) {
      set({ gamePhase: GamePhase.DEALER_TURN });
      setTimeout(() => get().dealerPlay(), 0);
      return;
    }

    let foundNextHand = false;
    for (let hIdx = currentSeat.currentHandIndex + 1; hIdx < currentSeat.hands.length; hIdx++) {
      const nextHand = currentSeat.hands[hIdx];
      if (nextHand.betAmount > 0 && nextHand.status === HandStatus.PLAYING) {
        set((s: any) => ({
          seats: s.seats.map((seat: any, idx: number) =>
            idx === state.currentSeatIndex
              ? { ...seat, currentHandIndex: hIdx }
              : seat
          ),
        }));
        foundNextHand = true;
        break;
      }
    }
    if (foundNextHand) return;

    for (let i = state.currentSeatIndex + 1; i < state.seats.length; i++) {
        const seat = state.seats[i];
        if (seat.isActive && seat.hands.some((h) => h.betAmount > 0 && h.status === HandStatus.PLAYING)) {
          set({
            currentSeatIndex: i,
            seats: state.seats.map((s, idx) =>
              idx === i ? { ...s, currentHandIndex: 0 } : s
            ),
          });
          return;
        }
    }

    set({ gamePhase: GamePhase.DEALER_TURN });
    setTimeout(() => get().dealerPlay(), 0);
};

export const hitLogic = (set: any, get: () => GameStore) => {
    const state = get();
    if (state.gamePhase !== GamePhase.PLAYER_TURN) return;
    if (!checkTutorialAction(state, 'action-hit')) return;

    const currentHand = getCurrentHand(state);
    if (!currentHand || currentHand.status !== HandStatus.PLAYING || currentHand.isDoubleDown) return;

    set({ actionCounter: state.actionCounter + 1 });

    let shoe = [...state.shoe];
    let forcedShoe = state.forcedShoe ? [...state.forcedShoe] : null;

    const card = (forcedShoe && forcedShoe.length > 0) ? forcedShoe.pop()! : dealCard(shoe);
    const newCard = card;

    const updatedSeats = state.seats.map((seat, seatIdx) => {
      if (seatIdx !== state.currentSeatIndex) return seat;
      return {
        ...seat,
        hands: seat.hands.map((hand, handIdx) => {
          if (handIdx !== seat.currentHandIndex) return hand;

          const newCards = [...hand.cards, newCard];
          const busted = isBust(newCards);
          const is21 = !busted && calculateHandValue(newCards).total === 21;
          const mustStand = hand.isAceSplit || is21;
          const isIberian = state.currentRoom === 'iberian_21';
          const isImmediateWin = isIberian && is21;

          return {
            ...hand,
            cards: newCards,
            status: busted ? HandStatus.BUST : isImmediateWin ? HandStatus.WON : mustStand ? HandStatus.STAND : HandStatus.PLAYING,
          };
        }),
      };
    });

    set({ shoe, seats: updatedSeats, forcedShoe: forcedShoe ? [...forcedShoe] : null });

    const updatedHand = updatedSeats[state.currentSeatIndex].hands[updatedSeats[state.currentSeatIndex].currentHandIndex];
    if (updatedHand.status !== HandStatus.PLAYING) {
      setTimeout(() => get().advanceToNextHand(), 0);
    }
};

export const standLogic = (set: any, get: () => GameStore) => {
    const state = get();
    if (state.gamePhase !== GamePhase.PLAYER_TURN) return;
    if (!checkTutorialAction(state, 'action-stand')) return;

    const currentSeat = state.seats[state.currentSeatIndex];
    if (!currentSeat) return;
    const currentHand = currentSeat.hands[currentSeat.currentHandIndex];
    if (!currentHand) return;

    const isBJ = currentHand.status === HandStatus.BLACKJACK;
    const rules = getRules(state.currentRoom);
    const canSwitch = rules.canSwitch && rules.canSwitch(currentSeat).allowed;

    if (currentHand.status !== HandStatus.PLAYING && !(isBJ && canSwitch)) return;

    const updatedSeats = state.seats.map((seat, seatIdx) => {
      if (seatIdx !== state.currentSeatIndex) return seat;
      return {
        ...seat,
        hands: seat.hands.map((hand, handIdx) => {
          if (handIdx !== seat.currentHandIndex) return hand;
          return { ...hand, status: HandStatus.STAND };
        }),
      };
    });

    set({ seats: updatedSeats });
    get().advanceToNextHand();
};

export const doubleDownLogic = (set: any, get: () => GameStore) => {
    const state = get();
    if (state.gamePhase !== GamePhase.PLAYER_TURN) return;
    if (!checkTutorialAction(state, 'action-double')) return;

    const currentHand = getCurrentHand(state);
    set({ actionCounter: state.actionCounter + 1 });
    if (!currentHand || currentHand.status !== HandStatus.PLAYING) return;

    const seat = state.seats[state.currentSeatIndex];
    if (!seat) return;

    const roomCfg = getRoomConfig(state.currentRoom);
    const rules = getRules(state.currentRoom);
    const { allowed, isFree, cost } = rules.canDoubleDown(currentHand);

    if (!allowed) return;
    if (!isFree && !state.canAfford(cost)) return;

    let shoe = [...state.shoe];
    let forcedShoe = state.forcedShoe ? [...state.forcedShoe] : null;

    if (!forcedShoe && shoe.length === 0) {
      const numDecks = roomCfg.gameRules.numberOfDecks;
      const omitTens = roomCfg.gameRules.omitTens;
      shoe = shuffleShoe(createShoe(numDecks, omitTens));
    }

    const newCard = (forcedShoe && forcedShoe.length > 0) ? forcedShoe.pop()! : dealCard(shoe);

    const updatedSeats = state.seats.map((seat, seatIdx) => {
      if (seatIdx !== state.currentSeatIndex) return seat;
      const newTokens = isFree ? (seat.freeActionTokens || 0) + 1 : (seat.freeActionTokens || 0);
      return {
        ...seat,
        freeActionTokens: newTokens,
        hands: seat.hands.map((hand, handIdx) => {
          if (handIdx !== seat.currentHandIndex) return hand;
          const newCards = [...hand.cards, newCard];
          const busted = isBust(newCards);
          const is21 = !busted && calculateHandValue(newCards).total === 21;
          const isIberian = state.currentRoom === 'iberian_21';
          const isImmediateWin = isIberian && is21;

          return {
            ...hand,
            cards: newCards,
            betAmount: hand.betAmount + (isFree ? hand.betAmount : cost),
            status: busted ? HandStatus.BUST : isImmediateWin ? HandStatus.WON : (is21 || !roomCfg.gameRules.allowDoubleDownRescue) ? HandStatus.STAND : HandStatus.PLAYING,
            isDoubleDown: true,
            isFreeActionDouble: isFree ? true : hand.isFreeActionDouble,
            freeActionBetAmount: isFree ? (hand.freeActionBetAmount || 0) + hand.betAmount : hand.freeActionBetAmount,
          };
        }),
      };
    });

    const isTutorial = getRoomConfig(state.currentRoom).isTutorial;
    set({
      shoe,
      seats: updatedSeats,
      bankroll: isTutorial || isFree ? state.bankroll : state.bankroll - cost,
      tutorialBalance: isTutorial && !isFree ? state.tutorialBalance - cost : state.tutorialBalance,
      forcedShoe: forcedShoe ? [...forcedShoe] : null,
    });

    const updatedHand = updatedSeats[state.currentSeatIndex].hands[state.seats[state.currentSeatIndex].currentHandIndex];
    if (updatedHand.status !== HandStatus.PLAYING) {
      setTimeout(() => get().advanceToNextHand(), 0);
    }
};

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
      if (forcedShoe && forcedShoe.length > 0) return forcedShoe.pop()!;
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

export const surrenderLogic = (set: any, get: () => GameStore) => {
    const state = get();
    if (state.gamePhase !== GamePhase.PLAYER_TURN) return;
    if (!checkTutorialAction(state, 'action-surrender')) return;

    const currentHand = getCurrentHand(state);
    if (!currentHand || currentHand.status !== HandStatus.PLAYING) return;

    const rules = getRules(state.currentRoom);
    const { allowed } = rules.canSurrender(currentHand);
    if (!allowed) return;

    const refund = currentHand.betAmount / 2;
    const updatedSeats = state.seats.map((seat, seatIdx) => {
      if (seatIdx !== state.currentSeatIndex) return seat;
      return {
        ...seat,
        hands: seat.hands.map((hand, handIdx) => {
          if (handIdx !== seat.currentHandIndex) return hand;
          return { ...hand, status: HandStatus.SURRENDERED, isSurrendered: true };
        }),
      };
    });

    const isTutorial = getRoomConfig(state.currentRoom).isTutorial;
    set({
      seats: updatedSeats,
      bankroll: isTutorial ? state.bankroll : state.bankroll + refund,
      tutorialBalance: isTutorial ? state.tutorialBalance + refund : state.tutorialBalance,
    });

    get().advanceToNextHand();
};

export const zapLogic = (set: any, get: () => GameStore) => {
    const state = get();
    set({ actionCounter: state.actionCounter + 1 });
    if (state.gamePhase !== GamePhase.PLAYER_TURN) return;
    if (!checkTutorialAction(state, 'action-zap')) return;

    const seat = state.seats[state.currentSeatIndex];
    if (!seat) return;
    const currentHand = seat.hands[seat.currentHandIndex];
    if (!currentHand || currentHand.status !== HandStatus.PLAYING) return;

    const rules = getRules(state.currentRoom);
    if (!rules.canZap) return;
    const { allowed } = rules.canZap(currentHand);
    if (!allowed) return;

    let shoe = [...state.shoe];
    if (shoe.length < 2) {
      const roomCfg = getRoomConfig(state.currentRoom);
      shoe = [...shoe, ...shuffleShoe(createShoe(roomCfg.gameRules.numberOfDecks, roomCfg.gameRules.omitTens))];
    }

    const newCards = [dealCard(shoe), dealCard(shoe)];
    const busted = isBust(newCards);
    const is21 = !busted && calculateHandValue(newCards).total === 21;

    const updatedSeats = state.seats.map((s, seatIdx) => {
      if (seatIdx !== state.currentSeatIndex) return s;
      const newHands = [...s.hands];
      newHands[seat.currentHandIndex] = {
        ...currentHand,
        id: `${currentHand.id}-zap`,
        cards: newCards,
        zappedCards: currentHand.cards,
        isZapped: true,
        status: busted ? HandStatus.BUST : (is21 ? HandStatus.STAND : HandStatus.PLAYING),
      };
      return { ...s, hands: newHands };
    });

    set({ shoe, seats: updatedSeats });

    const updatedHand = updatedSeats[state.currentSeatIndex].hands[seat.currentHandIndex];
    if (updatedHand.status !== HandStatus.PLAYING) {
       setTimeout(() => get().advanceToNextHand(), 0);
    }
};

export const burnLogic = (set: any, get: () => GameStore) => {
    const state = get();
    set({ actionCounter: state.actionCounter + 1 });
    if (state.gamePhase !== GamePhase.PLAYER_TURN) return;
    if (!checkTutorialAction(state, 'action-burn')) return;

    const seat = state.seats[state.currentSeatIndex];
    if (!seat) return;
    const currentHand = seat.hands[seat.currentHandIndex];
    if (!currentHand || currentHand.status !== HandStatus.PLAYING) return;

    const rules = getRules(state.currentRoom);
    if (!rules.canBurn) return;
    const { allowed, cost } = rules.canBurn(currentHand);
    if (!allowed || !state.canAfford(cost)) return;

    let shoe = [...state.shoe];
    if (shoe.length < 2) {
      const roomCfg = getRoomConfig(state.currentRoom);
      shoe = [...shoe, ...shuffleShoe(createShoe(roomCfg.gameRules.numberOfDecks, roomCfg.gameRules.omitTens))];
    }

    const discardedCard = currentHand.cards[1];
    const newCards = [currentHand.cards[0], dealCard(shoe)];

    let bankrollDelta = -cost;
    let burnBonusPayout = 0;
    if (discardedCard.rank === Rank.ACE) {
      burnBonusPayout = discardedCard.suit === Suit.SPADES ? cost * 8 : cost * 3;
    }
    bankrollDelta += burnBonusPayout;

    const busted = isBust(newCards);
    const is21 = !busted && calculateHandValue(newCards).total === 21;

    const updatedSeats = state.seats.map((s, seatIdx) => {
      if (seatIdx !== state.currentSeatIndex) return s;
      const newHands = [...s.hands];
      newHands[seat.currentHandIndex] = {
        ...currentHand,
        cards: newCards,
        isBurned: true,
        burnedCard: discardedCard,
        burnWagerAmount: cost,
        burnWagerPayout: burnBonusPayout,
        status: busted ? HandStatus.BUST : (is21 ? HandStatus.STAND : HandStatus.PLAYING),
      };
      return { ...s, hands: newHands };
    });

    const isTutorial = getRoomConfig(state.currentRoom).isTutorial;
    set({ 
      bankroll: isTutorial ? state.bankroll : state.bankroll + bankrollDelta, 
      tutorialBalance: isTutorial ? state.tutorialBalance + bankrollDelta : state.tutorialBalance,
      shoe, 
      seats: updatedSeats 
    });

    const updatedHand = updatedSeats[state.currentSeatIndex].hands[seat.currentHandIndex];
    if (updatedHand.status !== HandStatus.PLAYING) {
       setTimeout(() => get().advanceToNextHand(), 0);
    }
};

export const switchCardsLogic = (set: any, get: () => GameStore) => {
    const state = get();
    set({ actionCounter: state.actionCounter + 1 });
    if (state.gamePhase !== GamePhase.PLAYER_TURN) return;
    if (!checkTutorialAction(state, 'action-switch')) return;

    const seat = state.seats[state.currentSeatIndex];
    if (!seat) return;

    const rules = getRules(state.currentRoom);
    if (!rules.canSwitch) return;
    const { allowed } = rules.canSwitch(seat);
    if (!allowed) return;

    const h0 = seat.hands[0];
    const h1 = seat.hands[1];
    const newH0Cards = [h0.cards[0], h1.cards[1]];
    const newH1Cards = [h1.cards[0], h0.cards[1]];

    const isH021 = calculateHandValue(newH0Cards).total === 21;
    const isH121 = calculateHandValue(newH1Cards).total === 21;

    let nextHands = [
      { ...h0, cards: newH0Cards, isSwitched: true, status: isH021 ? HandStatus.STAND : HandStatus.PLAYING },
      { ...h1, cards: newH1Cards, isSwitched: true, status: isH121 ? HandStatus.STAND : HandStatus.PLAYING }
    ];

    const firstActiveIdx = nextHands.findIndex(h => h.status === HandStatus.PLAYING);
    const newIdx = firstActiveIdx !== -1 ? firstActiveIdx : 0;

    const updatedSeats = state.seats.map((s) => {
      if (s.id !== seat.id) return s;
      return { ...s, hasSwitched: true, hands: nextHands, currentHandIndex: newIdx };
    });

    set({ seats: updatedSeats });

    const updatedHand = nextHands[newIdx];
    if (updatedHand && updatedHand.status !== HandStatus.PLAYING) {
       setTimeout(() => get().advanceToNextHand(), 0);
    }
};

export const acceptInsuranceLogic = (set: any, get: () => GameStore) => {
    const state = get();
    if (state.gamePhase !== GamePhase.INSURANCE) return;
    if (!checkTutorialAction(state, 'insurance-accept')) return;

    const currentSeat = state.seats[state.currentSeatIndex];
    if (!currentSeat || !currentSeat.isActive) return;

    const mainBet = currentSeat.hands[0]?.betAmount ?? 0;
    const insuranceAmount = mainBet / 2;

    if (!state.canAfford(insuranceAmount) || insuranceAmount <= 0) {
      return; 
    }

    const isTutorial = getRoomConfig(state.currentRoom).isTutorial;
    const newInsuranceBets = { ...state.insuranceBets, [currentSeat.id]: insuranceAmount };
    const newBankroll = isTutorial ? state.bankroll : state.bankroll - insuranceAmount;
    const newTutorialBalance = isTutorial ? (state.tutorialBalance ?? 0) - insuranceAmount : state.tutorialBalance;

    const isIberian = state.currentRoom === 'iberian_21';
    const nextSeatIndex = state.seats.findIndex(
      (s, idx) =>
        idx > state.currentSeatIndex &&
        s.isActive &&
        s.hands.some((h) => {
          if (h.betAmount <= 0) return false;
          if (isIberian) return h.status === HandStatus.PLAYING;
          return h.status === HandStatus.PLAYING || h.status === HandStatus.BLACKJACK;
        })
    );

    if (nextSeatIndex !== -1) {
      set({
        insuranceBets: newInsuranceBets,
        bankroll: newBankroll,
        tutorialBalance: newTutorialBalance,
        currentSeatIndex: nextSeatIndex,
      });
      return;
    }

    const firstPlayableIndex = state.seats.findIndex(
      (s) => s.isActive && s.hands.some((h) => h.betAmount > 0 && h.status === HandStatus.PLAYING)
    );

    const dealerHasBJ = isBlackjack(state.dealerHand.cards, true);
    const nextPhase = dealerHasBJ ? GamePhase.DEALER_TURN : (firstPlayableIndex === -1 ? GamePhase.DEALER_TURN : GamePhase.PLAYER_TURN);

    set({
      insuranceBets: newInsuranceBets,
      bankroll: newBankroll,
      tutorialBalance: newTutorialBalance,
      gamePhase: nextPhase,
      currentSeatIndex: firstPlayableIndex === -1 ? 0 : firstPlayableIndex,
    });

    if (nextPhase === GamePhase.DEALER_TURN) {
      setTimeout(() => get().dealerPlay(), 0);
    }
};

export const declineInsuranceLogic = (set: any, get: () => GameStore) => {
    const state = get();
    if (state.gamePhase !== GamePhase.INSURANCE) return;
    if (!checkTutorialAction(state, 'insurance-decline')) return;

    const isIberian = state.currentRoom === 'iberian_21';
    const nextSeatIndex = state.seats.findIndex(
      (s, idx) =>
        idx > state.currentSeatIndex &&
        s.isActive &&
        s.hands.some((h) => {
          if (h.betAmount <= 0) return false;
          if (isIberian) return h.status === HandStatus.PLAYING;
          return h.status === HandStatus.PLAYING || h.status === HandStatus.BLACKJACK;
        })
    );

    if (nextSeatIndex !== -1) {
      set({
        currentSeatIndex: nextSeatIndex,
      });
      return;
    }

    const firstPlayableIndex = state.seats.findIndex(
      (s) => s.isActive && s.hands.some((h) => h.betAmount > 0 && h.status === HandStatus.PLAYING)
    );

    const dealerHasBJ = isBlackjack(state.dealerHand.cards, true);
    const nextPhase = dealerHasBJ ? GamePhase.DEALER_TURN : (firstPlayableIndex === -1 ? GamePhase.DEALER_TURN : GamePhase.PLAYER_TURN);

    set({
      gamePhase: nextPhase,
      currentSeatIndex: firstPlayableIndex === -1 ? 0 : firstPlayableIndex,
    });

    if (nextPhase === GamePhase.DEALER_TURN) {
      setTimeout(() => get().dealerPlay(), 0);
    }
};
