import React from 'react';
import { BookOpen, Ticket, Brain } from 'lucide-react';
import { ClassicRules } from '@/rules/ClassicRules';
import { VegasDowntownRules } from '@/rules/VegasDowntownRules';
import { RoomConfig } from './types';
import { 
    BEGINNER_TUTORIAL_LESSONS, 
    DOUBLE_TUTORIAL_LESSONS, 
    STRATEGY_TUTORIAL_LESSONS,
    COUNTING_TUTORIAL_LESSONS,
    PAIR_SPLITTING_TUTORIAL_LESSONS,
    MULTI_HAND_TUTORIAL_LESSONS
} from '../tutorials';

export const tutorialBeginner: RoomConfig = {
    id: 'tutorial_beginner',
    name: 'Beginner Tutorial',
    subtitle: 'Learn the Basics',
    description: 'Complete this guided tutorial to learn how to place bets, when to hit or stand, and how to win against the dealer. Includes forced card sequences to demonstrate key logic.',
    feltGradient: 'radial-gradient(ellipse 90% 85% at 50% 60%, #1e1b4b 0%, #151433 25%, #0f1026 50%, #070817 80%, #02020a 100%)',
    bgGradient: 'radial-gradient(ellipse 120% 100% at 50% 40%, #0c0724 0%, #060312 50%, #020108 100%)',
    borderColor: 'rgba(99, 102, 241, 0.4)',
    rules: {
        blackjackPays: 'Blackjack Pays 3 to 2',
        insurancePays: 'Insurance Pays 2 to 1',
        dealerStands: 'Dealer stands on soft 17',
    },
    gameRules: {
        numberOfDecks: 6,
        dealerHitsSoft17: false,
        allowSurrender: false,
    },
    blackjackMultiplier: 1.5,
    betRange: [100, 100],
    rtp: 'Tutorial',
    icon: React.createElement(BookOpen, { className: "w-5 h-5 drop-shadow-md text-indigo-400" }),
    accentColor: '#6366f1',
    isTutorial: true,
    logoPath: '/images/logo/rooms/classic.png',
    strategyType: 'standard',
    deviationsSet: 'standard',
    rulesClass: ClassicRules,
    tutorialLessons: BEGINNER_TUTORIAL_LESSONS,
    strategyModalContent: {
        overview: "Learn the basics of Blackjack in this guided tutorial.",
        highlights: [
            { eyebrow: "Tutorial", title: "Beginner", detail: "Step-by-step guidance.", tone: 'accent' }
        ],
        playerOptions: { title: "Options", items: ["Hit", "Stand"] },
        payouts: { title: "Payouts", items: ["3:2 Blackjack"] },
        dealerFlow: { title: "Dealer", items: ["Stands on 17"] },
        strategyNotes: { title: "Note", items: ["Follow the instructions."] }
    },
    strategyTableManual: {
        hard: { title: "Hard", summary: "Tutorial Hard Strategy", bullets: ["Follow instructions"] },
        soft: { title: "Soft", summary: "Tutorial Soft Strategy", bullets: ["Follow instructions"] },
        pairs: { title: "Pairs", summary: "Tutorial Pairs Strategy", bullets: ["Follow instructions"] }
    }
};

