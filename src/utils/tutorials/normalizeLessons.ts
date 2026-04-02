import { GamePhase } from '@/types/enums';
import { TutorialLesson } from './types';
import { getTutorialProfile } from './profiles';

const INTRO_BY_ROOM: Record<string, string> = {
    tutorial_beginner: 'Core rule: beat dealer without busting, blackjack pays 3:2, and all actions follow the classic strategy tables.',
    tutorial_double: 'Core rule: Double Down adds one extra wager, takes exactly one card, then the hand is locked.',
    tutorial_strategy: 'Core rule: this module follows the Hard, Soft, and Pairs charts exactly as defined in strategy tables.',
    tutorial_counting: 'Core rule: use Hi-Lo running count and true count, while base actions still start from strategy tables.',
    tutorial_splitting: 'Core rule: pair decisions follow the pairs table first, then room restrictions for split handling.',
    tutorial_multihand: 'Core rule: each seat is resolved independently, but every decision still follows the same strategy table logic.',
    tutorial_free_action: 'Core rule: free double and free split are available, but dealer 22 pushes non-blackjack hands.',
    tutorial_zapout: 'Core rule: one Zap Out per hand can replace both cards, and dealer 22 pushes non-blackjack hands.',
    tutorial_exchange: 'Core rule: two hands are played together, one switch is allowed, and each resulting hand follows strategy tables.',
    tutorial_firecard: 'Core rule: Burn replaces only the second card for a fee, and strategy decisions follow Fire Card table actions.',
    tutorial_madness: 'Core rule: hands start from one card, double can repeat, and dealer 22 pushes non-blackjack hands.',
    tutorial_iberian: 'Core rule: Spanish deck without 10 spots, rescue options apply after doubles, and special cases come from Iberian tables.',
    tutorial_european: 'Core rule: ENHC (no hole card), restricted doubles, and European hard-soft-pairs charts must be respected.',
    tutorial_uk: 'Core rule: ENHC plus OBO protection, with UK-specific split and double permissions from strategy tables.'
};

function hasExplicitIntro(lesson: TutorialLesson): boolean {
    const firstStep = lesson.steps[0];
    if (!firstStep) return false;
    return firstStep.requiresClick === true && firstStep.position === 'center' && !firstStep.targetElementId;
}

function normalizeRuleSummary(summary: string): string {
    return summary.replace(/^core\s*rule\s*:\s*/i, '').trim();
}

function buildIntroMessage(roomId: string, lessonTitle: string): string {
    const profile = getTutorialProfile(roomId);
    const roomIntro = INTRO_BY_ROOM[roomId] || 'Core rule: follow the room rules and strategy tables for every action.';
    const roomRuleSummary = normalizeRuleSummary(roomIntro);
    const toneLead = profile.tone === 'gentle'
        ? 'We will go step by step and keep it easy to follow.'
        : profile.tone === 'coach'
            ? 'We will move with game pace and focus on clean habits.'
            : 'We will focus on precision, edge cases, and discipline.';
    return `Welcome to "${lessonTitle}" (${profile.level}). ${toneLead} Rule focus: ${roomRuleSummary}`;
}

export function normalizeTutorialLessons(roomId: string, lessons: TutorialLesson[]): TutorialLesson[] {
    const normalized = lessons.map((lesson, lessonIndex) => {
        const shouldInjectIntro = lessonIndex === 0;
        const hasIntro = hasExplicitIntro(lesson);
        const introMessage = buildIntroMessage(roomId, lesson.title);

        const introStep = {
            id: -1,
            message: introMessage,
            condition: (state: { gamePhase: GamePhase }) => state.gamePhase === GamePhase.BETTING,
            position: 'center' as const,
            requiresClick: true,
        };

        const nextSteps = shouldInjectIntro
            ? (hasIntro
                ? lesson.steps.map((step, index) => {
                    if (index !== 0) return step;
                    return {
                        ...step,
                        message: introMessage,
                    };
                })
                : [introStep, ...lesson.steps])
            : lesson.steps;

        return {
            ...lesson,
            steps: nextSteps.map((step, index) => ({
                ...step,
                id: index,
            })),
        };
    });

    return normalized;
}
