// ============================================
// Game Flow Slice — dealing, player actions, dealer logic, payouts
// ============================================

import { StateCreator } from 'zustand';
import { GameStore, Hand, Card, MatchRecord } from '@/types/game';
import { GamePhase, HandStatus, Rank, Suit } from '@/types/enums';
import { createShoe, shuffleShoe, dealCard, shouldReshuffle } from '@/utils/deck';
import { calculateHandValue, isBust, isBlackjack } from '@/utils/hand';
import { getRules } from '@/rules';
import { getRoomConfig } from '@/utils/rooms';
import { BLACKJACK_PAYOUT } from '@/utils/constants';
import { createEmptyHand } from './bettingSlice';
import { SPEED_DELAYS } from './settingsSlice';
import { BEGINNER_TUTORIAL_LESSONS } from '@/utils/tutorialData';
import { checkTutorialAction } from '@/utils/tutorialInterceptor';

/** Guard flag — prevents concurrent dealerPlay execution */
let _dealerPlayLock = false;

export interface GameFlowSlice {
  // State
  shoe: Card[];
  savedShoes: Record<string, Card[]>;
  gamePhase: GamePhase;
  seats: GameStore['seats'];
  dealerHand: GameStore['dealerHand'];
  currentSeatIndex: number;
  matchHistory: MatchRecord[];
  insuranceBets: Record<number, number>;
  actionCounter: number;
  
  // Actions
  initializeShoe: () => void;
  startDeal: () => void;
  hit: () => void;
  stand: () => void;
  doubleDown: () => void;
  split: () => void;
  surrender: () => void;
  acceptInsurance: () => void;
  declineInsurance: () => void;
  advanceToNextHand: () => void;
  dealerPlay: () => Promise<void>;
  calculatePayouts: () => void;
  resetRound: () => void;
  zap: () => void;
  switchCards: () => void;
  burn: () => void;

  // History
  setMatchHistory: (records: MatchRecord[]) => void;

  // Utilities
  canAfford: (amount: number) => boolean;
}

/** Get the current active hand being played */
function getCurrentHand(state: GameStore): Hand | null {
  const seat = state.seats[state.currentSeatIndex];
  if (!seat || !seat.isActive) return null;
  return seat.hands[seat.currentHandIndex] ?? null;
}



