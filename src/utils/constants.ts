// ============================================
// Game Constants
// ============================================

/** Available chip denominations */
export const CHIP_VALUES = [
  1, 5, 25, 100, 500, 1_000, 5_000, 25_000, 100_000, 500_000, 1_000_000,
] as const;

/** Number of standard decks in the shoe */
export const NUM_DECKS = 6;

/** Number of betting seats at the table */
export const NUM_SEATS = 5;

/** Re-shuffle when this percentage of cards remain */
export const RESHUFFLE_THRESHOLD = 0.25;

/** Blackjack pays 3:2 */
export const BLACKJACK_PAYOUT = 1.5;

/** Starting bankroll for new players */
export const DEFAULT_BANKROLL = 10_000;

/** Chip display labels */
export const CHIP_LABELS: Record<number, string> = {
  1: '$1',
  5: '$5',
  25: '$25',
  100: '$100',
  500: '$500',
  1_000: '$1K',
  5_000: '$5K',
  25_000: '$25K',
  100_000: '$100K',
  500_000: '$500K',
  1_000_000: '$1M',
};

/** Chip colors for CSS styling */
export const CHIP_COLORS: Record<number, { bg: string; border: string; text: string }> = {
  1: { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-700' },
  5: { bg: 'bg-red-600', border: 'border-red-800', text: 'text-white' },
  25: { bg: 'bg-green-600', border: 'border-green-800', text: 'text-white' },
  100: { bg: 'bg-gray-900', border: 'border-gray-700', text: 'text-white' },
  500: { bg: 'bg-purple-600', border: 'border-purple-800', text: 'text-white' },
  1_000: { bg: 'bg-yellow-500', border: 'border-yellow-700', text: 'text-black' },
  5_000: { bg: 'bg-orange-500', border: 'border-orange-700', text: 'text-white' },
  25_000: { bg: 'bg-pink-500', border: 'border-pink-700', text: 'text-white' },
  100_000: { bg: 'bg-cyan-500', border: 'border-cyan-700', text: 'text-black' },
  500_000: { bg: 'bg-amber-400', border: 'border-amber-600', text: 'text-black' },
  1_000_000: { bg: 'bg-gradient-to-br from-yellow-300 to-yellow-600', border: 'border-yellow-700', text: 'text-black' },
};
