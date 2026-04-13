// ============================================
// Asset Path Utilities
// ============================================
// Maps game types to image file paths.
// Cards & card-back: centralised in cardImages.ts
// Chips: AI-generated premium

import { Card } from '@/types/game';
import { getCardImageFromCard, getCardBackImage } from '@/utils/cardImages';

/**
 * Get the image path for a playing card.
 * Returns card-back image if the card is hidden.
 * @see cardImages.ts — single source of truth for card assets
 */
export function getCardImagePath(card: Card, deckTheme: string = 'default', animationEnabled: boolean = true): string {
  return getCardImageFromCard(card, deckTheme, animationEnabled);
}

/** Get card back image path */
export function getCardBackPath(deckTheme: string = 'default', animationEnabled: boolean = true): string {
  return getCardBackImage(deckTheme, animationEnabled);
}

/** Chip value to base filename mapping */
const CHIP_FILENAMES: Record<number, string> = {
  0.5: 'chip-0.5',
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
