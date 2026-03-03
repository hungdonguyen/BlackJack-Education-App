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

export interface GameFlowSlice {
  // State
  shoe: Card[];
  gamePhase: GamePhase;
  seats: GameStore['seats'];
  dealerHand: GameStore['dealerHand'];
  currentSeatIndex: number;
  matchHistory: MatchRecord[];
  insuranceBets: Record<number, number>;
  
  // Actions
  initializeShoe: () => void;
  startDeal: () => void;
  hit: () => void;
  stand: () => void;
  doubleDown: () => void;
  split: () => void;
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
}

/** Get the current active hand being played */
function getCurrentHand(state: GameStore): Hand | null {
  const seat = state.seats[state.currentSeatIndex];
  if (!seat || !seat.isActive) return null;
  return seat.hands[seat.currentHandIndex] ?? null;
}

/** Find the first active seat index */
function findFirstActiveSeatIndex(state: GameStore): number {
  return state.seats.findIndex((s) => s.isActive && s.hands.some((h) => h.betAmount > 0));
}

export const createGameFlowSlice: StateCreator<GameStore, [], [], GameFlowSlice> = (set, get) => ({
  shoe: [],
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

  initializeShoe: () => {
    const state = get();
    const roomCfg = getRoomConfig(state.currentRoom);
    const numDecks = roomCfg.gameRules.numberOfDecks;
    const shoe = shuffleShoe(createShoe(numDecks));
    set({ shoe });
  },

  startDeal: async () => {
    const state = get();
    if (state.gamePhase !== GamePhase.BETTING) return;

    // Must have at least one active seat with a bet
    const hasActiveBets = state.seats.some(
      (s) => s.isActive && s.hands.some((h) => h.betAmount > 0)
    );
    if (!hasActiveBets) return;

    // Transition to DEALING phase immediately to hide betting UI
    // Capture previous bets to allow rebet/x2 in the next round
    const currentBets: { seatId: number; amount: number }[] = [];
    state.seats.forEach((s) => {
      const activeBet = s.hands.reduce((sum, h) => sum + h.betAmount, 0);
      if (activeBet > 0) currentBets.push({ seatId: s.id, amount: activeBet });
    });

    set({ gamePhase: GamePhase.DEALING, previousBets: currentBets });

    // Check if shoe needs reshuffling
    let shoe = [...state.shoe];
    const roomCfg = getRoomConfig(state.currentRoom);
    const numDecks = roomCfg.gameRules.numberOfDecks;
    
    if (shoe.length === 0 || shouldReshuffle(shoe, numDecks)) {
      shoe = shuffleShoe(createShoe(numDecks));
    }

    // Active seats that need cards
    const activeSeats = state.seats.filter(
      (s) => s.isActive && s.hands.some((h) => h.betAmount > 0)
    );

    let newSeats = [...state.seats];
    const dealerCards: Card[] = [];

    const dealToSeat = async (seatId: number) => {
      await new Promise((resolve) => setTimeout(resolve, 800)); // 0.8s between dealt cards
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
      await new Promise((resolve) => setTimeout(resolve, 800));
      dealerCards.push(dealCard(shoe, isHidden));
      set({ dealerHand: { cards: [...dealerCards] }, shoe: [...shoe] });
    };

    // --- First round of cards ---
    for (const seat of activeSeats) {
      await dealToSeat(seat.id);
    }
    await dealToDealer(false); // Face-up card

    // --- Second round of cards ---
    for (const seat of activeSeats) {
      await dealToSeat(seat.id);
    }
    await dealToDealer(true); // Hole card (hidden)

    // Wait a brief moment after all cards are dealt before checking for Blackjacks
    await new Promise((resolve) => setTimeout(resolve, 500));

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
    const dealerHasBJ = isBlackjack(dealerCards, true);

    // Find first active seat that can play
    const firstPlayableIndex = finalSeats.findIndex(
      (s) =>
        s.isActive &&
        s.hands.some((h) => h.betAmount > 0 && h.status === HandStatus.PLAYING)
    );

    if (dealerShowsAce) {
      // Go to insurance phase first
      set({
        seats: finalSeats,
        gamePhase: GamePhase.INSURANCE,
        currentSeatIndex: firstPlayableIndex === -1 ? 0 : firstPlayableIndex,
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

    // Calculate insurance bets: half the original bet per active seat
    const newInsuranceBets: Record<number, number> = {};
    let totalInsuranceCost = 0;

    state.seats.forEach((seat) => {
      if (!seat.isActive) return;
      const mainBet = seat.hands[0]?.betAmount ?? 0;
      if (mainBet > 0) {
        const insuranceAmount = Math.floor(mainBet / 2);
        if (insuranceAmount <= state.bankroll - totalInsuranceCost) {
          newInsuranceBets[seat.id] = insuranceAmount;
          totalInsuranceCost += insuranceAmount;
        }
      }
    });

    const updatedSeats = state.seats;

    // Find first playable hand from the UPDATED seats
    const firstPlayableIndex = updatedSeats.findIndex(
      (s) => s.isActive && s.hands.some((h) => h.betAmount > 0 && h.status === HandStatus.PLAYING)
    );

    const dealerHasBJ = isBlackjack(state.dealerHand.cards, true);
    const nextPhase = dealerHasBJ ? GamePhase.DEALER_TURN : (firstPlayableIndex === -1 ? GamePhase.DEALER_TURN : GamePhase.PLAYER_TURN);

    set({
      seats: updatedSeats,
      insuranceBets: newInsuranceBets,
      bankroll: state.bankroll - totalInsuranceCost,
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

    // Find first playable hand
    const firstPlayableIndex = state.seats.findIndex(
      (s) => s.isActive && s.hands.some((h) => h.betAmount > 0 && h.status === HandStatus.PLAYING)
    );

    const dealerHasBJ = isBlackjack(state.dealerHand.cards, true);
    const nextPhase = dealerHasBJ ? GamePhase.DEALER_TURN : (firstPlayableIndex === -1 ? GamePhase.DEALER_TURN : GamePhase.PLAYER_TURN);

    set({
      insuranceBets: {},
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

    const shoe = [...state.shoe];
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

          return {
            ...hand,
            cards: newCards,
            status: busted ? HandStatus.BUST : is21 ? HandStatus.STAND : HandStatus.PLAYING,
          };
        }),
      };
    });

    set({ shoe, seats: updatedSeats });

    // If busted or 21, auto-advance
    const updatedHand = updatedSeats[state.currentSeatIndex].hands[
      updatedSeats[state.currentSeatIndex].currentHandIndex
    ];
    if (
      updatedHand.status === HandStatus.BUST ||
      updatedHand.status === HandStatus.STAND
    ) {
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
    if (!currentHand || currentHand.status !== HandStatus.PLAYING) return;

    const seat = state.seats[state.currentSeatIndex];
    if (!seat) return;

    const rules = getRules(state.currentRoom);
    const { allowed, isFree, cost } = rules.canDoubleDown(currentHand);

    if (!allowed) return;
    if (cost > state.bankroll) return;

    const shoe = [...state.shoe];
    const newCard = dealCard(shoe);

    const updatedSeats = state.seats.map((seat, seatIdx) => {
      if (seatIdx !== state.currentSeatIndex) return seat;
      return {
        ...seat,
        hands: seat.hands.map((hand, handIdx) => {
          if (handIdx !== seat.currentHandIndex) return hand;

          const newCards = [...hand.cards, newCard];
          const busted = isBust(newCards);

          return {
            ...hand,
            cards: newCards,
            betAmount: hand.betAmount + cost,
            status: busted ? HandStatus.BUST : HandStatus.STAND,
            freeBetAmount: hand.freeBetAmount,
          };
        }),
      };
    });

    set({
      shoe,
      seats: updatedSeats,
      bankroll: state.bankroll - cost,
    });

    // Double down always ends the hand (force stand), advance
    get().advanceToNextHand();
  },

  split: () => {
    const state = get();
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
    if (cost > state.bankroll) return;

    const splitBet = currentHand.betAmount;
    const shoe = [...state.shoe];

    // Create two new hands from the split
    const card1 = currentHand.cards[0];
    const card2 = currentHand.cards[1];
    const newCard1 = dealCard(shoe);
    const newCard2 = dealCard(shoe);

    const isSplitAces = card1.value === 11;
    const initialStatus = isSplitAces ? HandStatus.STAND : HandStatus.PLAYING;

    const hand1: Hand = {
      id: `seat-${seat.id}-hand-${seat.hands.length}`,
      cards: [card1, newCard1],
      betAmount: splitBet,
      status: initialStatus,
      freeBetAmount: currentHand.freeBetAmount,
      isAceSplit: isSplitAces,
    };

    const hand2: Hand = {
      id: `seat-${seat.id}-hand-${seat.hands.length + 1}`,
      cards: [card2, newCard2],
      betAmount: splitBet, // Standard bet amount is same
      status: initialStatus,
      freeBetAmount: currentHand.freeBetAmount,
      isAceSplit: isSplitAces,
    };

    // Check for blackjack on split hands (Split Aces do not get Blackjack)
    if (!isSplitAces) {
      if (isBlackjack(hand1.cards)) hand1.status = HandStatus.BLACKJACK;
      if (isBlackjack(hand2.cards)) hand2.status = HandStatus.BLACKJACK;
    }

    const updatedSeats = state.seats.map((s, seatIdx) => {
      if (seatIdx !== state.currentSeatIndex) return s;

      const newHands = [...s.hands];
      newHands.splice(seat.currentHandIndex, 1, hand1, hand2);

      return {
        ...s,
        hands: newHands,
        currentHandIndex: seat.currentHandIndex,
      };
    });

    set({
      shoe,
      seats: updatedSeats,
      bankroll: state.bankroll - cost,
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
    const state = get();
    if (state.gamePhase !== GamePhase.DEALER_TURN) return;

    let shoe = [...state.shoe];
    let dealerCards = [...state.dealerHand.cards];

    // Reveal hidden card
    dealerCards = dealerCards.map((c) => ({
      ...c,
      isHidden: false,
    }));

    // Check if all player hands are busted — if so, dealer doesn't need to draw
    const allBusted = state.seats
      .filter((s) => s.isActive)
      .every((s) => s.hands.every((h) => h.status === HandStatus.BUST));

    // Initial reveal
    set({ dealerHand: { cards: [...dealerCards] } });

    if (!allBusted) {
      const roomCfg = getRoomConfig(state.currentRoom);
      const hitsSoft17 = roomCfg.gameRules.dealerHitsSoft17;

      // Dealer hits until 17 or higher
      // If dealer has exactly 17 and hitsSoft17 is TRUE and the hand is Soft, draw again
      let dealerValue = calculateHandValue(dealerCards);

      while (
        dealerValue.total < 17 || 
        (dealerValue.total === 17 && dealerValue.isSoft && hitsSoft17)
      ) {
        // Wait 1 seconds before drawing next card
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const newCard = dealCard(shoe);
        dealerCards.push(newCard);
        dealerValue = calculateHandValue(dealerCards);

        // Update state so UI shows the new card
        set({
          shoe: [...shoe],
          dealerHand: { cards: [...dealerCards] },
        });
      }
    }

    // Small delay before payout phase for visual pacing
    await new Promise((resolve) => setTimeout(resolve, 1000));

    set({
      gamePhase: GamePhase.PAYOUT,
    });

    // Auto-calculate payouts
    setTimeout(() => get().calculatePayouts(), 0);
  },

  calculatePayouts: () => {
    const state = get();
    if (state.gamePhase !== GamePhase.PAYOUT) return;

    const dealerValue = calculateHandValue(state.dealerHand.cards);
    const dealerBust = dealerValue.total > 21;
    const bankrollBefore = state.bankroll;

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

          // Already resolved (e.g., Bust, or Even Money)
          if (hand.status === HandStatus.BUST || hand.status === HandStatus.WON) {
            return {
              ...hand,
              status: hand.status === HandStatus.BUST ? HandStatus.LOST : HandStatus.WON,
            };
          }

          const playerValue = calculateHandValue(hand.cards);
          const playerHasBlackjack = hand.status === HandStatus.BLACKJACK;

          const freeBet = hand.freeBetAmount || 0;

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
          hands: seat.hands
            .filter((h) => h.betAmount > 0)
            .map((hand) => ({
              betAmount: hand.betAmount,
              result: hand.status,
              payout:
                hand.status === HandStatus.WON
                  ? hand.betAmount
                  : hand.status === HandStatus.BLACKJACK
                  ? hand.betAmount * rules.blackjackPayoutMultiplier
                  : hand.status === HandStatus.PUSH
                  ? 0
                  : -(hand.betAmount - (hand.freeBetAmount || 0)),
              cards: hand.cards.map((c) => ({ suit: c.suit, rank: c.rank })),
            })),
        })),
      dealerCards: state.dealerHand.cards.map((c) => ({
        suit: c.suit,
        rank: c.rank,
      })),
      bankrollBefore,
      bankrollAfter,
    };

    set({
      seats: updatedSeats,
      bankroll: bankrollAfter,
      matchHistory: [...state.matchHistory, matchRecord],
    });
  },

  resetRound: () => {
    const state = get();

    // Check if shoe needs reshuffling
    let shoe = state.shoe;
    const roomCfg = getRoomConfig(state.currentRoom);
    const numDecks = roomCfg.gameRules.numberOfDecks;
    
    if (shouldReshuffle(shoe, numDecks)) {
      shoe = shuffleShoe(createShoe(numDecks));
    }

    set({
      shoe,
      gamePhase: GamePhase.BETTING,
      dealerHand: { cards: [] },
      currentSeatIndex: 0,
      insuranceBets: {},
      seats: state.seats.map((seat) => ({
        ...seat,
        hands: [createEmptyHand(seat.id, 0)],
        currentHandIndex: 0,
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
  },});