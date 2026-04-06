import { useState, useEffect } from 'react';
import { useGameStore, useStoreHydration } from '@/hooks/useGameStore';

export function useHasClaimableRewards() {
  const isHydrated = useStoreHydration();
  const bankroll = useGameStore((s) => s.bankroll);
  const lastDailyClaim = useGameStore((s) => s.lastDailyClaim);
  const lastMysteryClaimAt = useGameStore((s) => s.lastMysteryClaimAt);
  const totalBetSinceLastClaim = useGameStore((s) => s.totalBetSinceLastClaim);
  const insuranceClaimsToday = useGameStore((s) => s.insuranceClaimsToday);
  const lastInsuranceReset = useGameStore((s) => s.lastInsuranceReset);
  const claimedTutorialRewards = useGameStore((s) => s.claimedTutorialRewards);
  const completedTutorials = useGameStore((s) => s.completedTutorials);

  const [hasClaimable, setHasClaimable] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;

    const checkClaimable = () => {
      const now = Date.now();
      
      // Hourly Claim logic
      const toHourStart = (ts: number) => {
        const d = new Date(ts);
        d.setMinutes(0, 0, 0);
        return d.getTime();
      };
      const currentHourStart = toHourStart(now);
      const lastClaimHour = lastDailyClaim > 0 ? toHourStart(lastDailyClaim) : 0;
      const hourlyReady = lastClaimHour !== currentHourStart;

      // Mystery Box logic
      const elapsedMystery = now - lastMysteryClaimAt;
      const mysteryReady = lastMysteryClaimAt === 0 || elapsedMystery >= 30 * 60 * 1000;

      // Rebate logic
      const currentRebateAmount = Math.floor((totalBetSinceLastClaim || 0) * 0.02);
      const canClaimRebate = currentRebateAmount >= 10;

      // Insurance logic
      const elapsedIns = now - lastInsuranceReset;
      const isInsuranceWindowActive = (insuranceClaimsToday > 0 && elapsedIns < 24 * 60 * 60 * 1000);
      const actualInsuranceClaims = isInsuranceWindowActive ? insuranceClaimsToday : 0;
      const canClaimInsurance = bankroll < 10 && actualInsuranceClaims < 5;

      // Tutorial logic
      const completedTutorialIds = Object.entries(completedTutorials || {})
        .filter(([roomId, completed]) => completed && roomId.startsWith('tutorial_'))
        .map(([roomId]) => roomId);
      const pendingTutorialIds = completedTutorialIds.filter((id) => !claimedTutorialRewards?.[id]);
      const canClaimTutorial = pendingTutorialIds.length > 0;

      setHasClaimable(
        hourlyReady || mysteryReady || canClaimRebate || canClaimInsurance || canClaimTutorial
      );
    };

    checkClaimable();
    const interval = setInterval(checkClaimable, 1000);
    return () => clearInterval(interval);
  }, [
    isHydrated,
    lastDailyClaim,
    lastMysteryClaimAt,
    totalBetSinceLastClaim,
    insuranceClaimsToday,
    lastInsuranceReset,
    bankroll,
    completedTutorials,
    claimedTutorialRewards
  ]);

  return hasClaimable;
}
