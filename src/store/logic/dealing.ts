import { GameStore, Card, GamePhase } from '@/types/game';
import { Rank } from '@/types/enums';
import { getRoomConfig } from '@/utils/rooms';
import { createShoe, shuffleShoe, dealCard, shouldReshuffle } from '@/utils/deck';
import { isBlackjack } from '@/utils/hand';
import { BEGINNER_TUTORIAL_LESSONS, DOUBLE_TUTORIAL_LESSONS, STRATEGY_TUTORIAL_LESSONS } from '@/utils/tutorialData';
import { checkTutorialAction } from '@/utils/tutorialInterceptor';
import { SPEED_DELAYS } from '../settingsSlice';
import { HandStatus } from '@/types/enums';
import { getRules } from '@/rules';

export const initializeShoeLogic = (set: any, get: () => GameStore) => {
    const state = get();
    const roomCfg = getRoomConfig(state.currentRoom);
    
    if (roomCfg.isTutorial) {
      let lessons = BEGINNER_TUTORIAL_LESSONS;
      if (state.currentRoom === 'tutorial_double') {
        lessons = DOUBLE_TUTORIAL_LESSONS;
      } else if (state.currentRoom === 'tutorial_strategy') {
        lessons = STRATEGY_TUTORIAL_LESSONS;
      }
      
      const lesson = lessons[state.tutorialRound] || lessons[0];
      set({ 
        forcedShoe: [...lesson.forcedCards], 
        tutorialStep: 0,
        tutorialBalance: state.tutorialRound === 0 ? 1000 : state.tutorialBalance
      });
    } else {
      const numDecks = roomCfg.gameRules.numberOfDecks;
      const omitTens = roomCfg.gameRules.omitTens;
      const shoe = shuffleShoe(createShoe(numDecks, omitTens));
      set({ shoe, forcedShoe: null, tutorialStep: 0 });
    }
};

