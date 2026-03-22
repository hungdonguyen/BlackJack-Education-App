// ============================================
// Achievement Checker — Pure logic to detect newly earned achievements
// ============================================

import { MatchRecord } from '@/types/game';
import { HandStatus, Rank } from '@/types/enums';
import { AchievementProgress } from '@/types/achievements';
import { getRoomConfig } from '@/utils/rooms';

/**
 * Given the current progress state, the latest match record, and the full game state context,
 * returns a list of achievement IDs that should be newly unlocked.
 */
export function checkNewAchievements(
  unlocked: Record<string, number>,
  progress: AchievementProgress,
  match: MatchRecord,
  bankroll: number,
  dailyClaimCount: number,
): string[] {
  const newlyUnlocked: string[] = [];

  const tryUnlock = (id: string) => {
    if (!unlocked[id]) newlyUnlocked.push(id);
  };

  // Gather match results for convenience
  const allHands = match.seats.flatMap((s) => s.hands);
  const wonHands = allHands.filter((h) => h.result === HandStatus.WON || h.result === HandStatus.BLACKJACK);
  const hasBlackjack = allHands.some((h) => h.result === HandStatus.BLACKJACK);
  const hasSurrender = allHands.some((h) => h.result === HandStatus.SURRENDERED);
  const hasDoubleDownWin = allHands.some((h) => h.isDoubleDown && (h.result === HandStatus.WON || h.result === HandStatus.BLACKJACK));
  const hasPush = allHands.some((h) => h.result === HandStatus.PUSH);

  // ═══ GENERAL ACHIEVEMENTS ═══

  // 1. First Hand — played at least one round
  tryUnlock('first_hand');

  // 2. Natural Blackjack
  if (hasBlackjack) tryUnlock('natural_blackjack');

  // 3. Double Trouble — win after doubling down
  if (hasDoubleDownWin) tryUnlock('double_trouble');

  // 4. Split Victory — win both hands after splitting
  for (const seat of match.seats) {
    const splitHands = seat.hands.filter((h) => h.isSplit);
    if (splitHands.length >= 2) {
      const allSplitWon = splitHands.every((h) => h.result === HandStatus.WON || h.result === HandStatus.BLACKJACK);
      if (allSplitWon) tryUnlock('split_victory');
    }
  }

  // 5. Surrender
  if (hasSurrender) tryUnlock('surrendered');

  // 6. Insurance win
  const hasInsuranceWin = match.seats.some((s) => s.insurancePayout && s.insurancePayout > 0);
  if (hasInsuranceWin) tryUnlock('insurance_win');

  // 7. Five Card Charlie
  const hasFiveCards = allHands.some(
    (h) => h.cards.length >= 5 && h.result !== HandStatus.LOST
  );
  if (hasFiveCards) tryUnlock('five_card_charlie');

  // Low bankroll win
  if (wonHands.length > 0 && match.bankrollBefore < 5) tryUnlock('low_bankroll');

  // 8 & 9 & 10. Win streaks
  if (progress.currentStreak >= 10) tryUnlock('win_streak_5');
  if (progress.currentStreak >= 20) tryUnlock('win_streak_10');
  if (progress.currentStreak >= 50) tryUnlock('win_streak_20');

  // 10. Card Shark — 500 total wins
  if (progress.totalWins >= 500) tryUnlock('wins_100');
  
  if (progress.totalWins >= 2500) tryUnlock('wins_500');

  // 11. High Roller — $100K bet -> let's make it $1M
  const maxBet = Math.max(...allHands.map((h) => h.betAmount), 0);
  if (maxBet >= 10_000_000) tryUnlock('high_roller');

  // 12. Millionaire -> 10M, Billionaire
  if (bankroll >= 10_000_000) tryUnlock('millionaire');
  if (bankroll >= 10_000_000_000) tryUnlock('billionaire');
  
  // 13. Comeback Kid
  if (progress.hasBeenUnder100 && bankroll >= 100_000) tryUnlock('comeback_kid');

  // 14. World Traveler — all 11 rooms
  if (progress.roomsPlayed.length >= 11) tryUnlock('room_explorer');

  // ═══ DAILY CLAIM ACHIEVEMENTS ═══
  if (dailyClaimCount >= 25) tryUnlock('daily_regular');
  if (dailyClaimCount >= 50) tryUnlock('daily_devoted');
  if (dailyClaimCount >= 100) tryUnlock('daily_dedicated');
  if (dailyClaimCount >= 250) tryUnlock('daily_obsessed');
  if (dailyClaimCount >= 500) tryUnlock('daily_eternal');

  // ═══ MASTERY ACHIEVEMENTS ═══

  // 20. Perfect Ten — 20 wins in session without any loss
  if (progress.sessionWins >= 20 && progress.sessionLosses === 0) tryUnlock('perfect_ten');

  // 21. Legend — 10000 total wins
  if (progress.totalWins >= 10000) tryUnlock('wins_1000');

  // 22. Dealer's Nightmare — dealer bust wins (50)
  if (progress.dealerBustWins >= 50) tryUnlock('bust_master');

  // 23. Standoff — 100 pushes total
  if (progress.totalPushes >= 100) tryUnlock('push_it');

  // 24. All In Glory — bet entire bankroll and win (checked by comparing bankrollBefore)
  const totalBetThisRound = allHands.reduce((sum, h) => sum + h.betAmount, 0);
  const wonThisRound = wonHands.length > 0;
  if (wonThisRound && totalBetThisRound > 0 && match.bankrollBefore > 0 && totalBetThisRound >= match.bankrollBefore * 0.95) {
    tryUnlock('all_in_glory');
  }

  // ═══ GAME-SPECIFIC VARIANT ACHIEVEMENTS ═══

  // Zap Master — win 25 after zap
  if (progress.zapWins >= 25) tryUnlock('zap_master');

  // Lightning Reflexes — zap and get 21
  if (match.roomId === 'zapout_21') {
    const zappedTo21 = allHands.some((h) => {
      if (!h.zappedCards || h.zappedCards.length === 0) return false;
      // If hand was zapped and result is a win with total 21
      const total = h.cards.reduce((sum, c) => {
        let v = 0;
        if (c.rank === Rank.ACE) v = 11;
        else if ([Rank.JACK, Rank.QUEEN, Rank.KING, Rank.TEN].includes(c.rank)) v = 10;
        else v = parseInt(c.rank, 10) || 0;
        return sum + v;
      }, 0);
      // Simple 21 check (without ace adjustment since we just want exact 21)
      return total === 21 || (h.result === HandStatus.WON && h.cards.length === 2);
    });
    if (zappedTo21) tryUnlock('zap_comeback');
  }

  // Fire Walker — win 25 after burn
  if (progress.burnWins >= 25) tryUnlock('fire_walker');

  // Ace Pyromaniac — burn an Ace of Spades
  if (match.roomId === 'firecard_21') {
    const burnedAceSpades = allHands.some(
      (h) => h.isBurned && h.burnedCard?.rank === 'ACE' && h.burnedCard?.suit === 'SPADES'
    );
    if (burnedAceSpades) tryUnlock('ace_pyromaniac');
  }

  // Switch Artist — win both hands after switching
  if (match.roomId === 'exchange_21') {
    for (const seat of match.seats) {
      const switchedHands = seat.hands.filter((h) => h.isSwitched);
      if (switchedHands.length >= 2) {
        const allWon = switchedHands.every((h) => h.result === HandStatus.WON || h.result === HandStatus.BLACKJACK);
        if (allWon) tryUnlock('switch_artist');
      }
    }

    // No Switch Needed — win both without switching
    for (const seat of match.seats) {
      if (seat.hands.length >= 2) {
        const noneSwitched = seat.hands.every((h) => !h.isSwitched);
        const allWon = seat.hands.every((h) => h.result === HandStatus.WON || h.result === HandStatus.BLACKJACK);
        if (noneSwitched && allWon) tryUnlock('no_switch_needed');
      }
    }
  }

  // Free Spirit — 3+ free action tokens
  if (match.roomId === 'free_action') {
    const maxTokens = Math.max(...match.seats.map((s) => s.freeActionTokens || 0), 0);
    if (maxTokens >= 3) tryUnlock('free_spirit');

    // Side Bet Jackpot — 40:1+ side bet win
    const hasBigSideBet = match.seats.some((s) => {
      if (!s.sideBetAmount || !s.sideBetPayout) return false;
      const multiplier = (s.sideBetPayout / s.sideBetAmount) - 1;
      return multiplier >= 40;
    });
    if (hasBigSideBet) tryUnlock('side_bet_jackpot');
  }

  // Iberian bonus — check for bonus payouts (hands with > 1x payout that aren't blackjack)
  if (match.roomId === 'iberian_21') {
    const hasBonus = allHands.some((h) => {
      // Iberian bonuses: 5-card 21, 6-card 21, 7+ card 21, 6-7-8, 7-7-7
      if (h.result !== HandStatus.WON) return false;
      if (h.cards.length >= 5) return true; // 5+ card 21
      // Check for 6-7-8 or 7-7-7 patterns
      if (h.cards.length === 3) {
        const ranks = h.cards.map((c) => c.rank).sort();
        const is678 = ranks.includes(Rank.SIX) && ranks.includes(Rank.SEVEN) && ranks.includes(Rank.EIGHT);
        const is777 = ranks.every((r) => r === Rank.SEVEN);
        if (is678 || is777) return true;
      }
      return false;
    });
    if (hasBonus) tryUnlock('iberian_bonus');
  }

  // ENHC Survivor — 50 wins under ENHC rules
  const roomCfg = getRoomConfig(match.roomId);
  if (roomCfg.gameRules.enhc && progress.enhcWins >= 50) {
    tryUnlock('enhc_survivor');
  }

  return newlyUnlocked;
}

