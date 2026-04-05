import { StateCreator } from 'zustand';
import { GameStore, DailyClaimSlice } from '@/types/game';
import {
  DAILY_CLAIM_BASE_REWARD,
  DAILY_CLAIM_STREAK_MILESTONES,
  getDailyClaimMilestoneBonus,
} from '@/utils/dailyClaimConfig';

const HOUR_MS = 60 * 60 * 1000;
const MYSTERY_COOLDOWN_MS = 30 * 60 * 1000;

const toHourStart = (ts: number): number => {
  const d = new Date(ts);
  d.setMinutes(0, 0, 0);
  return d.getTime();
};

type MysteryTier = {
  min: number;
  max: number;
  weight: number;
};

const MYSTERY_TIERS: MysteryTier[] = [
  { min: 1, max: 100, weight: 0.4 },
  { min: 101, max: 300, weight: 0.5 },
  { min: 301, max: 600, weight: 0.6 },
  { min: 601, max: 900, weight: 0.8 },
  { min: 901, max: 999, weight: 1.0 },
  { min: 1000, max: 1100, weight: 5.2 },
  { min: 1101, max: 1200, weight: 5.2 },
  { min: 1201, max: 1300, weight: 5.2 },
  { min: 1301, max: 1400, weight: 5.2 },
  { min: 1401, max: 1500, weight: 5.2 },
  { min: 1501, max: 1600, weight: 5.2 },
  { min: 1601, max: 1700, weight: 5.2 },
  { min: 1701, max: 1800, weight: 5.2 },
  { min: 1801, max: 1900, weight: 5.2 },
  { min: 1901, max: 2000, weight: 5.2 },
  { min: 2001, max: 2100, weight: 5.2 },
  { min: 2101, max: 2200, weight: 5.2 },
  { min: 2201, max: 2300, weight: 5.2 },
  { min: 2301, max: 2400, weight: 5.2 },
  { min: 2401, max: 2500, weight: 5.2 },
  { min: 2501, max: 2600, weight: 5.2 },
  { min: 2601, max: 2700, weight: 5.2 },
  { min: 2701, max: 2800, weight: 5.2 },
  { min: 2801, max: 2900, weight: 5.2 },
  { min: 2901, max: 3000, weight: 5.2 },
  { min: 3001, max: 5000, weight: 1.4 },
  { min: 5001, max: 10000, weight: 0.8 },
  { min: 10001, max: 25000, weight: 0.35 },
  { min: 25001, max: 50000, weight: 0.2 },
  { min: 50001, max: 100000, weight: 0.08 },
  { min: 100001, max: 200000, weight: 0.03 },
];

const rollByTier = (tier: MysteryTier): number => {
  return Math.floor(Math.random() * (tier.max - tier.min + 1)) + tier.min;
};

const rollMysteryReward = (): number => {
  const totalWeight = MYSTERY_TIERS.reduce((acc, tier) => acc + tier.weight, 0);
  const threshold = Math.random() * totalWeight;
  let cumulative = 0;

  for (const tier of MYSTERY_TIERS) {
    cumulative += tier.weight;
    if (threshold <= cumulative) return rollByTier(tier);
  }

  return rollByTier(MYSTERY_TIERS[MYSTERY_TIERS.length - 1]);
};

const withClaimPopup = (amount: number) => ({
  claimPopupAmount: amount,
  claimPopupNonce: Date.now(),
});

export const createDailyClaimSlice: StateCreator<
  GameStore,
  [['zustand/persist', unknown]],
  [],
  DailyClaimSlice
