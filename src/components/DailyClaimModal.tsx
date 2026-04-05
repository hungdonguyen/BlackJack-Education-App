import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Wallet, Timer, Coins, Gift, Unlock } from 'lucide-react';
import { useGameStore } from '@/hooks/useGameStore';
import { useAudio } from '@/utils/audio';
import { useMenuNavigation } from '@/hooks/useMenuNavigation';
import {
  DAILY_CLAIM_BASE_REWARD,
  DAILY_CLAIM_MILESTONE_BONUS,
  DAILY_CLAIM_STREAK_MILESTONES,
  getDailyClaimMilestoneBonus,
} from '@/utils/dailyClaimConfig';

interface DailyClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INS_RESET_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MYSTERY_COOLDOWN_MS = 30 * 60 * 1000;
const HOURLY_BASE_REWARD = DAILY_CLAIM_BASE_REWARD;
const STREAK_MILESTONES = DAILY_CLAIM_STREAK_MILESTONES;
const STREAK_BONUS_MAP = DAILY_CLAIM_MILESTONE_BONUS;

const CLAIM_ITEMS = ['hourly', 'mystery', 'rebate', 'insurance', 'tutorial'];

const EXTERNAL_ICONS = {
  hourly: 'https://img.icons8.com/fluency/96/time-machine.png',
  mystery: 'https://img.icons8.com/fluency/96/dice.png',
  rebate: 'https://img.icons8.com/fluency/96/cash-in-hand.png',
  insurance: 'https://img.icons8.com/fluency/96/shield.png',
  learning: 'https://img.icons8.com/fluency/96/training.png',
};

const toHourStart = (ts: number): number => {
  const d = new Date(ts);
  d.setMinutes(0, 0, 0);
  return d.getTime();
};

