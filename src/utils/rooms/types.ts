import React from 'react';
import { IRules } from '@/rules/types';
import { TutorialLesson } from '../tutorialData';

export interface RuleHighlight {
    eyebrow: string;
    title: string;
    detail: string;
    tone?: 'accent' | 'good' | 'warn';
}

export interface RuleSectionData {
    title: string;
    items: string[];
}

export interface RoomRulesContent {
    overview: string;
    highlights: RuleHighlight[];
    playerOptions: RuleSectionData;
    payouts: RuleSectionData;
    dealerFlow: RuleSectionData;
    strategyNotes: RuleSectionData;
}

export interface StrategyTableContent {
    title: string;
    summary: string;
    bullets: string[];
}

export interface RoomConfig {
    id: string;
    name: string;
    subtitle: string;
    description: string;
    /** Table felt gradient */
    feltGradient: string;
    /** Ambient background gradient */
    bgGradient: string;
    /** Table border color */
    borderColor: string;
    /** Payout rules text */
    rules: {
        blackjackPays: string;
        insurancePays: string;
        dealerStands: string;
    };
    /** Engine rules for game logic */
    gameRules: {
        numberOfDecks: number;
        dealerHitsSoft17: boolean;
        allowSurrender: boolean;
        /** Fraction of shoe remaining when reshuffle triggers. Default: 0.25 */
        reshuffleThreshold?: number;
        /** If true, 10s are removed from the deck (Iberian 21 style) */
        omitTens?: boolean;
        /** If true, allows surrender after double down */
        allowDoubleDownRescue?: boolean;
        /** If true, allows hitting and doubling repeatedly after double down */
        allowInfiniteDouble?: boolean;
        /** European No Hole Card rule */
        enhc?: boolean;
        /** Number of initial cards dealt to the player. Default: 2 */
        playerInitialCards?: number;
    };
    /** Blackjack payout multiplier (e.g. 1.5 for 3:2) */
    blackjackMultiplier: number;
    /** Min/Max bet range */
    betRange: [number, number];
    /** Theoretical Return to Player % */
    rtp: string;
    /** Theoretical RTP for the base game only (without side bets) */
    baseGameRtp?: string;
    /** Theoretical RTP for the side bet */
    sideBetRtp?: string;
    /** Room icon component */
    icon: React.ReactNode;
    /** Accent color for UI elements */
    accentColor: string;
    /** Whether this room has a side bet */
    hasSideBet?: boolean;
    /** Type of side bet */
    sideBetType?: 'free_action' | 'push_22' | 'multi_action';
    /** Whether this room is a Free Action variant */
    isFreeAction?: boolean;
    /** Path to the room logo image */
    logoPath: string;
    /** Whether this is a tutorial room */
    isTutorial?: boolean;
    /** Whether this room is in beta */
    isBeta?: boolean;
    /** Strategy table type */
    strategyType: string;
    /** Deviation set for counting */
    deviationsSet: string;
    /** Rule engine class */
    rulesClass: new () => IRules;
    /** Tutorial lessons for this room */
    tutorialLessons?: TutorialLesson[];
    /** Rules content for Strategy Modal */
    strategyModalContent: RoomRulesContent;
    /** Strategy table manual content */
    strategyTableManual: {
        hard: StrategyTableContent;
        soft: StrategyTableContent;
        pairs?: StrategyTableContent;
    };
    /** Citation for the strategy source */
    strategySource?: string;
}
