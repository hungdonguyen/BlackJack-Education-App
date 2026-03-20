import { describe, it, expect } from 'vitest';
import { calculateHandValue, isBust, isBlackjack, canSplit, canDoubleDown, getHandDisplayValue } from '../hand';
import { Card, Hand } from '@/types/game';
import { HandStatus, Rank, Suit } from '@/types/enums';

const c = (rank: string, value: number, isHidden: boolean = false): Card => ({ rank: rank as Rank, value, suit: Suit.SPADES, isHidden });

const createHand = (cards: Card[], status: HandStatus = HandStatus.PLAYING): Hand => ({
    id: 'hand1',
    cards,
    betAmount: 10,
    status,
    isDoubleDown: false,
    isSplit: false,
    isAceSplit: false
});

describe('Hand Utilities', () => {
    describe('calculateHandValue', () => {
        it('should calculate total without aces', () => {
            expect(calculateHandValue([c('10',10), c('7',7)])).toEqual({ total: 17, isSoft: false });
        });

        it('should calculate soft total with one ace', () => {
            expect(calculateHandValue([c('ACE',11), c('7',7)])).toEqual({ total: 18, isSoft: true });
        });

        it('should adjust aces if total > 21', () => {
            expect(calculateHandValue([c('ACE',11), c('10',10), c('7',7)])).toEqual({ total: 18, isSoft: false });
        });

        it('should ignore hidden cards by default', () => {
            expect(calculateHandValue([c('10',10), c('7',7, true)])).toEqual({ total: 10, isSoft: false });
        });

        it('should include hidden cards if flag is true', () => {
            expect(calculateHandValue([c('10',10), c('7',7, true)], true)).toEqual({ total: 17, isSoft: false });
        });
    });

    describe('isBust', () => {
        it('should return true if > 21', () => {
            expect(isBust([c('10',10), c('10',10), c('5',5)])).toBe(true);
        });

        it('should return false if <= 21', () => {
            expect(isBust([c('10',10), c('10',10)])).toBe(false);
        });
    });

    describe('isBlackjack', () => {
        it('should identify a 2-card 21', () => {
            expect(isBlackjack([c('ACE',11), c('10',10)])).toBe(true);
        });

        it('should return false if not 2 cards', () => {
            expect(isBlackjack([c('ACE',11), c('10',10), c('10',10)])).toBe(false);
            expect(isBlackjack([c('10',10)])).toBe(false);
        });

        it('should ignore hidden cards normally', () => {
            // Only 1 visible card, not BJ
            expect(isBlackjack([c('ACE',11, true), c('10',10)])).toBe(false);
        });

        it('should detect BJ with hidden cards if includeHidden is true', () => {
            expect(isBlackjack([c('ACE',11, true), c('10',10)], true)).toBe(true);
        });
    });

    describe('canSplit', () => {
        it('should return true for 2 cards of same value', () => {
            expect(canSplit(createHand([c('8',8), c('8',8)]))).toBe(true);
        });

        it('should return false if not 2 cards', () => {
            expect(canSplit(createHand([c('8',8), c('8',8), c('8',8)]))).toBe(false);
        });

        it('should return false if not PLAYING status', () => {
            expect(canSplit(createHand([c('8',8), c('8',8)], HandStatus.BUST))).toBe(false);
            expect(canSplit(createHand([c('8',8), c('8',8)], HandStatus.STAND))).toBe(false);
        });

        it('should return false if different values', () => {
            expect(canSplit(createHand([c('10',10), c('9',9)]))).toBe(false);
        });
    });

    describe('canDoubleDown', () => {
        it('should return true for 2 cards in PLAYING status', () => {
            expect(canDoubleDown(createHand([c('10',10), c('9',9)]))).toBe(true);
        });

        it('should return false if not 2 cards', () => {
            expect(canDoubleDown(createHand([c('10',10), c('9',9), c('2',2)]))).toBe(false);
        });

        it('should return false if not PLAYING status', () => {
            expect(canDoubleDown(createHand([c('10',10), c('9',9)], HandStatus.STAND))).toBe(false);
        });
    });

    describe('getHandDisplayValue', () => {
        it('should return 0 for no visible cards', () => {
            expect(getHandDisplayValue([c('10',10, true)])).toBe('0');
        });

        it('should return strict total for hard hand', () => {
            expect(getHandDisplayValue([c('10',10), c('7',7)])).toBe('17');
        });

        it('should return soft/hard format for soft hand under 21', () => {
            expect(getHandDisplayValue([c('ACE',11), c('7',7)])).toBe('8/18');
        });

        it('should just return 21 for soft 21', () => {
            expect(getHandDisplayValue([c('ACE',11), c('10',10)])).toBe('21');
        });

        it('should return total if busted (converted to hard internally)', () => {
            expect(getHandDisplayValue([c('ACE',11), c('10',10), c('7',7), c('5',5)])).toBe('23');
        });
    });
});
