import { describe, it, expect } from 'vitest';
import { Exchange21Rules } from '../Exchange21Rules';
import { ZapOut21Rules } from '../ZapOut21Rules';
import { FireCardRules } from '../FireCardRules';
import { FreeActionRules } from '../FreeActionRules';
import { Iberian21Rules } from '../Iberian21Rules';
import { UKRules } from '../UKRules';
import { Hand, Card, Seat } from '@/types/game';
import { HandStatus, Rank, Suit } from '@/types/enums';

const c = (rank: string, value: number): Card => ({ rank: rank as Rank, value, suit: Suit.SPADES, isHidden: false });
const createHand = (cards: Card[], status: HandStatus = HandStatus.PLAYING, betAmount: number = 10, isSplit: boolean = false, isDoubleDown: boolean = false): Hand => ({
    id: 'h1', cards, betAmount, status, isDoubleDown, isSplit, isAceSplit: false
});

describe('Exchange 21 Rules', () => {
    const rules = new Exchange21Rules();
    
    it('should allow switch if seat has 2 hands and hands have 2 cards', () => {
        const h0 = createHand([c('A',11), c('K',10)]);
        const h1 = createHand([c('5',5), c('6',6)]);
        const seat = {
            id: 1, isActive: true, hands: [h0, h1],
            currentHandIndex: 0
        } as unknown as Seat;
        
        const res = rules.canSwitch(seat);
        expect(res.allowed).toBe(true);
        expect(res.isFree).toBe(true);
    });

    it('should not allow switch if already switched', () => {
        const h0 = createHand([c('A',11), c('K',10)]);
        const h1 = createHand([c('5',5), c('6',6)]);
        const seat = {
            id: 1, isActive: true, hands: [h0, h1],
            currentHandIndex: 0,
            hasSwitched: true // Already switched
        } as unknown as Seat;
        expect(rules.canSwitch(seat).allowed).toBe(false);
    });
});

