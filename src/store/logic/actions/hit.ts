import { GameStore, GamePhase } from '@/types/game';
import { HandStatus } from '@/types/enums';
import { getRoomConfig } from '@/utils/rooms';
import { calculateHandValue, isBust } from '@/utils/hand';
import { dealCard, dealForcedCard } from '@/utils/deck';
import { checkTutorialAction } from '@/utils/tutorialInterceptor';
import { getCurrentHand } from '../utils';

export const hitLogic = (set: any, get: () => GameStore) => {
    const state = get();
    if (state.gamePhase !== GamePhase.PLAYER_TURN) return;
    if (!checkTutorialAction(state, 'action-hit')) return;

    const currentHand = getCurrentHand(state);
    const roomCfg = getRoomConfig(state.currentRoom);
    if (!currentHand || currentHand.status !== HandStatus.PLAYING || (currentHand.isDoubleDown && !roomCfg.gameRules.allowInfiniteDouble)) return;

    set({ actionCounter: state.actionCounter + 1 });

    let shoe = [...state.shoe];
    let forcedShoe = state.forcedShoe ? [...state.forcedShoe] : null;

    const card = (forcedShoe && forcedShoe.length > 0) ? dealForcedCard(shoe, forcedShoe) : dealCard(shoe);
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
