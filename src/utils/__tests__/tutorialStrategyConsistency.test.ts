import { describe, expect, it } from 'vitest';
import { Card, Suit } from '@/types/game';
import { Rank } from '@/types/enums';
import { getStrategyAction } from '../strategyAdvisor';
import {
    BEGINNER_TUTORIAL_LESSONS,
    DOUBLE_TUTORIAL_LESSONS,
    STRATEGY_TUTORIAL_LESSONS,
    COUNTING_TUTORIAL_LESSONS,
    PAIR_SPLITTING_TUTORIAL_LESSONS,
    MULTI_HAND_TUTORIAL_LESSONS,
    FREE_ACTION_TUTORIAL_LESSONS,
    ZAPOUT_TUTORIAL_LESSONS,
    EXCHANGE_TUTORIAL_LESSONS,
    FIRECARD_TUTORIAL_LESSONS,
    MADNESS_TUTORIAL_LESSONS,
    IBERIAN_TUTORIAL_LESSONS,
    EUROPEAN_TUTORIAL_LESSONS,
    UK_TUTORIAL_LESSONS,
    TutorialLesson,
} from '@/utils/tutorials';

type TutorialPack = {
    id: string;
    strategyType: string;
    lessons: TutorialLesson[];
    skipDynamicDeviation?: boolean;
};

const PACKS: TutorialPack[] = [
    { id: 'tutorial_beginner', strategyType: 'standard', lessons: BEGINNER_TUTORIAL_LESSONS },
    { id: 'tutorial_double', strategyType: 'standard', lessons: DOUBLE_TUTORIAL_LESSONS },
    { id: 'tutorial_strategy', strategyType: 'standard', lessons: STRATEGY_TUTORIAL_LESSONS },
    { id: 'tutorial_counting', strategyType: 'vegas_downtown', lessons: COUNTING_TUTORIAL_LESSONS, skipDynamicDeviation: true },
    { id: 'tutorial_splitting', strategyType: 'standard', lessons: PAIR_SPLITTING_TUTORIAL_LESSONS },
    { id: 'tutorial_multihand', strategyType: 'standard', lessons: MULTI_HAND_TUTORIAL_LESSONS },
    { id: 'tutorial_free_action', strategyType: 'free_action', lessons: FREE_ACTION_TUTORIAL_LESSONS },
    { id: 'tutorial_zapout', strategyType: 'zapout_21', lessons: ZAPOUT_TUTORIAL_LESSONS },
    { id: 'tutorial_exchange', strategyType: 'exchange_21', lessons: EXCHANGE_TUTORIAL_LESSONS },
    { id: 'tutorial_firecard', strategyType: 'firecard_21', lessons: FIRECARD_TUTORIAL_LESSONS },
    { id: 'tutorial_madness', strategyType: 'madness_21', lessons: MADNESS_TUTORIAL_LESSONS },
    { id: 'tutorial_iberian', strategyType: 'iberian_21', lessons: IBERIAN_TUTORIAL_LESSONS, skipDynamicDeviation: true },
    { id: 'tutorial_european', strategyType: 'european', lessons: EUROPEAN_TUTORIAL_LESSONS },
    { id: 'tutorial_uk', strategyType: 'uk', lessons: UK_TUTORIAL_LESSONS },
];

