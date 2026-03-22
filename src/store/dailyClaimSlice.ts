import { StateCreator } from 'zustand';
import { GameStore, DailyClaimSlice } from '@/types/game';

export const createDailyClaimSlice: StateCreator<
  GameStore,
  [['zustand/persist', unknown]],
  [],
  DailyClaimSlice
> = (set, get) => ({
  lastDailyClaim: 0,
  dailyClaimCount: 0,
  totalBetSinceLastClaim: 0,
  insuranceClaimsToday: 0,
  lastInsuranceReset: 0,
  totalClaimedAmount: 0,

  claimDaily: () => {
    return get().claimTimedReward();
  },

  claimTimedReward: () => {
    const state = get();
    const now = Date.now();
    const THIRTY_MIN = 30 * 60 * 1000;
    if (now - state.lastDailyClaim < THIRTY_MIN) return 0;

    const isBonusClaim = (state.dailyClaimCount + 1) % 3 === 0;
    const claimAmount = isBonusClaim ? 1000 : 500;

    set((s) => ({
      bankroll: s.bankroll + claimAmount,
      totalClaimedAmount: s.totalClaimedAmount + claimAmount,
      lastDailyClaim: now,
      dailyClaimCount: s.dailyClaimCount + 1,
    }));
    
    if ('syncAchievements' in get()) {
      (get() as any).syncAchievements();
    }
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
    }));

    return rebateAmount;
  },

  claimInsurance: () => {
    const state = get();
    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;
    
    let insuranceClaimsToday = state.insuranceClaimsToday;
    let lastInsuranceReset = state.lastInsuranceReset;

    if (now - lastInsuranceReset > DAY_MS) {
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
    }));

    return claimAmount;
  },
});
