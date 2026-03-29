import { Card, TutorialStep, GameState } from '@/types/game';
import { Rank, Suit, GamePhase } from '@/types/enums';

export interface TutorialLesson {
    round: number;
    title: string;
    forcedCards: Card[];
    steps: TutorialStep[];
}
