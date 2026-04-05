import { GameStore, GamePhase } from '@/types/game';
import { HandStatus } from '@/types/enums';
import { getRoomConfig } from '@/utils/rooms';
import { getRules } from '@/rules';
import { checkTutorialAction } from '@/utils/tutorialInterceptor';
import { getCurrentHand } from '../utils';

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
