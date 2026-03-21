import { Card } from '@/types/game';
import { Rank } from '@/types/enums';
import { calculateHandValue } from '@/utils/hand';

export type SwitchAdviceEngine = 'cindy_basic' | 'cindy_advanced' | 'arnold_snyder';

export interface ExchangeAdvice {
    shouldSwitch: boolean;
    reasoning: string;
    originalEV: number;
    switchedEV: number;
    engine: SwitchAdviceEngine;
    engineLabel: string;
}

interface BuildExchangeAdviceInput {
    hand1: Card[];
    hand2: Card[];
    dealerUpcard: string;
    engine: SwitchAdviceEngine;
    getHandEV: (cards: Card[], dealerUpcard: string, isSwitched?: boolean) => number;
    normalizeRank: (rank: string) => string;
}

export function getSwitchEngineLabel(engine: SwitchAdviceEngine): string {
    if (engine === 'cindy_basic') return 'Cindy Liu Basic';
    if (engine === 'cindy_advanced') return 'Cindy Liu Advanced';
    return 'Arnold Snyder';
}

function isSplittablePair(cards: Card[], dealerNorm: string): boolean {
    if (cards[0].rank !== cards[1].rank) return false;
    const r = cards[0].rank;
    const d = dealerNorm;
    if (['A', '8'].includes(r)) return true;
    if (r === '9' && ['2', '3', '4', '5', '6', '8', '9'].includes(d)) return true;
    if (r === '7' && ['2', '3', '4', '5', '6', '7'].includes(d)) return true;
    if (r === '6' && ['2', '3', '4', '5', '6'].includes(d)) return true;
    if (['2', '3'].includes(r) && ['2', '3', '4', '5', '6', '7'].includes(d)) return true;
    if (r === '4' && ['5', '6'].includes(d)) return true;
    return false;
}

function getHandPowerRank(cards: Card[], dealerNorm: string): number {
    const val = calculateHandValue(cards).total;
    const isPair = cards[0].rank === cards[1].rank;
    const isAA = isPair && cards[0].rank === Rank.ACE;
    const is88 = isPair && cards[0].rank === Rank.EIGHT;
    const isDealer2To8 = ['2', '3', '4', '5', '6', '7', '8'].includes(dealerNorm);

    if (val === 21) return 1;
    if (val === 20) return 2;
    if (val === 19) return 3;
    if (isAA) return 4;
    if (val === 11) return 5;
    if (val === 10) return 6;
    if (val === 9) return 7;
    if (val === 18 || val === 8) return 8;
    if (is88) {
        if (isDealer2To8) return 9;
        return 10; // Trash against 9, 10, A
    }
    
    return 10; // Trash
}

function getTrashScore(cards: Card[], dealerNorm: string): number {
    const val = calculateHandValue(cards).total;
    if (val === 17 || val === 7) return 100;
    if (isSplittablePair(cards, dealerNorm)) return 90;
    if (val === 12) return 80;
    if (val === 13) return 70;
    return val; // unranked
}

