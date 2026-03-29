// ============================================
// Deck & Shoe Utilities
// ============================================

import { Card, Shoe } from '@/types/game';
import { Suit, Rank } from '@/types/enums';
import { NUM_DECKS, RESHUFFLE_THRESHOLD } from './constants';
import { invoke } from '@tauri-apps/api/core';

/** Map of rank to base numeric value */
const RANK_VALUES: Record<Rank, number> = {
  [Rank.ACE]: 11,
  [Rank.TWO]: 2,
  [Rank.THREE]: 3,
  [Rank.FOUR]: 4,
  [Rank.FIVE]: 5,
  [Rank.SIX]: 6,
  [Rank.SEVEN]: 7,
  [Rank.EIGHT]: 8,
  [Rank.NINE]: 9,
  [Rank.TEN]: 10,
  [Rank.JACK]: 10,
  [Rank.QUEEN]: 10,
  [Rank.KING]: 10,
};

/** Create a single standard 52-card deck (or 48 cards if omitTens is true) */
export function createDeck(omitTens: boolean = false): Card[] {
  const suits = Object.values(Suit);
  const ranks = Object.values(Rank);
  const deck: Card[] = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      if (omitTens && rank === Rank.TEN) continue;

      deck.push({
        suit,
        rank,
        value: RANK_VALUES[rank],
        isHidden: false,
      });
    }
  }

  return deck;
}

/** Create a shoe from multiple decks (default: 6 decks = 312 cards) */
export function createShoe(numDecks: number = NUM_DECKS, omitTens: boolean = false): Shoe {
  const shoe: Shoe = [];
  for (let i = 0; i < numDecks; i++) {
    shoe.push(...createDeck(omitTens));
  }
  return shoe;
}

/** Fisher-Yates shuffle using CSPRNG (crypto.getRandomValues) */
export function shuffleShoe(shoe: Shoe): Shoe {
  const shuffled = [...shoe];
  const randomBuffer = new Uint32Array(shuffled.length);
  crypto.getRandomValues(randomBuffer);
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomBuffer[i] % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/** Tries to use the native Rust implementation to generate and shuffle shoes securely, falls back to JS in web-mode. */
export async function getShuffledShoe(numDecks: number = NUM_DECKS, omitTens: boolean = false): Promise<Shoe> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
    try {
      const shoe = await invoke<Card[]>('shuffle_and_deal', { numDecks, omitTens });
      return shoe;
    } catch (e) {
      console.error('Failed to get shoe from Rust backend, falling back to JS.', e);
    }
  }
  return shuffleShoe(createShoe(numDecks, omitTens));
}

/** Check if the shoe needs reshuffling.
 *  @param threshold - fraction of total cards at which to reshuffle (default: RESHUFFLE_THRESHOLD = 0.25)
 */
export function shouldReshuffle(shoe: Shoe, numDecks: number = NUM_DECKS, threshold: number = RESHUFFLE_THRESHOLD, omitTens: boolean = false): boolean {
  const cardsPerDeck = omitTens ? 48 : 52;
  const totalCards = numDecks * cardsPerDeck;
  return shoe.length <= totalCards * threshold;
}

/** Deal a card from the top of the shoe (mutates the shoe array) */
export function dealCard(shoe: Shoe, hidden: boolean = false): Card {
  const card = shoe.pop();
  if (!card) {
    throw new Error('Shoe is empty! Cannot deal card.');
  }
  return { ...card, isHidden: hidden };
}

/** 
 * Deal a forced card and remove a matching card from the main shoe (mutates both arrays).
 * Necessary for tutorials to keep Card Counting and Shoe logic accurate. 
 */
export function dealForcedCard(shoe: Shoe, forcedShoe: Shoe, hidden: boolean = false): Card {
  const card = forcedShoe.pop();
  if (!card) {
    throw new Error('Forced shoe is empty! Cannot deal card.');
  }

  // Remove matching card from the main shoe to keep deck composition tracking accurate
  const exactMatchIndex = shoe.findIndex(c => c.rank === card.rank && c.suit === card.suit);
  if (exactMatchIndex !== -1) {
    shoe.splice(exactMatchIndex, 1);
  } else {
    // Fallback: Remove any card with the same rank
    const matchRankIndex = shoe.findIndex(c => c.rank === card.rank);
    if (matchRankIndex !== -1) {
      shoe.splice(matchRankIndex, 1);
    } else {
      // Ultimate fallback: Just pop any card
      shoe.pop();
    }
  }

  return { ...card, isHidden: hidden };
}