export const tutorialDouble: RoomConfig = {
    id: 'tutorial_double',
    name: 'Double Down',
    subtitle: 'Risk & Reward',
    description: 'Learn the power of the Double Down. Double your bet when you have a strategic advantage to maximize your winnings.',
    feltGradient: 'radial-gradient(ellipse 90% 85% at 50% 60%, #064e3b 0%, #065f46 25%, #047857 50%, #065f46 80%, #022c22 100%)',
    bgGradient: 'radial-gradient(ellipse 120% 100% at 50% 40%, #022c22 0%, #064e3b 50%, #022c22 100%)',
    borderColor: 'rgba(52, 211, 153, 0.4)',
    rules: {
        blackjackPays: 'Blackjack Pays 3 to 2',
        insurancePays: 'Insurance Pays 2 to 1',
        dealerStands: 'Dealer stands on soft 17',
    },
    gameRules: {
        numberOfDecks: 6,
        dealerHitsSoft17: false,
        allowSurrender: false,
    },
    blackjackMultiplier: 1.5,
    betRange: [100, 100],
    rtp: 'Tutorial',
    icon: <Ticket className="w-5 h-5 drop-shadow-md text-emerald-400" />,
    accentColor: '#10b981',
    isTutorial: true,
    logoPath: '/images/logo/rooms/classic.png',
    strategyType: 'standard',
    deviationsSet: 'standard',
    rulesClass: ClassicRules,
    tutorialLessons: DOUBLE_TUTORIAL_LESSONS,
    strategyModalContent: {
        overview: "Learn when and how to Double Down.",
        highlights: [
            { eyebrow: "Tutorial", title: "Double Down", detail: "Double your bet for 1 card.", tone: 'accent' }
        ],
        playerOptions: { title: "Options", items: ["Double Down"] },
        payouts: { title: "Payouts", items: ["Standard Payouts"] },
        dealerFlow: { title: "Dealer", items: ["Stands on 17"] },
        strategyNotes: { title: "Note", items: ["Follow instructions."] }
    },
    strategyTableManual: {
        hard: { title: "Hard", summary: "Tutorial Hard Strategy", bullets: ["Follow instructions"] },
        soft: { title: "Soft", summary: "Tutorial Soft Strategy", bullets: ["Follow instructions"] },
        pairs: { title: "Pairs", summary: "Tutorial Pairs Strategy", bullets: ["Follow instructions"] }
    }
};

export const tutorialStrategy: RoomConfig = {
    id: 'tutorial_strategy',
    name: 'Basic Strategy',
    subtitle: 'Play like a Pro',
    description: 'Master the mathematically optimal moves for every hand. Learn when to Hit, Stand, Double, or Split to minimize the house edge.',
    feltGradient: 'radial-gradient(ellipse 90% 85% at 50% 60%, #312e81 0%, #3730a3 25%, #1e1b4b 50%, #1e1b4b 80%, #0f172a 100%)',
    bgGradient: 'radial-gradient(ellipse 120% 100% at 50% 40%, #1e1b4b 0%, #172554 50%, #0f172a 100%)',
    borderColor: 'rgba(99, 102, 241, 0.4)',
    rules: {
        blackjackPays: 'Blackjack Pays 3 to 2',
        insurancePays: 'Insurance Pays 2 to 1',
        dealerStands: 'Dealer stands on soft 17',
    },
    gameRules: {
        numberOfDecks: 6,
        dealerHitsSoft17: false,
        allowSurrender: false,
    },
    blackjackMultiplier: 1.5,
    betRange: [100, 100],
    rtp: 'Tutorial',
    icon: <BookOpen className="w-5 h-5 drop-shadow-md text-indigo-400" />,
    accentColor: '#6366f1',
    isTutorial: true,
    logoPath: '/images/logo/rooms/classic.png',
    strategyType: 'standard',
    deviationsSet: 'standard',
    rulesClass: ClassicRules,
    tutorialLessons: STRATEGY_TUTORIAL_LESSONS,
    strategyModalContent: {
        overview: "Learn the fundamentals of Basic Strategy.",
        highlights: [
            { eyebrow: "Tutorial", title: "Basic Strategy", detail: "Mathematical optimal play.", tone: 'accent' }
        ],
        playerOptions: { title: "Options", items: ["Standard Actions"] },
        payouts: { title: "Payouts", items: ["Standard Payouts"] },
        dealerFlow: { title: "Dealer", items: ["Stands on 17"] },
        strategyNotes: { title: "Note", items: ["Follow instructions."] }
    },
    strategyTableManual: {
        hard: { title: "Hard", summary: "Tutorial Hard Strategy", bullets: ["Follow instructions"] },
        soft: { title: "Soft", summary: "Tutorial Soft Strategy", bullets: ["Follow instructions"] },
        pairs: { title: "Pairs", summary: "Tutorial Pairs Strategy", bullets: ["Follow instructions"] }
    }
};

