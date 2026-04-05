import { GameStore, GamePhase } from '@/types/game';
import { HandStatus } from '@/types/enums';
import { getRules } from '@/rules';
import { calculateHandValue } from '@/utils/hand';
import { checkTutorialAction } from '@/utils/tutorialInterceptor';

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