export const startDealLogic = async (set: any, get: () => GameStore) => {
    const state = get();
    if (state.gamePhase !== GamePhase.BETTING) return;
    if (!checkTutorialAction(state, 'deal-button')) return;

    const currentRoomCfg = getRoomConfig(state.currentRoom);
    const minBet = currentRoomCfg.betRange[0];

    const activeSeatsList = state.seats.filter(s => s.isActive);
    if (activeSeatsList.length === 0) return;

    const hasValidBet = activeSeatsList.some(s => 
      s.hands.reduce((sum, h) => sum + h.betAmount, 0) >= minBet
    );

    if (!hasValidBet) return;

    const currentBets = state.seats
      .filter(s => s.isActive)
      .map(s => ({ 
        seatId: s.id, 
        amount: s.hands.reduce((sum, h) => sum + h.betAmount, 0) 
      }))
      .filter(b => b.amount > 0);
    const currentSideBets = { ...state.sideBets };

    set({ 
      gamePhase: GamePhase.DEALING, 
      previousBets: currentBets, 
      previousSideBets: currentSideBets 
    });

    let shoe = [...state.shoe];
    let forcedShoe = state.forcedShoe ? [...state.forcedShoe] : null;
    
    if (!forcedShoe && (shoe.length === 0 || shouldReshuffle(shoe, currentRoomCfg.gameRules.numberOfDecks, currentRoomCfg.gameRules.reshuffleThreshold, currentRoomCfg.gameRules.omitTens))) {
      shoe = shuffleShoe(createShoe(currentRoomCfg.gameRules.numberOfDecks, currentRoomCfg.gameRules.omitTens));
    }

    const dealingSeats = state.seats.filter(
      (s) => s.isActive && s.hands.some((h) => h.betAmount > 0)
    );

    let newSeats = [...state.seats];
    const dealerCards: Card[] = [];

    const dealFromSource = (isDealer: boolean = false, hidden: boolean = false): Card => {
      if (forcedShoe && forcedShoe.length > 0) {
        const card = forcedShoe.pop()!;
        if (isDealer) {
            return { ...card, isHidden: hidden };
        }
        return card;
      }
      return dealCard(shoe, isDealer && hidden);
    };

    const dealToHand = async (seatId: number, handId: string) => {
      const isTutorial = getRoomConfig(get().currentRoom).isTutorial;
      const speed = isTutorial ? 'normal' : get().dealerSpeed;
      const delays = SPEED_DELAYS[speed];
      await new Promise((resolve) => setTimeout(resolve, delays.dealCard));
      const seatIndex = newSeats.findIndex((s) => s.id === seatId);
      const card = dealFromSource(false);
      newSeats = [...newSeats];
      newSeats[seatIndex] = {
        ...newSeats[seatIndex],
        hands: newSeats[seatIndex].hands.map((hand) => {
          if (hand.id === handId) {
            return { ...hand, cards: [...hand.cards, card] };
          }
          return hand;
        }),
      };
      set({ seats: newSeats, shoe: [...shoe], forcedShoe: forcedShoe ? [...forcedShoe] : null });
    };

    const dealToDealer = async (isHidden: boolean = false) => {
      const isTutorial = getRoomConfig(get().currentRoom).isTutorial;
      const speed = isTutorial ? 'normal' : get().dealerSpeed;
      const delays = SPEED_DELAYS[speed];
      await new Promise((resolve) => setTimeout(resolve, delays.dealCard));
      const card = dealFromSource(true, isHidden);
      dealerCards.push(card);
      set({ dealerHand: { cards: [...dealerCards] }, shoe: [...shoe], forcedShoe: forcedShoe ? [...forcedShoe] : null });
    };

    for (const seat of dealingSeats) {
        const currentSeat = newSeats.find(s => s.id === seat.id);
        if (currentSeat) {
          for (const hand of currentSeat.hands) {
            await dealToHand(seat.id, hand.id);
          }
        }
    }
    await dealToDealer(false);

    const playerInitialCards = currentRoomCfg.gameRules.playerInitialCards ?? 2;

    if (playerInitialCards > 1) {
      for (let i = 1; i < playerInitialCards; i++) {
        for (const seat of dealingSeats) {
            const currentSeat = newSeats.find(s => s.id === seat.id);
            if (currentSeat) {
              for (const hand of currentSeat.hands) {
                await dealToHand(seat.id, hand.id);
              }
            }
        }
      }
    }

    if (!currentRoomCfg.gameRules.enhc) {
      await dealToDealer(true);
    }

    const isTutorial = getRoomConfig(get().currentRoom).isTutorial;
    const speed = isTutorial ? 'normal' : get().dealerSpeed;
    const postDealDelay = SPEED_DELAYS[speed].postDeal;
    await new Promise((resolve) => setTimeout(resolve, postDealDelay));

    const finalSeats = newSeats.map((seat) => {
      if (!seat.isActive || !seat.hands.some((h) => h.betAmount > 0)) return seat;
      return {
        ...seat,
        hands: seat.hands.map((hand) => {
          if (isBlackjack(hand.cards)) {
            return { ...hand, status: HandStatus.BLACKJACK };
          }
          return hand;
        }),
      };
    });

    const dealerFaceUp = dealerCards[0];
    const dealerShowsAce = dealerFaceUp.rank === Rank.ACE;
    const dealerHasBJ = currentRoomCfg.gameRules.enhc ? false : isBlackjack(dealerCards, true);

    const firstPlayableIndex = finalSeats.findIndex(
      (s) =>
        s.isActive &&
        s.hands.some((h) => h.betAmount > 0 && h.status === HandStatus.PLAYING)
    );

    const processedSeats = finalSeats.map(seat => {
      if (!seat.isActive) return seat;
      const isExchange21 = get().currentRoom === 'exchange_21';
      if (isExchange21 && seat.hands.length === 2 && !seat.hasSwitched) {
        const rules = getRules('exchange_21');
        if (rules.canSwitch && rules.canSwitch(seat).allowed) {
          return { ...seat, currentHandIndex: 0 };
        }
      }

      const firstPlayableHandIndex = seat.hands.findIndex(h => h.betAmount > 0 && h.status === HandStatus.PLAYING);
      if (firstPlayableHandIndex !== -1) {
        return { ...seat, currentHandIndex: firstPlayableHandIndex };
      }
      return seat;
    });

    const isIberian = get().currentRoom === 'iberian_21';
    const insurableSeats = finalSeats.filter(
      (s) =>
        s.isActive &&
        s.hands.some((h) => {
          if (h.betAmount <= 0) return false;
          if (isIberian) return h.status === HandStatus.PLAYING;
          return h.status === HandStatus.PLAYING || h.status === HandStatus.BLACKJACK;
        })
    );

    if (dealerShowsAce && insurableSeats.length > 0) {
      const firstInsurableIndex = finalSeats.findIndex((s) => insurableSeats.includes(s));
      set({
        seats: processedSeats,
        gamePhase: GamePhase.INSURANCE,
        currentSeatIndex: firstInsurableIndex,
        insuranceBets: {},
      });
    } else if (dealerHasBJ) {
      set({
        seats: processedSeats,
        gamePhase: GamePhase.DEALER_TURN,
        currentSeatIndex: firstPlayableIndex === -1 ? 0 : firstPlayableIndex,
        insuranceBets: {},
      });
      setTimeout(() => get().dealerPlay(), 0);
    } else {
      const nextPhase =
        firstPlayableIndex === -1 ? GamePhase.DEALER_TURN : GamePhase.PLAYER_TURN;

      set({
        seats: processedSeats,
        gamePhase: nextPhase,
        currentSeatIndex: firstPlayableIndex === -1 ? 0 : firstPlayableIndex,
        insuranceBets: {},
      });

      if (nextPhase === GamePhase.DEALER_TURN) {
        setTimeout(() => get().dealerPlay(), 0);
      }
    }
};

