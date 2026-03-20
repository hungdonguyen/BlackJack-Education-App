import { describe, it, expect } from 'vitest';
import { FreeActionRules } from '../FreeActionRules';
import { Hand, Card, HandValue } from '@/types/game';
import { HandStatus, Rank, Suit } from '@/types/enums';

const c = (rank: string, value: number): Card => ({ rank: rank as Rank, value, suit: Suit.SPADES, isHidden: false });

const createHand = (cards: Card[], status: HandStatus = HandStatus.PLAYING, betAmount: number = 10, isSplit: boolean = false, isAceSplit: boolean = false): Hand => ({
    id: Math.random().toString(),
    cards,
    betAmount,
    status,
    isDoubleDown: false,
    isSplit,
    isAceSplit
});

describe('Free Action Rules', () => {
    const rules = new FreeActionRules();

    it('should pay 3:2 for Blackjack', () => {
        expect(rules.blackjackPayoutMultiplier).toBe(1.5);
    });

    describe('canDoubleDown', () => {
        it('should be free on hard 9, 10, or 11', () => {
            const hand9 = createHand([c('5', 5), c('4', 4)]); // hard 9
            const res9 = rules.canDoubleDown(hand9);
            expect(res9.allowed).toBe(true);
            expect(res9.isFree).toBe(true);
            expect(res9.cost).toBe(0);

            const hand11 = createHand([c('8', 8), c('3', 3)]); // hard 11
            const res11 = rules.canDoubleDown(hand11);
            expect(res11.allowed).toBe(true);
            expect(res11.isFree).toBe(true);
            expect(res11.cost).toBe(0);
        });

        it('should cost money on soft hands or hard hands other than 9,10,11', () => {
            const soft16 = createHand([c('ACE', 11), c('5', 5)]); // soft 16
            const resSoft = rules.canDoubleDown(soft16);
            expect(resSoft.allowed).toBe(true);
            expect(resSoft.isFree).toBe(false);
            expect(resSoft.cost).toBe(10);

            const hard8 = createHand([c('5', 5), c('3', 3)]); // hard 8
            const resHard = rules.canDoubleDown(hard8);
            expect(resHard.allowed).toBe(true);
            expect(resHard.isFree).toBe(false);
            expect(resHard.cost).toBe(10);
        });

        it('should handle edge cases (not 2 cards, ace split)', () => {
            const threeCards = createHand([c('2',2), c('2',2), c('2',2)]);
            expect(rules.canDoubleDown(threeCards).allowed).toBe(false);

            const aceSplit = createHand([c('ACE',11), c('2',2)]);
            aceSplit.isAceSplit = true;
            expect(rules.canDoubleDown(aceSplit).allowed).toBe(false);
        });
    });

    describe('canSplit', () => {
        it('should be free for pairs EXCEPT 10-value cards', () => {
            const hand8s = createHand([c('8', 8), c('8', 8)]);
            const res8 = rules.canSplit(hand8s, 1);
            expect(res8.allowed).toBe(true);
            expect(res8.isFree).toBe(true);
            expect(res8.cost).toBe(0);
        });

        it('should cost money to split 10-value cards', () => {
            const hand10s = createHand([c('10', 10), c('QUEEN', 10)]);
            const res10 = rules.canSplit(hand10s, 1);
            expect(res10.allowed).toBe(true);
            expect(res10.isFree).toBe(false);
            expect(res10.cost).toBe(10);
        });

        it('should enforce basic split rules (2 cards, same value, max 4 hands, no resplit aces)', () => {
            const notTwoCards = createHand([c('8',8), c('8',8), c('8',8)]);
            expect(rules.canSplit(notTwoCards, 1).allowed).toBe(false);

            const notSameValue = createHand([c('10',10), c('9',9)]);
            expect(rules.canSplit(notSameValue, 1).allowed).toBe(false);

            const aceSplit = createHand([c('ACE',11), c('ACE',11)]);
            aceSplit.isAceSplit = true;
            expect(rules.canSplit(aceSplit, 1).allowed).toBe(false);

            const hand8s = createHand([c('8',8), c('8',8)]);
            expect(rules.canSplit(hand8s, 4).allowed).toBe(false); // Max 4 hands
        });
    });

    describe('canSurrender', () => {
        it('should not allow surrender', () => {
            const hand = createHand([c('10', 10), c('6', 6)]);
            const res = rules.canSurrender(hand);
            expect(res.allowed).toBe(false);
        });
    });

    describe('evaluateHand', () => {
        it('should push all surviving non-blackjack hands if dealer is exactly 22', () => {
            const playerHand = createHand([c('10', 10), c('10', 10)]); // 20
            const pVal = { total: 20, isSoft: false, handIndex: 0 };
            const dealerCards = [c('10', 10), c('6', 6), c('6', 6)]; // 22
            const dVal = { total: 22, isSoft: false, handIndex: 0 };

            const payout = rules.evaluateHand(playerHand, pVal, dealerCards, dVal);
            expect(payout.status).toBe(HandStatus.PUSH);
            expect(payout.payoutMultiplier).toBe(0);
        });

        it('should pay 3:2 to player natural blackjack against dealer 22', () => {
            const playerHand = createHand([c('ACE', 11), c('10', 10)], HandStatus.BLACKJACK);
            const pVal = { total: 21, isSoft: true, handIndex: 0 };
            const dealerCards = [c('10', 10), c('6', 6), c('6', 6)]; // 22
            const dVal = { total: 22, isSoft: false, handIndex: 0 };

            const payout = rules.evaluateHand(playerHand, pVal, dealerCards, dVal);
            expect(payout.status).toBe(HandStatus.BLACKJACK);
            expect(payout.payoutMultiplier).toBe(1.5);
        });

        it('should bust and lose if player busts, even if dealer busts 22', () => {
            const playerHand = createHand([c('10', 10), c('6', 6), c('6', 6)]); // 22
            const pVal = { total: 22, isSoft: false, handIndex: 0 };
            const dealerCards = [c('10', 10), c('6', 6), c('6', 6)]; // 22
            const dVal = { total: 22, isSoft: false, handIndex: 0 };

            const payout = rules.evaluateHand(playerHand, pVal, dealerCards, dVal);
            expect(payout.status).toBe(HandStatus.LOST);
        });

        it('should handle natural BJ interactions', () => {
            const bjHand = createHand([c('ACE',11), c('KING',10)], HandStatus.BLACKJACK);
            const dBJ = [c('ACE',11), c('QUEEN',10)];
            // Push
            expect(rules.evaluateHand(bjHand, {total:21, isSoft:true}, dBJ, {total:21, isSoft:true}))
                .toEqual({ status: HandStatus.PUSH, payoutMultiplier: 0 });
            
            // Dealer BJ vs non-BJ
            const loseHand = createHand([c('10',10), c('10',10)]);
            expect(rules.evaluateHand(loseHand, {total:20, isSoft:false}, dBJ, {total:21, isSoft:true}))
                .toEqual({ status: HandStatus.LOST, payoutMultiplier: -1 });
        });

        it('should handle standard logic: dealer bust, win, push, lose', () => {
            const dealerCards = [c('10',10), c('7',7)];
            const dVal = {total: 17, isSoft:false};

            const winHand = createHand([c('10',10), c('9',9)]);
            expect(rules.evaluateHand(winHand, {total:19, isSoft:false}, dealerCards, dVal))
                .toEqual({ status: HandStatus.WON, payoutMultiplier: 1 });

            // Dealer bust > 22
            expect(rules.evaluateHand(winHand, {total:19, isSoft:false}, [c('10',10), c('6',6), c('7',7)], {total:23, isSoft:false}))
                .toEqual({ status: HandStatus.WON, payoutMultiplier: 1 });

            const pushHand = createHand([c('10',10), c('7',7)]);
            expect(rules.evaluateHand(pushHand, {total:17, isSoft:false}, dealerCards, dVal))
                .toEqual({ status: HandStatus.PUSH, payoutMultiplier: 0 });

            const loseHand = createHand([c('10',10), c('6',6)]);
            expect(rules.evaluateHand(loseHand, {total:16, isSoft:false}, dealerCards, dVal))
                .toEqual({ status: HandStatus.LOST, payoutMultiplier: -1 });
        });
    });
});