describe('Zap Out 21 Rules', () => {
    const rules = new ZapOut21Rules();

    it('should allow Zap on Hard 15-18 with 2 cards', () => {
        // Hard 16
        expect(rules.canZap(createHand([c('10',10), c('6',6)])).allowed).toBe(true);
        // Hard 15
        expect(rules.canZap(createHand([c('8',8), c('7',7)])).allowed).toBe(true);
    });

    it('should NOT allow Zap on Soft totals or outside 15-18 range', () => {
        // Soft 17 (A,6)
        expect(rules.canZap(createHand([c('A',11), c('6',6)])).allowed).toBe(false);
        // Hard 12
        expect(rules.canZap(createHand([c('10',10), c('2',2)])).allowed).toBe(false);
    });

    it('handles canDoubleDown and canSurrender', () => {
        const h2 = createHand([c('2',2), c('3',3)]);
        expect(rules.canDoubleDown(h2).allowed).toBe(true);
        expect(rules.canSurrender().allowed).toBe(false); // No hand param needed
        const h3 = createHand([c('2',2), c('2',2), c('2',2)]);
        expect(rules.canDoubleDown(h3).allowed).toBe(false);
    });

    it('handles canSplit constraints', () => {
        const pair = createHand([c('8',8), c('8',8)]);
        expect(rules.canSplit(pair, 3).allowed).toBe(true);
        expect(rules.canSplit(pair, 4).allowed).toBe(false); // Max 4 hands
        
        const nonPair = createHand([c('10',10), c('9',9)]);
        expect(rules.canSplit(nonPair, 1).allowed).toBe(false);

        const threeCard = createHand([c('2',2), c('2',2), c('2',2)]);
        expect(rules.canSplit(threeCard, 1).allowed).toBe(false);
    });

    describe('evaluateHand', () => {
        const dealerCards = [c('10',10), c('7',7)]; // 17
        const dealerValue = { total: 17, isSoft: false };

        it('should handle dealer bust vs player', () => {
            const hand = createHand([c('10',10), c('10',10)]);
            const val = { total: 20, isSoft: false };
            const dCards = [c('10',10), c('6',6), c('7',7)];
            expect(rules.evaluateHand(hand, val, dCards, {total: 23, isSoft: false})).toEqual({ status: HandStatus.WON, payoutMultiplier: 1 });
        });

        it('should handle dealer 22 bust pushing non-busted player hands', () => {
            const hand = createHand([c('10',10), c('10',10)]);
            const val = { total: 20, isSoft: false };
            const dCards = [c('10',10), c('6',6), c('6',6)];
            expect(rules.evaluateHand(hand, val, dCards, {total: 22, isSoft: false})).toEqual({ status: HandStatus.PUSH, payoutMultiplier: 0 });
        });

        it('should pay 3:2 for natural BJ unless Zapped', () => {
            const hand = createHand([c('ACE',11), c('KING',10)]);
            hand.status = HandStatus.BLACKJACK;
            
            const res = rules.evaluateHand(hand, {total: 21, isSoft:true}, dealerCards, dealerValue);
            expect(res).toEqual({ status: HandStatus.BLACKJACK, payoutMultiplier: 1.5 });

            // Zapped BJ
            hand.isZapped = true;
            // zapped BJ evaluates as PLAYING value 21 against normal compare
            expect(rules.evaluateHand(hand, {total: 21, isSoft:true}, dealerCards, dealerValue)).toEqual({ status: HandStatus.WON, payoutMultiplier: 1 });
        });

        it('should push BJ vs BJ', () => {
             const hand = createHand([c('ACE',11), c('KING',10)]);
             hand.status = HandStatus.BLACKJACK;
             const dCards = [c('ACE',11), c('QUEEN',10)];
             expect(rules.evaluateHand(hand, {total: 21, isSoft:true}, dCards, {total: 21, isSoft:true})).toEqual({ status: HandStatus.PUSH, payoutMultiplier: 0 });
        });

        it('should lose to Dealer BJ', () => {
            const hand = createHand([c('10',10), c('10',10)]);
            const dCards = [c('ACE',11), c('QUEEN',10)];
            expect(rules.evaluateHand(hand, {total: 20, isSoft:false}, dCards, {total: 21, isSoft:true})).toEqual({ status: HandStatus.LOST, payoutMultiplier: -1 });
        });

        it('should lose on bust', () => {
            const hand = createHand([c('10',10), c('10',10), c('5',5)]);
            hand.status = HandStatus.BUST;
            expect(rules.evaluateHand(hand, {total: 25, isSoft:false}, dealerCards, dealerValue)).toEqual({ status: HandStatus.LOST, payoutMultiplier: -1 });
        });

        it('standard compares', () => {
            const hand19 = createHand([c('10',10), c('9',9)]);
            const hand17 = createHand([c('10',10), c('7',7)]);
            const hand16 = createHand([c('10',10), c('6',6)]);

            expect(rules.evaluateHand(hand19, {total:19, isSoft:false}, dealerCards, dealerValue)).toEqual({ status: HandStatus.WON, payoutMultiplier: 1 });
            expect(rules.evaluateHand(hand17, {total:17, isSoft:false}, dealerCards, dealerValue)).toEqual({ status: HandStatus.PUSH, payoutMultiplier: 0 });
            expect(rules.evaluateHand(hand16, {total:16, isSoft:false}, dealerCards, dealerValue)).toEqual({ status: HandStatus.LOST, payoutMultiplier: -1 });
        });
    });
});

