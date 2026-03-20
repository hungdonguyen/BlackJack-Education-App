import { describe, it, expect } from 'vitest';
import { Exchange21Rules } from '../Exchange21Rules';
import { Hand, Card, HandValue, Seat } from '@/types/game';
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

describe('Exchange 21 Rules', () => {
    const rules = new Exchange21Rules();

    it('should pay 1:1 for Blackjack (not 3:2)', () => {
        expect(rules.blackjackPayoutMultiplier).toBe(1);
    });

    it('should split up to 4 hands', () => {
        const hand = createHand([c('8', 8), c('8', 8)]);
        // If seatHandsLength is 3, splitting makes 4 (Allowed)
        expect(rules.canSplit(hand, 3).allowed).toBe(true);
        // If seatHandsLength is 4, splitting makes 5 (Not Allowed)
        expect(rules.canSplit(hand, 4).allowed).toBe(false);

        const diffVals = createHand([c('10',10), c('9',9)]);
        expect(rules.canSplit(diffVals, 1).allowed).toBe(false);

        const aceSplit = createHand([c('8',8), c('8',8)]);
        aceSplit.isAceSplit = true;
        expect(rules.canSplit(aceSplit, 1).allowed).toBe(false);

        const threeCards = createHand([c('8',8), c('8',8), c('8',8)]);
        expect(rules.canSplit(threeCards, 1).allowed).toBe(false);
    });

    describe('canSwitch', () => {
        it('should allow switch when having exactly 2 playing hands with 2 cards each and not switched yet', () => {
            const h1 = createHand([c('10', 10), c('5', 5)]);
            const h2 = createHand([c('ACE', 11), c('6', 6)]);
            const seat = {
                id: 1,
                isActive: true,
                currentHandIndex: 0,
                hands: [h1, h2],
                hasSwitched: false
            } as unknown as Seat;

            const res = rules.canSwitch(seat);
            expect(res.allowed).toBe(true);
            expect(res.isFree).toBe(true);
            expect(res.cost).toBe(0);
        });

        it('should not allow switch if already switched', () => {
            const h1 = createHand([c('10', 10), c('5', 5)]);
            const h2 = createHand([c('ACE', 11), c('6', 6)]);
            const seat = {
                id: 1,
                isActive: true,
                currentHandIndex: 0,
                hands: [h1, h2],
                hasSwitched: true // Already switched
            } as unknown as Seat;

            expect(rules.canSwitch(seat).allowed).toBe(false);
        });

        it('should not allow switch if any hand is split', () => {
            const h1 = createHand([c('10', 10), c('5', 5)], HandStatus.PLAYING, 10, true);
            const h2 = createHand([c('ACE', 11), c('6', 6)]);
            const seat = {
                id: 1,
                isActive: true,
                currentHandIndex: 0,
                hands: [h1, h2],
                hasSwitched: false
            } as unknown as Seat;

            expect(rules.canSwitch(seat).allowed).toBe(false);
        });
    });

    describe('evaluateHand', () => {
        it('should push player non-busted hand when dealer total is 22', () => {
            const playerHand = createHand([c('10', 10), c('10', 10)]); // Total 20
            const pVal = { total: 20, isSoft: false, handIndex: 0 };
            const dealerCards = [c('10', 10), c('6', 6), c('6', 6)]; // Total 22
            const dVal = { total: 22, isSoft: false, handIndex: 0 };

            const payout = rules.evaluateHand(playerHand, pVal, dealerCards, dVal);
            expect(payout.status).toBe(HandStatus.PUSH);
            expect(payout.payoutMultiplier).toBe(0);
        });

        it('should win 1:1 for player natural blackjack against dealer 22', () => {
            const playerHand = createHand([c('ACE', 11), c('10', 10)], HandStatus.BLACKJACK);
            const pVal = { total: 21, isSoft: true, handIndex: 0 };
            const dealerCards = [c('10', 10), c('6', 6), c('6', 6)]; // Total 22
            const dVal = { total: 22, isSoft: false, handIndex: 0 };

            const payout = rules.evaluateHand(playerHand, pVal, dealerCards, dVal);
            expect(payout.status).toBe(HandStatus.BLACKJACK);
            expect(payout.payoutMultiplier).toBe(1);
        });

        it('should push if both player and dealer have natural blackjacks', () => {
            const playerHand = createHand([c('ACE', 11), c('10', 10)], HandStatus.BLACKJACK);
            const pVal = { total: 21, isSoft: true, handIndex: 0 };
            const dealerCards = [c('ACE', 11), c('10', 10)];
            const dVal = { total: 21, isSoft: true, handIndex: 0 };

            const payout = rules.evaluateHand(playerHand, pVal, dealerCards, dVal);
            expect(payout.status).toBe(HandStatus.PUSH);
        });

        it('should lose if player busts', () => {
            const playerHand = createHand([c('10', 10), c('6', 6), c('6', 6)]); // 22
            const pVal = { total: 22, isSoft: false, handIndex: 0 };
            const dealerCards = [c('9', 9), c('7', 7)]; // 16
            const dVal = { total: 16, isSoft: false, handIndex: 0 };

            const payout = rules.evaluateHand(playerHand, pVal, dealerCards, dVal);
            expect(payout.status).toBe(HandStatus.LOST);
        });

        it('should handle dealer blackjack', () => {
            const playerHand = createHand([c('10',10), c('9',9)]);
            const dealerCards = [c('ACE',11), c('QUEEN',10)];
            const payout = rules.evaluateHand(playerHand, {total:19, isSoft:false}, dealerCards, {total:21, isSoft:true});
            expect(payout.status).toBe(HandStatus.LOST);
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
