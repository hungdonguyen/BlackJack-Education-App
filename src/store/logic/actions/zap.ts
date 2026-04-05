import { GameStore, GamePhase } from '@/types/game';
import { HandStatus } from '@/types/enums';
import { getRoomConfig } from '@/utils/rooms';
import { getRules } from '@/rules';
import { calculateHandValue, isBust } from '@/utils/hand';
import { dealCard, dealForcedCard, createShoe, shuffleShoe } from '@/utils/deck';
import { checkTutorialAction } from '@/utils/tutorialInterceptor';

export const zapLogic = (set: any, get: () => GameStore) => {
    const state = get();
    set({ actionCounter: state.actionCounter + 1 });
    if (state.gamePhase !== GamePhase.PLAYER_TURN) return;
    if (!checkTutorialAction(state, 'action-zapout')) return;

    const seat = state.seats[state.currentSeatIndex];
    if (!seat) return;
    const currentHand = seat.hands[seat.currentHandIndex];
    if (!currentHand || currentHand.status !== HandStatus.PLAYING) return;

    const rules = getRules(state.currentRoom);
    if (!rules.canZap) return;
    const { allowed } = rules.canZap(currentHand);
    if (!allowed) return;

    let shoe = [...state.shoe];
    let forcedShoe = state.forcedShoe ? [...state.forcedShoe] : null;

    if (!forcedShoe && shoe.length < 2) {
      const roomCfg = getRoomConfig(state.currentRoom);
      shoe = [...shoe, ...shuffleShoe(createShoe(roomCfg.gameRules.numberOfDecks, roomCfg.gameRules.omitTens))];
    }

    const drawCard = () => (forcedShoe && forcedShoe.length > 0 ? dealForcedCard(shoe, forcedShoe) : dealCard(shoe));
    const newCards = [drawCard(), drawCard()];
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

    set({ shoe, seats: updatedSeats, forcedShoe: forcedShoe ? [...forcedShoe] : null });

    const updatedHand = updatedSeats[state.currentSeatIndex].hands[seat.currentHandIndex];
    if (updatedHand.status !== HandStatus.PLAYING) {
       setTimeout(() => get().advanceToNextHand(), 0);
    }
};
