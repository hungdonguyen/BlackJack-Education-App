import type { SwitchAdviceEngine } from '@/utils/exchangeSwitchAdvice';

export type SwitchSubTabId = 'cindy_basic' | 'cindy_advanced' | 'arnold_snyder';

export interface SwitchSubTabItem {
    id: SwitchSubTabId;
    label: string;
}

export interface EVTableEntry {
    hand: string;
    ev: string;
    notes: string;
}

export interface SwitchSystemDetailedContent {
    id: SwitchAdviceEngine;
    title: string;
    philosophy: string;
    corePrinciples: { title: string; content: string; }[];
    detailedRules: {
        category: string;
        rules: string[];
    }[];
    evTable?: EVTableEntry[];
    evSource?: string;
    advantages: string[];
    disadvantages: string[];
    idealPlayerProfile: string;
    exampleScenarios: SwitchExampleCase[];
}

export type ExampleAction = 'SWITCH' | 'STAND PAT';

export interface ExampleCardToken {
    rank: 'A' | 'K' | 'Q' | 'J' | '10' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';
    suit: 'S' | 'H' | 'D' | 'C';
}

export interface SwitchExampleCase {
    title: string;
    dealerUpcard: string;
    handA: ExampleCardToken[];
    handB: ExampleCardToken[];
    switchedA: ExampleCardToken[];
    switchedB: ExampleCardToken[];
    action: ExampleAction;
    insight: string;
}

export const SWITCH_TAB_HEADER = {
    eyebrow: 'Exchange Switching Strategies',
    leadTemplate: '{roomName} features three distinct switch strategies.',
    subLead: 'Explore the methodology, deep rules, and practical examples of each approach to find what suits your playstyle best.',
} as const;

export const SWITCH_SUB_TABS: SwitchSubTabItem[] = [
    { id: 'cindy_basic', label: 'Cindy Liu Basic' },
    { id: 'cindy_advanced', label: 'Cindy Liu Advanced' },
    { id: 'arnold_snyder', label: 'Arnold Snyder' },
];

