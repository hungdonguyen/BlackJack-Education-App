// ============================================
// Asset Path Utilities
// ============================================
// Maps game types to image file paths.
// Cards: Deck of Cards API | Chips: AI-generated premium

import { Card } from '@/types/game';
import { Suit, Rank } from '@/types/enums';

/** Cache buster — increment and hard-reload browser when replacing images */
// const CHIP_VERSION = 'v2';

/** Map Suit enum to file prefix */
const SUIT_PREFIX: Record<Suit, string> = {
  [Suit.HEARTS]: 'H',
  [Suit.DIAMONDS]: 'D',
  [Suit.CLUBS]: 'C',
  [Suit.SPADES]: 'S',
};

/** Map Rank enum to file suffix */
const RANK_SUFFIX: Record<Rank, string> = {
  [Rank.ACE]: 'A',
  [Rank.TWO]: '2',
  [Rank.THREE]: '3',
  [Rank.FOUR]: '4',
  [Rank.FIVE]: '5',
  [Rank.SIX]: '6',
  [Rank.SEVEN]: '7',
  [Rank.EIGHT]: '8',
  [Rank.NINE]: '9',
  [Rank.TEN]: '10',
  [Rank.JACK]: 'J',
  [Rank.QUEEN]: 'Q',
  [Rank.KING]: 'K',
};

/**
 * Get the image path for a playing card.
 * Returns card-back image if the card is hidden.
 */
export function getCardImagePath(card: Card): string {
  if (card.isHidden) {
    return '/images/cards/card-back.png';
  }
  const suit = SUIT_PREFIX[card.suit];
  const rank = RANK_SUFFIX[card.rank];
  return `/images/cards/${suit}-${rank}.png`;
}

/** Get card back image path */
export function getCardBackPath(): string {
  return '/images/cards/card-back.png';
}

/** Chip value to base filename mapping */
const CHIP_FILENAMES: Record<number, string> = {
  1: 'chip-1',
  5: 'chip-5',
  25: 'chip-25',
  100: 'chip-100',
  500: 'chip-500',
  1_000: 'chip-1000',
  5_000: 'chip-5000',
  25_000: 'chip-25000',
  100_000: 'chip-100000',
  500_000: 'chip-500000',
  1_000_000: 'chip-1000000',
};

/** Get chip image path by denomination value */
export function getChipImagePath(value: number): string {
  const filename = CHIP_FILENAMES[value] ?? 'chip-1';
  return `/images/chips/${filename}.png`;
}