function buildBasicSwitchAdvice(
    origH1: Card[],
    origH2: Card[],
    switchH1: Card[],
    switchH2: Card[],
    dealerNorm: string,
    totalOrigEV: number,
    totalSwtchEV: number,
    isRedundant: boolean
): ExchangeAdvice {
    const engine: SwitchAdviceEngine = 'cindy_basic';
    if (isRedundant) {
        return {
            shouldSwitch: false,
            reasoning: 'STAND PAT: Switching results in the exact same hand structure.',
            originalEV: totalOrigEV,
            switchedEV: totalSwtchEV,
            engine,
            engineLabel: getSwitchEngineLabel(engine),
        };
    }

    const rankO1 = getHandPowerRank(origH1, dealerNorm);
    const rankO2 = getHandPowerRank(origH2, dealerNorm);
    const rankS1 = getHandPowerRank(switchH1, dealerNorm);
    const rankS2 = getHandPowerRank(switchH2, dealerNorm);

    const origRanks = [rankO1, rankO2].sort((a, b) => a - b);
    const switchRanks = [rankS1, rankS2].sort((a, b) => a - b);

    const origStrongest = origRanks[0];
    const origWeakest = origRanks[1];
    const switchStrongest = switchRanks[0];
    const switchWeakest = switchRanks[1];

    // 1. Universal Rule: The Free Upgrade
    if ((switchStrongest <= origStrongest && switchWeakest < origWeakest) ||
        (switchStrongest < origStrongest && switchWeakest <= origWeakest)) {
        return {
            shouldSwitch: true,
            reasoning: 'SWITCH (Free Upgrade): At least one hand improves its Power Rank without hurting the other.',
            originalEV: totalOrigEV,
            switchedEV: totalSwtchEV,
            engine,
            engineLabel: getSwitchEngineLabel(engine)
        };
    }

    // 2. The Trash Bailout
    if (origStrongest === 10 && switchStrongest === 10) {
        const origTrashMax = Math.max(getTrashScore(origH1, dealerNorm), getTrashScore(origH2, dealerNorm));
        const switchTrashMax = Math.max(getTrashScore(switchH1, dealerNorm), getTrashScore(switchH2, dealerNorm));
        
        if (switchTrashMax > origTrashMax) {
            return {
                shouldSwitch: true,
                reasoning: 'SWITCH (Trash Bailout): Both configurations are unranked, but switching builds a prioritized survival hand (17, Split, 12, or 13).',
                originalEV: totalOrigEV,
                switchedEV: totalSwtchEV,
                engine,
                engineLabel: getSwitchEngineLabel(engine)
            };
        } else {
            return {
                shouldSwitch: false,
                reasoning: 'STAND PAT (Trash Bailout): Switched hands do not offer a better survival priority than your current unranked hands.',
                originalEV: totalOrigEV,
                switchedEV: totalSwtchEV,
                engine,
                engineLabel: getSwitchEngineLabel(engine)
            };
        }
    }

    // 3. Balance vs Maximize Analysis
    const isBalance = ['7', '8'].includes(dealerNorm);
    
    if (isBalance) {
        if (switchWeakest < origWeakest) {
            return {
                shouldSwitch: true,
                reasoning: 'SWITCH to BALANCE: Against a dealer 7 or 8, you successfully elevated your WEAKEST hand to a better Power Rank.',
                originalEV: totalOrigEV,
                switchedEV: totalSwtchEV,
                engine,
                engineLabel: getSwitchEngineLabel(engine)
            };
        }
    } else {
        if (switchStrongest < origStrongest) {
            return {
                shouldSwitch: true,
                reasoning: `SWITCH to MAXIMIZE: Against a dealer ${dealerNorm}, you sacrificed to build one stronger Power Rank hand.`,
                originalEV: totalOrigEV,
                switchedEV: totalSwtchEV,
                engine,
                engineLabel: getSwitchEngineLabel(engine)
            };
        }
    }

    return {
        shouldSwitch: false,
        reasoning: 'STAND PAT: Switching violates the strict Power Ranking mechanics for this dealer upcard.',
        originalEV: totalOrigEV,
        switchedEV: totalSwtchEV,
        engine,
        engineLabel: getSwitchEngineLabel(engine)
    };
}