/**
 * Update progress counters based on the latest match record.
 * Returns the updated progress object (new reference).
 */
export function updateProgress(
  prev: AchievementProgress,
  match: MatchRecord,
  bankroll: number,
): AchievementProgress {
  const allHands = match.seats.flatMap((s) => s.hands);
  const wonCount = allHands.filter((h) => h.result === HandStatus.WON || h.result === HandStatus.BLACKJACK).length;
  const lostCount = allHands.filter((h) => h.result === HandStatus.LOST).length;
  const pushCount = allHands.filter((h) => h.result === HandStatus.PUSH).length;

  // Dealer bust wins: player won AND it wasn't a blackjack (dealer must have played)
  const dealerBusted = match.bankrollAfter > match.bankrollBefore; // simplified
  // More accurate: check if any hand was WON while dealer busted
  // We'll count hands won that are not blackjack (since BJ wins before dealer plays)
  const dealerBustWinCount = allHands.filter(
    (h) => h.result === HandStatus.WON && !h.cards.some((_, __, arr) => arr.length === 2)
  ).length;

  // Streak logic: if any hand lost, reset streak. If all won, increment.
  let newStreak = prev.currentStreak;
  if (lostCount > 0) {
    newStreak = wonCount; // Reset to just this round's wins
  } else if (wonCount > 0) {
    newStreak = prev.currentStreak + wonCount;
  }

  // Session tracking
  const sessionWins = prev.sessionWins + wonCount;
  const sessionLosses = prev.sessionLosses + lostCount;

  // Rooms played
  const roomsPlayed = prev.roomsPlayed.includes(match.roomId)
    ? prev.roomsPlayed
    : [...prev.roomsPlayed, match.roomId];

  // Game-specific counters
  const zapWins = prev.zapWins + allHands.filter(
    (h) => h.zappedCards && h.zappedCards.length > 0 && (h.result === HandStatus.WON || h.result === HandStatus.BLACKJACK)
  ).length;

  const burnWins = prev.burnWins + allHands.filter(
    (h) => h.isBurned && (h.result === HandStatus.WON || h.result === HandStatus.BLACKJACK)
  ).length;

  const switchWins = prev.switchWins + allHands.filter(
    (h) => h.isSwitched && (h.result === HandStatus.WON || h.result === HandStatus.BLACKJACK)
  ).length;

  // ENHC wins
  const roomCfg = getRoomConfig(match.roomId);
  const enhcWins = roomCfg.gameRules.enhc
    ? prev.enhcWins + wonCount
    : prev.enhcWins;

  // Comeback tracking
  const hasBeenUnder100 = prev.hasBeenUnder100 || bankroll < 100;

  return {
    totalWins: prev.totalWins + wonCount,
    totalPushes: prev.totalPushes + pushCount,
    currentStreak: newStreak,
    bestStreak: Math.max(prev.bestStreak, newStreak),
    roomsPlayed,
    sessionWins,
    sessionLosses,
    hasBeenUnder100,
    dealerBustWins: prev.dealerBustWins + dealerBustWinCount,
    zapWins,
    burnWins,
    switchWins,
    enhcWins,
  };
}
