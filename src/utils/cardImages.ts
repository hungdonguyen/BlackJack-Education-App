// ============================================
// Card Image Registry — Single source of truth
// ============================================
// All 52 playing-card images + card-back, centralised here.
// Every component that needs a card image should import from this file.

import { Suit, Rank } from '@/types/enums';

// ─── Path constants ──────────────────────────────────────────────────────────

/** Root directory for all card themes */
const CARDS_ROOT = '/images/cards';

/** Resolve the directory for a given deck theme */
function getThemeDir(deckTheme: string): string {
  return `${CARDS_ROOT}/${deckTheme}`;
}

/** Suit → single-letter prefix used in file names */
const SUIT_PREFIX: Record<Suit, string> = {
  [Suit.HEARTS]:   'H',
  [Suit.DIAMONDS]: 'D',
  [Suit.CLUBS]:    'C',
  [Suit.SPADES]:   'S',
};

/** Rank → suffix used in file names */
const RANK_SUFFIX: Record<Rank, string> = {
  [Rank.ACE]:   'A',
  [Rank.TWO]:   '2',
  [Rank.THREE]: '3',
  [Rank.FOUR]:  '4',
  [Rank.FIVE]:  '5',
  [Rank.SIX]:   '6',
  [Rank.SEVEN]: '7',
  [Rank.EIGHT]: '8',
  [Rank.NINE]:  '9',
  [Rank.TEN]:   '10',
  [Rank.JACK]:  'J',
  [Rank.QUEEN]: 'Q',
  [Rank.KING]:  'K',
};

// ─── Pre-built lookup map ────────────────────────────────────────────────────

/** Key format: "H-A", "D-10", "S-K", etc. */
type CardKey = `${string}-${string}`;

function buildCardKey(suit: Suit, rank: Rank): CardKey {
  return `${SUIT_PREFIX[suit]}-${RANK_SUFFIX[rank]}`;
}

/**
 * Complete map of every card key → image path.
 * Built once at module load time so look-ups are O(1).
 * Uses the default theme.
 */
const CARD_IMAGE_MAP: Record<string, string> = {};

for (const suit of Object.values(Suit)) {
  for (const rank of Object.values(Rank)) {
    const key = buildCardKey(suit, rank);
    CARD_IMAGE_MAP[key] = `${getThemeDir('default')}/${key}.png`;
  }
}

/** The card-back image path (default theme) */
export const CARD_BACK_PATH = `${getThemeDir('default')}/card-back.png`;

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Get the image path for a specific suit + rank combination.
 *
 * @example
 * getCardImage(Suit.HEARTS, Rank.ACE)          // => "/images/cards/default/H-A.png"
 * getCardImage(Suit.HEARTS, Rank.ACE, 'gold')  // => "/images/cards/gold/H-A.png"
 */
export function getCardImage(suit: Suit, rank: Rank, deckTheme: string = 'default'): string {
  return `${getThemeDir(deckTheme)}/${buildCardKey(suit, rank)}.png`;
}

/**
 * Get the image path for a Card object (the type used in game state).
 * Returns the card-back image when the card is hidden.
 */
export function getCardImageFromCard(card: { suit: Suit; rank: Rank; isHidden?: boolean }, deckTheme: string = 'default'): string {
  if (card.isHidden) return getCardBackImage(deckTheme);
  return getCardImage(card.suit, card.rank, deckTheme);
}

/**
 * Get the card-back image path.
 */
export function getCardBackImage(deckTheme: string = 'default'): string {
  return `${getThemeDir(deckTheme)}/card-back.png`;
}

// ─── Exports for consumers that need the raw mappings ────────────────────────

export { SUIT_PREFIX, RANK_SUFFIX, CARD_IMAGE_MAP };