describe('Fire Card 21 Rules', () => {
    const rules = new FireCardRules();
    
    it('should allow Burn on first 2 cards for half bet', () => {
         const hand = createHand([c('10',10), c('4',4)], HandStatus.PLAYING, 100);
         const res = rules.canBurn(hand);
         expect(res.allowed).toBe(true);
         expect(res.cost).toBe(50); // Half of 100

         const burned = createHand([c('10',10), c('4',4)]);
         burned.isBurned = true;
         // Already burned, cannot burn again
         expect(rules.canBurn(burned).allowed).toBe(false);

         const threeCards = createHand([c('5',5), c('5',5), c('4',4)]);
         expect(rules.canBurn(threeCards).allowed).toBe(false);
    });

    it('handles canDoubleDown, canSplit, canSurrender', () => {
         const h2 = createHand([c('2',2), c('3',3)]);
         expect(rules.canDoubleDown(h2).allowed).toBe(true);
         
         const h3 = createHand([c('2',2), c('2',2), c('2',2)]);
         expect(rules.canDoubleDown(h3).allowed).toBe(false);

         expect(rules.canSurrender(h2).allowed).toBe(false);

         const splitHandNDAS = createHand([c('5',5), c('3',3)], HandStatus.PLAYING, 10, true);
         // Simulate FireCard rules created with DAS = false
         const rulesNDAS = new FireCardRules(true, 4, false);
         expect(rulesNDAS.canDoubleDown(splitHandNDAS).allowed).toBe(false);

         const pair = createHand([c('8',8), c('8',8)]);
         expect(rules.canSplit(pair, 3).allowed).toBe(true);
         expect(rules.canSplit(pair, 4).allowed).toBe(false);
         expect(rules.canSplit(h3, 1).allowed).toBe(false);
         expect(rules.canSplit(h2, 1).allowed).toBe(false);
    });

    describe('evaluateHand', () => {
        const d17 = [c('10',10), c('7',7)];
        const v17 = {total: 17, isSoft: false};

        it('evaluates Player BJ vs Dealer BJ interactions paying 1:1', () => {
             const hand = createHand([c('ACE',11), c('KING',10)]);
             hand.status = HandStatus.BLACKJACK;
             
             // Natural BJ vs 17 => 1.0 multiplier
             expect(rules.evaluateHand(hand, {total: 21, isSoft:true}, d17, v17)).toEqual({ status: HandStatus.BLACKJACK, payoutMultiplier: 1.0 });

             // Burned BJ => Just a 21
             hand.isBurned = true;
             expect(rules.evaluateHand(hand, {total: 21, isSoft:true}, d17, v17)).toEqual({ status: HandStatus.WON, payoutMultiplier: 1.0 });

             // Both BJ => push
             hand.isBurned = false;
             const dBJ = [c('ACE',11), c('QUEEN',10)];
             expect(rules.evaluateHand(hand, {total: 21, isSoft:true}, dBJ, {total: 21, isSoft:true})).toEqual({ status: HandStatus.PUSH, payoutMultiplier: 0 });
        });

        it('handles surrendered, bust, dealer bust, and values', () => {
            const surr = createHand([]);
            surr.status = HandStatus.SURRENDERED;
            surr.isSurrendered = true;
            expect(rules.evaluateHand(surr, {total: 10, isSoft:false}, d17, v17)).toEqual({ status: HandStatus.SURRENDERED, payoutMultiplier: -0.5 });

            const bust = createHand([]);
            bust.status = HandStatus.BUST;
            expect(rules.evaluateHand(bust, {total: 25, isSoft:false}, d17, v17)).toEqual({ status: HandStatus.LOST, payoutMultiplier: -1 });

            const win = createHand([c('10',10), c('9',9)]);
            expect(rules.evaluateHand(win, {total: 19, isSoft:false}, d17, v17)).toEqual({ status: HandStatus.WON, payoutMultiplier: 1 });
            const push = createHand([c('10',10), c('7',7)]);
            expect(rules.evaluateHand(push, {total: 17, isSoft:false}, d17, v17)).toEqual({ status: HandStatus.PUSH, payoutMultiplier: 0 });
            const lose = createHand([c('10',10), c('6',6)]);
            expect(rules.evaluateHand(lose, {total: 16, isSoft:false}, d17, v17)).toEqual({ status: HandStatus.LOST, payoutMultiplier: -1 });

            // Dealer bust
            expect(rules.evaluateHand(win, {total: 19, isSoft:false}, [c('10',10), c('4',4), c('9',9)], {total: 23, isSoft:false}))
                .toEqual({ status: HandStatus.WON, payoutMultiplier: 1 });
            // Dealer BJ
            expect(rules.evaluateHand(win, {total: 19, isSoft:false}, [c('ACE',11), c('QUEEN',10)], {total: 21, isSoft:true}))
                .toEqual({ status: HandStatus.LOST, payoutMultiplier: -1 });
        });
    });
});

