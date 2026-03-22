'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Timer, Coins, Shield, Sparkles, TrendingUp, AlertCircle, CheckCircle2, Wallet, ArrowRight } from 'lucide-react';
import { useGameStore } from '@/hooks/useGameStore';
import { useAudio } from '@/utils/audio';

interface DailyClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CLAIM_COOLDOWN_MS = 30 * 60 * 1000;
const INS_RESET_MS = 24 * 60 * 60 * 1000;

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
  const dailyClaimCount = useGameStore(s => s.dailyClaimCount);
  const totalBetSinceLastClaim = useGameStore(s => s.totalBetSinceLastClaim);
  const insuranceClaimsToday = useGameStore(s => s.insuranceClaimsToday);
  const lastInsuranceReset = useGameStore(s => s.lastInsuranceReset);
  const totalClaimedAmount = useGameStore(s => s.totalClaimedAmount);

  const claimTimedReward = useGameStore(s => s.claimTimedReward);
  const claimRebate = useGameStore(s => s.claimRebate);
  const claimInsurance = useGameStore(s => s.claimInsurance);

  const [timedCooldown, setTimedCooldown] = useState('');
  const [timedMs, setTimedMs] = useState(0);
  const [insCountdown, setInsCountdown] = useState('');

  // Cooldown & Countdown logic
  useEffect(() => {
    if (!isOpen) return;

    const tick = () => {
      const now = Date.now();
      
      // Timed Claim Cooldown
      const elapsedTimed = now - lastDailyClaim;
      if (elapsedTimed >= CLAIM_COOLDOWN_MS) {
        setTimedCooldown('');
        setTimedMs(0);
      } else {
        const remaining = CLAIM_COOLDOWN_MS - elapsedTimed;
        const m = Math.floor(remaining / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        setTimedCooldown(`${m}m ${s}s`);
        setTimedMs(remaining);
      }

      // Insurance Reset Countdown
      const elapsedIns = now - lastInsuranceReset;
      if (insuranceClaimsToday > 0 && elapsedIns < INS_RESET_MS) {
        const remaining = INS_RESET_MS - elapsedIns;
        const h = Math.floor(remaining / (60 * 60 * 1000));
        const m = Math.floor((remaining % (60 * 60 * 1000)) / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        setInsCountdown(`${h}h ${m}m ${s}s`);
      } else {
        setInsCountdown('');
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isOpen, lastDailyClaim, lastInsuranceReset, insuranceClaimsToday]);

  if (!isOpen) return null;

  const timedClaimReady = timedMs === 0;
  const claimStep = (dailyClaimCount % 3) + 1;
  const isBonusClaim = claimStep === 3;
  const baseTimedAmount = isBonusClaim ? 1000 : 500;
  
  const currentRebateAmount = Math.floor((totalBetSinceLastClaim || 0) * 0.02);
  const canClaimRebate = currentRebateAmount >= 10;
  
  // Insurance Logic
  const canClaimInsurance = bankroll < 10 && insuranceClaimsToday < 5;
  const actualInsuranceClaims = (Date.now() - lastInsuranceReset > INS_RESET_MS) ? 0 : insuranceClaimsToday;

  const handleClaimTimed = () => {
    if (!timedClaimReady) return;
    const amount = claimTimedReward();
    if (amount > 0) playSound(isBonusClaim ? 'win' : 'chip-lay');
  };

  const handleClaimRebate = () => {
    if (!canClaimRebate) return;
    const amount = claimRebate();
    if (amount > 0) playSound('chip-lay');
  };

  const handleClaimInsurance = () => {
    if (!canClaimInsurance) return;
    const amount = claimInsurance();
    if (amount > 0) playSound('win');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
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
        className="relative w-full max-w-5xl bg-[#0c0c0c] border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,1)]"
      >
        {/* Header */}
        <div className="flex-shrink-0 p-8 border-b border-white/5 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.1)_0%,transparent_70%)] flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center text-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.2)] border border-amber-500/20">
              <Gift size={36} className="drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
            </div>
            <div>
              <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70 uppercase tracking-tighter flex items-center gap-3">
                Daily <span className="text-amber-500">Rewards</span>
              </h2>
              <p className="text-xs font-bold text-amber-500/50 uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
                <Sparkles size={12} /> Central Rewards Hub
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 hover:rotate-90 text-white/50 hover:text-white transition-all duration-300 border border-white/10 cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-grow p-8 bg-[#080808] max-h-[85vh] overflow-y-auto">
          
          {/* Account Summary Section */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="relative overflow-hidden bg-white/[0.02] border border-white/5 p-5 rounded-2xl flex items-center justify-between group">
              <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div>
                <div className="flex items-center gap-2 mb-1 text-white/30">
                  <Wallet size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Bankroll</span>
                </div>
                <div className="text-2xl font-black text-white tabular-nums">${bankroll.toLocaleString()}</div>
              </div>
            </div>
            <div className="relative overflow-hidden bg-amber-500/5 border border-amber-500/20 p-5 rounded-2xl flex items-center justify-between group shadow-[inset_0_0_20px_rgba(245,158,11,0.02)]">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div>
                <div className="flex items-center gap-2 mb-1 text-amber-500/50">
                  <Gift size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Total Earned</span>
                </div>
                <div className="text-2xl font-black text-amber-400 tabular-nums drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">${(totalClaimedAmount || 0).toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Card 1: Timed Reward */}
            <motion.div 
              className={`relative flex flex-col rounded-3xl border transition-all duration-500 overflow-hidden ${
                timedClaimReady 
                  ? 'bg-gradient-to-b from-amber-500/10 to-amber-500/5 border-amber-500/30' 
                  : 'bg-white/[0.02] border-white/5'
              }`}
            >
              {timedClaimReady && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-50" />
              )}
              <div className="p-6 flex-grow flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-xl ${
                  timedClaimReady ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-black' : 'bg-white/5 text-white/20'
                }`}>
                  <Timer size={32} className={timedClaimReady ? 'animate-pulse' : ''} />
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">Timed Payout</h3>
                </div>
                
                <div className="text-4xl font-black tabular-nums text-white leading-none my-3">
                  ${compactClaimNumber(baseTimedAmount)}
                </div>
                
                <div className={`text-[10px] font-black px-2 mt-1 py-1 rounded inline-block border ${isBonusClaim ? 'border-amber-500/40 text-amber-400 bg-amber-500/10' : 'border-white/10 text-white/30'}`}>
                  STEP {claimStep}/3 {isBonusClaim && 'BONUS'}
                </div>
                
                <div className="mt-4 p-3 bg-black/40 rounded-xl w-full">
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                    {timedClaimReady ? 'Ready for collection' : `Next Payout in`}
                  </p>
                  {!timedClaimReady && (
                    <p className="text-lg font-mono text-white/70 mt-1 font-bold">{timedCooldown}</p>
                  )}
                </div>
              </div>

              <div className="p-4 pt-0">
                <button
                  onClick={handleClaimTimed}
                  disabled={!timedClaimReady}
                  className={`w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all ${
                    timedClaimReady 
                      ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-[0_0_30px_rgba(245,158,11,0.3)] cursor-pointer hover:scale-[1.02] active:scale-95' 
                      : 'bg-white/5 text-white/20 cursor-not-allowed'
                  }`}
                >
                  {timedClaimReady ? 'COLLECT REWARD' : 'LOCKED'}
                </button>
              </div>
            </motion.div>

            {/* Card 2: Bet Rebate */}
            <motion.div 
              className={`relative flex flex-col rounded-3xl border transition-all duration-500 overflow-hidden ${
                canClaimRebate 
                  ? 'bg-gradient-to-b from-emerald-500/10 to-emerald-500/5 border-emerald-500/30' 
                  : 'bg-white/[0.02] border-white/5'
              }`}
            >
              {canClaimRebate && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-50" />
              )}
              <div className="p-6 flex-grow flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-xl ${
                  canClaimRebate ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-black' : 'bg-white/5 text-white/20'
                }`}>
                  <TrendingUp size={32} />
                </div>
                
                <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">Rolling Rebate</h3>
                
                <div className={`text-4xl font-black tabular-nums leading-none my-3 ${canClaimRebate ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-white/40'}`}>
                  ${currentRebateAmount.toLocaleString()}
                </div>
                
                <div className="text-[10px] mt-1 font-black px-2 py-1 rounded inline-block border border-emerald-500/30 text-emerald-500 bg-emerald-500/10 uppercase">
                  2% Rakeback
                </div>

                <div className="mt-4 p-3 bg-black/40 rounded-xl w-full">
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                    {canClaimRebate ? 'Status' : 'Progress'}
                  </p>
                  <p className={`text-sm mt-1 font-bold ${canClaimRebate ? 'text-emerald-400' : 'text-white/50'}`}>
                    {canClaimRebate ? 'Threshold Reached!' : `Need $${10 - currentRebateAmount} more`}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0">
                <button
                  onClick={handleClaimRebate}
                  disabled={!canClaimRebate}
                  className={`w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all ${
                    canClaimRebate 
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_30px_rgba(16,185,129,0.3)] cursor-pointer hover:scale-[1.02] active:scale-95' 
                      : 'bg-white/5 text-white/20 cursor-not-allowed'
                  }`}
                >
                  {canClaimRebate ? 'CLAIM REBATE' : '$10 MINIMUM'}
                </button>
              </div>
            </motion.div>

            {/* Card 3: Insurance */}
            <motion.div 
              className={`relative flex flex-col rounded-3xl border transition-all duration-500 overflow-hidden ${
                canClaimInsurance 
                  ? 'bg-gradient-to-b from-blue-500/10 to-blue-500/5 border-blue-500/30' 
                  : 'bg-white/[0.02] border-white/5'
              }`}
            >
              {canClaimInsurance && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50" />
              )}
              <div className="p-6 flex-grow flex flex-col items-center text-center">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-xl ${
                  canClaimInsurance ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-black' : 'bg-white/5 text-white/20'
                }`}>
                  <Shield size={32} />
                </div>
                
                <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2">Safety Protocol</h3>
                
                <div className={`text-4xl font-black tabular-nums leading-none my-3 ${canClaimInsurance ? 'text-blue-400 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'text-white/40'}`}>
                  $1,000
                </div>

                <div className={`text-[10px] mt-1 font-black px-2 py-1 rounded inline-block border ${actualInsuranceClaims < 5 ? 'border-blue-500/30 text-blue-500 bg-blue-500/10' : 'border-red-500/30 text-red-500 bg-red-500/10'}`}>
                  {5 - actualInsuranceClaims} USES LEFT TODAY
                </div>

                <div className="mt-4 p-3 bg-black/40 rounded-xl w-full h-[60px] flex flex-col justify-center">
                  <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest text-center">
                    {canClaimInsurance 
                      ? 'Critical balance! Ready.' 
                      : (actualInsuranceClaims >= 5 
                          ? `Resets in`
                          : 'Balance secure')
                    }
                  </p>
                  {insCountdown && actualInsuranceClaims >= 5 && (
                    <div className="flex items-center justify-center gap-1 text-[12px] font-mono font-bold text-amber-500 mt-1 uppercase">
                      <Timer size={12} /> {insCountdown}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 pt-0">
                <button
                  onClick={handleClaimInsurance}
                  disabled={!canClaimInsurance}
                  className={`w-full py-4 rounded-xl font-black uppercase tracking-widest transition-all ${
                    canClaimInsurance 
                      ? 'bg-blue-500 hover:bg-blue-400 text-black shadow-[0_0_30px_rgba(59,130,246,0.3)] cursor-pointer hover:scale-[1.02] active:scale-95' 
                      : 'bg-white/5 text-white/20 cursor-not-allowed'
                  }`}
                >
                  {canClaimInsurance ? 'INITIATE BAILOUT' : 'SECURE'}
                </button>
              </div>
            </motion.div>

          </div>
        </div>

        {/* Footer info */}
        <div className="flex-shrink-0 p-6 border-t border-white/5 bg-black/40 flex items-center justify-between px-10">
          <div className="flex items-center gap-2 text-white/20">
            <div className="w-2 h-2 rounded-full bg-amber-500/40" />
            <span className="text-[9px] uppercase font-bold tracking-[0.3em]">Premium Reward Protocol</span>
          </div>
          <div className="text-[9px] text-white/10 font-medium uppercase tracking-[0.2em]">
            Centralized Rewards Engine v2.1
          </div>
        </div>
      </motion.div>
    </div>
  );
};