function buildAdvancedSwitchAdvice(
    origH1: Card[],
    origH2: Card[],
    switchH1: Card[],
    switchH2: Card[],
    dealerNorm: string,
    totalOrigEV: number,
    totalSwtchEV: number,
    isRedundant: boolean
): ExchangeAdvice {
    const engine: SwitchAdviceEngine = 'cindy_advanced';
    if (isRedundant) {
        return {
            shouldSwitch: false,
            reasoning: 'STAND PAT: Switching results in the same hand combination.',
            originalEV: totalOrigEV,
            switchedEV: totalSwtchEV,
            engine,
            engineLabel: getSwitchEngineLabel(engine),
        };
    }

    const isStrongDealer = ['9', '10', 'A'].includes(dealerNorm);
    const requiredMargin = isStrongDealer ? 0.10 : 0.05;

    // Apply Double Penalty
    let adjustedSwitchEV = totalSwtchEV;
    const sV1 = calculateHandValue(switchH1).total;
    const sV2 = calculateHandValue(switchH2).total;
    const rankS1 = getHandPowerRank(switchH1, dealerNorm);
    const rankS2 = getHandPowerRank(switchH2, dealerNorm);

    const hasPenalty1 = (sV1 === 15 || sV1 === 16) && rankS2 > 2;
    const hasPenalty2 = (sV2 === 15 || sV2 === 16) && rankS1 > 2;
    if (hasPenalty1) adjustedSwitchEV -= 0.05;
    if (hasPenalty2) adjustedSwitchEV -= 0.05;

    const evDelta = adjustedSwitchEV - totalOrigEV;
    const rawEvDelta = totalSwtchEV - totalOrigEV;
    const shouldSwitch = evDelta >= requiredMargin;

    let reasoning = `STAND PAT: EV margin (${rawEvDelta > 0 ? '+' : ''}${rawEvDelta.toFixed(2)}) doesn't clear the required mathematical safety threshold.`;
    
    if (shouldSwitch) {
        if (isStrongDealer) {
            reasoning = `SWITCH: Clears the strict +0.10 EV requirement vs strong dealer, ensuring survival (+${rawEvDelta.toFixed(2)} EV).`;
        } else {
            reasoning = `SWITCH: Mathematically validated Expected Value edge (+${rawEvDelta.toFixed(2)} EV).`;
            if (sV1 === 11 || sV2 === 11 || isSplittablePair(switchH1, dealerNorm) || isSplittablePair(switchH2, dealerNorm)) {
                reasoning = `SWITCH: Math dictates aggressively breaking hands to create high-value offensive equity (+${rawEvDelta.toFixed(2)} EV).`;
            }
        }
    }

    return {
        shouldSwitch,
        reasoning,
        originalEV: totalOrigEV,
        switchedEV: totalSwtchEV, 
        engine,
        engineLabel: getSwitchEngineLabel(engine)
    };
}

function buildSnyderSwitchAdvice(
    origH1: Card[],
    origH2: Card[],
    switchH1: Card[],
    switchH2: Card[],
    dealerNorm: string,
    totalOrigEV: number,
    totalSwtchEV: number,
    isRedundant: boolean
): ExchangeAdvice {
    const engine: SwitchAdviceEngine = 'arnold_snyder';
    if (isRedundant) {
        return {
            shouldSwitch: false,
            reasoning: 'STAND PAT: No structural difference.',
            originalEV: totalOrigEV,
            switchedEV: totalSwtchEV,
            engine,
            engineLabel: getSwitchEngineLabel(engine),
        };
    }

    const oV1 = calculateHandValue(origH1).total;
    const oV2 = calculateHandValue(origH2).total;
    const sV1 = calculateHandValue(switchH1).total;
    const sV2 = calculateHandValue(switchH2).total;

    // Strict Prohibitions
    // NEVER switch if Hand A or Hand B is currently an 18, 19, 20, or 21.
    const hasExistingPremium = [oV1, oV2].some(v => v >= 18);
    if (hasExistingPremium) {
        return {
            shouldSwitch: false,
            reasoning: 'STAND PAT (Protect the Fortress): Snyder strictly refuses to risk dismantling a made hand of 18 or higher.',
            originalEV: totalOrigEV,
            switchedEV: totalSwtchEV,
            engine,
            engineLabel: getSwitchEngineLabel(engine),
        };
    }

    const isStrongDealer = ['9', '10', 'A'].includes(dealerNorm);
    const createsSplit = isSplittablePair(switchH1, dealerNorm) || isSplittablePair(switchH2, dealerNorm);
    
    // Do not switch to create splits against a dealer 9, 10, or Ace.
    if (createsSplit && isStrongDealer) {
        return {
            shouldSwitch: false,
            reasoning: 'STAND PAT: Variance Mitigation rejects creating a split against a severe dealer 9, 10, or Ace.',
            originalEV: totalOrigEV,
            switchedEV: totalSwtchEV,
            engine,
            engineLabel: getSwitchEngineLabel(engine),
        };
    }

    // Avoid switches that result in two stiff hands (12-16) against a dealer 7 or higher.
    const isDealer7orHigher = ['7', '8', '9', '10', 'A'].includes(dealerNorm);
    const twoStiffsS = (sV1 >= 12 && sV1 <= 16) && (sV2 >= 12 && sV2 <= 16);
    if (twoStiffsS && isDealer7orHigher) {
        return {
            shouldSwitch: false,
            reasoning: 'STAND PAT: Pessimistic evaluation avoids switching into doublestiff hands against a dealer 7+.',
            originalEV: totalOrigEV,
            switchedEV: totalSwtchEV,
            engine,
            engineLabel: getSwitchEngineLabel(engine),
        };
    }

    const evDelta = totalSwtchEV - totalOrigEV;
    if (evDelta > 0.08) {
        return {
            shouldSwitch: true,
            reasoning: `SWITCH: Solid situational edge (+${evDelta.toFixed(2)} EV) that passes all low-variance baseline prohibitions.`,
            originalEV: totalOrigEV,
            switchedEV: totalSwtchEV,
            engine,
            engineLabel: getSwitchEngineLabel(engine),
        };
    }

    return {
        shouldSwitch: false,
        reasoning: 'STAND PAT: Snyder enforces low-variance survival; the mathematical advantage is not undeniably strong enough.',
        originalEV: totalOrigEV,
        switchedEV: totalSwtchEV,
        engine,
        engineLabel: getSwitchEngineLabel(engine),
    };
}