describe('Free Action Rules', () => {
    const rules = new FreeActionRules();
    
    it('should have FREE Double on Hard 9, 10, 11', () => {
        // Hard 10
        const res10 = rules.canDoubleDown(createHand([c('6',6), c('4',4)]));
        expect(res10.allowed).toBe(true);
        expect(res10.isFree).toBe(true);
    });

    it('should have COSTLY Double on other hands', () => {
        // Soft 14 (A,3)
        const resSoft = rules.canDoubleDown(createHand([c('A',11), c('3',3)]));
        expect(resSoft.allowed).toBe(true);
        expect(resSoft.isFree).toBe(false);
    });

    it('should have FREE Split on pairs except 10s', () => {
        // Pair of 8s
        const res8s = rules.canSplit(createHand([c('8',8), c('8',8)]), 1);
        expect(res8s.allowed).toBe(true);
        expect(res8s.isFree).toBe(true);

        // Pair of Kings (10s)
        const resKs = rules.canSplit(createHand([c('K',10), c('K',10)]), 1);
        expect(resKs.allowed).toBe(true);
        expect(resKs.isFree).toBe(false);
    });
});

describe('Iberian 21 Rules (Spanish 21)', () => {
    const rules = new Iberian21Rules();
    
    it('should allow Double Down on ANY number of cards', () => {
        // 3 cards
        const hand = createHand([c('2',2), c('3',3), c('4',4)]); // 9
        expect(rules.canDoubleDown(hand).allowed).toBe(true);
        hand.isDoubleDown = true;
        // no redouble
        expect(rules.canDoubleDown(hand).allowed).toBe(false);
    });

    it('should allow Surrender (Double Down Rescue) after doubling', () => {
         const hand = createHand([c('6',6), c('5',5)], HandStatus.PLAYING, 10, false, true); // Doubled
         expect(rules.canSurrender(hand).allowed).toBe(true);
    });

    it('handles canSplit', () => {
        const pair = createHand([c('8',8), c('8',8)]);
        expect(rules.canSplit(pair, 3).allowed).toBe(true);
        expect(rules.canSplit(pair, 4).allowed).toBe(false);
    });

    describe('evaluateHand', () => {
        const d17 = [c('10',10), c('7',7)];
        const v17 = {total: 17, isSoft: false};
        const dBJ = [c('ACE',11), c('QUEEN',10)];
        const vBJ = {total: 21, isSoft: true};

        it('always wins on Player Blackjack, even against Dealer Blackjack', () => {
            const hand = createHand([c('ACE',11), c('KING',10)]);
            hand.status = HandStatus.BLACKJACK;
            
            // Vs normal
            expect(rules.evaluateHand(hand, vBJ, d17, v17)).toEqual({ status: HandStatus.BLACKJACK, payoutMultiplier: 1.5 });
            // Vs dealer BJ
            expect(rules.evaluateHand(hand, vBJ, dBJ, vBJ)).toEqual({ status: HandStatus.BLACKJACK, payoutMultiplier: 1.5 });
        });

        it('always wins on Player 21 with bonus payouts', () => {
            const hand = createHand([c('10',10), c('6',6), c('5',5)]);
            hand.status = HandStatus.PLAYING;
            
            // Undoubled 3-card 21 => 1.0 (win) usually
            expect(rules.evaluateHand(hand, {total: 21, isSoft:false}, d17, v17)).toMatchObject({ status: HandStatus.WON, payoutMultiplier: 1 });

            // 5-card 21 (3:2 = 1.5)
            const h5 = createHand([c('2',2), c('2',2), c('3',3), c('4',4), c('10',10)]);
            expect(rules.evaluateHand(h5, {total: 21, isSoft:false}, d17, v17)).toMatchObject({ status: HandStatus.WON, payoutMultiplier: 1.5 });

            // 6-card 21 (2:1 = 2)
            const h6 = createHand([c('2',2), c('2',2), c('2',2), c('2',2), c('3',3), c('10',10)]);
            expect(rules.evaluateHand(h6, {total: 21, isSoft:false}, d17, v17)).toMatchObject({ status: HandStatus.WON, payoutMultiplier: 2 });

            // 7-card 21 (3:1 = 3)
            const h7 = createHand([c('2',2), c('2',2), c('2',2), c('A',1), c('A',1), c('3',3), c('10',10)]);
            expect(rules.evaluateHand(h7, {total: 21, isSoft:false}, d17, v17)).toMatchObject({ status: HandStatus.WON, payoutMultiplier: 3 });
        });

        it('awards strictly 1:1 if player 21 is doubled', () => {
             const h5 = createHand([c('2',2), c('2',2), c('3',3), c('4',4), c('10',10)]);
             h5.isDoubleDown = true;
             expect(rules.evaluateHand(h5, {total: 21, isSoft:false}, d17, v17)).toMatchObject({ status: HandStatus.WON, payoutMultiplier: 1 });
        });

        it('evaluates 6-7-8 and 7-7-7 bonuses', () => {
            const h678_mixed = createHand([
                {rank: Rank.SIX, value: 6, suit: Suit.HEARTS, isHidden:false},
                {rank: Rank.SEVEN, value: 7, suit: Suit.CLUBS, isHidden:false},
                {rank: Rank.EIGHT, value: 8, suit: Suit.DIAMONDS, isHidden:false}
            ]);
            expect(rules.evaluateHand(h678_mixed, {total: 21, isSoft:false}, d17, v17)).toMatchObject({ status: HandStatus.WON, payoutMultiplier: 1.5 }); // 3:2

            const h777_suited = createHand([
                {rank: Rank.SEVEN, value: 7, suit: Suit.HEARTS, isHidden:false},
                {rank: Rank.SEVEN, value: 7, suit: Suit.HEARTS, isHidden:false},
                {rank: Rank.SEVEN, value: 7, suit: Suit.HEARTS, isHidden:false}
            ]);
            expect(rules.evaluateHand(h777_suited, {total: 21, isSoft:false}, d17, v17)).toMatchObject({ status: HandStatus.WON, payoutMultiplier: 2 }); // 2:1 since not spades

            const hSpades = createHand([
                {rank: Rank.SIX, value: 6, suit: Suit.SPADES, isHidden:false},
                {rank: Rank.SEVEN, value: 7, suit: Suit.SPADES, isHidden:false},
                {rank: Rank.EIGHT, value: 8, suit: Suit.SPADES, isHidden:false}
            ]);
            expect(rules.evaluateHand(hSpades, {total: 21, isSoft:false}, d17, v17)).toMatchObject({ status: HandStatus.WON, payoutMultiplier: 3 }); // 3:1

            // Super bonus 777 suited against 7 upcard
            const d7 = [{rank: Rank.SEVEN, value: 7, suit: Suit.HEARTS, isHidden:false}];
            h777_suited.betAmount = 25; // 5000 / 25 = 200 multiplier!
            expect(rules.evaluateHand(h777_suited, {total: 21, isSoft:false}, d7, v17)).toMatchObject({ status: HandStatus.WON, payoutMultiplier: 200 }); // 5000 / 25
        });

        it('handles dealer BJ, busts, standard outcomes', () => {
            const hand = createHand([c('10',10), c('9',9)]);
            // Dealer BJ vs 19 = lost
            expect(rules.evaluateHand(hand, {total: 19, isSoft:false}, dBJ, vBJ)).toEqual({ status: HandStatus.LOST, payoutMultiplier: -1 });

            // Player Bust = lost
            const bust = createHand([c('10',10), c('10',10), c('5',5)]);
            expect(rules.evaluateHand(bust, {total: 25, isSoft:false}, d17, v17)).toEqual({ status: HandStatus.LOST, payoutMultiplier: -1 });

            // Standard Compare
            expect(rules.evaluateHand(hand, {total: 19, isSoft:false}, d17, v17)).toEqual({ status: HandStatus.WON, payoutMultiplier: 1 });
            expect(rules.evaluateHand(createHand([c('10',10), c('7',7)]), {total: 17, isSoft:false}, d17, v17)).toEqual({ status: HandStatus.PUSH, payoutMultiplier: 0 });
            expect(rules.evaluateHand(createHand([c('10',10), c('6',6)]), {total: 16, isSoft:false}, d17, v17)).toEqual({ status: HandStatus.LOST, payoutMultiplier: -1 });
            
            // Dealer Bust
            expect(rules.evaluateHand(hand, {total: 19, isSoft:false}, [c('10',10), c('6',6), c('7',7)], {total: 23, isSoft:false})).toEqual({ status: HandStatus.WON, payoutMultiplier: 1 });
        });
    });
});

