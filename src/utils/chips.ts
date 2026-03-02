import { CHIP_VALUES } from './constants';

/**
 * Calculates the minimal number of chips required to represent a given amount.
 * Starts from the largest denomination and works down.
 * 
 * @param amount Total value of the bet to be represented by chips
 * @returns Array of individual chip values to be stacked (from bottom to top)
 */
export function calculateMinimalChips(amount: number): number[] {
  if (amount <= 0) return [];

  let currentAmount = amount;
  const chips: number[] = [];
  
  // Sort CHIP_VALUES descending safely (CHIP_VALUES is read-only)
  const sortedValues = [...CHIP_VALUES].sort((a, b) => b - a);
  
  for (const value of sortedValues) {
    if (currentAmount >= value) {
      const count = Math.floor(currentAmount / value);
      
      // Add 'count' number of chips of this 'value'
      for (let i = 0; i < count; i++) {
        chips.push(value);
      }
      currentAmount -= value * count;
    }
    
    if (currentAmount === 0) break;
  }
  
  // Reverse the array so the largest chips are at the bottom of the stack (index 0)
  // and the smallest chips are at the top (highest index)
  return chips.reverse();
}