> = (set, get) => ({
  lastDailyClaim: 0,
  dailyClaimStreak: 0,
  dailyClaimCount: 0,
  totalBetSinceLastClaim: 0,
  insuranceClaimsToday: 0,
  lastInsuranceReset: 0,
  totalClaimedAmount: 0,
  mysteryClaimCount: 0,
  lastMysteryClaimAt: 0,
  lastMysteryReward: 0,
  claimPopupAmount: 0,
  claimPopupNonce: 0,
  claimedTutorialRewards: {},

  claimDaily: () => {
    return get().claimTimedReward();
  },

  clearClaimPopup: () => {
    set({ claimPopupAmount: 0 });
  },

  claimTimedReward: () => {
    const state = get();
    const now = Date.now();
    const currentHourStart = toHourStart(now);
    const lastClaimHour = state.lastDailyClaim > 0 ? toHourStart(state.lastDailyClaim) : 0;
    const maxStreakMilestone = DAILY_CLAIM_STREAK_MILESTONES[DAILY_CLAIM_STREAK_MILESTONES.length - 1] ?? 50;

    if (lastClaimHour === currentHourStart) return 0;

    const effectiveCurrentStreak = state.dailyClaimStreak >= maxStreakMilestone ? 0 : Math.max(0, state.dailyClaimStreak);
    const nextStreak = effectiveCurrentStreak + 1;
    const milestoneBonus = getDailyClaimMilestoneBonus(nextStreak);
    const claimAmount = DAILY_CLAIM_BASE_REWARD + milestoneBonus;
    const shouldResetStreak = nextStreak >= maxStreakMilestone;

    set((s) => ({
      bankroll: s.bankroll + claimAmount,
      totalClaimedAmount: s.totalClaimedAmount + claimAmount,
      lastDailyClaim: now,
      dailyClaimStreak: shouldResetStreak ? 0 : nextStreak,
      dailyClaimCount: s.dailyClaimCount + 1,
      ...withClaimPopup(claimAmount),
    }));
    
    get().syncAchievements();
    return claimAmount;
  },

  claimMysteryReward: () => {
    const state = get();
    const now = Date.now();
    if (now - state.lastMysteryClaimAt < MYSTERY_COOLDOWN_MS) return 0;

    const claimAmount = rollMysteryReward();

    set((s) => ({
      bankroll: s.bankroll + claimAmount,
      totalClaimedAmount: s.totalClaimedAmount + claimAmount,
      mysteryClaimCount: s.mysteryClaimCount + 1,
      lastMysteryClaimAt: now,
      lastMysteryReward: claimAmount,
      ...withClaimPopup(claimAmount),
    }));

    return claimAmount;
  },

  claimRebate: () => {
    const state = get();
    const rebateAmount = Math.floor((state.totalBetSinceLastClaim || 0) * 0.02);
    if (rebateAmount < 10) return 0;

    set((s) => ({
      bankroll: s.bankroll + rebateAmount,
      totalClaimedAmount: s.totalClaimedAmount + rebateAmount,
      totalBetSinceLastClaim: 0,
      ...withClaimPopup(rebateAmount),
    }));

    return rebateAmount;
  },

  claimInsurance: () => {
    const state = get();
    const now = Date.now();

    let insuranceClaimsToday = state.insuranceClaimsToday;
    const lastInsuranceReset = state.lastInsuranceReset;

    if (now - lastInsuranceReset > 24 * 60 * 60 * 1000) {
      insuranceClaimsToday = 0;
    }

    if (insuranceClaimsToday >= 5) return 0;
    if (state.bankroll >= 10) return 0;

    const claimAmount = 1000;
    const newLastInsuranceReset = insuranceClaimsToday === 0 ? now : lastInsuranceReset;

    set((s) => ({
      bankroll: s.bankroll + claimAmount,
      totalClaimedAmount: s.totalClaimedAmount + claimAmount,
      insuranceClaimsToday: insuranceClaimsToday + 1,
      lastInsuranceReset: newLastInsuranceReset,
      ...withClaimPopup(claimAmount),
    }));

    return claimAmount;
  },

  claimTutorialProgressReward: () => {
    const state = get();
    const completedTutorials = state.completedTutorials || {};
    const claimedTutorialRewards = state.claimedTutorialRewards || {};

    const pendingTutorialIds = Object.entries(completedTutorials)
      .filter(([roomId, completed]) => completed && roomId.startsWith('tutorial_'))
      .map(([roomId]) => roomId)
      .filter((roomId) => !claimedTutorialRewards[roomId]);

    if (pendingTutorialIds.length === 0) return 0;

    const claimAmount = pendingTutorialIds.length * 10000;

    set((s) => {
      const nextClaimedTutorialRewards = { ...s.claimedTutorialRewards };
      pendingTutorialIds.forEach((roomId) => {
        nextClaimedTutorialRewards[roomId] = true;
      });

      return {
        bankroll: s.bankroll + claimAmount,
        totalClaimedAmount: s.totalClaimedAmount + claimAmount,
        claimedTutorialRewards: nextClaimedTutorialRewards,
        ...withClaimPopup(claimAmount),
      };
    });

    return claimAmount;
  },
});
