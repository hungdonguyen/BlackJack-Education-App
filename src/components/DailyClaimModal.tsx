import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Wallet, Timer, Shield, Coins, Gift, Unlock } from 'lucide-react';
import { useGameStore } from '@/hooks/useGameStore';
import { useAudio } from '@/utils/audio';

interface DailyClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INS_RESET_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MYSTERY_COOLDOWN_MS = 30 * 60 * 1000;
const HOURLY_BASE_REWARD = 3000;
const STREAK_MILESTONES = [1, 5, 10, 24, 50];
const STREAK_BONUS_MAP: Record<number, number> = {
  1: 2000,
  5: 10000,
  10: 30000,
  24: 80000,
  50: 250000,
};

const EXTERNAL_ICONS = {
  hourly: 'https://img.icons8.com/fluency/96/time-machine.png',
  mystery: 'https://img.icons8.com/fluency/96/dice.png',
  rebate: 'https://img.icons8.com/fluency/96/cash-in-hand.png',
  insurance: 'https://img.icons8.com/fluency/96/shield.png',
  learning: 'https://img.icons8.com/fluency/96/training.png',
  gift: 'https://img.icons8.com/3d-fluency/94/gift--v2.png',
};

const toHourStart = (ts: number): number => {
  const d = new Date(ts);
  d.setMinutes(0, 0, 0);
  return d.getTime();
};

