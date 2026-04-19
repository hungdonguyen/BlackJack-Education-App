// ============================================
// Achievement System — Type Definitions & Data
// ============================================

export type AchievementTier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  tier: AchievementTier;
  /** Optional: only relevant to a specific room */
  roomId?: string;
  /** Path to generated icon */
  icon?: string;
  /** If true, description is hidden until unlocked */
  secret?: boolean;
  /** Category for grouping in the UI */
  category: 'general' | 'mastery' | 'daily' | 'variant' | 'store';
}

export interface AchievementProgress {
  totalWins: number;
  totalPushes: number;
  currentStreak: number;
  bestStreak: number;
  roomsPlayed: string[];
  sessionWins: number;
  sessionLosses: number;
  hasBeenUnder100: boolean;
  dealerBustWins: number;
  zapWins: number;
  burnWins: number;
  switchWins: number;
  enhcWins: number;
}

export const INITIAL_PROGRESS: AchievementProgress = {
  totalWins: 0,
  totalPushes: 0,
  currentStreak: 0,
  bestStreak: 0,
  roomsPlayed: [],
  sessionWins: 0,
  sessionLosses: 0,
  hasBeenUnder100: false,
  dealerBustWins: 0,
  zapWins: 0,
  burnWins: 0,
  switchWins: 0,
  enhcWins: 0,
};

/** Tier metadata for UI styling */
export const TIER_CONFIG: Record<AchievementTier, { label: string; color: string; glow: string; bg: string }> = {
  common:    { label: 'Common',    color: '#9ca3af', glow: 'rgba(156,163,175,0.3)', bg: 'rgba(156,163,175,0.08)' },
  uncommon:  { label: 'Uncommon',  color: '#22c55e', glow: 'rgba(34,197,94,0.3)',   bg: 'rgba(34,197,94,0.08)' },
  rare:      { label: 'Rare',      color: '#3b82f6', glow: 'rgba(59,130,246,0.3)',  bg: 'rgba(59,130,246,0.08)' },
  epic:      { label: 'Epic',      color: '#a855f7', glow: 'rgba(168,85,247,0.3)',  bg: 'rgba(168,85,247,0.08)' },
  legendary: { label: 'Legendary', color: '#f59e0b', glow: 'rgba(245,158,11,0.4)',  bg: 'rgba(245,158,11,0.1)' },
};

export const TIER_SORT_ORDER: Record<string, number> = {
  common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5
};

