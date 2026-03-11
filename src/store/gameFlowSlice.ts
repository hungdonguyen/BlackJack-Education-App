// ============================================
// Game Flow Slice — dealing, player actions, dealer logic, payouts
// ============================================

import { StateCreator } from 'zustand';
import { GameStore, Hand, Card, MatchRecord } from '@/types/game';
import { GamePhase, HandStatus, Rank } from '@/types/enums';
import { createShoe, shuffleShoe, dealCard, shouldReshuffle } from '@/utils/deck';
import { calculateHandValue, isBust, isBlackjack } from '@/utils/hand';
import { getRules } from '@/rules';
import { getRoomConfig } from '@/utils/rooms';
import { BLACKJACK_PAYOUT } from '@/utils/constants';
import { createEmptyHand } from './bettingSlice';
import { SPEED_DELAYS } from './settingsSlice';

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

  // Dev tools
  forceBlackjack: () => void;
  forceBust: () => void;
  forceSplitScenario: () => void;
  forceAceSplitScenario: () => void;
  forcePush: () => void;
  forceDealerBust: () => void;
  forceInsurance: () => void;
  forceDoubleSetup: () => void;

  // History
  setMatchHistory: (records: MatchRecord[]) => void;
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

  initializeShoe: () => {
    const state = get();
    const roomCfg = getRoomConfig(state.currentRoom);
    const numDecks = roomCfg.gameRules.numberOfDecks;
    const omitTens = roomCfg.gameRules.omitTens;
    const shoe = shuffleShoe(createShoe(numDecks, omitTens));
    set({ shoe });
  },

  startDeal: async () => {
    const state = get();
    if (state.gamePhase !== GamePhase.BETTING) return;

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
    // Capture previous bets to allow rebet/x2 in the next round
    const currentBets: { seatId: number; amount: number }[] = [];
    state.seats.forEach((s) => {
      const activeBet = s.hands.reduce((sum, h) => sum + h.betAmount, 0);
      if (activeBet > 0) currentBets.push({ seatId: s.id, amount: activeBet });
    });

    set({ gamePhase: GamePhase.DEALING, previousBets: currentBets, previousSideBets: { ...state.sideBets } });

    // Check if shoe needs reshuffling
    let shoe = [...state.shoe];
    const numDecks = currentRoomCfg.gameRules.numberOfDecks;
    const reshuffleThreshold = currentRoomCfg.gameRules.reshuffleThreshold;
    const omitTens = currentRoomCfg.gameRules.omitTens;
    
    if (shoe.length === 0 || shouldReshuffle(shoe, numDecks, reshuffleThreshold, omitTens)) {
      shoe = shuffleShoe(createShoe(numDecks, omitTens));
    }

    // Active seats that need cards
    const dealingSeats = state.seats.filter(
      (s) => s.isActive && s.hands.some((h) => h.betAmount > 0)
    );

    let newSeats = [...state.seats];
    const dealerCards: Card[] = [];

    const dealToSeat = async (seatId: number) => {
      const delays = SPEED_DELAYS[get().dealerSpeed];
      await new Promise((resolve) => setTimeout(resolve, delays.dealCard));
      const seatIndex = newSeats.findIndex((s) => s.id === seatId);
      const card = dealCard(shoe);
      newSeats = [...newSeats]; // copy array
      newSeats[seatIndex] = {
        ...newSeats[seatIndex],
        hands: newSeats[seatIndex].hands.map((hand) => ({
          ...hand,
          cards: [...hand.cards, card],
        })),
      };
      set({ seats: newSeats, shoe: [...shoe] });
    };

    const dealToDealer = async (isHidden: boolean = false) => {
      const delays = SPEED_DELAYS[get().dealerSpeed];
      await new Promise((resolve) => setTimeout(resolve, delays.dealCard));
      dealerCards.push(dealCard(shoe, isHidden));
      set({ dealerHand: { cards: [...dealerCards] }, shoe: [...shoe] });
    };

    // --- First round of cards ---
    for (const seat of dealingSeats) {
      await dealToSeat(seat.id);
    }
    await dealToDealer(false); // Face-up card

    // --- Second round of cards ---
    for (const seat of dealingSeats) {
      await dealToSeat(seat.id);
    }
    if (!currentRoomCfg.gameRules.enhc) {
      await dealToDealer(true); // Hole card (hidden)
    }

    // Wait a brief moment after all cards are dealt before checking for Blackjacks
    const postDealDelay = SPEED_DELAYS[get().dealerSpeed].postDeal;
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
        seats: finalSeats,
        gamePhase: GamePhase.INSURANCE,
        currentSeatIndex: firstInsurableIndex,
        insuranceBets: {},
      });
    } else if (dealerHasBJ) {
      // Dealer shows 10, peeks, and it's a Blackjack. Skip player turn!
      set({
        seats: finalSeats,
        gamePhase: GamePhase.DEALER_TURN,
        currentSeatIndex: firstPlayableIndex === -1 ? 0 : firstPlayableIndex,
        insuranceBets: {},
      });
      setTimeout(() => get().dealerPlay(), 0);
    } else {
      const nextPhase =
        firstPlayableIndex === -1 ? GamePhase.DEALER_TURN : GamePhase.PLAYER_TURN;

      set({
        seats: finalSeats,
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

    const currentSeat = state.seats[state.currentSeatIndex];
    if (!currentSeat || !currentSeat.isActive) return;

    const mainBet = currentSeat.hands[0]?.betAmount ?? 0;
    const insuranceAmount = mainBet / 2;

    if (insuranceAmount > state.bankroll || insuranceAmount <= 0) {
      return; 
    }

    const newInsuranceBets = { ...state.insuranceBets, [currentSeat.id]: insuranceAmount };
    const newBankroll = state.bankroll - insuranceAmount;

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

    const currentHand = getCurrentHand(state);
    if (!currentHand || currentHand.status !== HandStatus.PLAYING) return;

    // Increment action counter to reset turn timer
    set({ actionCounter: state.actionCounter + 1 });

    let shoe = [...state.shoe];

    if (shoe.length === 0) {
      const roomCfg = getRoomConfig(state.currentRoom);
      const numDecks = roomCfg.gameRules.numberOfDecks;
      const omitTens = roomCfg.gameRules.omitTens;
      shoe = shuffleShoe(createShoe(numDecks, omitTens));
    }

    const newCard = dealCard(shoe);

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

    set({ shoe, seats: updatedSeats });

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

    const currentHand = getCurrentHand(state);
    if (!currentHand || currentHand.status !== HandStatus.PLAYING) return;

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
    if (!isFree && cost > state.bankroll) return;

    let shoe = [...state.shoe];

    if (shoe.length === 0) {
      const numDecks = roomCfg.gameRules.numberOfDecks;
      const omitTens = roomCfg.gameRules.omitTens;
      shoe = shuffleShoe(createShoe(numDecks, omitTens));
    }

    const newCard = dealCard(shoe);

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

    set({
      shoe,
      seats: updatedSeats,
      bankroll: isFree ? state.bankroll : state.bankroll - cost,
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

    set({
      seats: updatedSeats,
      bankroll: state.bankroll + refund,
    });

    get().advanceToNextHand();
  },

  split: () => {
    const state = get();

    // Increment action counter to reset turn timer
    set({ actionCounter: state.actionCounter + 1 });
    if (state.gamePhase !== GamePhase.PLAYER_TURN) return;

    const seat = state.seats[state.currentSeatIndex];
    if (!seat) return;

    // Max 4 hands per seat (i.e. max 3 splits)
    if (seat.hands.length >= 4) return;

    const currentHand = seat.hands[seat.currentHandIndex];
    if (!currentHand || currentHand.status !== HandStatus.PLAYING) return;

    const rules = getRules(state.currentRoom);
    const { allowed, isFree, cost } = rules.canSplit(currentHand, seat.hands.length);

    if (!allowed) return;
    if (!isFree && cost > state.bankroll) return;

    const splitBet = currentHand.betAmount;
    let shoe = [...state.shoe];

    // Create two new hands from the split
    const card1 = currentHand.cards[0];
    const card2 = currentHand.cards[1];

    if (shoe.length < 2) {
      const roomCfg = getRoomConfig(state.currentRoom);
      const numDecks = roomCfg.gameRules.numberOfDecks;
      const omitTens = roomCfg.gameRules.omitTens;
      const newShoe = shuffleShoe(createShoe(numDecks, omitTens));
      shoe = [...shoe, ...newShoe]; // prepend remaining cards if any
    }

    const newCard1 = dealCard(shoe);
    const newCard2 = dealCard(shoe);

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
      id: `seat-${seat.id}-hand-${Date.now()}-1`,
      cards: [card1, newCard1],
      betAmount: splitBet,
      status: initialStatus1,
      freeActionBetAmount: currentHand.freeActionBetAmount,
      isAceSplit: locksAfterSplit,
      isFreeActionSplit: isFree ? true : currentHand.isFreeActionSplit,
      isSplit: true,
    };

    const hand2: Hand = {
      id: `seat-${seat.id}-hand-${Date.now()}-2`,
      cards: [card2, newCard2],
      betAmount: splitBet,
      status: initialStatus2,
      freeActionBetAmount: isFree ? splitBet : currentHand.freeActionBetAmount,
      isAceSplit: locksAfterSplit,
      isFreeActionSplit: isFree ? true : currentHand.isFreeActionSplit,
      isSplit: true,
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

    set({
      shoe,
      seats: updatedSeats,
      bankroll: isFree ? state.bankroll : state.bankroll - cost,
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
    const shoe = [...state.shoe];
    let dealerCards = [...state.dealerHand.cards];

    // Reveal hidden card
    dealerCards = dealerCards.map((c) => ({
      ...c,
      isHidden: false,
    }));

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
        const hitDelay = SPEED_DELAYS[get().dealerSpeed].dealerHit;
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

        const newCard = dealCard(currentShoe);
        dealerCards.push(newCard);
        dealerValue = calculateHandValue(dealerCards);

        // Update state so UI shows the new card
        set({
          dealerHand: { cards: [...dealerCards] },
          shoe: currentShoe,
        });
      }
    }

    // Small delay before payout phase for visual pacing
    const prePayoutDelay = SPEED_DELAYS[get().dealerSpeed].prePayout;
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
    state.seats.forEach(seat => {
      if (!seat.isActive) return;
      seat.hands.forEach(hand => {
        totalStaked += (hand.betAmount - (hand.freeActionBetAmount || 0));
      });
      if (state.insuranceBets[seat.id]) {
        totalStaked += state.insuranceBets[seat.id];
      }
      if (state.sideBets[seat.id]) {
        totalStaked += state.sideBets[seat.id];
      }
    });

    const bankrollBefore = state.bankroll + totalStaked;

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
        hands: seat.hands.map((hand) => {
          if (hand.betAmount === 0) return hand;

          const playerValue = calculateHandValue(hand.cards);
          const freeBet = hand.freeActionBetAmount || 0;

          // Already resolved (e.g., Bust, Even Money, or Surrendered)
          if (hand.status === HandStatus.BUST || hand.status === HandStatus.WON || hand.status === HandStatus.SURRENDERED) {
            if (hand.status === HandStatus.WON) {
              const evaluation = rules.evaluateHand(hand, playerValue, state.dealerHand.cards, dealerValue);
              totalPayout += (hand.betAmount - freeBet) + (hand.betAmount * evaluation.payoutMultiplier);
            }
            return {
              ...hand,
              status: hand.status === HandStatus.BUST ? HandStatus.LOST
                : hand.status === HandStatus.SURRENDERED ? HandStatus.SURRENDERED
                : HandStatus.WON,
            };
          }

          const evaluation = rules.evaluateHand(hand, playerValue, state.dealerHand.cards, dealerValue);
          
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
            .map((hand) => {
              const freeAmt = hand.freeActionBetAmount || 0;
              const playerValue = calculateHandValue(hand.cards);
              const evaluation = hand.status === HandStatus.SURRENDERED
                ? null
                : rules.evaluateHand(hand, playerValue, state.dealerHand.cards, dealerValue);
              return {
                betAmount: hand.betAmount - freeAmt, // Record only the real wagered amount
                freeActionBetAmount: freeAmt,
                result: hand.status,
                payout:
                  hand.status === HandStatus.WON || hand.status === HandStatus.BLACKJACK
                    ? hand.betAmount * (evaluation?.payoutMultiplier ?? 1)
                    : hand.status === HandStatus.PUSH
                    ? 0
                    : hand.status === HandStatus.SURRENDERED
                    ? -(hand.betAmount / 2)
                    : -(hand.betAmount - freeAmt),
                isSplit: hand.isSplit,
                isFreeActionSplit: hand.isFreeActionSplit,
                isDoubleDown: hand.isDoubleDown,
                isFreeActionDouble: hand.isFreeActionDouble,
                cards: hand.cards.map((c) => ({ suit: c.suit, rank: c.rank })),
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
    const MAX_STORE_HISTORY = 5000;
    const newHistory = [...state.matchHistory, matchRecord];
    if (newHistory.length > MAX_STORE_HISTORY) {
        newHistory.splice(0, newHistory.length - MAX_STORE_HISTORY);
    }

    set({
      seats: updatedSeats,
      bankroll: bankrollAfter,
      matchHistory: newHistory,
    });
  },

  resetRound: () => {
    const state = get();

    // Check if shoe needs reshuffling
    let shoe = state.shoe;
    const roomCfg = getRoomConfig(state.currentRoom);
    const numDecks = roomCfg.gameRules.numberOfDecks;
    const reshuffleThreshold = roomCfg.gameRules.reshuffleThreshold;
    const omitTens = roomCfg.gameRules.omitTens;
    
    if (shouldReshuffle(shoe, numDecks, reshuffleThreshold, omitTens)) {
      shoe = shuffleShoe(createShoe(numDecks, omitTens));
    }

    set({
      shoe,
      gamePhase: GamePhase.BETTING,
      dealerHand: { cards: [] },
      currentSeatIndex: 0,
      insuranceBets: {},
      sideBets: {},
      seats: state.seats.map((seat) => ({
        ...seat,
        hands: [createEmptyHand(seat.id, 0)],
        currentHandIndex: 0,
        freeActionTokens: 0,
        sideBetAmount: 0,
      })),
    });
  },

  // ============================================
  // Dev Tools
  // ============================================

  forceBlackjack: () => {
    const state = get();
    if (state.gamePhase !== GamePhase.BETTING) return;

    // Find first active seat and give it a bet
    const firstActive = state.seats.find((s) => s.isActive);
    if (!firstActive) return;

    // Stack the shoe with Ace + King on top
    const shoe = [...state.shoe];

    // Find and move an Ace and a face card to the top
    const aceIndex = shoe.findIndex((c) => c.rank === Rank.ACE);
    const faceIndex = shoe.findIndex(
      (c, i) => i !== aceIndex && (c.rank === Rank.KING || c.rank === Rank.QUEEN || c.rank === Rank.JACK)
    );

    if (aceIndex !== -1 && faceIndex !== -1) {
      // Move these cards to the dealing positions
      // Cards are dealt from the end (pop), so put them at the end
      const ace = shoe.splice(aceIndex, 1)[0];
      const adjustedFaceIdx = faceIndex > aceIndex ? faceIndex - 1 : faceIndex;
      const face = shoe.splice(adjustedFaceIdx, 1)[0];

      // The first player card dealt is at positions from the end
      // Active seats count + dealer alternation means we need to position carefully
      shoe.push(face); // Will be dealt second to player (second round)
      shoe.push(ace);  // Will be dealt to dealer (first round, second card after first player)
      // Actually, let's just stack the top simply
      shoe.push(ace);
      shoe.push(face);
    }

    set({ shoe });
  },

  forceSplitScenario: () => {
    const state = get();
    if (state.gamePhase !== GamePhase.BETTING) return;

    const shoe = [...state.shoe];

    // Find two cards of the same rank
    const targetRank = Rank.EIGHT;
    const indices = shoe.reduce<number[]>((acc, card, i) => {
      if (card.rank === targetRank && acc.length < 2) acc.push(i);
      return acc;
    }, []);

    if (indices.length >= 2) {
      // Remove and push to top
      const cards = indices
        .sort((a, b) => b - a) // Remove from end first to preserve indices
        .map((idx) => shoe.splice(idx, 1)[0]);
      shoe.push(...cards);
    }

    set({ shoe });
  },

  forceBust: () => {
    const state = get();
    if (state.gamePhase !== GamePhase.BETTING) return;

    const shoe = [...state.shoe];

    // Give player a 10 and a 6 (16)
    // Then the next card to be dealt to the player (when they hit) is a 10 (26 Bust)
    const card10 = shoe.find((c) => Math.min(c.value, 10) === 10);
    const card10_index = shoe.findIndex(c => c === card10)
    const c10_1 = shoe.splice(card10_index, 1)[0]
    
    // get another 10
    const card10_2 = shoe.find((c) => Math.min(c.value, 10) === 10);
    const card10_index2 = shoe.findIndex(c => c === card10_2);
    const c10_2 = shoe.splice(card10_index2, 1)[0];

    const card6 = shoe.find((c) => c.value === 6);
    const card6_index = shoe.findIndex(c => c === card6);
    const c6 = shoe.splice(card6_index, 1)[0]
    
    // Stack cards for dealing
    shoe.push(c10_2) // hit card
    shoe.push(c6)   // second card
    shoe.push(c10_1) // first card

    set({ shoe });
  },

  forceAceSplitScenario: () => {
    const state = get();
    if (state.gamePhase !== GamePhase.BETTING) return;

    const shoe = [...state.shoe];

    // Find two Aces
    const targetRank = Rank.ACE;
    const indices = shoe.reduce<number[]>((acc, card, i) => {
      if (card.rank === targetRank && acc.length < 2) acc.push(i);
      return acc;
    }, []);

    if (indices.length >= 2) {
      // Remove and push to top
      const cards = indices
        .sort((a, b) => b - a)
        .map((idx) => shoe.splice(idx, 1)[0]);
      shoe.push(...cards);
    }

    set({ shoe });
  },

  // ─── Assumes 1 active seat. Dealing order (pop): seat1, dealer_up, seat2, dealer_hole ───

  forcePush: () => {
    // Both player and dealer get 20 (King + King)
    const state = get();
    if (state.gamePhase !== GamePhase.BETTING) return;
    const shoe = [...state.shoe];
    const pick = (rank: Rank) => {
      const idx = shoe.findIndex((c) => c.rank === rank);
      return idx !== -1 ? shoe.splice(idx, 1)[0] : shoe.splice(0, 1)[0];
    };
    const k1 = pick(Rank.KING);
    const k2 = pick(Rank.QUEEN);
    const k3 = pick(Rank.JACK);
    const k4 = shoe.findIndex((c) => c.value === 10);
    const k4card = k4 !== -1 ? shoe.splice(k4, 1)[0] : shoe.splice(0, 1)[0];
    // Push order: hole, dealer_up, seat2, seat1
    shoe.push(k3, k2, k4card, k1);
    set({ shoe });
  },

  forceDealerBust: () => {
    // Player gets 20, dealer gets 6+10=16, next card is 10 → bust 26
    const state = get();
    if (state.gamePhase !== GamePhase.BETTING) return;
    const shoe = [...state.shoe];
    const pick = (predicate: (c: typeof shoe[0]) => boolean) => {
      const idx = shoe.findIndex(predicate);
      return idx !== -1 ? shoe.splice(idx, 1)[0] : shoe.splice(0, 1)[0];
    };
    const bust10 = pick((c) => c.value === 10);  // dealer hit card
    const hole10 = pick((c) => c.value === 10);  // dealer hole
    const up6   = pick((c) => c.value === 6);    // dealer face-up → 6+10=16, hits
    const s2    = pick((c) => c.value === 10);   // seat card 2
    const s1    = pick((c) => c.value === 10);   // seat card 1 → player 20
    // shoe: [..., bust10, hole10, up6, s2, s1]
    shoe.push(bust10, hole10, up6, s2, s1);
    set({ shoe });
  },

  forceInsurance: () => {
    // Dealer face-up = Ace → triggers insurance offer
    // Player gets King + King = 20
    const state = get();
    if (state.gamePhase !== GamePhase.BETTING) return;
    const shoe = [...state.shoe];
    const pick = (predicate: (c: typeof shoe[0]) => boolean) => {
      const idx = shoe.findIndex(predicate);
      return idx !== -1 ? shoe.splice(idx, 1)[0] : shoe.splice(0, 1)[0];
    };
    const hole = pick((c) => c.value === 10);         // dealer hole card
    const ace  = pick((c) => c.rank === Rank.ACE);    // dealer face-up = Ace
    const s2   = pick((c) => c.value === 10);         // seat second card
    const s1   = pick((c) => c.value === 10);         // seat first card → 20
    // shoe: [..., hole, ace, s2, s1]
    shoe.push(hole, ace, s2, s1);
    set({ shoe });
  },

  forceDoubleSetup: () => {
    // Player gets 9+2 = 11 (ideal double down hand)
    // Dealer shows 6 (worst dealer upcard)
    const state = get();
    if (state.gamePhase !== GamePhase.BETTING) return;
    const shoe = [...state.shoe];
    const pick = (predicate: (c: typeof shoe[0]) => boolean) => {
      const idx = shoe.findIndex(predicate);
      return idx !== -1 ? shoe.splice(idx, 1)[0] : shoe.splice(0, 1)[0];
    };
    const hole = pick((c) => c.value === 10);  // dealer hole
    const up   = pick((c) => c.value === 6);   // dealer face-up (weak = 6)
    const s2   = pick((c) => c.value === 2);   // seat card 2 → 9+2=11
    const s1   = pick((c) => c.value === 9);   // seat card 1
    shoe.push(hole, up, s2, s1);
    set({ shoe });
  },

  setMatchHistory: (records: MatchRecord[]) => {
    set({ matchHistory: records });
  },
});