const compactClaimNumber = (value: number) => {
  if (Math.abs(value) < 1_000_000) return value.toLocaleString();
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
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
  const mysteryClaimCount = useGameStore(s => s.mysteryClaimCount);
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
  const [hourlyMs, setHourlyMs] = useState(0);
  const [mysteryMs, setMysteryMs] = useState(0);
  const [insCountdown, setInsCountdown] = useState('');

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
        setHourlyCountdown('');
        setHourlyMs(0);
      } else {
        const remaining = HOUR_MS - (now - lastClaimHour);
        const m = Math.floor(remaining / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        setHourlyCountdown(`${m}m ${s}s`);
        setHourlyMs(remaining);
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
        const remaining = INS_RESET_MS - elapsedIns;
        const h = Math.floor(remaining / (60 * 60 * 1000));
        const m = Math.floor((remaining % (60 * 60 * 1000)) / 60000);
        setInsCountdown(`${h}h ${m}m left`);
      } else {
        setInsCountdown('');
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isOpen, lastDailyClaim, lastMysteryClaimAt, lastInsuranceReset, insuranceClaimsToday]);

  if (!isOpen) return null;

  const hourlyReady = hourlyMs === 0;
  const mysteryReady = mysteryMs === 0;
  const nextStreak = hourlyReady ? dailyClaimStreak + 1 : dailyClaimStreak;
  const nextStreakMilestone = STREAK_MILESTONES.find((m) => m >= nextStreak) ?? 50;
  const nextMilestoneBonus = STREAK_BONUS_MAP[nextStreakMilestone] ?? 0;
  const hourlyPreview = HOURLY_BASE_REWARD + nextMilestoneBonus;

  const currentRebateAmount = Math.floor((totalBetSinceLastClaim || 0) * 0.02);
  const canClaimRebate = currentRebateAmount >= 10;

  const canClaimInsurance = bankroll < 10 && insuranceClaimsToday < 5;
  const actualInsuranceClaims = (Date.now() - lastInsuranceReset > INS_RESET_MS) ? 0 : insuranceClaimsToday;

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
    { label: "Bankroll", value: `$${bankroll.toLocaleString()}`, accent: "text-emerald-400" },
    { label: "Total Claimed", value: `$${(totalClaimedAmount || 0).toLocaleString()}`, accent: "text-amber-400" },
  ];

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
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-linear-to-tr from-amber-600 to-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]">
              <img src={EXTERNAL_ICONS.gift} alt="Rewards" className="w-8 h-8 drop-shadow-md" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-linear-to-r from-white to-white/60 tracking-tight">
                VIP REWARDS
              </h2>
              <p className="text-[10px] font-bold text-amber-500/80 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
                <Sparkles size={10} /> Exclusive Casino Hub
              </p>
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
        <div className="px-6 py-3 border-b border-white/5 bg-black/40 flex gap-4 shrink-0">
          {accountCards.map((card) => (
            <div key={card.label} className="flex flex-col rounded-lg border border-white/5 bg-white/5 px-4 py-2 shrink-0 min-w-35">
              <p className="text-[9px] uppercase tracking-widest text-white/40 font-bold">{card.label}</p>
              <p className={`text-xl font-black mt-0.5 ${card.accent}`}>{card.value}</p>
            </div>
          ))}
        </div>

        {/* Bento Grid */}
        <div className="p-6 overflow-y-auto max-h-[70vh] bg-black/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* HOURLY BONUS (col-span-2) */}
            <div className="md:col-span-2 relative overflow-hidden rounded-2xl border border-amber-500/20 bg-linear-to-b from-amber-500/10 to-black/40 p-5 group flex flex-col justify-between min-h-55">
              <div className="absolute -right-4 -top-4 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full" />

              <div className="flex justify-between items-start z-10">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <img src={EXTERNAL_ICONS.hourly} alt="Hourly" className="w-7 h-7 filter drop-shadow-lg" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Hourly Bonus</span>
                  </div>
                  <h3 className="text-3xl font-black text-white mt-1">
                    ${compactClaimNumber(hourlyPreview)}
                  </h3>
                  <p className="text-[11px] text-amber-300/60 font-semibold uppercase tracking-wider">Base ${compactClaimNumber(HOURLY_BASE_REWARD)} <span className="text-amber-500/50 px-1">+</span> Streak Bonus</p>
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
                  {STREAK_MILESTONES.map((m, idx) => {
                    const reached = dailyClaimStreak >= m;
                    const next = !reached && m === nextStreakMilestone;
                    const leftPos = `${(idx / (STREAK_MILESTONES.length - 1)) * 100}%`;
                    return (
                      <div key={m} className="absolute -translate-x-1/2 flex flex-col items-center" style={{ left: leftPos, top: '-7px' }}>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center text-[8px] font-bold z-10 transition-colors ${reached ? 'bg-amber-500 border-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]' : next ? 'bg-black border-amber-500 text-amber-500' : 'bg-black border-white/20 text-white/30'}`}>
                          {m}
                        </div>
                        <div className="mt-1.5 whitespace-nowrap absolute top-full">
                          <span className={`text-[9px] font-black uppercase tracking-wider ${reached ? 'text-amber-500' : 'text-white/30'}`}>
                            +${compactClaimNumber(STREAK_BONUS_MAP[m])}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  <div 
                    className="absolute top-0 left-0 h-full bg-linear-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                    style={{
                      width: `${Math.min(100, Math.max(0, (STREAK_MILESTONES.indexOf(nextStreakMilestone) / (STREAK_MILESTONES.length - 1)) * 100))}%`
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
            <div className="relative overflow-hidden rounded-2xl border border-fuchsia-500/20 bg-linear-to-b from-fuchsia-500/10 to-black/40 flex flex-col min-h-55">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-fuchsia-500/20 blur-3xl rounded-full" />
              <div className="p-5 flex-1 flex flex-col z-10">
                <div className="flex items-center gap-2 mb-3">
                  <img src={EXTERNAL_ICONS.mystery} alt="Mystery" className="w-7 h-7 filter drop-shadow-lg" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-fuchsia-400">Mystery Box</span>
                </div>

                <h3 className="text-2xl font-black text-white">${compactClaimNumber(1)} - ${compactClaimNumber(200000)}</h3>
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
            <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-linear-to-b from-emerald-500/5 to-black/40 p-5 flex flex-col min-h-50">
               <div className="flex items-center gap-2 mb-3 z-10">
                  <img src={EXTERNAL_ICONS.rebate} alt="Rebate" className="w-7 h-7 filter drop-shadow-lg" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">2% Cash Rebate</span>
              </div>
              <div className="flex-1 flex flex-col justify-center mb-4 z-10">
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Available Cashback</p>
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
                Claim Cash
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
            <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-linear-to-b from-blue-500/5 to-black/40 p-5 flex flex-col group min-h-50">
              <div className="flex items-center gap-2 mb-3">
                  <img src={EXTERNAL_ICONS.insurance} alt="Insurance" className="w-7 h-7 filter drop-shadow-lg" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Emergency Rescue</span>
              </div>
              <div className="flex-1 flex flex-col justify-center mb-4">
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Rescue Credit</p>
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
            <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-linear-to-b from-indigo-500/5 to-black/40 p-5 flex flex-col min-h-50">
               <div className="flex items-center gap-2 mb-3">
                  <img src={EXTERNAL_ICONS.learning} alt="Learning" className="w-7 h-7 filter drop-shadow-lg" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Training Bonus</span>
              </div>
              <div className="flex-1 flex flex-col justify-center mb-4">
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Pending Balance</p>
                <div className="text-3xl font-black text-indigo-400">${tutorialRewardAmount.toLocaleString()}</div>
                <p className="text-[9px] text-indigo-300/40 uppercase tracking-widest font-bold leading-relaxed mt-2 pt-2 border-t border-white/5">
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