export const DailyClaimModal: React.FC<DailyClaimModalProps> = ({ isOpen, onClose }) => {
  const { playSound } = useAudio();
  const bankroll = useGameStore(s => s.bankroll);
  const lastDailyClaim = useGameStore(s => s.lastDailyClaim);
  const dailyClaimStreak = useGameStore(s => s.dailyClaimStreak);
  const totalBetSinceLastClaim = useGameStore(s => s.totalBetSinceLastClaim);
  const insuranceClaimsToday = useGameStore(s => s.insuranceClaimsToday);
  const lastInsuranceReset = useGameStore(s => s.lastInsuranceReset);
  const totalClaimedAmount = useGameStore(s => s.totalClaimedAmount);
  const lastMysteryClaimAt = useGameStore(s => s.lastMysteryClaimAt);
  const lastMysteryReward = useGameStore(s => s.lastMysteryReward);
  const claimedTutorialRewards = useGameStore(s => s.claimedTutorialRewards);
  const completedTutorials = useGameStore(s => s.completedTutorials);

  const claimTimedReward = useGameStore(s => s.claimTimedReward);
  const claimMysteryReward = useGameStore(s => s.claimMysteryReward);
  const claimRebate = useGameStore(s => s.claimRebate);
  const claimInsurance = useGameStore(s => s.claimInsurance);
  const claimTutorialProgressReward = useGameStore(s => s.claimTutorialProgressReward);

  const [hourlyCountdown, setHourlyCountdown] = useState('');
  const [mysteryCountdown, setMysteryCountdown] = useState('');
  const [mysteryMs, setMysteryMs] = useState(0);
  const [insCountdown, setInsCountdown] = useState('');
  const [hasClaimedCurrentHour, setHasClaimedCurrentHour] = useState(false);
  const [isHourlyContinuingStreak, setIsHourlyContinuingStreak] = useState(false);
  const [isInsuranceWindowActive, setIsInsuranceWindowActive] = useState(false);

  const [flashMystery, setFlashMystery] = useState<number | null>(null);
  const [flashHourly, setFlashHourly] = useState<number | null>(null);
  const [flashRebate, setFlashRebate] = useState<number | null>(null);
  const [flashTutorial, setFlashTutorial] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const tick = () => {
      const now = Date.now();

      // Hourly Claim
      const currentHourStart = toHourStart(now);
      const lastClaimHour = lastDailyClaim > 0 ? toHourStart(lastDailyClaim) : 0;
      if (lastClaimHour !== currentHourStart) {
        setHasClaimedCurrentHour(false);
        setIsHourlyContinuingStreak(lastClaimHour > 0 && currentHourStart - lastClaimHour === HOUR_MS);
        setHourlyCountdown('');
      } else {
        setHasClaimedCurrentHour(true);
        setIsHourlyContinuingStreak(true);
        const remaining = HOUR_MS - (now - lastClaimHour);
        const m = Math.floor(remaining / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        setHourlyCountdown(`${m}m ${s}s`);
      }

      // Mystery Claim
      const elapsedMystery = now - lastMysteryClaimAt;
      if (lastMysteryClaimAt === 0 || elapsedMystery >= MYSTERY_COOLDOWN_MS) {
        setMysteryCountdown('');
        setMysteryMs(0);
      } else {
        const remaining = MYSTERY_COOLDOWN_MS - elapsedMystery;
        const m = Math.floor(remaining / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        setMysteryCountdown(`${m}m ${s}s`);
        setMysteryMs(remaining);
      }

      // Insurance
      const elapsedIns = now - lastInsuranceReset;
      if (insuranceClaimsToday > 0 && elapsedIns < INS_RESET_MS) {
        setIsInsuranceWindowActive(true);
        const remaining = INS_RESET_MS - elapsedIns;
        const h = Math.floor(remaining / (60 * 60 * 1000));
        const m = Math.floor((remaining % (60 * 60 * 1000)) / 60000);
        setInsCountdown(`${h}h ${m}m left`);
      } else {
        setIsInsuranceWindowActive(false);
        setInsCountdown('');
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isOpen, lastDailyClaim, lastMysteryClaimAt, lastInsuranceReset, insuranceClaimsToday]);

  const mysteryReady = mysteryMs === 0;
  const hourlyReady = !hasClaimedCurrentHour;

  // Mirror slice logic to avoid preview/payout mismatch.
  const projectedNextStreak = hasClaimedCurrentHour
    ? dailyClaimStreak + 1
    : isHourlyContinuingStreak
      ? dailyClaimStreak + 1
      : 1;
  const milestoneBonus = getDailyClaimMilestoneBonus(projectedNextStreak);
  const hourlyPreview = HOURLY_BASE_REWARD + milestoneBonus;

  const maxStreakMilestone = STREAK_MILESTONES[STREAK_MILESTONES.length - 1] ?? 50;
  const cappedCurrentStreak = Math.min(Math.max(dailyClaimStreak, 0), maxStreakMilestone);
  const nextVisualMilestone = STREAK_MILESTONES.find((m) => m > cappedCurrentStreak) ?? maxStreakMilestone;
  const streakProgressPct = maxStreakMilestone > 0 ? (cappedCurrentStreak / maxStreakMilestone) * 100 : 0;

  const currentRebateAmount = Math.floor((totalBetSinceLastClaim || 0) * 0.02);
  const canClaimRebate = currentRebateAmount >= 10;

  const actualInsuranceClaims = isInsuranceWindowActive ? insuranceClaimsToday : 0;
  const canClaimInsurance = bankroll < 10 && actualInsuranceClaims < 5;

  const completedTutorialIds = Object.entries(completedTutorials || {})
    .filter(([roomId, completed]) => completed && roomId.startsWith('tutorial_'))
    .map(([roomId]) => roomId);
  const pendingTutorialIds = completedTutorialIds.filter((id) => !claimedTutorialRewards?.[id]);
  const tutorialRewardAmount = pendingTutorialIds.length * 10000;
  const canClaimTutorial = tutorialRewardAmount > 0;

  const handleClaimHourly = () => {
    if (!hourlyReady) return;
    const amount = claimTimedReward();
    if (amount > 0) {
      playSound('win');
      setFlashHourly(amount);
      setTimeout(() => setFlashHourly(null), 2500);
    }
  };

  const handleClaimMystery = () => {
    if (!mysteryReady) return;
    const amount = claimMysteryReward();
    if (amount > 0) {
      playSound('chip-lay');
      setFlashMystery(amount);
      setTimeout(() => setFlashMystery(null), 3000);
    }
  };

  const handleClaimRebate = () => {
    if (!canClaimRebate) return;
    const amount = claimRebate();
    if (amount > 0) {
      playSound('chip-lay');
      setFlashRebate(amount);
      setTimeout(() => setFlashRebate(null), 2500);
    }
  };

  const handleClaimInsurance = () => {
    if (!canClaimInsurance) return;
    const amount = claimInsurance();
    if (amount > 0) playSound('win');
  };

  const handleClaimTutorial = () => {
    if (!canClaimTutorial) return;
    const amount = claimTutorialProgressReward();
    if (amount > 0) {
      playSound('win');
      setFlashTutorial(amount);
      setTimeout(() => setFlashTutorial(null), 2500);
    }
  };

  const accountCards = [
    {
      label: 'Bankroll',
      value: `$${bankroll.toLocaleString()}`,
      icon: Wallet,
      iconWrap: 'bg-[#16382f] text-[#8ef5d0] border-[#2f8266]',
      accent: 'text-[#9ff6d7]',
      cardBorder: 'border-[#1f5d4a]',
      cardGlow: 'shadow-[0_8px_28px_rgba(16,185,129,0.16)]',
    },
    {
      label: 'Total Claimed',
      value: `$${(totalClaimedAmount || 0).toLocaleString()}`,
      icon: Coins,
      iconWrap: 'bg-[#3b2c10] text-[#ffd57a] border-[#8f6b24]',
      accent: 'text-[#ffd57a]',
      cardBorder: 'border-[#6b5220]',
      cardGlow: 'shadow-[0_8px_28px_rgba(245,158,11,0.16)]',
    },
  ];

  // Keyboard/gamepad navigation for claim buttons
  const handleClaimSelect = (id: string) => {
    switch (id) {
      case 'hourly': handleClaimHourly(); break;
      case 'mystery': handleClaimMystery(); break;
      case 'rebate': handleClaimRebate(); break;
      case 'insurance': handleClaimInsurance(); break;
      case 'tutorial': handleClaimTutorial(); break;
    }
  };

  const { focusedId } = useMenuNavigation({
    items: CLAIM_ITEMS,
    columns: 1,
    onSelect: handleClaimSelect,
    onBack: onClose,
    disabled: !isOpen,
  });

  const claimFocusStyle = (id: string) =>
    focusedId === id
      ? { boxShadow: '0 0 0 2px rgba(212,168,67,0.6), 0 0 20px rgba(212,168,67,0.2)', transition: 'box-shadow 0.15s ease' }
      : {};

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-3 md:p-6 select-none">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-5xl bg-[#0a0a0c] border border-white/5 rounded-3xl overflow-hidden flex flex-col shadow-[0_0_90px_rgba(0,0,0,1)]"
        style={{
          backgroundImage: "radial-gradient(ellipse 100% 100% at 50% 0%, rgba(212,168,67,0.08), transparent 60%)"
        }}
      >
        {/* Header */}
        <div className="py-4 px-6 border-b border-white/10 flex items-center justify-between bg-white/2 shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative group/header">
              <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full scale-150 animate-pulse" />
              <div className="relative w-14 h-14 rounded-2xl flex items-center justify-center bg-linear-to-b from-amber-300 via-amber-500 to-amber-700 shadow-[0_10px_20px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.4)] border border-amber-400/30 overflow-hidden transform group-hover/header:rotate-6 transition-transform">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.4),transparent)]" />
                <Gift size={28} className="text-[#2a1804] drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)] z-10" />
                <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover/header:translate-x-[100%] transition-transform duration-1000" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-linear-to-b from-white via-white to-white/40 leading-none">
                CASINO <span className="text-amber-500">REWARDS</span>
              </h2>
              <div className="text-[10px] font-black text-amber-500/60 uppercase tracking-[0.3em] flex items-center gap-2 mt-1.5 drop-shadow-md">
                <div className="h-1 w-8 bg-amber-500/30 rounded-full" />
                Exclusive VIP Member Benefits
                <div className="h-1 w-8 bg-amber-500/30 rounded-full" />
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Global Stats */}
        <div className="px-6 py-4 border-b border-white/5 bg-linear-to-r from-black/80 via-white/[0.03] to-black/80 flex gap-4 shrink-0 overflow-x-auto no-scrollbar">
          {accountCards.map((card) => {
            const CardIcon = card.icon;
            return (
            <div 
              key={card.label} 
              className={`flex items-center gap-4 px-5 py-3 rounded-2xl border bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] backdrop-blur-xl min-w-[248px] ${card.cardBorder} ${card.cardGlow}`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${card.iconWrap}`}>
                <CardIcon size={18} />
              </div>
              <div className="flex flex-col min-w-0">
                <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-black">{card.label}</p>
                <p className={`text-[1.6rem] leading-none font-black tracking-tight tabular-nums ${card.accent} drop-shadow-sm truncate`}>{card.value}</p>
              </div>
            </div>
          )})}
        </div>

        {/* Bento Grid */}
        <div className="p-6 overflow-y-auto max-h-[70vh] bg-black/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* HOURLY BONUS (col-span-2) */}
            <div className="md:col-span-2 relative overflow-hidden rounded-3xl border border-amber-500/30 bg-linear-to-b from-amber-500/15 via-black/40 to-black/60 p-6 group flex flex-col justify-between min-h-60 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]" style={claimFocusStyle('hourly')}>
              <div className="absolute -right-4 -top-4 w-40 h-40 bg-amber-500/10 blur-[80px] rounded-full" />
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none" />

              <div className="flex justify-between items-start z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <img src={EXTERNAL_ICONS.hourly} alt="Hourly" className="w-7 h-7 filter drop-shadow-lg" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Hourly Bonus</span>
                  </div>
                  <h3 className="text-3xl font-black text-white mt-1">
                    ${hourlyPreview.toLocaleString()}
                  </h3>
                  <p className="text-[11px] text-amber-300/60 font-semibold uppercase tracking-wider">Base ${HOURLY_BASE_REWARD.toLocaleString()} <span className="text-amber-500/50 px-1">+</span> Milestone Bonus</p>
                </div>

                <button
                  onClick={handleClaimHourly}
                  disabled={!hourlyReady}
                  className={`relative overflow-hidden px-8 py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${hourlyReady ? 'bg-linear-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)] cursor-pointer scale-100 active:scale-95' : 'bg-white/5 text-white/30 cursor-not-allowed border border-white/10'}`}
                >
                  {hourlyReady ? 'Claim Now' : hourlyCountdown}
                </button>
              </div>

              {/* Progress milestones */}
              <div className="mt-6 bg-black/40 rounded-xl p-4 border border-white/5 relative z-10">
                <div className="flex justify-between text-[10px] uppercase font-bold text-white/50 mb-5">
                  <span className="tracking-widest">Active Streak</span>
                  <span className="text-amber-400">Current: {dailyClaimStreak}</span>
                </div>
                <div className="relative w-full h-2 bg-white/10 rounded-full mt-4 mb-2">
                  {STREAK_MILESTONES.map((m) => {
                    const reached = cappedCurrentStreak >= m;
                    const next = !reached && m === nextVisualMilestone;
                    const leftPos = `${(m / maxStreakMilestone) * 100}%`;
                    return (
                      <div key={m} className="absolute -translate-x-1/2 flex flex-col items-center" style={{ left: leftPos, top: '-7px' }}>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[8px] font-bold z-10 transition-colors ${reached ? 'bg-amber-500 border-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]' : next ? 'bg-black border-amber-500 text-amber-500' : 'bg-black border-white/20 text-white/30'}`}>
                          {m}
                        </div>
                        <div className="mt-1.5 whitespace-nowrap absolute top-full">
                          <span className={`text-[9px] font-black uppercase tracking-wider ${reached ? 'text-amber-500' : 'text-white/30'}`}>
                            +${(STREAK_BONUS_MAP[m] ?? 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  <div 
                    className="absolute top-0 left-0 h-full bg-linear-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                    style={{
                      width: `${Math.min(100, Math.max(0, streakProgressPct))}%`
                    }}
                  />
                </div>
              </div>

              {/* Hourly Flash Success */}
              <AnimatePresence>
                {flashHourly && (
                  <motion.div
                     initial={{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }}
                     animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} 
                     exit={{ opacity: 0, scale: 1.05 }}
                     className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md rounded-2xl"
                  >
                    <Wallet className="text-amber-400 w-12 h-12 mb-2 animate-bounce drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]" />
                    <div className="text-4xl font-black text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,1)]">
                      +${flashHourly.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-white/60 font-black uppercase tracking-[0.2em] mt-2">Bonus Transferred</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* MYSTERY BONUS (col-span-1) */}
            <div className="relative overflow-hidden rounded-3xl border border-fuchsia-500/30 bg-linear-to-b from-fuchsia-500/15 via-black/40 to-black/60 flex flex-col min-h-60 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]" style={claimFocusStyle('mystery')}>
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-fuchsia-500/15 blur-[80px] rounded-full" />
              <div className="p-6 flex-1 flex flex-col z-10">
                <div className="flex items-center gap-2 mb-3">
                  <img src={EXTERNAL_ICONS.mystery} alt="Mystery" className="w-7 h-7 filter drop-shadow-lg" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-fuchsia-400">Mystery Box</span>
                </div>

                <h3 className="text-2xl font-black text-white">$1 - $200,000</h3>
                <p className="text-[10px] text-fuchsia-300/60 font-bold mt-1 leading-snug uppercase tracking-widest border-b border-fuchsia-500/20 pb-3">Epic random rewards</p>

                <div className="mt-auto pt-3">
                  <div className="flex items-center justify-between mb-3 text-[9px] uppercase font-bold tracking-widest">
                    <span className="text-white/40">Drop history</span>
                    <span className="text-emerald-400">+${lastMysteryReward.toLocaleString()}</span>
                  </div>
                  {!mysteryReady ? (
                    <div className="w-full py-3 rounded-xl border border-white/5 bg-black/40 text-center transition-all flex items-center justify-center gap-2">
                      <Timer className="w-4 h-4 text-fuchsia-400/50" />
                      <span className="text-xs font-mono font-bold text-white/50">{mysteryCountdown}</span>
                    </div>
                  ) : (
                    <button
                      onClick={handleClaimMystery}
                      className="w-full py-3 rounded-xl bg-linear-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-black text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(217,70,239,0.3)] cursor-pointer active:scale-95 transition-all"
                    >
                      Open Box
                    </button>
                  )}
                </div>
              </div>

              {/* Mystery Flash Success */}
              <AnimatePresence>
                {flashMystery && (
                  <motion.div
                     initial={{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }}
                     animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} 
                     exit={{ opacity: 0, scale: 1.05 }}
                     className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md rounded-2xl border border-fuchsia-500/50"
                  >
                    <Gift className="text-fuchsia-400 w-16 h-16 animate-bounce mb-2 drop-shadow-[0_0_15px_rgba(217,70,239,1)]" />
                    <div className="text-3xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,1)]">
                      +${flashMystery.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-fuchsia-400 uppercase font-black tracking-widest mt-2">Jackpot Secured</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* REBATE (col-span-1) */}
            <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-linear-to-b from-emerald-500/10 via-black/40 to-black/60 p-6 flex flex-col min-h-55 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]" style={claimFocusStyle('rebate')}>
               <div className="flex items-center gap-2 mb-4 z-10">
                  <img src={EXTERNAL_ICONS.rebate} alt="Rebate" className="w-7 h-7 filter drop-shadow-lg" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">2% Chip Rebate</span>
              </div>
              <div className="flex-1 flex flex-col justify-center mb-4 z-10">
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Available Chip Rebate</p>
                <div className="text-3xl font-black text-emerald-400">${currentRebateAmount.toLocaleString()}</div>
                <div className="mt-3 relative w-full h-2 bg-black rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="absolute top-0 left-0 h-full bg-linear-to-r from-emerald-600 to-emerald-400 rounded-full transition-all shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    style={{ width: canClaimRebate ? '100%' : `${Math.min(100, (currentRebateAmount / 10) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-bold text-emerald-500/40 uppercase tracking-widest mt-1.5">
                   <span>$0</span>
                   <span className={canClaimRebate ? "text-emerald-400" : ""}>$10 Min</span>
                </div>
              </div>
              <button
                onClick={handleClaimRebate}
                disabled={!canClaimRebate}
                className={`mt-auto z-10 w-full py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${canClaimRebate ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer' : 'bg-black/50 text-white/30 cursor-not-allowed border border-white/5'}`}
              >
                Claim Chips
              </button>

              {/* Rebate Flash */}
              <AnimatePresence>
                {flashRebate && (
                  <motion.div
                     initial={{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }}
                     animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} 
                     exit={{ opacity: 0, scale: 1.05 }}
                     className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md rounded-2xl border border-emerald-500/40"
                  >
                    <Coins className="text-emerald-400 w-12 h-12 mb-2 drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
                    <div className="text-3xl font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,1)]">
                      +${flashRebate.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-emerald-400/80 uppercase font-black tracking-widest mt-2">Rebate Processed</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* INSURANCE (col-span-1) */}
            <div className="relative overflow-hidden rounded-3xl border border-blue-500/30 bg-linear-to-b from-blue-500/10 via-black/40 to-black/60 p-6 flex flex-col group min-h-55 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]" style={claimFocusStyle('insurance')}>
               <div className="absolute -left-10 -top-10 w-40 h-40 bg-blue-500/10 blur-[60px] rounded-full" />
              <div className="flex items-center gap-2 mb-4 z-10">
                  <img src={EXTERNAL_ICONS.insurance} alt="Insurance" className="w-7 h-7 filter drop-shadow-lg" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Emergency Rescue</span>
              </div>
              <div className="flex-1 flex flex-col justify-center mb-4 z-10">
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-black mb-1">Rescue Credit</p>
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-black text-white">$1,000</div>
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                   <p className="text-[9px] text-blue-300/60 uppercase tracking-widest font-bold">Claims left</p>
                   <span className="text-sm font-black text-blue-400">{5 - actualInsuranceClaims}/5</span>
                </div>
                {insCountdown && (
                  <p className="text-[9px] text-amber-500/80 mt-1 uppercase tracking-widest font-bold text-right">{insCountdown}</p>
                )}
              </div>
              <button
                onClick={handleClaimInsurance}
                disabled={!canClaimInsurance}
                className={`mt-auto w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${canClaimInsurance ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] cursor-pointer animate-pulse' : 'bg-black/50 text-white/30 cursor-not-allowed border border-white/5'}`}
              >
                {!canClaimInsurance ? <Unlock size={14} opacity={0.5}/> : null}
                {canClaimInsurance ? 'Secure Funds' : 'Locked'}
              </button>
            </div>

            {/* LEARNING / TUTORIALS (col-span-1) */}
            <div className="relative overflow-hidden rounded-3xl border border-indigo-500/30 bg-linear-to-b from-indigo-500/10 via-black/40 to-black/60 p-6 flex flex-col min-h-55 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)]" style={claimFocusStyle('tutorial')}>
               <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/10 blur-[60px] rounded-full" />
               <div className="flex items-center gap-2 mb-4 z-10">
                  <img src={EXTERNAL_ICONS.learning} alt="Learning" className="w-7 h-7 filter drop-shadow-lg" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Training Bonus</span>
              </div>
              <div className="flex-1 flex flex-col justify-center mb-4 z-10">
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-black mb-1">Pending Balance</p>
                <div className="text-3xl font-black text-indigo-400">${tutorialRewardAmount.toLocaleString()}</div>
                <p className="text-[9px] text-indigo-300/40 uppercase tracking-widest font-bold leading-relaxed mt-3 pt-3 border-t border-white/5">
                  Earn $10,000 for each completed tutorial module
                </p>
              </div>
              <button
                onClick={handleClaimTutorial}
                disabled={!canClaimTutorial}
                className={`mt-auto z-10 w-full py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all ${canClaimTutorial ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)] cursor-pointer' : 'bg-black/50 text-white/30 cursor-not-allowed border border-white/5'}`} 
              >
                Claim Training
              </button>

              {/* Tutorial Flash */}
              <AnimatePresence>
                {flashTutorial && (
                  <motion.div
                     initial={{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }}
                     animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} 
                     exit={{ opacity: 0, scale: 1.05 }}
                     className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md rounded-2xl border border-indigo-500/40"
                  >
                    <Sparkles className="text-indigo-400 w-12 h-12 mb-2 drop-shadow-[0_0_15px_rgba(79,70,229,0.8)]" />
                    <div className="text-3xl font-black text-indigo-400 drop-shadow-[0_0_15px_rgba(79,70,229,1)]">
                      +${flashTutorial.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-indigo-400/80 uppercase font-black tracking-widest mt-2">Training Reward</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
