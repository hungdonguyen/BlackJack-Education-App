import { describe, it, expect } from 'vitest';
import { ClassicRules } from '../ClassicRules';
import { EuropeanRules } from '../EuropeanRules';
import { VegasDowntownRules } from '../VegasDowntownRules';
import { VegasStripRules } from '../VegasStripRules';
import { Hand, Card, HandValue } from '@/types/game';
import { HandStatus, Rank, Suit } from '@/types/enums';

const createHand = (cards: Card[], status: HandStatus = HandStatus.PLAYING, betAmount: number = 10, isAceSplit: boolean = false, isSplit: boolean = false): Hand => ({
    id: 'test-hand',
    cards,
    betAmount,
    status,
    isDoubleDown: false,
    isSplit,
    isAceSplit
});

const c = (rank: string, value: number): Card => ({ rank: rank as Rank, value, suit: Suit.SPADES, isHidden: false });

const testEvaluateHandBasic = (rules: any) => {
    describe('evaluateHand', () => {
        const dealerCards = [c('10',10), c('7',7)]; // 17
        const dealerValue = { total: 17, isSoft: false };

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
};

describe('Classic Rules', () => {
    const rules = new ClassicRules();

    it('should split max 2 hands', () => {
        const hand = createHand([c('8', 8), c('8', 8)]);
        // If seatHandsLength is 1 (current hand), splitting makes 2. Allowed.
        expect(rules.canSplit(hand, 1).allowed).toBe(true);
        // If seatHandsLength is 2 (already split once), splitting makes 3. Not allowed.
        expect(rules.canSplit(hand, 2).allowed).toBe(false);
    });

    it('should double down on any 2 cards unless ace split', () => {
        const hand = createHand([c('5',5), c('3',3)]);
        expect(rules.canDoubleDown(hand).allowed).toBe(true);

        const aceSplitHand = createHand([c('ACE',11), c('2',2)], HandStatus.PLAYING, 10, true, true);
        expect(rules.canDoubleDown(aceSplitHand).allowed).toBe(false);
    });

    it('should not surrender', () => {
        expect(rules.canSurrender(createHand([c('10',10),c('6',6)])).allowed).toBe(false);
    });

    testEvaluateHandBasic(rules);
});

describe('European Rules (ENHC)', () => {
    const rules = new EuropeanRules();

    it('should only double on 9, 10, 11 (Hard)', () => {
        // Hard 9 - Allowed
        expect(rules.canDoubleDown(createHand([c('5',5), c('4',4)])).allowed).toBe(true);
        // Hard 11 - Allowed
        expect(rules.canDoubleDown(createHand([c('6',6), c('5',5)])).allowed).toBe(true);
        // Hard 8 - Not Allowed
        expect(rules.canDoubleDown(createHand([c('4',4), c('4',4)])).allowed).toBe(false);
        // Soft 13 (A,2) - Total 13 or 3. Not 9,10,11. Not allowed.
        // Wait, logic says: !isSoft && (hardTotal === 9...).
        // A,2 is Soft. So not allowed.
        expect(rules.canDoubleDown(createHand([c('ACE',11), c('2',2)])).allowed).toBe(false);
    });

    it('should not double after split (NDAS)', () => {
        // Hard 11, but isSplit = true
        const hand = createHand([c('6',6), c('5',5)], HandStatus.PLAYING, 10, false, true);
        expect(rules.canDoubleDown(hand).allowed).toBe(false);
    });

    it('should not split aces twice (max 2 hands)', () => {
        const hand = createHand([c('ACE', 11), c('ACE', 11)]);
        expect(rules.canSplit(hand, 1).allowed).toBe(true); // Split once -> 2 hands
        const splitHand = createHand([c('ACE', 11), c('ACE', 11)], HandStatus.PLAYING, 10, true);
        expect(rules.canSplit(splitHand, 2).allowed).toBe(false); // Can't split Ace-split
    });

    it('should not surrender', () => {
        expect(rules.canSurrender(createHand([c('10',10),c('6',6)])).allowed).toBe(false);
    });

    testEvaluateHandBasic(rules);
});

describe('Vegas Strip Rules', () => {
    const rules = new VegasStripRules();

    it('should allow 4 hands split', () => {
        const hand = createHand([c('8',8), c('8',8)]);
        expect(rules.canSplit(hand, 3).allowed).toBe(true); // 3 -> 4
        expect(rules.canSplit(hand, 4).allowed).toBe(false); // Max 4
        
        // No Re-splitting aces
        const aceSplitHand = createHand([c('ACE',11), c('ACE',11)], HandStatus.PLAYING, 10, true);
        expect(rules.canSplit(aceSplitHand, 1).allowed).toBe(false);
    });

    it('should allow double on any 2 cards unless ace split', () => {
        expect(rules.canDoubleDown(createHand([c('2',2), c('2',2)])).allowed).toBe(true);
        const aceSplitHand = createHand([c('ACE',11), c('2',2)], HandStatus.PLAYING, 10, true);
        expect(rules.canDoubleDown(aceSplitHand).allowed).toBe(false);
    });

    it('should not surrender', () => {
        expect(rules.canSurrender(createHand([c('10',10),c('6',6)])).allowed).toBe(false);
    });

    testEvaluateHandBasic(rules);
});

describe('Vegas Downtown Rules', () => {
    const rules = new VegasDowntownRules();
    // Mostly same as Strip in this implementation regarding double/split logic shown
    it('should allow 4 hands split except aces', () => {
        const hand = createHand([c('8',8), c('8',8)]);
        expect(rules.canSplit(hand, 3).allowed).toBe(true);
        expect(rules.canSplit(hand, 4).allowed).toBe(false);

        const aceSplitHand = createHand([c('ACE',11), c('ACE',11)], HandStatus.PLAYING, 10, true);
        expect(rules.canSplit(aceSplitHand, 1).allowed).toBe(false);
    });

    it('should allow double on any 2 cards unless ace split', () => {
        expect(rules.canDoubleDown(createHand([c('2',2), c('2',2)])).allowed).toBe(true);
        const aceSplitHand = createHand([c('ACE',11), c('2',2)], HandStatus.PLAYING, 10, true);
        expect(rules.canDoubleDown(aceSplitHand).allowed).toBe(false);
    });

    it('should not surrender', () => {
        expect(rules.canSurrender(createHand([c('10',10),c('6',6)])).allowed).toBe(false);
    });

    testEvaluateHandBasic(rules);
});