export const tutorialCounting: RoomConfig = {
    id: 'tutorial_counting',
    name: 'Card Counting',
    subtitle: 'Advanced Techniques',
    description: 'Master the Hi-Lo card counting system. Learn to track the running count, convert to a true count, and apply deviations to gain a mathematical edge over the house.',
    feltGradient: 'radial-gradient(ellipse 90% 85% at 50% 60%, #451a03 0%, #78350f 25%, #92400e 50%, #78350f 80%, #1c0a00 100%)',
    bgGradient: 'radial-gradient(ellipse 120% 100% at 50% 40%, #1c0a00 0%, #451a03 50%, #1c0a00 100%)',
    borderColor: 'rgba(251, 191, 36, 0.4)',
    rules: {
        blackjackPays: 'Blackjack Pays 3 to 2',
        insurancePays: 'Insurance Pays 2 to 1',
        dealerStands: 'Dealer hits soft 17',
    },
    gameRules: {
        numberOfDecks: 2,
        dealerHitsSoft17: true,
        allowSurrender: false,
    },
    blackjackMultiplier: 1.5,
    betRange: [100, 100],
    rtp: 'Tutorial',
    icon: React.createElement(Brain, { className: "w-5 h-5 drop-shadow-md text-amber-400" }),
    accentColor: '#f59e0b',
    isTutorial: true,
    logoPath: '/images/logo/rooms/vegas_downtown.png',
    strategyType: 'vegas_downtown',
    deviationsSet: 'standard',
    rulesClass: VegasDowntownRules,
    tutorialLessons: COUNTING_TUTORIAL_LESSONS,
    strategyModalContent: {
        overview: "Learn the fundamentals of Hi-Lo card counting.",
        highlights: [
            { eyebrow: "Tutorial", title: "Card Counting", detail: "Hi-Lo system, true count & deviations.", tone: 'accent' }
        ],
        playerOptions: { title: "Options", items: ["Standard Actions"] },
        payouts: { title: "Payouts", items: ["Standard Payouts"] },
        dealerFlow: { title: "Dealer", items: ["Stands on 17"] },
        strategyNotes: { title: "Note", items: ["Follow instructions."] }
    },
    strategyTableManual: {
        hard: { title: "Hard", summary: "Tutorial Hard Strategy", bullets: ["Follow instructions"] },
        soft: { title: "Soft", summary: "Tutorial Soft Strategy", bullets: ["Follow instructions"] },
        pairs: { title: "Pairs", summary: "Tutorial Pairs Strategy", bullets: ["Follow instructions"] }
    }
};