// ─── All Achievement Definitions ───

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // ═══ GENERAL Gameplay (1–13) ═══
  { id: 'first_hand', name: 'First Steps', description: 'Complete your first hand of Blackjack.', tier: 'common', category: 'general', icon: '/images/achievements/first_hand.png' },
  { id: 'natural_blackjack', name: 'Natural Born Winner', description: 'Get a natural Blackjack (21 on first two cards).', tier: 'common', category: 'general', icon: '/images/achievements/natural_blackjack.png' },
  { id: 'double_trouble', name: 'Double Trouble', description: 'Win a hand after doubling down.', tier: 'common', category: 'general', icon: '/images/achievements/double_trouble.png' },
  { id: 'split_victory', name: 'Divide & Conquer', description: 'Win both hands after a split.', tier: 'rare', category: 'general', icon: '/images/achievements/split_victory.png' },
  { id: 'surrendered', name: 'Tactical Retreat', description: 'Surrender a hand when you have a 1% chance to win.', tier: 'common', category: 'general', icon: '/images/achievements/surrendered.png' },
  { id: 'win_streak_5', name: 'Heating Up', description: 'Win 10 hands in a row.', tier: 'rare', category: 'general', icon: '/images/achievements/win_streak_5.png' },
  { id: 'win_streak_10', name: 'On Fire', description: 'Win 20 hands in a row.', tier: 'epic', category: 'general', icon: '/images/achievements/win_streak_10.png' },
  { id: 'win_streak_20', name: 'Unstoppable Force', description: 'Win 50 hands in a row.', tier: 'legendary', category: 'general', icon: '/images/achievements/win_streak_20.png' },
  { id: 'low_bankroll', name: 'Near the Brink', description: 'Win a hand when your bankroll is below $5.', tier: 'epic', category: 'general', icon: '/images/achievements/low_bankroll.png' },
  { id: 'all_in_glory', name: 'All or Nothing', description: 'Win an all-in bet.', tier: 'epic', category: 'general', icon: '/images/achievements/all_in_glory.png', secret: true },
  { id: 'millionaire', name: 'High Roller Club', description: 'Reach a bankroll of $10,000,000.', tier: 'epic', category: 'general', icon: '/images/achievements/millionaire.png' },
  { id: 'billionaire', name: 'Casino Titan', description: 'Reach a bankroll of $10,000,000,000.', tier: 'legendary', category: 'general', icon: '/images/achievements/billionaire.png' },
  { id: 'perfect_strategy', name: 'Math Genius', description: 'Make 100 consecutive "Perfect Strategy" moves according to Advisor.', tier: 'legendary', category: 'general', icon: '/images/achievements/perfect_strategy.png' },
  { id: 'tutorial_graduate', name: 'Knowledge Seeker', description: 'Complete a tutorial lesson to refine your skills.', tier: 'common', category: 'general', icon: '' },
  { id: 'simulator_tester', name: 'Lab Rat', description: 'Run a simulation using the Advanced Simulator.', tier: 'uncommon', category: 'general', icon: '' },

  // ═══ Mastery (14–17) ═══
  { id: 'wins_100', name: 'Century Winner', description: 'Reach 500 total wins.', tier: 'rare', category: 'mastery', icon: '/images/achievements/wins_100.png' },
  { id: 'wins_500', name: 'Pro Grinder', description: 'Reach 2,500 total wins.', tier: 'epic', category: 'mastery', icon: '/images/achievements/wins_500.png' },
  { id: 'wins_1000', name: 'Blackjack Legend', description: 'Reach 10,000 total wins.', tier: 'legendary', category: 'mastery', icon: '/images/achievements/wins_1000.png' },
  { id: 'room_explorer', name: 'Globetrotter', description: 'Play at least one hand in every available room.', tier: 'epic', category: 'mastery', icon: '/images/achievements/room_explorer.png' },

  // ═══ DAILY CLAIM (18–22) ═══
  { id: 'daily_regular', name: 'Frequent Guest', description: 'Claim the daily bonus 25 times.', tier: 'common', category: 'daily', icon: '/images/achievements/daily_regular.png' },
  { id: 'daily_devoted', name: 'Devoted Player', description: 'Claim the daily bonus 50 times.', tier: 'uncommon', category: 'daily', icon: '/images/achievements/daily_devoted.png' },
  { id: 'daily_dedicated', name: 'Dedicated Regular', description: 'Claim the daily bonus 100 times.', tier: 'rare', category: 'daily', icon: '/images/achievements/daily_dedicated.png' },
  { id: 'daily_obsessed', name: 'True Believer', description: 'Claim the daily bonus 250 times.', tier: 'epic', category: 'daily', icon: '/images/achievements/daily_obsessed.png' },
  { id: 'daily_eternal', name: 'Eternal Loyalty', description: 'Claim the daily bonus 500 times.', tier: 'legendary', category: 'daily', icon: '/images/achievements/daily_eternal.png' },

  // ═══ VARIANT SPECIFIC (23–27) ═══
  { id: 'zap_master', name: 'Zap Master', description: 'Win 25 hands in Zap Out 21 after dealer is zapped.', tier: 'rare', category: 'variant', roomId: 'zapout_21', icon: '/images/achievements/zap_master.png' },
  { id: 'fire_walker', name: 'Fire Walker', description: 'Win 25 hands in Fire Card 21 with a "Hot" card active.', tier: 'rare', category: 'variant', roomId: 'firecard_21', icon: '/images/achievements/fire_walker.png' },
  { id: 'switch_artist', name: 'Switch Artist', description: 'Win a hand in Exchange 21 after switching to a better hand.', tier: 'rare', category: 'variant', roomId: 'exchange_21', icon: '/images/achievements/switch_artist.png' },
  { id: 'free_deal', name: 'The Art of the Deal', description: 'Use Free Action tokens 3 times in one hand and win.', tier: 'legendary', category: 'variant', roomId: 'free_action', icon: '/images/achievements/free_deal.png' },
  { id: 'iberian_king', name: 'Iberian King', description: 'Achieve a "Grand Iberian" (7-7-7 of same suit) in Iberian 21.', tier: 'legendary', category: 'variant', roomId: 'iberian_21', icon: '/images/achievements/iberian_king.png' },

  // ═══ SECRET Achievements (28–34) ═══
  { id: 'bust_master', name: 'Bust Master', description: 'Win 50 hands where the dealer busts.', tier: 'uncommon', category: 'general', icon: '/images/achievements/bust_master.png', secret: true },
  { id: 'insurance_pay', name: 'Safety First', description: 'Win an Insurance bet when the dealer has Blackjack.', tier: 'rare', category: 'general', icon: '/images/achievements/insurance_pay.png', secret: true },
  { id: 'multi_blackjack', name: 'Double Trouble 21', description: 'Get Blackjack on two seats in the same round.', tier: 'epic', category: 'general', icon: '/images/achievements/multi_blackjack.png', secret: true },
  { id: 'dealer_bust_22', name: 'the 22 Curse', description: 'Dealer busts with exactly 22.', tier: 'common', category: 'general', icon: '/images/achievements/dealer_bust_22.png', secret: true },
  { id: 'perfect_21_sum', name: 'Zen Master', description: 'Win 3 spots with exactly 21 on all of them.', tier: 'legendary', category: 'general', icon: '/images/achievements/perfect_21_sum.png', secret: true },
  { id: 'exact_zero', name: 'Back from the Dead', description: 'Reach exactly $0 bankroll and win it all back from a daily claim.', tier: 'legendary', category: 'general', icon: '/images/achievements/exact_zero.png', secret: true },
  { id: 'count_savant', name: 'Eye in the Sky', description: 'Play 500 hands with Card Counting disabled and maintain 99%+ accuracy.', tier: 'legendary', category: 'general', icon: '/images/achievements/count_savant.png', secret: true },

  // ═══ STORE PURCHASE (35–38) ═══
  { id: 'gold_collector', name: 'Golden Touch', description: 'Purchase the Premium Gold Deck from the Casino Store.', tier: 'epic', category: 'store', icon: '/images/achievements/gold_collector.png' },
  { id: 'silver_collector', name: 'Silver Lining', description: 'Purchase the Sterling Silver Deck from the Casino Store.', tier: 'rare', category: 'store', icon: '/images/achievements/silver_collector.png' },
  { id: 'plasma_collector', name: 'Plasma State', description: 'Purchase the dynamic Plasma Flow Deck from the Casino Store.', tier: 'epic', category: 'store', icon: '/images/achievements/plasma_collector.png' },
  { id: 'rainbow_collector', name: 'Over the Rainbow', description: 'Purchase the Iridescent Rainbow Deck from the Casino Store.', tier: 'epic', category: 'store', icon: '/images/achievements/rainbow_collector.png' },
  { id: 'hacker_collector', name: 'System Override', description: 'Purchase the Cyber Hacker Deck from the Casino Store.', tier: 'epic', category: 'store', icon: '/images/achievements/hacker_collector.png' },
  { id: 'glass_collector', name: 'Crystal Clear', description: 'Purchase the Frosted Glass Deck from the Casino Store.', tier: 'epic', category: 'store', icon: '/images/achievements/glass_collector.png' },
  { id: 'cosmic_voyager', name: 'Cosmic Voyager', description: 'Purchase the Cosmic Swirl Deck and transcend beyond the stars.', tier: 'legendary', category: 'store', icon: '/images/achievements/cosmic_voyager.png' },
];

/** Quick lookup map */
export const ACHIEVEMENT_MAP: Record<string, AchievementDefinition> = Object.fromEntries(
  ACHIEVEMENTS.map((a) => [a.id, a])
);