describe('UK Rules', () => {
    const rules = new UKRules();

    it('should allow splitting up to 4 hands', () => {
        const hand = createHand([c('8',8), c('8',8)]);
        expect(rules.canSplit(hand, 3).allowed).toBe(true);
        expect(rules.canSplit(hand, 4).allowed).toBe(false);
    });

    it('handles canDoubleDown edge cases', () => {
        const h2 = createHand([c('2',2), c('3',3)]);
        expect(rules.canDoubleDown(h2).allowed).toBe(true);
        const h3 = createHand([c('2',2), c('3',3), c('4',4)]);
        expect(rules.canDoubleDown(h3).allowed).toBe(false);
    });

    it('should NOT allow surrender', () => {
        expect(rules.canSurrender(createHand([c('10',10), c('6',6)])).allowed).toBe(false);
    });

    describe('evaluateHand with OBO (Original Bets Only)', () => {
        const d17 = [c('10',10), c('7',7)];
        const v17 = {total: 17, isSoft: false};
        const dBJ = [c('ACE',11), c('QUEEN',10)];
        const vBJ = {total: 21, isSoft: true};

        it('refunds extra bets correctly when dealer has BJ (OBO Rule)', () => {
            const normal = createHand([c('10',10), c('9',9)]); // 1x bet
            const doubled = createHand([c('10',10), c('9',9)], HandStatus.PLAYING, 10, false, true); // doubled
            const splitFirst = createHand([c('10',10), c('9',9)]); // handIndex = 0
            const splitSecond = createHand([c('10',10), c('9',9)]); // handIndex = 1

            // Normal lose = -1
            expect(rules.evaluateHand(normal, {total: 19, isSoft:false}, dBJ, vBJ, 0, 1)).toEqual({ status: HandStatus.LOST, payoutMultiplier: -1 });
            
            // Doubled lose vs Dealer BJ = lose half of 2x = -0.5
            expect(rules.evaluateHand(doubled, {total: 19, isSoft:false}, dBJ, vBJ, 0, 1)).toEqual({ status: HandStatus.LOST, payoutMultiplier: -0.5 });

            // Split first hand = lose original bet = -1
            expect(rules.evaluateHand(splitFirst, {total: 19, isSoft:false}, dBJ, vBJ, 0, 2)).toEqual({ status: HandStatus.LOST, payoutMultiplier: -1 });

            // Split extra hands = push (refund)
            expect(rules.evaluateHand(splitSecond, {total: 19, isSoft:false}, dBJ, vBJ, 1, 2)).toEqual({ status: HandStatus.PUSH, payoutMultiplier: 0 });
        });

        it('handles player bust', () => {
             const bust = createHand([c('10',10), c('10',10), c('5',5)]);
             expect(rules.evaluateHand(bust, {total: 25, isSoft:false}, d17, v17)).toEqual({ status: HandStatus.LOST, payoutMultiplier: -1 });
        });

        it('handles natural BJ interactions', () => {
             const hand = createHand([c('ACE',11), c('KING',10)]);
             hand.status = HandStatus.BLACKJACK;

             // Push
             expect(rules.evaluateHand(hand, vBJ, dBJ, vBJ)).toEqual({ status: HandStatus.PUSH, payoutMultiplier: 0 });

             // Win 1.5
             expect(rules.evaluateHand(hand, vBJ, d17, v17)).toEqual({ status: HandStatus.BLACKJACK, payoutMultiplier: 1.5 });
        });

        it('handles standard dealer bust and compare', () => {
            const win = createHand([c('10',10), c('9',9)]);
            expect(rules.evaluateHand(win, {total: 19, isSoft:false}, d17, v17)).toEqual({ status: HandStatus.WON, payoutMultiplier: 1 });
            
            expect(rules.evaluateHand(createHand([c('10',10), c('7',7)]), {total: 17, isSoft:false}, d17, v17)).toEqual({ status: HandStatus.PUSH, payoutMultiplier: 0 });
            
            expect(rules.evaluateHand(createHand([c('10',10), c('6',6)]), {total: 16, isSoft:false}, d17, v17)).toEqual({ status: HandStatus.LOST, payoutMultiplier: -1 });

             // Dealer Bust
             expect(rules.evaluateHand(win, {total: 19, isSoft:false}, [c('10',10), c('6',6), c('7',7)], {total: 23, isSoft:false})).toEqual({ status: HandStatus.WON, payoutMultiplier: 1 });
        });
    });
});
