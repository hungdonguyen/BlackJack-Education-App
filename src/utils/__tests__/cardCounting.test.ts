import { describe, it, expect } from 'vitest';
import { calculateRunningCountFromShoe, getCardValue, CountingSystem, getInitialDeckSum, calculateTrueCountFromShoe } from '../cardCounting';
import { Card, Seat } from '@/types/game';
import { Rank, Suit } from '@/types/enums';

const c = (rank: string, value: number, isHidden = false): Card => ({ rank: rank as Rank, value, suit: Suit.SPADES, isHidden });

describe('Card Counting Utils', () => {
    describe('getCardValue (Hi-Lo)', () => {
        const SYSTEM: CountingSystem = 'Hi-Lo';

        it('should return +1 for 2-6', () => {
            expect(getCardValue('2' as any, SYSTEM)).toBe(1);
            expect(getCardValue('6' as any, SYSTEM)).toBe(1);
        });

        it('should return 0 for 7-9', () => {
            expect(getCardValue('7' as any, SYSTEM)).toBe(0);
            expect(getCardValue('9' as any, SYSTEM)).toBe(0);
        });

        it('should return -1 for 10-A', () => {
            expect(getCardValue('10' as any, SYSTEM)).toBe(-1);
            expect(getCardValue('ACE' as any, SYSTEM)).toBe(-1);
            expect(getCardValue('KING' as any, SYSTEM)).toBe(-1);
        });
    });

    describe('calculateRunningCountFromShoe', () => {
        // Logic: 
        // Initial Shoe Sum (Hi-Lo) = 0 (balanced)
        // Running Count = Initial - Sum(Cards in Shoe) - Sum(Hidden Cards)
        // Wait, the implementation says:
        // runningCount = initialShoeSum - shoeSum
        // then subtract valid visible cards?
        // Let's re-read the implementation in `cardCounting.ts`.
        // 
        // `calculateRunningCountFromShoe` iterates over the SHOE (remaining cards) and sums them.
        // runningCount = initial - shoeSum.
        // Then it iterates dealer/player cards and if `isHidden`, it SUBTRACTS their value from runningCount?
        // That seems inverted or assumes we are "un-counting" hidden cards from the "seen" pile (which is total - shoe).
        //
        // If Total Deck Sum = 0.
        // Seen Cards + Shoe Cards = Total Deck.
        // Count(Seen) + Count(Shoe) = 0.
        // Count(Seen) = -Count(Shoe).
        //
        // Code: runningCount = 0 - shoeSum. This matches Count(Seen).
        // Then: loops dealerCards. if isHidden, runningCount -= val.
        // This effectively removes the hidden card from the "Seen" count. Correct.

        it('should calculate specific count correctly', () => {
            // Setup: 1 deck.
            // Cards Dealt (Visible): 2, 3, 4 (+3 count)
            // Cards Dealt (Hidden): 5 (+1 count)
            // Cards Remaining in Shoe: Rest.
            //
            // Since we pass the SHOE (remaining cards), let's construct it.
            // If dealt are 2,3,4,5. Shoe has everything else.
            // Shoe Sum = 0 (Total) - (1+1+1+1) = -4.
            // Running Count (All Dealt) = -(-4) = +4.
            // Adjust for Hidden (5): +4 - (+1) = +3.
            // Result should be +3.
            
            // Mock Shoe: Create a few cards representing the shoe. 
            // To simplify, let's say Total Deck has just 5 cards: 2, 3, 4, 5, 10 (-1). Sum = 1+1+1+1-1 = 3.
            // But logic assumes full 52-card decks usually for `initialDeckSum`.
            // Let's rely on the input `numDecks`.
            // initialDeckSum for Hi-Lo is 0.
            
            // Scenario:
            // Dealt: 2 (Visible), 10 (Visible). Running Count = +1 -1 = 0.
            // Shoe: has the rest.
            //
            // If I just pass an empty shoe and say numDecks=0 (or 1), what happens?
            // If shoe is empty, shoeSum=0. RC = 0.
            
            // Let's try actual:
            // Visible: 2 (+1).
            // Shoe: 10 (-1).
            // Total cards in universe: 2, 10. (Not a real deck but logic should hold if we assume Balances).
            // Actually the logic `initialShoeSum` assumes full decks. 
            // If we use 1 deck (52 cards). 
            // Shoe has 51 cards (all except a '2'). 
            // Shoe Sum = 0 - (+1) = -1.
            // RC = 0 - (-1) = +1. Correct.
            
            // Test case: 1 Deck. Player sees a '2'. 
            // Shoe missing '2'.
            // Call function.
            
            const fullDeck = []; 
            // Fill pseudo deck
            // Actually I'll mock shoe cards.
            // If I want result +1. I need shoe sum to be -1.
            // If I just put a '10' in the shoe, shoe sum is -1.
            // But the logic assumes `initialShoeSum` is calculated from `numDecks`. 
            // `initialDeckSum` for Hi-Lo is 0. 
            // So `runningCount` = -shoeSum.
            // If shoe has '10', shoeSum = -1. RC = 1.
            // But wait, if shoe has '10', that means '10' is NOT seen.
            // If '10' is in shoe, count of SEEN cards should be opposite? 
            // No.
            // Sum(All) = Sum(Seen) + Sum(Shoe) = 0.
            // Sum(Seen) = -Sum(Shoe).
            // If Shoe has '10' (-1). Sum(Seen) = -(-1) = +1. 
            // This implies the rest of the deck (which totals +1) is seen.
            
            // So if I pass a shoe with one '10', RC should be +1 (assuming 1 deck total, and all other cards are seen/dealt).
            // But wait, are "all other cards" passed in `dealerCards` or `seats`? 
            // The function loop for dealer/seats only subtracts HIDDEN cards. It doesn't ADD visible ones.
            // It derives the count purely from the shoe residue.
            // So passed seats/dealerCards are ONLY used to subtract hidden ones.
            
            const shoe = [c('KING', 10), c('QUEEN', 10)]; // Sum -2.
            // RC = -(-2) = +2.
            
            const dealerCards: Card[] = [];
            const seats: Seat[] = [];
            
            const result = calculateRunningCountFromShoe(
                shoe, dealerCards, seats, 1, 'Hi-Lo', false
            );
            
            // Note: `numDecks` * 0 = 0.
            // shoeSum = -2.
            // RC = 2.
            expect(result).toBe(2);
        });

        it('should adjust for hidden cards', () => {
            // Shoe has '10' (-1). RC = 1.
            // But Dealer has a Hidden '2' (+1).
            // Visible Count should be RC - Val(Hidden).
            // RC (derived from shoe) = 1.
            // Hidden '2' (+1).
            // Adjusted RC = 1 - 1 = 0.
            
            const shoe = [c('KING', 10)]; // Sum -1.
            const dealerCards = [c('2', 2, true)]; // Hidden
            const seats: Seat[] = [];
            
            const result = calculateRunningCountFromShoe(
                shoe, dealerCards, seats, 1, 'Hi-Lo', false
            );
            
            expect(result).toBe(0);
        });

        it('should subtract hidden cards from seats and ignore visible cards', () => {
             const shoe = [c('KING', 10)]; // shoeSum = -1 -> RC = 1
             const dealerCards = [
                 c('7', 7, true),   // Hidden +0
                 c('2', 2, false)   // Visible, ignored
             ];
             const seats: Seat[] = [{
                 id: 1,
                 isActive: true,
                 currentHandIndex: 0,
                 hands: [{
                     id: 'h1',
                     cards: [
                         c('QUEEN', 10, true), // Hidden -1
                         c('ACE', 11, false)   // Visible, ignored
                     ],
                     betAmount: 10,
                     status: 'PLAYING' as any,
                     isDoubleDown: false,
                     isSplit: false,
                     isAceSplit: false
                 }],
                 hasSwitched: false
             }];

             const result = calculateRunningCountFromShoe(
                 shoe, dealerCards, seats, 1, 'Hi-Lo', false
             );

             // RC = 1 - (+0 from dealer_hidden) - (-1 from seat_hidden) = 2
             expect(result).toBe(2);
        });
    });

    describe('Katarina Walker System', () => {
        const SYSTEM: CountingSystem = 'Katarina Walker';

        it('should return correct card values', () => {
            expect(getCardValue('2' as any, SYSTEM)).toBe(1);
            expect(getCardValue('3' as any, SYSTEM)).toBe(1);
            expect(getCardValue('6' as any, SYSTEM)).toBe(1);

            expect(getCardValue('4' as any, SYSTEM)).toBe(2);
            expect(getCardValue('5' as any, SYSTEM)).toBe(2);

            expect(getCardValue('7' as any, SYSTEM)).toBe(0);
            expect(getCardValue('8' as any, SYSTEM)).toBe(0);

            expect(getCardValue('9' as any, SYSTEM)).toBe(-1);
            expect(getCardValue('10' as any, SYSTEM)).toBe(-1);
            expect(getCardValue('JACK' as any, SYSTEM)).toBe(-1);
            expect(getCardValue('QUEEN' as any, SYSTEM)).toBe(-1);
            expect(getCardValue('KING' as any, SYSTEM)).toBe(-1);
            expect(getCardValue('ACE' as any, SYSTEM)).toBe(-1);

            // Default fallback
            expect(getCardValue('UNKNOWN' as any, SYSTEM)).toBe(0);
            expect(getCardValue('UNKNOWN' as any, 'Hi-Lo')).toBe(0);
        });

        it('should have correct initial deck sums', () => {
             expect(getInitialDeckSum(SYSTEM, true)).toBe(8); // omitTens = true
             expect(getInitialDeckSum(SYSTEM, false)).toBe(4); // omitTens = false
             expect(getInitialDeckSum('Hi-Lo', true)).toBe(0);
        });
    });

    describe('calculateTrueCountFromShoe', () => {
        it('should calculate true count correctly', () => {
             // 1 DECK, no 10s (48 cards). 
             // System: Hi-Lo. Initial = 0.
             // Shoe has 24 cards (0.5 decks remaining).
             // Let's say shoe sum = -2. RC = +2.
             // Decks remaining = 24 / 48 = 0.5.
             // True count raw = 2 / 0.5 = 4.
             const customShoe = Array(22).fill(c('7',7)).concat([c('KING',10), c('QUEEN',10)]);
             
             const result = calculateTrueCountFromShoe(customShoe, [], [], 1, 'Hi-Lo', true); // omitTens = true (48/deck)
             
             // shoeSum = -2
             // Initial = 0
             // RC = 2
             // decksRemaining = Math.max(24/48, 0.5) = 0.5
             // trueCountRaw = 2 / 0.5 = 4
             // trueCount = floor(4) = 4
             expect(result.runningCount).toBe(2);
             expect(result.decksRemaining).toBe(0.5);
             expect(result.trueCountRaw).toBe(4);
             expect(result.trueCount).toBe(4);

             // Also cover omitTens=false (52/deck)
             const shoeStandard = Array(52).fill(c('7',7)); // shoeSum=0, RC=0
             const resStandard = calculateTrueCountFromShoe(shoeStandard, [], [], 1, 'Hi-Lo', false);
             expect(resStandard.decksRemaining).toBe(1);
        });
    });
});
