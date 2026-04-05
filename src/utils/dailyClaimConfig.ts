export const DAILY_CLAIM_BASE_REWARD = 1000;

export const DAILY_CLAIM_MILESTONE_BONUS: Record<number, number> = {
  3: 2000,
  10: 10000,
  25: 25000,
  50: 50000,
  65: 100000,
};

export const DAILY_CLAIM_STREAK_MILESTONES = Object.keys(DAILY_CLAIM_MILESTONE_BONUS)
  .map((k) => parseInt(k, 10))
  .sort((a, b) => a - b);

export const getDailyClaimMilestoneBonus = (streak: number): number => {
  return DAILY_CLAIM_MILESTONE_BONUS[streak] ?? 0;
};
