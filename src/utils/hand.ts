// ============================================
// Hand Evaluation Utilities
// ============================================

import { Card, Hand, HandValue } from '@/types/game';
import { Rank, HandStatus } from '@/types/enums';

/**
 * Calculate the total value of a hand, automatically adjusting Aces.
 * Returns the best total (≤21 if possible) and whether the hand is "soft".
 */
export function calculateHandValue(cards: Card[]): HandValue {
  let total = 0;
  let aceCount = 0;

  for (const card of cards) {
    // Skip hidden cards (dealer's hole card)
    if (card.isHidden) continue;

    total += card.value;
    if (card.rank === Rank.ACE) {
      aceCount++;
    }
  }

  // Adjust Aces from 11 to 1 to prevent bust
  while (total > 21 && aceCount > 0) {
    total -= 10;
    aceCount--;
  }

  return {
    total,
    isSoft: aceCount > 0, // At least one Ace still counted as 11
  };
}

/** Check if a hand is busted (total > 21) */
export function isBust(cards: Card[]): boolean {
  return calculateHandValue(cards).total > 21;
}

/** Check if a hand is a natural Blackjack (exactly 2 cards totaling 21) */
export function isBlackjack(cards: Card[]): boolean {
  if (cards.length !== 2) return false;
  // Only count visible cards for the check
  const visibleCards = cards.filter((c) => !c.isHidden);
  if (visibleCards.length !== 2) return false;
  return calculateHandValue(visibleCards).total === 21;
}

/** Check if a hand can be split (exactly 2 cards with the same value) */
export function canSplit(hand: Hand): boolean {
  if (hand.cards.length !== 2) return false;
  if (hand.status !== HandStatus.PLAYING) return false;
  return hand.cards[0].value === hand.cards[1].value;
}

/** Check if a hand can double down (exactly 2 cards, still playing) */
export function canDoubleDown(hand: Hand): boolean {
  if (hand.cards.length !== 2) return false;
  if (hand.status !== HandStatus.PLAYING) return false;
  return true;
}

/**
 * Get a display-friendly value string for a hand.
 * Shows "soft" totals like "6/16" when an Ace is flexible.
 */
export function getHandDisplayValue(cards: Card[]): string {
  const visibleCards = cards.filter((c) => !c.isHidden);
  if (visibleCards.length === 0) return '0';

  const { total, isSoft } = calculateHandValue(visibleCards);

  if (isSoft && total <= 21 && total !== 21) {
    const hardTotal = total - 10;
    return `${hardTotal}/${total}`;
  }

  return total.toString();
}
