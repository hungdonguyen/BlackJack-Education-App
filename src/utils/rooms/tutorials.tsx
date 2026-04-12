import React from 'react';
import { BookOpen, Ticket, Brain, Zap, ArrowLeftRight, Flame, Sparkles, Globe, ShieldAlert } from 'lucide-react';
import { ClassicRules } from '@/rules/ClassicRules';
import { VegasDowntownRules } from '@/rules/VegasDowntownRules';
import { FreeActionRules } from '@/rules/FreeActionRules';
import { ZapOut21Rules } from '@/rules/ZapOut21Rules';
import { Exchange21Rules } from '@/rules/Exchange21Rules';
import { FireCardRules } from '@/rules/FireCardRules';
import { InfinityDoubleDownRules } from '@/rules/InfinityDoubleDownRules';
import { Iberian21Rules } from '@/rules/Iberian21Rules';
import { EuropeanRules } from '@/rules/EuropeanRules';
import { UKRules } from '@/rules/UKRules';
import { RoomConfig } from './types';
import { freeAction as roomFreeAction } from './freeAction';
import { zapout as roomZapout } from './zapout';
import { exchange as roomExchange } from './exchange';
import { firecard as roomFirecard } from './firecard';
import { infinity_double_down as roomInfinityDoubleDown } from './infinity_double_down';
import { iberian21 as roomIberian21 } from './iberian21';
import { european as roomEuropean } from './european';
import { uk as roomUk } from './uk';
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
    UK_TUTORIAL_LESSONS
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

export const tutorialFreeAction: RoomConfig = {
    id: 'tutorial_free_action',
    name: 'Free Action',
    subtitle: 'Free Bet Mechanics',
    description: 'Learn to exploit the free double down and free split rules, and understand the Push 22 caveat.',
    feltGradient: 'radial-gradient(ellipse 90% 85% at 50% 60%, #064e3b 0%, #065f46 25%, #047857 50%, #065f46 80%, #022c22 100%)',
    bgGradient: 'radial-gradient(ellipse 120% 100% at 50% 40%, #022c22 0%, #064e3b 50%, #022c22 100%)',
    borderColor: 'rgba(52, 211, 153, 0.4)',
    rules: roomFreeAction.rules,
    gameRules: roomFreeAction.gameRules,
    blackjackMultiplier: roomFreeAction.blackjackMultiplier,
    betRange: [100, 100],
    rtp: 'Tutorial',
    icon: <Sparkles className="w-5 h-5 drop-shadow-md text-emerald-400" />,
    accentColor: '#10b981',
    isTutorial: true,
    logoPath: '/images/logo/rooms/freeaction.png',
    strategyType: 'free_action',
    deviationsSet: 'free_action',
    rulesClass: FreeActionRules,
    tutorialLessons: FREE_ACTION_TUTORIAL_LESSONS,
    strategyModalContent: roomFreeAction.strategyModalContent,
    strategyTableManual: roomFreeAction.strategyTableManual
};

export const tutorialZapout: RoomConfig = {
    id: 'tutorial_zapout',
    name: 'Zapout 21',
    subtitle: 'Escape Bad Hands',
    description: 'Master the Zapout mechanic to discard dreadful hands without losing your bet.',
    feltGradient: 'radial-gradient(ellipse 90% 85% at 50% 60%, #1e3a8a 0%, #1e40af 25%, #1d4ed8 50%, #1e40af 80%, #172554 100%)',
    bgGradient: 'radial-gradient(ellipse 120% 100% at 50% 40%, #172554 0%, #1e3a8a 50%, #172554 100%)',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    rules: roomZapout.rules,
    gameRules: roomZapout.gameRules,
    blackjackMultiplier: roomZapout.blackjackMultiplier,
    betRange: [100, 100],
    rtp: 'Tutorial',
    icon: <Zap className="w-5 h-5 drop-shadow-md text-blue-400" />,
    accentColor: '#3b82f6',
    isTutorial: true,
    logoPath: '/images/logo/rooms/zapout21.png',
    strategyType: 'zapout_21',
    deviationsSet: 'zapout_21',
    rulesClass: ZapOut21Rules,
    tutorialLessons: ZAPOUT_TUTORIAL_LESSONS,
    strategyModalContent: roomZapout.strategyModalContent,
    strategyTableManual: roomZapout.strategyTableManual
};