export const resetRoundLogic = (set: any, get: () => GameStore) => {
    const state = get();
    if (!checkTutorialAction(state, 'new-round-button')) return;

    let shoe = state.shoe;
    const roomCfg = getRoomConfig(state.currentRoom);
    const numDecks = roomCfg.gameRules.numberOfDecks;
    const reshuffleThreshold = roomCfg.gameRules.reshuffleThreshold;
    const omitTens = roomCfg.gameRules.omitTens;
    
    if (shouldReshuffle(shoe, numDecks, reshuffleThreshold, omitTens)) {
      shoe = shuffleShoe(createShoe(numDecks, omitTens));
    }

    const isTutorial = roomCfg.isTutorial;
    let lessons = BEGINNER_TUTORIAL_LESSONS;
    if (state.currentRoom === 'tutorial_double') {
      lessons = DOUBLE_TUTORIAL_LESSONS;
    } else if (state.currentRoom === 'tutorial_strategy') {
      lessons = STRATEGY_TUTORIAL_LESSONS;
    }
    let forcedShoe = state.forcedShoe;
    let nextTutorialRound = state.tutorialRound;
    if (isTutorial) {
        nextTutorialRound = state.tutorialRound + 1;
    }

    const isTutorialCompleted = isTutorial && nextTutorialRound >= lessons.length;

    if (isTutorial) {
      if (!isTutorialCompleted) {
        const lesson = lessons[nextTutorialRound];
        if (lesson) {
            forcedShoe = [...lesson.forcedCards];
        }
      } else {
        forcedShoe = null;
      }
    }

    const isExchangeRoom = state.currentRoom === 'exchange_21';

    set({
      shoe,
      forcedShoe,
      gamePhase: GamePhase.BETTING,
      dealerHand: { cards: [] },
      currentSeatIndex: 0,
      insuranceBets: {},
      sideBets: {},
      tutorialRound: isTutorial ? nextTutorialRound : 0,
      tutorialStep: 0,
      tutorialCompleted: isTutorialCompleted,
      seats: state.seats.map((seat) => ({
        ...seat,
        hands: isExchangeRoom
          ? [{
              id: `seat-${seat.id}-hand-1`,
              cards: [],
              betAmount: 0,
              status: HandStatus.PLAYING,
              seatId: seat.id
            }, {
              id: `seat-${seat.id}-hand-2`,
              cards: [],
              betAmount: 0,
              status: HandStatus.PLAYING,
              seatId: seat.id
            }]
          : [{
              id: `seat-${seat.id}-hand-1`,
              cards: [],
              betAmount: 0,
              status: HandStatus.PLAYING,
              seatId: seat.id
            }],
        currentHandIndex: 0,
        freeActionTokens: 0,
        sideBetAmount: 0,
        hasSwitched: false,
      })),
    });
};