const dealerRegex = /(?:vs|against)\s+(?:the\s+)?dealer(?:'s)?\s*(ace|a|10|[2-9])/i;
const hardRegex = /hard\s*(\d{1,2})/i;
const softRegex = /soft\s*(\d{1,2})/i;
const haveRegex = /you\s+have\s+(\d{1,2})/i;
const pairRegex = /pair\s+of\s+([2-9]|10|aces|a)/i;

function parseDealerUp(message: string): string | null {
    const match = message.match(dealerRegex);
    if (!match) return null;
    const raw = match[1].toUpperCase();
    if (raw === 'ACE' || raw === 'A') return 'A';
    return raw;
}

function parsePairRank(message: string): string | null {
    const match = message.match(pairRegex);
    if (!match) return null;
    const raw = match[1].toUpperCase();
    return raw === 'ACES' || raw === 'A' ? 'A' : raw;
}

function rankToEnum(rank: string): Rank {
    if (rank === 'A') return Rank.ACE;
    if (rank === '10') return Rank.TEN;
    return rank as Rank;
}

function buildCardsFromMessage(message: string): { cards: Card[]; total: number; isSoft: boolean } | null {
    const pairRank = parsePairRank(message);
    if (pairRank) {
        const value = pairRank === 'A' ? 11 : Number(pairRank);
        return {
            cards: [
                { rank: rankToEnum(pairRank), suit: Suit.SPADES, value, isHidden: false },
                { rank: rankToEnum(pairRank), suit: Suit.HEARTS, value, isHidden: false },
            ],
            total: pairRank === 'A' ? 12 : value * 2,
            isSoft: pairRank === 'A',
        };
    }

    const soft = message.match(softRegex);
    if (soft) {
        const total = Number(soft[1]);
        const second = Math.max(total - 11, 2);
        return {
            cards: [
                { rank: Rank.ACE, suit: Suit.SPADES, value: 11, isHidden: false },
                { rank: rankToEnum(String(second)), suit: Suit.HEARTS, value: second, isHidden: false },
            ],
            total,
            isSoft: true,
        };
    }

    const hard = message.match(hardRegex) ?? message.match(haveRegex);
    if (!hard) return null;

    const total = Number(hard[1]);
    if (Number.isNaN(total) || total < 2 || total > 21) return null;

    if (total <= 11) {
        let first = Math.max(2, Math.floor(total / 2));
        let second = total - first;
        if (first === second) {
            first = Math.max(2, first - 1);
            second = total - first;
        }
        return {
            cards: [
                { rank: rankToEnum(String(first)), suit: Suit.SPADES, value: first, isHidden: false },
                { rank: rankToEnum(String(second)), suit: Suit.HEARTS, value: second, isHidden: false },
            ],
            total,
            isSoft: false,
        };
    }

    const second = total - 10;
    return {
        cards: [
            { rank: Rank.TEN, suit: Suit.SPADES, value: 10, isHidden: false },
            { rank: rankToEnum(String(second)), suit: Suit.HEARTS, value: second, isHidden: false },
        ],
        total,
        isSoft: false,
    };
}

function shouldSkipByMessage(message: string): boolean {
    const lowered = message.toLowerCase();
    return lowered.includes('true count') || lowered.includes('deviation') || lowered.includes('illustrious 18');
}

function mapTargetToAllowedActions(targetElementId: string): string[] {
    switch (targetElementId) {
        case 'action-hit': return ['H'];
        case 'action-stand': return ['S'];
        case 'action-double': return ['D', 'FD'];
        case 'action-split': return ['SP', 'FSP'];
        case 'action-zapout': return ['Z'];
        case 'action-burn': return ['B'];
        case 'action-surrender': return ['SU', 'R'];
        default: return [];
    }
}

type ExplicitScenario = {
    packId: string;
    round: number;
    stepId: number;
    total: number;
    isSoft: boolean;
    dealerUp: string;
    expectedTarget: string;
    pairRank?: string;
    cardCount?: 1 | 2;
    cards?: Card[];
};

function buildScenarioCards(scenario: ExplicitScenario): Card[] {
    if (scenario.cards) {
        return scenario.cards;
    }

    if (scenario.pairRank) {
        const value = scenario.pairRank === 'A' ? 11 : Number(scenario.pairRank);
        return [
            { rank: rankToEnum(scenario.pairRank), suit: Suit.SPADES, value, isHidden: false },
            { rank: rankToEnum(scenario.pairRank), suit: Suit.HEARTS, value, isHidden: false },
        ];
    }

    if (scenario.cardCount === 1) {
        return [{ rank: rankToEnum(String(scenario.total)), suit: Suit.SPADES, value: scenario.total, isHidden: false }];
    }

    const parsed = buildCardsFromMessage(`hard ${scenario.total} vs dealer ${scenario.dealerUp}`);
    if (!parsed) throw new Error(`Unable to build cards for total ${scenario.total}`);
    if (scenario.isSoft) {
        const second = Math.max(scenario.total - 11, 2);
        return [
            { rank: Rank.ACE, suit: Suit.SPADES, value: 11, isHidden: false },
            { rank: rankToEnum(String(second)), suit: Suit.HEARTS, value: second, isHidden: false },
        ];
    }
    return parsed.cards;
}

const EXPLICIT_SCENARIOS: ExplicitScenario[] = [
    { packId: 'tutorial_beginner', round: 0, stepId: 4, total: 16, isSoft: false, dealerUp: '10', expectedTarget: 'action-hit' },
    { packId: 'tutorial_beginner', round: 1, stepId: 3, total: 18, isSoft: false, dealerUp: '10', expectedTarget: 'action-stand' },
    { packId: 'tutorial_double', round: 0, stepId: 5, total: 11, isSoft: false, dealerUp: '6', expectedTarget: 'action-double' },
    { packId: 'tutorial_double', round: 1, stepId: 4, total: 10, isSoft: false, dealerUp: '9', expectedTarget: 'action-double' },
    { packId: 'tutorial_double', round: 2, stepId: 4, total: 11, isSoft: false, dealerUp: '10', expectedTarget: 'action-double' },
    { packId: 'tutorial_double', round: 3, stepId: 4, total: 17, isSoft: true, dealerUp: '5', expectedTarget: 'action-double' },
    { packId: 'tutorial_strategy', round: 0, stepId: 9, total: 16, isSoft: false, dealerUp: '5', expectedTarget: 'action-stand' },
    { packId: 'tutorial_strategy', round: 1, stepId: 5, total: 16, isSoft: false, dealerUp: '7', expectedTarget: 'action-hit' },
    { packId: 'tutorial_strategy', round: 3, stepId: 5, total: 18, isSoft: true, dealerUp: '9', expectedTarget: 'action-hit' },
    { packId: 'tutorial_counting', round: 0, stepId: 6, total: 20, isSoft: false, dealerUp: '4', expectedTarget: 'action-stand' },
    { packId: 'tutorial_counting', round: 2, stepId: 5, total: 12, isSoft: false, dealerUp: '4', expectedTarget: 'action-stand' },
    { packId: 'tutorial_free_action', round: 1, stepId: 4, total: 11, isSoft: false, dealerUp: '9', expectedTarget: 'action-double' },
    { packId: 'tutorial_zapout', round: 0, stepId: 4, total: 16, isSoft: false, dealerUp: '10', expectedTarget: 'action-zapout' },
    { packId: 'tutorial_exchange', round: 1, stepId: 6, total: 10, isSoft: false, dealerUp: '10', expectedTarget: 'action-hit' },
    { packId: 'tutorial_firecard', round: 1, stepId: 4, total: 16, isSoft: false, dealerUp: '10', expectedTarget: 'action-burn' },
    {
        packId: 'tutorial_firecard',
        round: 2,
        stepId: 4,
        total: 20,
        isSoft: true,
        dealerUp: '9',
        expectedTarget: 'action-burn',
        cards: [
            { rank: Rank.NINE, suit: Suit.HEARTS, value: 9, isHidden: false },
            { rank: Rank.ACE, suit: Suit.SPADES, value: 11, isHidden: false },
        ],
    },
    { packId: 'tutorial_madness', round: 0, stepId: 4, total: 11, isSoft: false, dealerUp: '6', expectedTarget: 'action-double', cardCount: 1 },
    { packId: 'tutorial_iberian', round: 0, stepId: 4, total: 11, isSoft: false, dealerUp: '10', expectedTarget: 'action-double' },
    { packId: 'tutorial_european', round: 1, stepId: 5, total: 11, isSoft: false, dealerUp: 'A', expectedTarget: 'action-hit' },
    { packId: 'tutorial_uk', round: 1, stepId: 4, total: 18, isSoft: true, dealerUp: '6', expectedTarget: 'action-double' },
    { packId: 'tutorial_uk', round: 0, stepId: 4, total: 16, isSoft: false, dealerUp: '10', expectedTarget: 'action-split', pairRank: '8' },
];

describe('Tutorial strategy consistency', () => {
    it('validates explicit key scenarios across all tutorial rooms', () => {
        for (const scenario of EXPLICIT_SCENARIOS) {
            const pack = PACKS.find((item) => item.id === scenario.packId);
            expect(pack, `Missing tutorial pack: ${scenario.packId}`).toBeDefined();
            if (!pack) continue;

            const lesson = pack.lessons[scenario.round];
            expect(lesson, `Missing round ${scenario.round} in ${scenario.packId}`).toBeDefined();
            if (!lesson) continue;

            const step = lesson.steps.find((s) => s.id === scenario.stepId);
            expect(step, `Missing step ${scenario.stepId} in ${scenario.packId} / ${lesson.title}`).toBeDefined();
            if (!step) continue;

            expect(step.targetElementId, `${scenario.packId} / ${lesson.title} step ${scenario.stepId}`).toBe(scenario.expectedTarget);

            const cards = buildScenarioCards(scenario);
            const allowed = mapTargetToAllowedActions(scenario.expectedTarget);
            const canSplit = cards.length === 2 && cards[0].value === cards[1].value;

            const action = getStrategyAction(
                cards,
                scenario.total,
                scenario.isSoft,
                scenario.dealerUp,
                pack.strategyType,
                true,
                canSplit,
                true,
                { resolveConditions: true, canZap: true, canBurn: true }
            );

            if (!allowed.includes(action)) {
                throw new Error(
                    `${scenario.packId} round ${scenario.round} step ${scenario.stepId} expected target ${scenario.expectedTarget} but table action is ${action}`
                );
            }
        }
    });

    it('keeps parsed action prompts aligned with strategy tables', () => {
        const mismatches: string[] = [];
        let checked = 0;

        for (const pack of PACKS) {
            for (const lesson of pack.lessons) {
                for (const step of lesson.steps) {
                    const target = step.targetElementId;
                    if (!target || !target.startsWith('action-')) continue;
                    if (pack.skipDynamicDeviation && shouldSkipByMessage(step.message)) continue;

                    const allowed = mapTargetToAllowedActions(target);
                    if (allowed.length === 0) continue;

                    const dealerUp = parseDealerUp(step.message);
                    if (!dealerUp) continue;

                    const parsed = buildCardsFromMessage(step.message);
                    if (!parsed) continue;

                    const canSplit = parsed.cards.length === 2 && parsed.cards[0].value === parsed.cards[1].value;
                    const canDouble = true;
                    const canSurrender = true;

                    const action = getStrategyAction(
                        parsed.cards,
                        parsed.total,
                        parsed.isSoft,
                        dealerUp,
                        pack.strategyType,
                        canDouble,
                        canSplit,
                        canSurrender,
                        { resolveConditions: true, canZap: true, canBurn: true }
                    );

                    checked += 1;
                    if (!allowed.includes(action)) {
                        mismatches.push(
                            `${pack.id} :: ${lesson.title} :: step ${step.id} :: target ${target} :: parsed ${parsed.isSoft ? 'soft' : 'hard'} ${parsed.total} vs ${dealerUp} :: table ${action}`
                        );
                    }
                }
            }
        }

        expect(checked).toBeGreaterThan(8);
        expect(mismatches).toEqual([]);
    });
});