export const tutorialExchange: RoomConfig = {
    id: 'tutorial_exchange',
    name: 'Exchange 21',
    subtitle: 'Strategic Switching',
    description: 'Learn to switch cards between hands to turn a pair of losers into powerful winning hands.',
    feltGradient: 'radial-gradient(ellipse 90% 85% at 50% 60%, #475569 0%, #334155 25%, #1e293b 50%, #0f172a 80%, #020617 100%)',
    bgGradient: 'radial-gradient(ellipse 120% 100% at 50% 40%, #020617 0%, #334155 50%, #020617 100%)',
    borderColor: 'rgba(148, 163, 184, 0.4)',
    rules: roomExchange.rules,
    gameRules: roomExchange.gameRules,
    blackjackMultiplier: roomExchange.blackjackMultiplier,
    betRange: [100, 100],
    rtp: 'Tutorial',
    icon: <ArrowLeftRight className="w-5 h-5 drop-shadow-md text-slate-400" />,
    accentColor: '#94a3b8',
    isTutorial: true,
    logoPath: '/images/logo/rooms/exchange21.png',
    strategyType: 'exchange_21',
    deviationsSet: 'exchange_21',
    rulesClass: Exchange21Rules,
    tutorialLessons: EXCHANGE_TUTORIAL_LESSONS,
    strategyModalContent: roomExchange.strategyModalContent,
    strategyTableManual: roomExchange.strategyTableManual
};

export const tutorialFirecard: RoomConfig = {
    id: 'tutorial_firecard',
    name: 'Firecard 21',
    subtitle: 'Burn the Upcard',
    description: 'Learn when it is mathematically correct to burn the dealer\'s dangerous upcard.',
    feltGradient: 'radial-gradient(ellipse 90% 85% at 50% 60%, #7c2d12 0%, #9a3412 25%, #c2410c 50%, #9a3412 80%, #431407 100%)',
    bgGradient: 'radial-gradient(ellipse 120% 100% at 50% 40%, #431407 0%, #9a3412 50%, #431407 100%)',
    borderColor: 'rgba(249, 115, 22, 0.4)',
    rules: roomFirecard.rules,
    gameRules: roomFirecard.gameRules,
    blackjackMultiplier: roomFirecard.blackjackMultiplier,
    betRange: [100, 100],
    rtp: 'Tutorial',
    icon: <Flame className="w-5 h-5 drop-shadow-md text-orange-400" />,
    accentColor: '#f97316',
    isTutorial: true,
    logoPath: '/images/logo/rooms/firecard21.png',
    strategyType: 'firecard_21',
    deviationsSet: 'firecard_21',
    rulesClass: FireCardRules,
    tutorialLessons: FIRECARD_TUTORIAL_LESSONS,
    strategyModalContent: roomFirecard.strategyModalContent,
    strategyTableManual: roomFirecard.strategyTableManual
};

export const tutorialInfinityDoubleDown: RoomConfig = {
    id: 'tutorial_infinity_double_down',
    name: 'InfinityDoubleDown 21',
    subtitle: 'Infinite Options',
    description: 'Double Down on any number of cards, suited blackjacks pay 2:1, and beware the Push 22 rule.',
    feltGradient: 'radial-gradient(ellipse 90% 85% at 50% 60%, #831843 0%, #9d174d 25%, #be185d 50%, #9d174d 80%, #4c0519 100%)',
    bgGradient: 'radial-gradient(ellipse 120% 100% at 50% 40%, #4c0519 0%, #9d174d 50%, #4c0519 100%)',
    borderColor: 'rgba(244, 63, 94, 0.4)',
    rules: roomInfinityDoubleDown.rules,
    gameRules: roomInfinityDoubleDown.gameRules,
    blackjackMultiplier: roomInfinityDoubleDown.blackjackMultiplier,
    betRange: [100, 100],
    rtp: 'Tutorial',
    icon: <Zap className="w-5 h-5 drop-shadow-md text-rose-400" />,
    accentColor: '#f43f5e',
    hasSideBet: false,
    isTutorial: true,
    logoPath: '/images/logo/rooms/infinity_double_down.png',
    strategyType: 'infinity_double_down',
    deviationsSet: 'infinity_double_down',
    rulesClass: InfinityDoubleDownRules,
    tutorialLessons: MADNESS_TUTORIAL_LESSONS,
    strategyModalContent: roomInfinityDoubleDown.strategyModalContent,
    strategyTableManual: roomInfinityDoubleDown.strategyTableManual,
    strategySource: roomInfinityDoubleDown.strategySource
};

