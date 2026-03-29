import { GameStore, GamePhase, Card } from '@/types/game';
import { Rank } from '@/types/enums';
import { getRoomConfig } from '@/utils/rooms';
import { calculateHandValue } from '@/utils/hand';
import { createShoe, shuffleShoe, dealCard, dealForcedCard } from '@/utils/deck';
import { SPEED_DELAYS } from '../settingsSlice';

let _dealerPlayLock = false;

export const dealerPlayLogic = async (set: any, get: () => GameStore) => {
    if (_dealerPlayLock) return;
    const state = get();
    if (state.gamePhase !== GamePhase.DEALER_TURN) return;
    _dealerPlayLock = true;

    try {
      let shoe = [...state.shoe];
      let forcedShoe = state.forcedShoe ? [...state.forcedShoe] : null;

      let dealerCards = state.dealerHand.cards.map((c) => ({
        ...c,
        isHidden: false,
      }));
      set({ dealerHand: { cards: dealerCards } });

      const isTutorial = getRoomConfig(state.currentRoom).isTutorial;
      const speed = isTutorial ? 'normal' : get().dealerSpeed;
      const flipDelay = SPEED_DELAYS[speed].flipCard || 800;
      await new Promise((resolve) => setTimeout(resolve, flipDelay));

      const allBustedOrSurrendered = state.seats
        .filter((s) => s.isActive && s.hands.some((h) => h.betAmount > 0))
        .every((s) => s.hands.every((h) => h.betAmount === 0 || h.status === 'BUST' || h.status === 'SURRENDERED'));

      const allResolvedOrBlackjack = state.seats
        .filter((s) => s.isActive && s.hands.some((h) => h.betAmount > 0))
        .every((s) => s.hands.every((h) =>
          h.betAmount === 0 || h.status === 'BUST' || h.status === 'SURRENDERED' || h.status === 'BLACKJACK'
        ));

      set({ dealerHand: { cards: [...dealerCards] } });

      const roomCfg = getRoomConfig(state.currentRoom);
      const hasInsuranceBets = Object.values(state.insuranceBets).some((bet) => bet > 0);
      const dealerNeedsToDrawForInsurance = roomCfg.gameRules.enhc && dealerCards.length === 1 && dealerCards[0].rank === Rank.ACE && hasInsuranceBets;
      
      const hasBlackjack = state.seats.filter(s => s.isActive).some(s => s.hands.some(h => h.betAmount > 0 && h.status === 'BLACKJACK'));
      const dealerNeedsToDrawForENHCBlackjack = roomCfg.gameRules.enhc && dealerCards.length === 1 && hasBlackjack;

      if (!allBustedOrSurrendered && !allResolvedOrBlackjack || dealerNeedsToDrawForInsurance || dealerNeedsToDrawForENHCBlackjack) {
        const hitsSoft17 = roomCfg.gameRules.dealerHitsSoft17;
        let dealerValue = calculateHandValue(dealerCards);

        while (
          dealerValue.total < 17 || 
          (dealerValue.total === 17 && dealerValue.isSoft && hitsSoft17)
        ) {
          const hitDelay = SPEED_DELAYS[isTutorial ? 'normal' : get().dealerSpeed].dealerHit;
          await new Promise((resolve) => setTimeout(resolve, hitDelay));

          if (get().gamePhase !== GamePhase.DEALER_TURN) return;

          const currentState = get();
          let currentShoe = [...currentState.shoe];

          if (currentShoe.length === 0) {
            currentShoe = shuffleShoe(createShoe(roomCfg.gameRules.numberOfDecks, roomCfg.gameRules.omitTens));
          }

          const newCard = (forcedShoe && forcedShoe.length > 0) ? dealForcedCard(currentShoe, forcedShoe) : dealCard(currentShoe);
          dealerCards.push(newCard);
          dealerValue = calculateHandValue(dealerCards);

          set({ dealerHand: { cards: [...dealerCards] }, shoe: currentShoe, forcedShoe: forcedShoe ? [...forcedShoe] : null });
        }
      }

      const prePayoutDelay = SPEED_DELAYS[isTutorial ? 'normal' : get().dealerSpeed].prePayout;
      await new Promise((resolve) => setTimeout(resolve, prePayoutDelay));

      set({ gamePhase: GamePhase.PAYOUT });
      setTimeout(() => get().calculatePayouts(), 0);

    } catch (err) {
      console.error('[dealerPlay] Error during dealer turn:', err);
      if (get().gamePhase === GamePhase.DEALER_TURN) {
        set({ gamePhase: GamePhase.PAYOUT });
        setTimeout(() => get().calculatePayouts(), 0);
      }
    } finally {
      _dealerPlayLock = false;
    }
};
