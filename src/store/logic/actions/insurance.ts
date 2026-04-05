import { GameStore, GamePhase } from '@/types/game';
import { HandStatus } from '@/types/enums';
import { getRoomConfig } from '@/utils/rooms';
import { isBlackjack } from '@/utils/hand';
import { checkTutorialAction } from '@/utils/tutorialInterceptor';

export const acceptInsuranceLogic = (set: any, get: () => GameStore) => {
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
    const newTutorialBalance = isTutorial ? (state.tutorialBalance ?? 0) - insuranceAmount : state.tutorialBalance;

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
};

export const declineInsuranceLogic = (set: any, get: () => GameStore) => {
    const state = get();
    if (state.gamePhase !== GamePhase.INSURANCE) return;
    if (!checkTutorialAction(state, 'insurance-decline')) return;

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
};
