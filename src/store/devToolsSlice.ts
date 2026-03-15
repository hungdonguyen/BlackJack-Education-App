import { StateCreator } from 'zustand';
import { GameStore } from '@/types/game';
import { GamePhase, Rank } from '@/types/enums';

export interface DevToolsSlice {
  forceBlackjack: () => void;
  forceBust: () => void;
  forceSplitScenario: () => void;
  forceAceSplitScenario: () => void;
  forcePush: () => void;
  forceDealerBust: () => void;
  forceInsurance: () => void;
  forceDoubleSetup: () => void;
}

export const createDevToolsSlice: StateCreator<
  GameStore,
  [],
  [],
  DevToolsSlice
> = (set, get) => ({
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
  },
});