export const SYSTEM_DETAILS: Record<SwitchSubTabId, SwitchSystemDetailedContent> = {
    cindy_basic: {
        id: 'cindy_basic',
        title: 'Cindy Liu Basic Strategy',
        philosophy: 'Mastering Cindy Liu\'s Simple Switching Strategy requires memorizing a strict {c}Hand Power Ranking{/c} and understanding two core philosophies: {a}"Balance"{/a} and {e}"Maximize"{/e}. Your strategy shifts entirely depending on the {r}dealer\'s upcard threat level{/r}.',
        corePrinciples: [
            { title: '{c}Strict Power Rankings{/c}', content: 'Every decision revolves around building hands from the strict 9-tier Power Ranking. Unlisted combinations are {r}"Trash"{/r}.' },
            { title: '{a}Balance vs Maximize{/a}', content: 'Upgrade your {a}WEAKEST{/a} hand to survive vs a dealer 7-8. Sacrifice everything to build one {e}STRONGEST{/e} hand vs a 2-6 or 9-A.' },
            { title: '{r}The "Trash" Bailout{/r}', content: 'When given disastrous cards, systematically prioritize making a 7/17, a splittable pair, a 12, or a 13, in that exact order.' }
        ],
        detailedRules: [
            {
                category: 'Step 1: The Power Rankings',
                rules: [
                    '{e}Rank 1{/e}: 21 (Natural or Hard/Soft 21)',
                    '{e}Rank 2{/e}: 20',
                    '{c}Rank 3{/c}: 19',
                    '{c}Rank 4{/c}: A,A (Extremely powerful to split)',
                    '{a}Rank 5{/a}: 11 (Ready to double down)',
                    '{a}Rank 6{/a}: 10',
                    '{a}Rank 7{/a}: 9',
                    '{r}Rank 8{/r}: 18 or 8',
                    '{r}Rank 9{/r}: Pair of 8s (Only ranked if Dealer shows 2 through 8. Against a 9, 10, or A, treat it as unranked {r}Trash 16{/r}).',
                    '{r}Unranked{/r}: Anything else is strictly viewed as {r}"Trash"{/r}.'
                ]
            },
            {
                category: 'Step 2: Analysis & Execution',
                rules: [
                    'Target {a}BALANCE (Dealer 7 or 8){/a}: Switch ONLY if it elevates your {e}WEAKEST{/e} hand to a higher Power Rank (e.g., from Trash to Rank 8). It\'s acceptable if your strongest hand drops a rank (e.g., Rank 2 to 3) as long as the weakest improves.',
                    'Target {e}MAXIMIZE (Dealer 2-6, or 9-A){/e}: Switch ONLY if it elevates your {e}STRONGEST{/e} hand to a higher Power Rank (e.g., from Rank 3 to Rank 2). Do this even if it means destroying your other hand into Trash.',
                    '{c}Universal Rule: The Free Upgrade{/c}. Always switch if it improves the Power Rank of one hand without lowering the Power Rank of the other.'
                ]
            },
            {
                category: 'Step 3: The "Trash" Exception',
                rules: [
                    '{r}If completely unlucky{/r} and both pat and switched configurations yield ZERO ranked hands:',
                    '{a}1st Priority{/a}: Create a 7 or 17 (17 can still push or win on a dealer bust).',
                    '{a}2nd Priority{/a}: Build any splittable pair according to Basic Strategy (e.g., creating 2,2 vs a dealer 5).',
                    '{a}3rd Priority{/a}: Structure a 12 (Better than 13-16 as it\'s harder to bust with one draw).',
                    '{a}4th Priority{/a}: Structure a 13.'
                ]
            }
        ],
        advantages: [
            'Removes all ambiguity by assigning {c}rigid power levels{/c} to specific hand totals.',
            'Clearly dictates when to be selfish with one hand ({e}Maximize{/e}) versus protective of both ({a}Balance{/a}).',
            'Features an explicit {r}"bailout" protocol{/r} when dealt disastrous cards.'
        ],
        disadvantages: [
            'Requires strict memorization of the {a}9-tier list{/a} and bailout priorities.',
            'Sometimes ignores minor {r}mathematical edges{/r} in favor of rigid rank upgrades.'
        ],
        idealPlayerProfile: 'Players who prefer {c}categorizing and sorting options mentally{/c} rather than calculating fluid Expected Value (EV) margins. Perfect for {e}fast-paced play{/e}.',
        exampleScenarios: [
            {
                title: 'Maximize Target vs Weak Dealer',
                dealerUpcard: '6',
                handA: [{ rank: '10', suit: 'S' }, { rank: '7', suit: 'D' }], // 17 (Trash)
                handB: [{ rank: '9', suit: 'H' }, { rank: '8', suit: 'C' }], // 17 (Trash)
                switchedA: [{ rank: '10', suit: 'S' }, { rank: '8', suit: 'C' }], // 18 (Rank 8)
                switchedB: [{ rank: '9', suit: 'H' }, { rank: '7', suit: 'D' }], // 16 (Trash)
                action: 'SWITCH',
                insight: 'Against a 6, we play to {e}MAXIMIZE{/e}. The dealt hands are both "Trash" (17s). By switching, we upgrade our {c}strongest potential hand{/c} to an 18 (Rank 8), leaving the other as a 16 (Trash to stand on). The rule mandates prioritizing the strongest hand.'
            },
            {
                title: 'Balance Target vs Dealer 8',
                dealerUpcard: '8',
                handA: [{ rank: '10', suit: 'S' }, { rank: '10', suit: 'H' }], // 20 (Rank 2)
                handB: [{ rank: '9', suit: 'D' }, { rank: '9', suit: 'C' }], // 18 (Rank 8)
                switchedA: [{ rank: '10', suit: 'S' }, { rank: '9', suit: 'C' }], // 19 (Rank 3)
                switchedB: [{ rank: '9', suit: 'D' }, { rank: '10', suit: 'H' }], // 19 (Rank 3)
                action: 'SWITCH',
                insight: "Against an 8, we play to {a}BALANCE{/a}. The dealt hands have a Rank 2 and a Rank 8. By switching, we upgrade our {c}weakest hand{/c} from Rank 8 to Rank 3. Even though we sacrificed our Rank 2 hand down to a Rank 3, the {e}overall survivability{/e} of both hands against the dealer's 8 is significantly improved."
            },
            {
                title: 'Balance Enforcement (Rejecting a 20)',
                dealerUpcard: '7',
                handA: [{ rank: '10', suit: 'S' }, { rank: '9', suit: 'H' }], // 19 (Rank 3)
                handB: [{ rank: '8', suit: 'D' }, { rank: '10', suit: 'C' }], // 18 (Rank 8)
                switchedA: [{ rank: '10', suit: 'S' }, { rank: '10', suit: 'C' }], // 20 (Rank 2)
                switchedB: [{ rank: '8', suit: 'D' }, { rank: '9', suit: 'H' }], // 17 (Trash)
                action: 'STAND PAT',
                insight: 'Against a 7, our primary dictate is {a}BALANCE{/a}. Switching creates an alluring 20 (Rank 2), but simultaneously collapses our other hand from a Rank 8 into a {r}Trash 17{/r}. The Balance rule strictly forbids sacrificing your weakest hand against a 7, so we comfortably stand pat on our 19 and 18.'
            },
            {
                title: 'The "Trash" Bailout',
                dealerUpcard: '10',
                handA: [{ rank: '10', suit: 'S' }, { rank: '5', suit: 'D' }], // 15 (Trash)
                handB: [{ rank: '9', suit: 'C' }, { rank: '7', suit: 'H' }], // 16 (Trash)
                switchedA: [{ rank: '10', suit: 'S' }, { rank: '7', suit: 'H' }], // 17 (Bailout #1)
                switchedB: [{ rank: '9', suit: 'C' }, { rank: '5', suit: 'D' }], // 14 (Trash)
                action: 'SWITCH',
                insight: 'When all dealt and switched combinations yield unranked {r}"Trash"{/r}, we trigger the Bailout Protocol. Switching replaces two worst-case stiffs (15 and 16) by salvaging a 17 (Bailout Priority #1). While 17 is weak, it secures a vital chance to push against a dealer 17 or win on a bust.'
            }
        ]
    },
    cindy_advanced: {
        id: 'cindy_advanced',
        title: 'Cindy Liu Advanced Strategy',
        philosophy: 'The Advanced strategy builds directly on the Basic Power Rankings but introduces {e}Expected Value (EV){/e} math and situational {r}Dealer Vulnerability{/r} to squeeze out every drop of theoretical edge. It transitions from rigid rules to {c}fluid margin calculations{/c}.',
        corePrinciples: [
            { title: '{e}EV Margins First{/e}', content: 'Switches are executed ONLY if precisely calculated Expected Value mathematically validates superiority over standing by a specific safety margin.' },
            { title: '{a}Dynamic Risk Focus{/a}', content: 'Risk tolerance shifts fluidly based on exact dealer upcard weakness rather than generalizing them into rough dealer groupings.' },
            { title: '{c}Advanced Pair Equity{/c}', content: 'Heavily prioritizes the creation of splittable pair structures capable of multiplicative EV swings in deep card shoes.' }
        ],
        detailedRules: [
            {
                category: 'Mathematical Overrides',
                rules: [
                    '{e}EV Validation{/e}: Calculate total EV(Dealt) and EV(Switched). Only switch if EV(Switched) > EV(Dealt) {e}+ 0.05{/e}.',
                    '{a}Stiff Hand Optimization{/a}: Will aggressively break a weak made hand (like Hard 17) against a weak dealer (4-6) if the switch creates a high-value double-down (11) and a manageable stiff.',
                    '{r}The Double Penalty{/r}: Switching into a marginal stiff hand (15/16) is penalized in EV calculations unless paired with a Rank 1 or Rank 2 hand.'
                ]
            },
            {
                category: 'Situational Nuance',
                rules: [
                    'Against Dealer {r}9, 10, Ace{/r}: EV margins required to switch tighten drastically ({c}+0.10 EV required{/c}). Survival is prioritized.',
                    'Dealer {e}3-6 Weaknesses{/e}: Will take higher variance risks to create splittable 2s, 3s, 7s, and 9s, unlike the basic strategy which mostly focuses on Aces and 8s.'
                ]
            }
        ],
        evTable: [
            { hand: 'Blackjack (Natural 21)', ev: '+1.50 EV', notes: 'Guaranteed 3:2 payout (unless matching). Highest absolute value.' },
            { hand: 'Made 21 (3+ cards)', ev: '+1.00 EV', notes: 'Guaranteed win unless dealer also makes 21. Cannot lose.' },
            { hand: 'Soft 21 (A,10)', ev: '+0.88 EV', notes: 'If dealt as a swappable configuration, highly dominant.' },
            { hand: 'Hard 20', ev: '+0.78 EV', notes: 'Incredibly strong standing hand. Win roughly ~80% of the time.' },
            { hand: 'Hand 11 (Doubling)', ev: '+0.65 EV', notes: 'Huge double-down potential. High priority target against dealer 2-6.' },
            { hand: 'Soft 19 & 20', ev: '+0.40 EV to +0.65 EV', notes: 'Excellent hands. Sometimes doubled vs weak dealers, otherwise standing.' },
            { hand: 'Pair of A,A', ev: '+0.55 EV', notes: 'Splitting Aces is massively profitable against almost all dealer cards.' },
            { hand: 'Hard 19', ev: '+0.48 EV', notes: 'Strong standing hand. Wins consistently against weak dealer upcards.' },
            { hand: 'Hand 10 (Doubling)', ev: '+0.45 EV', notes: 'Secondary double target. Requires slightly better dealer vulnerability.' },
            { hand: 'Pair of 8,8', ev: '+0.42 EV', notes: 'Splitting 8s turns a terrible 16 into a profitable offensive move.' },
            { hand: 'Hard 18', ev: '+0.15 EV', notes: 'Marginally positive. Vulnerable to Dealer 9, 10, A but strong vs stiffs.' },
            { hand: 'Hard 4 to 8', ev: '-0.05 EV to +0.10 EV', notes: 'Neutral starting hands. Dependent on next card, rarely the focus of a switch.' },
            { hand: 'Hard 17', ev: '-0.15 EV', notes: 'Negative EV but standing is better than drawing. Will lose to dealer 18+.' },
            { hand: 'Hard 12 & 13', ev: '-0.25 EV', notes: 'Weak stiffs. Expected to lose, but slightly better than 14-16 math-wise.' },
            { hand: 'Hard 14 & 15', ev: '-0.40 EV', notes: 'Terrible stiff hands. Frequently bust on draw or lose to dealer standing.' },
            { hand: 'Hard 16', ev: '-0.52 EV', notes: 'The worst hand in Blackjack. Losing expectation is over 50%.' },
            { hand: 'Other Soft Hands (13-18)', ev: 'Variable EV', notes: 'Deeply negative if forced to stand, but positive if doubling against a 5 or 6.' },
            { hand: 'Other Pairs (2s-7s, 9s)', ev: 'Variable EV', notes: 'Situationally profitable to split vs bust cards, otherwise treated as Hard totals.' }
        ],
        evSource: '* Analytical baselines sourced and adapted from Wizard of Odds Blackjack Switch Expected Value tables (Based on 6 Decks, Dealer Hits Soft 17).',
        advantages: [
            'Provides the {e}highest theoretical return (RTP){/e} and the lowest house edge of the three strategies.',
            'Adaptable to complex, {c}non-standard situations{/c} and varying dealer strengths.',
            '{a}Mathematically proves{/a} every decision, protecting against intuitively obvious but mathematically flawed switches.'
        ],
        disadvantages: [
            '{r}Extremely difficult{/r} to execute perfectly without software assistance or intense EV memorization.',
            'Decision making can be {c}slow and mentally taxing{/c} under time limits.'
        ],
        idealPlayerProfile: 'Advanced players, card counters, {c}math-oriented strategists{/c}, and those aiming for the {e}absolute minimum house edge{/e} using the Advisor.',
        exampleScenarios: [
            {
                title: 'EV Over Intrusion (Advanced Math)',
                dealerUpcard: '10',
                handA: [{ rank: '8', suit: 'S' }, { rank: '6', suit: 'H' }], // 14 (Trash)
                handB: [{ rank: '5', suit: 'D' }, { rank: '8', suit: 'C' }], // 13 (Trash)
                switchedA: [{ rank: '8', suit: 'S' }, { rank: '8', suit: 'C' }], // Pair 8s
                switchedB: [{ rank: '5', suit: 'D' }, { rank: '6', suit: 'H' }], // 11 (Rank 5)
                action: 'SWITCH',
                insight: 'While facing a scary 10, converting two stiffs (14, 13) into an 11 (Double Down) and an 8,8 (Split) yields a {e}massive mathematically positive EV swing{/e}, despite the {r}high volatility{/r} of acting twice against a 10.'
            },
            {
                title: 'Sacrificing a Weak Made Hand for Growth',
                dealerUpcard: '6',
                handA: [{ rank: '10', suit: 'S' }, { rank: '7', suit: 'D' }], // Hard 17 (-0.15 EV)
                handB: [{ rank: '7', suit: 'H' }, { rank: '8', suit: 'C' }], // 15 (-0.40 EV)
                switchedA: [{ rank: '10', suit: 'S' }, { rank: '8', suit: 'C' }], // 18 (+0.15 EV)
                switchedB: [{ rank: '7', suit: 'H' }, { rank: '7', suit: 'D' }], // Pair 7s (Variable +EV)
                action: 'SWITCH',
                insight: 'Basic players hate breaking a 17. The Advanced Engine calculates breaking this 17 (-0.15 EV) into an 18 (+0.15 EV) while simultaneously transforming a dead stiff 15 into a highly profitable splittable Pair of 7s against a weak 6. It\'s a {e}pure EV-driven masterpiece{/e}.'
            },
            {
                title: 'The Double Penalty (Refusing a Switch)',
                dealerUpcard: '10',
                handA: [{ rank: '10', suit: 'S' }, { rank: '5', suit: 'D' }], // 15
                handB: [{ rank: '10', suit: 'H' }, { rank: '6', suit: 'C' }], // 16
                switchedA: [{ rank: '10', suit: 'S' }, { rank: '6', suit: 'C' }], // 16
                switchedB: [{ rank: '10', suit: 'H' }, { rank: '5', suit: 'D' }], // 15
                action: 'STAND PAT',
                insight: 'Switching two terrible stiffs simply creates two different terrible stiffs. The Advanced Strategy recognizes no mathematical EV threshold (+0.05 minimum) has been met. It strictly applies the {r}Double Penalty{/r} rule, advising you to Stand Pat and surrender to fate rather than hoping a symmetrical shift changes the math.'
            }
        ]
    },
    arnold_snyder: {
        id: 'arnold_snyder',
        title: 'Arnold Snyder Strategy',
        philosophy: 'A highly {c}conservative{/c}, {a}risk-averse{/a} profile designed around edge-protection and {e}variance reduction{/e}. It assumes the dealer always has a 10 in the hole. It {r}strictly refuses{/r} to break made hands of high value to chase marginal math advantages.',
        corePrinciples: [
            { title: '{c}Protect the Fortress{/c}', content: 'Never, under any circumstances, dismantle an existing premium made hand (Hard 18, 19, 20, 21).' },
            { title: '{r}Pessimistic Evaluation{/r}', content: 'Assume the dealer ALWAYS has a 10 in the hole. Switches are only approved if they survive this worst-case assumption.' },
            { title: '{e}Variance Mitigation{/e}', content: 'Favor stable, low-variance drawing hands over aggressive splitting tactics to preserve bankroll and survive long sessions.' }
        ],
        detailedRules: [
            {
                category: 'Strict Prohibitions',
                rules: [
                    '{r}NEVER switch{/r} if Hand A or Hand B is currently an 18, 19, 20, or 21.',
                    'Do not switch to create splits against a dealer {r}9, 10, or Ace{/r}.',
                    'Avoid switches that result in {r}two stiff hands (12-16){/r} against a dealer 7 or higher.'
                ]
            },
            {
                category: 'Conservative Triggers',
                rules: [
                    'Only switch to create a Blackjack {e}IF{/e} it does not ruin a made hand.',
                    'Switch to create an 11 {e}ONLY{/e} against a dealer 2 through 6.',
                    'When facing a dealer bust card, prioritize making {c}one hand a guaranteed lock (18+){/c} rather than two mediocre hands.'
                ]
            }
        ],
        advantages: [
            'Significantly reduces bankroll swings and {e}volatility{/e} (Lower Standard Deviation).',
            '{c}Very safe approach{/c} when playing with a limited bankroll or attempting to clear bonus wagering requirements.',
            'Easy to identify the {r}"do not switch"{/r} scenarios quickly.'
        ],
        disadvantages: [
            'Sacrifices a measurable amount of {a}overall EV{/a} by ignoring profitable but volatile situations.',
            'Can lead to {r}frustrating missed opportunities{/r} for large payouts.'
        ],
        idealPlayerProfile: '{c}Conservative players{/c}, those with smaller bankrolls, players deeply concerned with variance, and those optimizing for {e}time-at-table{/e} rather than maximum profit.',
        exampleScenarios: [
            {
                title: 'The Ultimate Conservative Stand (Refusing a Blackjack)',
                dealerUpcard: '10',
                handA: [{ rank: '8', suit: 'S' }, { rank: '10', suit: 'H' }], // 18 
                handB: [{ rank: 'A', suit: 'D' }, { rank: '5', suit: 'C' }], // Soft 16 
                switchedA: [{ rank: '8', suit: 'S' }, { rank: '5', suit: 'C' }], // 13 
                switchedB: [{ rank: 'A', suit: 'D' }, { rank: '10', suit: 'H' }], // Blackjack 
                action: 'STAND PAT',
                insight: 'Advanced EV Math (+1.47 EV swing) and the Cindy Liu strategies would eagerly break the 18 to secure a guaranteed Blackjack. However, Snyder\'s cardinal rule is {r}NEVER break a made hand of 18 or higher{/r}. Facing a scary 10, he stubbornly protects his 18, completely refusing a massive mathematical advantage just to avoid the variance of drawing on a 13.'
            },
            {
                title: 'Variance Mitigation (Rejecting a Split)',
                dealerUpcard: '7',
                handA: [{ rank: '8', suit: 'S' }, { rank: '10', suit: 'C' }], // 18 
                handB: [{ rank: '9', suit: 'D' }, { rank: '8', suit: 'H' }], // 17 
                switchedA: [{ rank: '8', suit: 'S' }, { rank: '8', suit: 'H' }], // Pair 8s
                switchedB: [{ rank: '9', suit: 'D' }, { rank: '10', suit: 'C' }], // 19
                action: 'STAND PAT',
                insight: 'Most players would jump at the chance to create an 8,8 split and a 19. Snyder {r}strictly refuses{/r}. He assumes the dealer has a 10 (making 17). By standing pat, he has two hands (18 and 17) that already win or push against a 17. Splitting 8s introduces massive {e}Variance{/e}—he would rather lock in safety than gamble more money on a split board.'
            }
        ]
    }
};
