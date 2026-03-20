import { describe, it, expect } from 'vitest';
import { AtlanticCityRules } from '../AtlanticCityRules';
import { Hand, Card } from '@/types/game';
import { HandStatus, Rank, Suit } from '@/types/enums';

// Helper to create a hand
const createHand = (cards: Card[], status: HandStatus = HandStatus.PLAYING, betAmount: number = 10, isAceSplit: boolean = false): Hand => ({
    id: 'test-hand',
    cards,
    betAmount,
    status,
    isDoubleDown: false,
    isSplit: false, // Initial state, will override if needed
    isAceSplit
});

// Helper to create cards
const c = (rank: string, value: number): Card => ({ rank: rank as Rank, value, suit: Suit.SPADES, isHidden: false });

describe('AtlanticCityRules', () => {
    const rules = new AtlanticCityRules();

    describe('canDoubleDown', () => {
        it('should allow double down on any two cards', () => {
            const hand = createHand([
                { rank: '5', value: 5, suit: 'SPADES', isHidden: false },
                { rank: '4', value: 4, suit: 'HEARTS', isHidden: false }
            ] as Card[]); // Total 9
            const result = rules.canDoubleDown(hand);
            expect(result.allowed).toBe(true);
        });

        it('should not allow double down if not 2 cards', () => {
            const hand = createHand([
                { rank: '5', value: 5, suit: 'SPADES', isHidden: false },
                { rank: '4', value: 4, suit: 'HEARTS', isHidden: false },
                { rank: '2', value: 2, suit: 'CLUBS', isHidden: false }
            ] as Card[]);
            const result = rules.canDoubleDown(hand);
            expect(result.allowed).toBe(false);
        });

        it('should not allow double down on Ace split having 1 card', () => {
             // Logic check: usually AC allows DAS (Double After Split), but if it's Ace split, usually you get only 1 card and stand.
             // The rule implementation says: !hand.isAceSplit
             const hand = createHand([
                 { rank: 'ACE', value: 11, suit: 'SPADES', isHidden: false },
                 { rank: '9', value: 9, suit: 'HEARTS', isHidden: false }
             ] as Card[], HandStatus.PLAYING, 10, true);
             
             const result = rules.canDoubleDown(hand);
             expect(result.allowed).toBe(false);
        });
    });

    describe('canSplit', () => {
        it('should allow splitting 10s (mixed face cards)', () => {
            const hand = createHand([
                { rank: 'KING', value: 10, suit: 'SPADES', isHidden: false },
                { rank: 'JACK', value: 10, suit: 'HEARTS', isHidden: false }
            ] as Card[]);
            const result = rules.canSplit(hand, 1);
            expect(result.allowed).toBe(true);
        });

        it('should allow splitting pairs', () => {
            const hand = createHand([
                { rank: '8', value: 8, suit: 'SPADES', isHidden: false },
                { rank: '8', value: 8, suit: 'HEARTS', isHidden: false }
            ] as Card[]);
            const result = rules.canSplit(hand, 1);
            expect(result.allowed).toBe(true);
        });

        it('should enforce max split limit (3 splits => 4 hands)', () => {
            const hand = createHand([
                { rank: '8', value: 8, suit: 'SPADES', isHidden: false },
                { rank: '8', value: 8, suit: 'HEARTS', isHidden: false }
            ] as Card[]);
            const result = rules.canSplit(hand, 4); // Already 4 hands
            expect(result.allowed).toBe(false);
        });

         it('should not allow re-splitting Aces if rule implies (isAceSplit check)', () => {
             // Implementation says: !hand.isAceSplit. If it's already an Ace split hand, can't split again.
            const hand = createHand([
                { rank: 'ACE', value: 11, suit: 'SPADES', isHidden: false },
                { rank: 'ACE', value: 11, suit: 'HEARTS', isHidden: false }
            ] as Card[], HandStatus.PLAYING, 10, true);
            const result = rules.canSplit(hand, 2);
            expect(result.allowed).toBe(false);
        });
    });

    describe('canSurrender', () => {
        it('should allow surrender on first 2 cards', () => {
            const hand = createHand([
                { rank: '9', value: 9, suit: 'SPADES', isHidden: false },
                { rank: '7', value: 7, suit: 'HEARTS', isHidden: false }
            ] as Card[]); // 16
            const result = rules.canSurrender(hand);
            expect(result.allowed).toBe(true);
        });

        it('should NOT allow surrender if hit happened', () => {
            const hand = createHand([
                 { rank: '9', value: 9, suit: 'SPADES', isHidden: false },
                 { rank: '5', value: 5, suit: 'HEARTS', isHidden: false },
                 { rank: '2', value: 2, suit: 'CLUBS', isHidden: false }
            ] as Card[]);
            const result = rules.canSurrender(hand);
            expect(result.allowed).toBe(false);
        });
    });
    describe('evaluateHand', () => {
        const dealerCards = [c('10',10), c('7',7)]; // 17
        const dealerValue = { total: 17, isSoft: false };

        it('should handle surrendered hand', () => {
             const hand = createHand([c('10',10), c('6',6)]);
             hand.status = HandStatus.SURRENDERED;
             const val = { total: 16, isSoft: false };
             expect(rules.evaluateHand(hand, val, dealerCards, dealerValue)).toEqual({ status: HandStatus.SURRENDERED, payoutMultiplier: -0.5 });
        });

        it('should handle player bust', () => {
            const hand = createHand([c('10',10), c('10',10), c('5',5)]);
            hand.status = HandStatus.BUST;
            const val = { total: 25, isSoft: false };
            expect(rules.evaluateHand(hand, val, dealerCards, dealerValue)).toEqual({ status: HandStatus.LOST, payoutMultiplier: -1 });
        });

        it('should handle player blackjack vs dealer non-blackjack', () => {
            const hand = createHand([c('ACE',11), c('KING',10)]);
            hand.status = HandStatus.BLACKJACK;
            const val = { total: 21, isSoft: true };
            expect(rules.evaluateHand(hand, val, dealerCards, dealerValue)).toEqual({ status: HandStatus.BLACKJACK, payoutMultiplier: 1.5 });
        });

        it('should handle player blackjack vs dealer blackjack (push)', () => {
            const hand = createHand([c('ACE',11), c('KING',10)]);
            hand.status = HandStatus.BLACKJACK;
            const val = { total: 21, isSoft: true };
            const dCards = [c('ACE',11), c('QUEEN',10)];
            const dVal = { total: 21, isSoft: true };
            expect(rules.evaluateHand(hand, val, dCards, dVal)).toEqual({ status: HandStatus.PUSH, payoutMultiplier: 0 });
        });

        it('should handle dealer blackjack beating player normal 21', () => {
            const hand = createHand([c('10',10), c('6',6), c('5',5)]);
            hand.status = HandStatus.PLAYING;
            const val = { total: 21, isSoft: false };
            const dCards = [c('ACE',11), c('QUEEN',10)];
            const dVal = { total: 21, isSoft: true };
            expect(rules.evaluateHand(hand, val, dCards, dVal)).toEqual({ status: HandStatus.LOST, payoutMultiplier: -1 });
        });

        it('should handle dealer bust vs non-bust player', () => {
            const hand = createHand([c('10',10), c('7',7)]);
            hand.status = HandStatus.PLAYING;
            const val = { total: 17, isSoft: false };
            const dCards = [c('10',10), c('6',6), c('7',7)];
            const dVal = { total: 23, isSoft: false };
            expect(rules.evaluateHand(hand, val, dCards, dVal)).toEqual({ status: HandStatus.WON, payoutMultiplier: 1 });
        });

        it('should handle player win by value', () => {
            const hand = createHand([c('10',10), c('9',9)]);
            const val = { total: 19, isSoft: false };
            expect(rules.evaluateHand(hand, val, dealerCards, dealerValue)).toEqual({ status: HandStatus.WON, payoutMultiplier: 1 });
        });

        it('should handle player lose by value', () => {
            const hand = createHand([c('9',9), c('7',7)]);
            const val = { total: 16, isSoft: false };
            expect(rules.evaluateHand(hand, val, dealerCards, dealerValue)).toEqual({ status: HandStatus.LOST, payoutMultiplier: -1 });
        });

        it('should handle push by value', () => {
            const hand = createHand([c('10',10), c('7',7)]);
            const val = { total: 17, isSoft: false };
            expect(rules.evaluateHand(hand, val, dealerCards, dealerValue)).toEqual({ status: HandStatus.PUSH, payoutMultiplier: 0 });
        });
    });
});
