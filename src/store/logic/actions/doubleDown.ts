import { GameStore, GamePhase } from '@/types/game';
import { HandStatus, Rank } from '@/types/enums';
import { getRoomConfig } from '@/utils/rooms';
import { getRules } from '@/rules';
import { calculateHandValue, isBust } from '@/utils/hand';
import { dealCard, dealForcedCard, createShoe, shuffleShoe } from '@/utils/deck';
import { checkTutorialAction } from '@/utils/tutorialInterceptor';
import { getCurrentHand } from '../utils';

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

    const newCard = (forcedShoe && forcedShoe.length > 0) ? dealForcedCard(shoe, forcedShoe) : dealCard(shoe);

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

          const stayPlaying = roomCfg.gameRules.allowDoubleDownRescue || roomCfg.gameRules.allowInfiniteDouble;
          const isSingleCardStart = (roomCfg.gameRules.playerInitialCards ?? 2) === 1;
          const isMadnessAceDouble = isSingleCardStart && hand.cards.length === 1 && hand.cards[0].rank === Rank.ACE;
          
          return {
            ...hand,
            cards: newCards,
            betAmount: hand.betAmount + (isFree ? hand.betAmount : cost),
            status: busted ? HandStatus.BUST : isImmediateWin ? HandStatus.WON : (is21 || !stayPlaying || isMadnessAceDouble) ? HandStatus.STAND : HandStatus.PLAYING,
            isDoubleDown: true,
            doubleCount: (hand.doubleCount || 0) + 1,
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