export const tutorialSplitting: RoomConfig = {
    id: 'tutorial_splitting',
    name: 'Playing with pair',
    subtitle: 'Split Smart, Win More',
    description: 'Master the golden rules of playing pairs. Know exactly when to split Aces & 8s, when to never split 10s or 5s, and how context changes the play for 9s.',
    feltGradient: 'radial-gradient(ellipse 90% 85% at 50% 60%, #2e1065 0%, #4c1d95 25%, #5b21b6 50%, #4c1d95 80%, #1a0050 100%)',
    bgGradient: 'radial-gradient(ellipse 120% 100% at 50% 40%, #1a0050 0%, #2e1065 50%, #0d0020 100%)',
    borderColor: 'rgba(167, 139, 250, 0.4)',
    rules: {
        blackjackPays: 'Blackjack Pays 3 to 2',
        insurancePays: 'Insurance Pays 2 to 1',
        dealerStands: 'Dealer stands on soft 17',
    },
    gameRules: {
        numberOfDecks: 6,
        dealerHitsSoft17: false,
        allowSurrender: false,
    },
    blackjackMultiplier: 1.5,
    betRange: [100, 100],
    rtp: 'Tutorial',
    icon: React.createElement(Brain, { className: "w-5 h-5 drop-shadow-md text-violet-400" }),
    accentColor: '#8b5cf6',
    isTutorial: true,
    logoPath: '/images/logo/rooms/classic.png',
    strategyType: 'standard',
    deviationsSet: 'standard',
    rulesClass: ClassicRules,
    tutorialLessons: PAIR_SPLITTING_TUTORIAL_LESSONS,
    strategyModalContent: {
        overview: "Master every rule for playing pairs in Blackjack.",
        highlights: [
            { eyebrow: "Tutorial", title: "Playing with pair", detail: "Always, Never, and Context rules.", tone: 'accent' }
        ],
        playerOptions: { title: "Options", items: ["Split", "Double", "Stand"] },
        payouts: { title: "Payouts", items: ["Standard Payouts"] },
        dealerFlow: { title: "Dealer", items: ["Stands on 17"] },
        strategyNotes: { title: "Note", items: ["Follow instructions."] }
    },
    strategyTableManual: {
        hard: { title: "Hard", summary: "Tutorial Hard Strategy", bullets: ["Follow instructions"] },
        soft: { title: "Soft", summary: "Tutorial Soft Strategy", bullets: ["Follow instructions"] },
        pairs: { title: "Pairs", summary: "Tutorial Pairs Strategy", bullets: ["Follow instructions"] }
    }
};

export const tutorialMultiHand: RoomConfig = {
    id: 'tutorial_multihand',
    name: 'Multi-Hand Play',
    subtitle: 'Expose the Trap',
    description: 'Learn how to play multiple hands simultaneously for bigger action and more excitement.',
    feltGradient: 'radial-gradient(ellipse 90% 85% at 50% 60%, #4c0519 0%, #881337 25%, #9f1239 50%, #881337 80%, #1f0009 100%)',
    bgGradient: 'radial-gradient(ellipse 120% 100% at 50% 40%, #1f0009 0%, #4c0519 50%, #0d0003 100%)',
    borderColor: 'rgba(251, 113, 133, 0.4)',
    rules: {
        blackjackPays: 'Blackjack Pays 3 to 2',
        insurancePays: 'Insurance Pays 2 to 1',
        dealerStands: 'Dealer stands on soft 17',
    },
    gameRules: {
        numberOfDecks: 6,
        dealerHitsSoft17: false,
        allowSurrender: false,
    },
    blackjackMultiplier: 1.5,
    betRange: [100, 100],
    rtp: 'Tutorial',
    icon: React.createElement(Brain, { className: "w-5 h-5 drop-shadow-md text-rose-400" }),
    accentColor: '#f43f5e',
    isTutorial: true,
    logoPath: '/images/logo/rooms/classic.png',
    strategyType: 'standard',
    deviationsSet: 'standard',
    rulesClass: ClassicRules,
    tutorialLessons: MULTI_HAND_TUTORIAL_LESSONS,
    strategyModalContent: {
        overview: "Learn to handle multiple seats at once.",
        highlights: [
            { eyebrow: "Tutorial", title: "Multi-Hand", detail: "Manage multiple hands and actions.", tone: 'accent' }
        ],
        playerOptions: { title: "Options", items: ["Bet Multiple", "Hit or Stand on each"] },
        payouts: { title: "Payouts", items: ["Plays like normal"] },
        dealerFlow: { title: "Dealer", items: ["Stands on 17"] },
        strategyNotes: { title: "Note", items: ["Follow instructions."] }
    },
    strategyTableManual: {
        hard: { title: "Hard", summary: "Tutorial Hard Strategy", bullets: ["Follow instructions"] },
        soft: { title: "Soft", summary: "Tutorial Soft Strategy", bullets: ["Follow instructions"] },
        pairs: { title: "Pairs", summary: "Tutorial Pairs Strategy", bullets: ["Follow instructions"] }
    }
};