export const tutorialIberian: RoomConfig = {
    id: 'tutorial_iberian',
    name: 'Iberian 21',
    subtitle: 'No Tens, More Bonuses',
    description: 'Play with a 48-card deck lacking 10s, utilizing Double Descues and bonus combinations.',
    feltGradient: 'radial-gradient(ellipse 90% 85% at 50% 60%, #14532d 0%, #166534 25%, #15803d 50%, #166534 80%, #052e16 100%)',
    bgGradient: 'radial-gradient(ellipse 120% 100% at 50% 40%, #052e16 0%, #166534 50%, #052e16 100%)',
    borderColor: 'rgba(34, 197, 94, 0.4)',
    rules: roomIberian21.rules,
    gameRules: roomIberian21.gameRules,
    blackjackMultiplier: roomIberian21.blackjackMultiplier,
    betRange: [100, 100],
    rtp: 'Tutorial',
    icon: <Globe className="w-5 h-5 drop-shadow-md text-green-400" />,
    accentColor: '#22c55e',
    isTutorial: true,
    logoPath: '/images/logo/rooms/iberian21.png',
    strategyType: 'iberian_21',
    deviationsSet: 'iberian_21',
    rulesClass: Iberian21Rules,
    tutorialLessons: IBERIAN_TUTORIAL_LESSONS,
    strategyModalContent: roomIberian21.strategyModalContent,
    strategyTableManual: roomIberian21.strategyTableManual
};

export const tutorialEuropean: RoomConfig = {
    id: 'tutorial_european',
    name: 'European',
    subtitle: 'No Hole Card (ENHC)',
    description: 'Navigate the extreme rules of European Blackjack: ENHC and heavily restricted doubles.',
    feltGradient: 'radial-gradient(ellipse 90% 85% at 50% 60%, #1e3a8a 0%, #1e40af 25%, #2563eb 50%, #1e40af 80%, #172554 100%)',
    bgGradient: 'radial-gradient(ellipse 120% 100% at 50% 40%, #172554 0%, #1e40af 50%, #172554 100%)',
    borderColor: 'rgba(96, 165, 250, 0.4)',
    rules: roomEuropean.rules,
    gameRules: roomEuropean.gameRules,
    blackjackMultiplier: roomEuropean.blackjackMultiplier,
    betRange: [100, 100],
    rtp: 'Tutorial',
    icon: <ShieldAlert className="w-5 h-5 drop-shadow-md text-blue-400" />,
    accentColor: '#60a5fa',
    isTutorial: true,
    logoPath: '/images/logo/rooms/european.png',
    strategyType: 'european',
    deviationsSet: 'european',
    rulesClass: EuropeanRules,
    tutorialLessons: EUROPEAN_TUTORIAL_LESSONS,
    strategyModalContent: roomEuropean.strategyModalContent,
    strategyTableManual: roomEuropean.strategyTableManual
};

export const tutorialUk: RoomConfig = {
    id: 'tutorial_uk',
    name: 'UK Rules',
    subtitle: 'OBO Protection',
    description: 'Learn the OBO (Original Bets Only) rule, which protects your splits and doubles against a dealer blackjack.',
    feltGradient: 'radial-gradient(ellipse 90% 85% at 50% 60%, #451a03 0%, #78350f 25%, #92400e 50%, #78350f 80%, #2e1008 100%)',
    bgGradient: 'radial-gradient(ellipse 120% 100% at 50% 40%, #2e1008 0%, #78350f 50%, #2e1008 100%)',
    borderColor: 'rgba(251, 146, 60, 0.4)',
    rules: roomUk.rules,
    gameRules: roomUk.gameRules,
    blackjackMultiplier: roomUk.blackjackMultiplier,
    betRange: [100, 100],
    rtp: 'Tutorial',
    icon: <ShieldAlert className="w-5 h-5 drop-shadow-md text-orange-400" />,
    accentColor: '#fb923c',
    isTutorial: true,
    logoPath: '/images/logo/rooms/uk_logo.png',
    strategyType: 'uk',
    deviationsSet: 'uk',
    rulesClass: UKRules,
    tutorialLessons: UK_TUTORIAL_LESSONS,
    strategyModalContent: roomUk.strategyModalContent,
    strategyTableManual: roomUk.strategyTableManual
};