export function buildExchange21Advice({
    hand1,
    hand2,
    dealerUpcard,
    engine,
    getHandEV,
    normalizeRank,
}: BuildExchangeAdviceInput): ExchangeAdvice | null {
    if (hand1.length !== 2 || hand2.length !== 2) return null;

    const h1c1 = hand1[0];
    const h1c2 = hand1[1];
    const h2c1 = hand2[0];
    const h2c2 = hand2[1];

    const origH1 = [h1c1, h1c2];
    const origH2 = [h2c1, h2c2];

    const switchH1 = [h1c1, h2c2];
    const switchH2 = [h2c1, h1c2];

    const dealerNorm = normalizeRank(dealerUpcard);

    const evOrig1 = getHandEV(origH1, dealerNorm, false);
    const evOrig2 = getHandEV(origH2, dealerNorm, false);
    const totalOrigEV = evOrig1 + evOrig2;

    const evSwtch1 = getHandEV(switchH1, dealerNorm, true);
    const evSwtch2 = getHandEV(switchH2, dealerNorm, true);
    const totalSwtchEV = evSwtch1 + evSwtch2;

    const h1Val = calculateHandValue(origH1);
    const h2Val = calculateHandValue(origH2);
    const s1Val = calculateHandValue(switchH1);
    const s2Val = calculateHandValue(switchH2);

    const oSummary = [`${h1Val.total}${h1Val.isSoft}`, `${h2Val.total}${h2Val.isSoft}`].sort().join('|');
    const sSummary = [`${s1Val.total}${s1Val.isSoft}`, `${s2Val.total}${s2Val.isSoft}`].sort().join('|');
    const isRedundant = oSummary === sSummary;

    if (engine === 'cindy_basic') {
        return buildBasicSwitchAdvice(origH1, origH2, switchH1, switchH2, dealerNorm, totalOrigEV, totalSwtchEV, isRedundant);
    }

    if (engine === 'arnold_snyder') {
        return buildSnyderSwitchAdvice(origH1, origH2, switchH1, switchH2, dealerNorm, totalOrigEV, totalSwtchEV, isRedundant);
    }

    return buildAdvancedSwitchAdvice(origH1, origH2, switchH1, switchH2, dealerNorm, totalOrigEV, totalSwtchEV, isRedundant);
}
