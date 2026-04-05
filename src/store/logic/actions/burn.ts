import { GameStore, GamePhase } from '@/types/game';
import { HandStatus, Rank, Suit } from '@/types/enums';
import { getRoomConfig } from '@/utils/rooms';
import { getRules } from '@/rules';
import { calculateHandValue, isBust } from '@/utils/hand';
import { dealCard, dealForcedCard, createShoe, shuffleShoe } from '@/utils/deck';
import { checkTutorialAction } from '@/utils/tutorialInterceptor';

export const burnLogic = (set: any, get: () => GameStore) => {
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
    let forcedShoe = state.forcedShoe ? [...state.forcedShoe] : null;

    if (!forcedShoe && shoe.length < 2) {
      const roomCfg = getRoomConfig(state.currentRoom);
      shoe = [...shoe, ...shuffleShoe(createShoe(roomCfg.gameRules.numberOfDecks, roomCfg.gameRules.omitTens))];
    }

    const discardedCard = currentHand.cards[1];
    const replacementCard = (forcedShoe && forcedShoe.length > 0) ? dealForcedCard(shoe, forcedShoe) : dealCard(shoe);
    const newCards = [currentHand.cards[0], replacementCard];

    let bankrollDelta = -cost;
    let burnBonusPayout = 0;
    if (discardedCard.rank === Rank.ACE) {
      burnBonusPayout = discardedCard.suit === Suit.SPADES ? cost * 8 : cost * 3;
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
      seats: updatedSeats,
      forcedShoe: forcedShoe ? [...forcedShoe] : null,
    });

    const updatedHand = updatedSeats[state.currentSeatIndex].hands[seat.currentHandIndex];
    if (updatedHand.status !== HandStatus.PLAYING) {
       setTimeout(() => get().advanceToNextHand(), 0);
    }
};