export const createGameFlowSlice: StateCreator<GameStore, [], [], GameFlowSlice> = (set, get) => ({
  shoe: [],
  savedShoes: {},
  gamePhase: GamePhase.BETTING,
  seats: Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    isActive: i === 2, // Middle seat active by default
    hands: [createEmptyHand(i + 1, 0)],
    currentHandIndex: 0,
  })),
  dealerHand: { cards: [] },
  currentSeatIndex: 0,
  matchHistory: [],
  insuranceBets: {},
  actionCounter: 0,


  canAfford: (amount: number) => {
    const state = get();
    const isTutorial = getRoomConfig(state.currentRoom).isTutorial;
    return (isTutorial ? state.tutorialBalance : state.bankroll) >= amount;
  },

  initializeShoe: () => {
    const state = get();
    const roomCfg = getRoomConfig(state.currentRoom);
    
    if (roomCfg.isTutorial && state.currentRoom === 'tutorial_beginner') {
      const lesson = BEGINNER_TUTORIAL_LESSONS[state.tutorialRound] || BEGINNER_TUTORIAL_LESSONS[0];
      set({ 
        forcedShoe: [...lesson.forcedCards], 
        tutorialStep: 0,
        tutorialBalance: state.tutorialRound === 0 ? 1000 : state.tutorialBalance // Keep balance across rounds
      });
    } else {
      const numDecks = roomCfg.gameRules.numberOfDecks;
      const omitTens = roomCfg.gameRules.omitTens;
      const shoe = shuffleShoe(createShoe(numDecks, omitTens));
      set({ shoe, forcedShoe: null, tutorialStep: 0 });
    }
  },

  startDeal: async () => {
    const state = get();
    if (state.gamePhase !== GamePhase.BETTING) return;
    if (!checkTutorialAction(state, 'deal-button')) return;

    const currentRoomCfg = getRoomConfig(state.currentRoom);
    const minBet = currentRoomCfg.betRange[0];

    // Must have at least one active seat with a valid minimum bet
    const activeSeatsList = state.seats.filter(s => s.isActive);
    if (activeSeatsList.length === 0) return;

    const hasValidBet = activeSeatsList.some(s => 
      s.hands.reduce((sum, h) => sum + h.betAmount, 0) >= minBet
    );

    if (!hasValidBet) return;

    // Transition to DEALING phase immediately to hide betting UI
    set({ gamePhase: GamePhase.DEALING, previousBets: [], previousSideBets: {} });

    // Check if shoe needs reshuffling
    let shoe = [...state.shoe];
    let forcedShoe = state.forcedShoe ? [...state.forcedShoe] : null;
    
    if (!forcedShoe && (shoe.length === 0 || shouldReshuffle(shoe, currentRoomCfg.gameRules.numberOfDecks, currentRoomCfg.gameRules.reshuffleThreshold, currentRoomCfg.gameRules.omitTens))) {
      shoe = shuffleShoe(createShoe(currentRoomCfg.gameRules.numberOfDecks, currentRoomCfg.gameRules.omitTens));
    }

    // Active seats that need cards
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
      const isTutorial = getRoomConfig(state.currentRoom).isTutorial;
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
      const isTutorial = getRoomConfig(state.currentRoom).isTutorial;
      const speed = isTutorial ? 'normal' : get().dealerSpeed;
      const delays = SPEED_DELAYS[speed];
      await new Promise((resolve) => setTimeout(resolve, delays.dealCard));
      const card = dealFromSource(true, isHidden);
      dealerCards.push(card);
      set({ dealerHand: { cards: [...dealerCards] }, shoe: [...shoe], forcedShoe: forcedShoe ? [...forcedShoe] : null });
    };

    // --- First round of cards ---
    for (const seat of dealingSeats) {
      const currentSeat = newSeats.find(s => s.id === seat.id);
      if (currentSeat) {
        for (const hand of currentSeat.hands) {
          await dealToHand(seat.id, hand.id);
        }
      }
    }
    await dealToDealer(false); // Face-up card

    // --- Second round of cards ---
    for (const seat of dealingSeats) {
      const currentSeat = newSeats.find(s => s.id === seat.id);
      if (currentSeat) {
        for (const hand of currentSeat.hands) {
          await dealToHand(seat.id, hand.id);
        }
      }
    }
    if (!currentRoomCfg.gameRules.enhc) {
      await dealToDealer(true); // Hole card (hidden)
    }

    // Wait a brief moment after all cards are dealt before checking for Blackjacks
    const isTutorial = getRoomConfig(state.currentRoom).isTutorial;
    const speed = isTutorial ? 'normal' : get().dealerSpeed;
    const postDealDelay = SPEED_DELAYS[speed].postDeal;
    await new Promise((resolve) => setTimeout(resolve, postDealDelay));

    // Check for natural Blackjacks
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

    // Check if dealer's face-up card is an Ace → offer insurance
    const dealerFaceUp = dealerCards[0];
    const dealerShowsAce = dealerFaceUp.rank === Rank.ACE;
    // Peek at hole card logic
    const dealerHasBJ = currentRoomCfg.gameRules.enhc ? false : isBlackjack(dealerCards, true);

    const isIberian = get().currentRoom === 'iberian_21';

    // Find first active seat that can play normal turn
    const firstPlayableIndex = finalSeats.findIndex(
      (s) =>
        s.isActive &&
        s.hands.some((h) => h.betAmount > 0 && h.status === HandStatus.PLAYING)
    );

    // For all seats, pre-set currentHandIndex to the first PLAYING hand if any
    const processedSeats = finalSeats.map(seat => {
      if (!seat.isActive) return seat;

      // Exchange 21 refinement: If switching is allowed, always start at hand 0
      // even if hand 0 is a Natural Blackjack. This allows the player to switch.
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

    // Find seats eligible for insurance
    // Standard: Anyone with a bet (incl. BJ for Even Money)
    // Iberian: Only those who can still lose to a dealer BJ (skips natural 21s)
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
      // Go to insurance phase for the first eligible seat
      const firstInsurableIndex = finalSeats.findIndex((s) => insurableSeats.includes(s));
      set({
        seats: processedSeats,
        gamePhase: GamePhase.INSURANCE,
        currentSeatIndex: firstInsurableIndex,
        insuranceBets: {},
      });
    } else if (dealerHasBJ) {
      // Dealer shows 10, peeks, and it's a Blackjack. Skip player turn!
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

      // If no playable hands, trigger dealer play immediately
      if (nextPhase === GamePhase.DEALER_TURN) {
        setTimeout(() => get().dealerPlay(), 0);
      }
    }
  },

  // ─── Insurance Actions ───

  acceptInsurance: () => {
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
    const newTutorialBalance = isTutorial ? state.tutorialBalance - insuranceAmount : state.tutorialBalance;

    // Find next eligible insurance seat
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

    // No more seats to ask for insurance.
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
  },

  declineInsurance: () => {
    const state = get();
    if (state.gamePhase !== GamePhase.INSURANCE) return;
    if (!checkTutorialAction(state, 'insurance-decline')) return;

    // Find next eligible insurance seat
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

    // No more seats to ask for insurance.
    // Standard: playable if status is PLAYING
    // Iberian: playable if status is PLAYING
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
  },

  hit: () => {
    const state = get();
    if (state.gamePhase !== GamePhase.PLAYER_TURN) return;
    if (!checkTutorialAction(state, 'action-hit')) return;

    const currentHand = getCurrentHand(state);
    if (!currentHand || currentHand.status !== HandStatus.PLAYING || currentHand.isDoubleDown) return;

    // Increment action counter to reset turn timer
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

          // If it was an Ace split, they only get one card and must stand
          const mustStand = hand.isAceSplit || is21;

          // Spanish 21 rule: Player 21 always wins immediately
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

    // If busted or 21, auto-advance
    const updatedHand = updatedSeats[state.currentSeatIndex].hands[
      updatedSeats[state.currentSeatIndex].currentHandIndex
    ];
    if (updatedHand.status !== HandStatus.PLAYING) {
      setTimeout(() => get().advanceToNextHand(), 0);
    }
  },

   stand: () => {
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

    // Usually only PLAYING hands can stand. 
    // In Exchange 21, we allow "Standing" on a Natural Blackjack if switching is still an option,
    // which effectively acts as a "Decline Switch" for that hand and moves to the next.
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
  },

  doubleDown: () => {
    const state = get();
    if (state.gamePhase !== GamePhase.PLAYER_TURN) return;
    if (!checkTutorialAction(state, 'action-double')) return;

    const currentHand = getCurrentHand(state);

    // Increment action counter to reset turn timer
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
          // Spanish 21 rule: Player 21 always wins immediately
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

    // If locked to STAND, auto-advance
    const updatedHand = updatedSeats[state.currentSeatIndex].hands[state.seats[state.currentSeatIndex].currentHandIndex];
    if (updatedHand.status !== HandStatus.PLAYING) {
      setTimeout(() => get().advanceToNextHand(), 0);
    }
  },

  surrender: () => {
    const state = get();
    if (state.gamePhase !== GamePhase.PLAYER_TURN) return;
    if (!checkTutorialAction(state, 'action-surrender')) return;

    const currentHand = getCurrentHand(state);
    if (!currentHand || currentHand.status !== HandStatus.PLAYING) return;

    const rules = getRules(state.currentRoom);
    const { allowed } = rules.canSurrender(currentHand);
    if (!allowed) return;

    // Late Surrender: player forfeits hand and gets 50% of bet back.
    const refund = currentHand.betAmount / 2;

    const updatedSeats = state.seats.map((seat, seatIdx) => {
      if (seatIdx !== state.currentSeatIndex) return seat;
      return {
        ...seat,
        hands: seat.hands.map((hand, handIdx) => {
          if (handIdx !== seat.currentHandIndex) return hand;
          return {
            ...hand,
            status: HandStatus.SURRENDERED,
            isSurrendered: true,
          };
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
  },

  zap: () => {
    const state = get();
    // Increment action counter to reset turn timer
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
      const numDecks = roomCfg.gameRules.numberOfDecks;
      const omitTens = roomCfg.gameRules.omitTens;
      const newShoe = shuffleShoe(createShoe(numDecks, omitTens));
      shoe = [...shoe, ...newShoe]; // prepend remaining cards if any
    }

    const newCard1 = dealCard(shoe);
    const newCard2 = dealCard(shoe);

    const newCards = [newCard1, newCard2];
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

      return {
        ...s,
        hands: newHands,
      };
    });

    set({ shoe, seats: updatedSeats, actionCounter: state.actionCounter + 1 });

    const updatedHand = updatedSeats[state.currentSeatIndex].hands[seat.currentHandIndex];
    if (updatedHand.status !== HandStatus.PLAYING) {
       setTimeout(() => get().advanceToNextHand(), 0);
    }
  },

  burn: () => {
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
      const newShoe = shuffleShoe(createShoe(roomCfg.gameRules.numberOfDecks, roomCfg.gameRules.omitTens));
      shoe = [...shoe, ...newShoe];
    }

    const discardedCard = currentHand.cards[1];
    const burnCard = dealCard(shoe);
    const newCards = [currentHand.cards[0], burnCard]; // Replaces the 2nd card

    let bankrollDelta = -cost; // Deduct the burn wager
    let burnBonusPayout = 0;

    // Burn wager payout logic
    if (discardedCard.rank === Rank.ACE) {
      if (discardedCard.suit === Suit.SPADES) {
        burnBonusPayout = cost * 8; // 7:1 payout plus original wager return
      } else {
        burnBonusPayout = cost * 3; // 2:1 payout plus original wager return
      }
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
  },

  switchCards: () => {
    const state = get();
    set({ actionCounter: state.actionCounter + 1 });
    if (state.gamePhase !== GamePhase.PLAYER_TURN) return;
    if (!checkTutorialAction(state, 'action-switch')) return;

    const seat = state.seats.find((s) => s.isActive && s.id === state.seats[state.currentSeatIndex].id);
    if (!seat) return;

    const rules = getRules(state.currentRoom);
    if (!rules.canSwitch) return;

    const { allowed } = rules.canSwitch(seat);
    if (!allowed) return;

    // Swap the 2nd cards
    const h0 = seat.hands[0];
    const h1 = seat.hands[1];

    const newH0Cards = [h0.cards[0], h1.cards[1]];
    const newH1Cards = [h1.cards[0], h0.cards[1]];

    const newH0Value = calculateHandValue(newH0Cards);
    const newH1Value = calculateHandValue(newH1Cards);

    const isH021 = newH0Value.total === 21;
    const isH121 = newH1Value.total === 21;

    let nextHands = [
      {
        ...h0,
        cards: newH0Cards,
        isSwitched: true,
        // In Casino Switch, natural blackjacks from a switch count as 21, not blackjack
        status: isH021 ? HandStatus.STAND : HandStatus.PLAYING,
      },
      {
        ...h1,
        cards: newH1Cards,
        isSwitched: true,
        status: isH121 ? HandStatus.STAND : HandStatus.PLAYING,
      }
    ];

    const firstActiveIdx = nextHands.findIndex(h => h.status === HandStatus.PLAYING);
    const newIdx = firstActiveIdx !== -1 ? firstActiveIdx : 0;

    const updatedSeats = state.seats.map((s) => {
      if (s.id !== seat.id) return s;
      return {
        ...s,
        hasSwitched: true,
        hands: nextHands,
        currentHandIndex: newIdx,
      };
    });

    set({ seats: updatedSeats });

    // If the current hand is not playable (e.g., 21 from switch), advance
    const updatedHand = nextHands[newIdx];
    if (updatedHand && updatedHand.status !== HandStatus.PLAYING) {
       setTimeout(() => get().advanceToNextHand(), 0);
    }
  },

  split: () => {
    const state = get();

    // Increment action counter to reset turn timer
    set({ actionCounter: state.actionCounter + 1 });
    if (state.gamePhase !== GamePhase.PLAYER_TURN) return;
    if (!checkTutorialAction(state, 'action-split')) return;

    const seat = state.seats[state.currentSeatIndex];
    if (!seat) return;

    // Max 4 hands per seat (i.e. max 3 splits)
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
      if (forcedShoe && forcedShoe.length > 0) {
        return forcedShoe.pop()!;
      }
      return dealCard(shoe);
    };

    if (!forcedShoe && shoe.length < 2) {
      const roomCfg = getRoomConfig(state.currentRoom);
      const numDecks = roomCfg.gameRules.numberOfDecks;
      const omitTens = roomCfg.gameRules.omitTens;
      const newShoe = shuffleShoe(createShoe(numDecks, omitTens));
      shoe = [...shoe, ...newShoe]; // prepend remaining cards if any
    }

    const newCard1 = dealFromSource();
    const newCard2 = dealFromSource();

    const isSplitAces = card1.value === 11;
    const restrictSplitAces = state.currentRoom !== 'iberian_21';
    const locksAfterSplit = isSplitAces && restrictSplitAces;

    // Check if the split hand immediately results in a 21
    const is21Hand1 = calculateHandValue([card1, newCard1]).total === 21;
    const is21Hand2 = calculateHandValue([card2, newCard2]).total === 21;

    const isIberian = state.currentRoom === 'iberian_21';
    const initialStatus1 = (isIberian && is21Hand1) ? HandStatus.WON : (locksAfterSplit || is21Hand1) ? HandStatus.STAND : HandStatus.PLAYING;
    const initialStatus2 = (isIberian && is21Hand2) ? HandStatus.WON : (locksAfterSplit || is21Hand2) ? HandStatus.STAND : HandStatus.PLAYING;

    const hand1: Hand = {
      ...currentHand,
      id: `seat-${seat.id}-hand-${Date.now()}-1`,
      cards: [card1, newCard1],
      betAmount: splitBet, // Keep original main bet
      status: initialStatus1,
      freeActionBetAmount: currentHand.freeActionBetAmount,
      isAceSplit: locksAfterSplit,
      isFreeActionSplit: isFree ? true : currentHand.isFreeActionSplit,
      isSplit: true,
      // Retain burn stats on the first hand
      isBurned: currentHand.isBurned,
      burnedCard: currentHand.burnedCard,
      burnWagerAmount: currentHand.burnWagerAmount,
      burnWagerPayout: currentHand.burnWagerPayout,
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
      // Clear burn wager cost/payout on second hand to avoid double-counting
      burnWagerAmount: undefined,
      burnWagerPayout: undefined,
      isBurned: currentHand.isBurned,
      burnedCard: currentHand.burnedCard,
    };

    // A 21 on a split hand is not considered a Natural Blackjack, 
    // but the status will automatically advance to STAND via initialStatus.

    // Track free action tokens
    const newTokens = isFree ? (seat.freeActionTokens || 0) + 1 : (seat.freeActionTokens || 0);

    const updatedSeats = state.seats.map((s, seatIdx) => {
      if (seatIdx !== state.currentSeatIndex) return s;

      const newHands = [...s.hands];
      newHands.splice(seat.currentHandIndex, 1, hand1, hand2);

      return {
        ...s,
        hands: newHands,
        currentHandIndex: seat.currentHandIndex,
        freeActionTokens: newTokens,
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

    // If first split hand is already resolved, advance
    if (hand1.status !== HandStatus.PLAYING) {
      setTimeout(() => get().advanceToNextHand(), 0);
    }
  },

  advanceToNextHand: () => {
    const state = get();
    const currentSeat = state.seats[state.currentSeatIndex];

    if (!currentSeat) {
      set({ gamePhase: GamePhase.DEALER_TURN });
      setTimeout(() => get().dealerPlay(), 0);
      return;
    }

    // Try next hand in current seat
    let foundNextHand = false;
    for (let hIdx = currentSeat.currentHandIndex + 1; hIdx < currentSeat.hands.length; hIdx++) {
      const nextHand = currentSeat.hands[hIdx];
      if (nextHand.betAmount > 0 && nextHand.status === HandStatus.PLAYING) {
        set((s) => ({
          seats: s.seats.map((seat, idx) =>
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

    // Try next active seat
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

    // No more hands to play — dealer's turn
    set({ gamePhase: GamePhase.DEALER_TURN });
    setTimeout(() => get().dealerPlay(), 0);
  },

  dealerPlay: async () => {
    // Prevent concurrent execution (race condition in fast mode)
    if (_dealerPlayLock) return;
    const state = get();
    if (state.gamePhase !== GamePhase.DEALER_TURN) return;
    _dealerPlayLock = true;

    try {
      let shoe = [...state.shoe];
      let forcedShoe = state.forcedShoe ? [...state.forcedShoe] : null;

      // Reveal hidden card
      let dealerCards = state.dealerHand.cards.map((c) => ({
        ...c,
        isHidden: false,
      }));
      set({ dealerHand: { cards: dealerCards } });

      const isTutorial = getRoomConfig(state.currentRoom).isTutorial;
      const speed = isTutorial ? 'normal' : get().dealerSpeed;
      const flipDelay = SPEED_DELAYS[speed].flipCard || 800;
      await new Promise((resolve) => setTimeout(resolve, flipDelay));

    // Check if all player hands are busted or surrendered — if so, dealer doesn't need to draw
    const allBustedOrSurrendered = state.seats
      .filter((s) => s.isActive && s.hands.some((h) => h.betAmount > 0))
      .every((s) => s.hands.every((h) => h.betAmount === 0 || h.status === HandStatus.BUST || h.status === HandStatus.SURRENDERED));

    // Check if all non-bust/surrender player hands are blackjacks — dealer doesn't need to draw
    const allResolvedOrBlackjack = state.seats
      .filter((s) => s.isActive && s.hands.some((h) => h.betAmount > 0))
      .every((s) => s.hands.every((h) =>
        h.betAmount === 0 || h.status === HandStatus.BUST || h.status === HandStatus.SURRENDERED || h.status === HandStatus.BLACKJACK
      ));

    // Initial reveal
    set({ dealerHand: { cards: [...dealerCards] } });

    const roomCfg = getRoomConfig(state.currentRoom);
    const hasInsuranceBets = Object.values(state.insuranceBets).some((bet) => bet > 0);
    const dealerNeedsToDrawForInsurance = roomCfg.gameRules.enhc && dealerCards.length === 1 && dealerCards[0].rank === Rank.ACE && hasInsuranceBets;

    if (!allBustedOrSurrendered && !allResolvedOrBlackjack || dealerNeedsToDrawForInsurance) {
      const hitsSoft17 = roomCfg.gameRules.dealerHitsSoft17;

      // Dealer hits until 17 or higher
      // If dealer has exactly 17 and hitsSoft17 is TRUE and the hand is Soft, draw again
      let dealerValue = calculateHandValue(dealerCards);

      while (
        dealerValue.total < 17 || 
        (dealerValue.total === 17 && dealerValue.isSoft && hitsSoft17)
      ) {
        // Wait before drawing next card
        const hitDelay = SPEED_DELAYS[isTutorial ? 'normal' : get().dealerSpeed].dealerHit;
        await new Promise((resolve) => setTimeout(resolve, hitDelay));

        // Bail out if phase changed externally (e.g. reset)
        if (get().gamePhase !== GamePhase.DEALER_TURN) return;

        // Refetch latest state inside loop to avoid stale shoe
        const currentState = get();
        let currentShoe = [...currentState.shoe];

        if (currentShoe.length === 0) {
          const roomCfg = getRoomConfig(currentState.currentRoom);
          const numDecks = roomCfg.gameRules.numberOfDecks;
          const omitTens = roomCfg.gameRules.omitTens;
          currentShoe = shuffleShoe(createShoe(numDecks, omitTens));
        }

        const newCard = (forcedShoe && forcedShoe.length > 0) ? forcedShoe.pop()! : dealCard(currentShoe);
        dealerCards.push(newCard);
        dealerValue = calculateHandValue(dealerCards);

        // Update state so UI shows the new card
        set({ dealerHand: { cards: [...dealerCards] }, shoe: currentShoe, forcedShoe: forcedShoe ? [...forcedShoe] : null });
        set({
          dealerHand: { cards: [...dealerCards] },
          shoe: currentShoe,
        });
      }
    }

    // Small delay before payout phase for visual pacing
    const prePayoutDelay = SPEED_DELAYS[isTutorial ? 'normal' : get().dealerSpeed].prePayout;
    await new Promise((resolve) => setTimeout(resolve, prePayoutDelay));

    set({
      gamePhase: GamePhase.PAYOUT,
    });

    // Auto-calculate payouts
    setTimeout(() => get().calculatePayouts(), 0);

    } catch (err) {
      console.error('[dealerPlay] Error during dealer turn:', err);
      // Force transition to PAYOUT to prevent stuck state
      if (get().gamePhase === GamePhase.DEALER_TURN) {
        set({ gamePhase: GamePhase.PAYOUT });
        setTimeout(() => get().calculatePayouts(), 0);
      }
    } finally {
      _dealerPlayLock = false;
    }
  },

  calculatePayouts: () => {
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
      if (state.insuranceBets[seat.id]) {
        totalStaked += state.insuranceBets[seat.id];
      }
      if (state.sideBets[seat.id]) {
        totalStaked += state.sideBets[seat.id];
      }
    });

    const bankrollBefore = state.bankroll + totalStaked - totalBurnPayout;

    let totalPayout = 0;

    const rules = getRules(state.currentRoom);
    
    // Insurance payouts: if dealer has blackjack, insurance pays 2:1
    const insuranceBets = state.insuranceBets;
    const dealerBlackjack = isBlackjack(state.dealerHand.cards);
    const insurancePayouts: Record<number, number> = {};
    if (dealerBlackjack) {
      for (const [seatIdStr, amount] of Object.entries(insuranceBets)) {
        const seatId = Number(seatIdStr);
        const payout = amount * 3;
        totalPayout += payout; // Return bet + 2:1 payout
        insurancePayouts[seatId] = payout;
      }
    }
    // If dealer doesn't have BJ, insurance bets are already lost (deducted in acceptInsurance)

    const updatedSeats = state.seats.map((seat) => {
      if (!seat.isActive) return seat;

      return {
        ...seat,
        hands: seat.hands.map((hand, handIdx) => {
          if (hand.betAmount === 0) return hand;

          const playerValue = calculateHandValue(hand.cards);
          const freeBet = hand.freeActionBetAmount || 0;

          // Already resolved (e.g., Bust, Even Money, or Surrendered)
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
            // Won amount (profit) + return of real principal (betAmount - freeBet)
            totalPayout += (hand.betAmount - freeBet) + (hand.betAmount * evaluation.payoutMultiplier);
          } else if (evaluation.status === HandStatus.PUSH) {
            // Push: just return real principal
            totalPayout += (hand.betAmount - freeBet);
          }

          return { ...hand, status: evaluation.status };
        }),
      };
    });


    // ═══ MULTI ACTION BONUS SIDE BET ═══
    const SIDE_BET_PAYOUTS: Record<number, number> = {
      1: 3,    // 3:1
      2: 10,   // 10:1
      3: 40,   // 40:1
      4: 100,  // 100:1
      5: 150,  // 150:1
      6: 250,  // 250:1
      7: 250,  // 250:1
      8: 250,  // 250:1
    };

    const sideBetPayouts: Record<number, number> = {};
    for (const [seatIdStr, sideBetAmount] of Object.entries(state.sideBets)) {
      const seatId = Number(seatIdStr);
      if (sideBetAmount <= 0) continue;

      const seat = updatedSeats.find(s => s.id === seatId);
      const tokens = seat?.freeActionTokens || 0;
      const multiplier = SIDE_BET_PAYOUTS[tokens] || 0;

      if (multiplier > 0) {
        const payout = sideBetAmount + (sideBetAmount * multiplier); // Return bet + winnings
        totalPayout += payout;
        sideBetPayouts[seatId] = payout;
      }
      // If no tokens, side bet is lost (already deducted in placeSideBet)
    }

    const bankrollAfter = state.bankroll + totalPayout;

    // Create match record
    const matchRecord: MatchRecord = {
      id: `match-${Date.now()}`,
      timestamp: Date.now(),
      roomId: state.currentRoom,
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
                betAmount: (hand.betAmount - freeAmt) + (hand.burnWagerAmount || 0), // Record only the real wagered amount plus burn wager
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
    const MAX_STORE_HISTORY = 500;
    const newHistory = [...state.matchHistory, matchRecord];
    if (newHistory.length > MAX_STORE_HISTORY) {
        newHistory.splice(0, newHistory.length - MAX_STORE_HISTORY);
    }

    const isTutorial = getRoomConfig(state.currentRoom).isTutorial;
    set({
      seats: updatedSeats,
      bankroll: isTutorial ? state.bankroll : bankrollAfter,
      tutorialBalance: isTutorial ? state.tutorialBalance + totalPayout : state.tutorialBalance,
      matchHistory: newHistory,
      totalBetSinceLastClaim: isTutorial ? (state.totalBetSinceLastClaim || 0) : (state.totalBetSinceLastClaim || 0) + totalStaked,
    });

    // Check for achievements after payout
    get().checkAchievements(matchRecord);
  },

  resetRound: () => {
    const state = get();
    if (!checkTutorialAction(state, 'new-round-button')) return;

    // Check if shoe needs reshuffling
    let shoe = state.shoe;
    const roomCfg = getRoomConfig(state.currentRoom);
    const numDecks = roomCfg.gameRules.numberOfDecks;
    const reshuffleThreshold = roomCfg.gameRules.reshuffleThreshold;
    const omitTens = roomCfg.gameRules.omitTens;
    
    if (shouldReshuffle(shoe, numDecks, reshuffleThreshold, omitTens)) {
      shoe = shuffleShoe(createShoe(numDecks, omitTens));
    }

    const isTutorial = roomCfg.isTutorial;
    const nextTutorialRound = isTutorial ? state.tutorialRound + 1 : 0;
    const isTutorialCompleted = isTutorial && nextTutorialRound >= BEGINNER_TUTORIAL_LESSONS.length;

    let forcedShoe = state.forcedShoe;
    if (isTutorial && !isTutorialCompleted) {
      const lesson = BEGINNER_TUTORIAL_LESSONS[nextTutorialRound];
      if (lesson) {
        forcedShoe = [...lesson.forcedCards];
      }
    }

    set({
      shoe,
      forcedShoe,
      gamePhase: GamePhase.BETTING,
      dealerHand: { cards: [] },
      currentSeatIndex: 0,
      insuranceBets: {},
      sideBets: {},
      tutorialRound: nextTutorialRound,
      tutorialCompleted: isTutorialCompleted,
      seats: state.seats.map((seat) => ({
        ...seat,
        hands: [createEmptyHand(seat.id, 0)],
        currentHandIndex: 0,
        freeActionTokens: 0,
        sideBetAmount: 0,
        hasSwitched: false,
      })),
    });
  },

  setMatchHistory: (records: MatchRecord[]) => {
    set({ matchHistory: records });
  },
});