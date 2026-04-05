import { GameStore, GamePhase } from '@/types/game';
import { HandStatus } from '@/types/enums';
import { getRoomConfig } from '@/utils/rooms';
import { getRules } from '@/rules';
import { checkTutorialAction } from '@/utils/tutorialInterceptor';

export const standLogic = (set: any, get: () => GameStore) => {
    const state = get();
    if (state.gamePhase !== GamePhase.PLAYER_TURN) return;
    if (!checkTutorialAction(state, 'action-stand')) return;

    const currentSeat = state.seats[state.currentSeatIndex];
    if (!currentSeat) return;
    const currentHand = currentSeat.hands[currentSeat.currentHandIndex];
    if (!currentHand) return;

    const roomCfg = getRoomConfig(state.currentRoom);
    const isSingleCardStart = (roomCfg.gameRules.playerInitialCards ?? 2) === 1;
    if (isSingleCardStart && currentHand.cards.length === 1) return;

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
