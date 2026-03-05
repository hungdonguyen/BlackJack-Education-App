'use client';

// ============================================
// Home Page — Premium Landing
// ============================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Spade, Wallet, BookOpen, TrendingUp, Sparkles } from 'lucide-react';
import LegalAgreementModal from '@/components/LegalAgreementModal';
import StrategyModal from '@/components/StrategyModal';
import { useGameStore, useStoreHydration } from '@/hooks/useGameStore';
import { ROOMS } from '@/utils/rooms';

export default function HomePage() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [showStrategy, setShowStrategy] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<'classic' | 'vegas_strip' | 'vegas_downtown'>('classic');

  const isHydrated = useStoreHydration();
  const bankroll = useGameStore((s) => s.bankroll);

  const formatMoney = (v: number) =>
    v >= 1_000_000
      ? `$${(v / 1_000_000).toFixed(1)}M`
      : v >= 1000
        ? `$${v.toLocaleString()}`
        : `$${v}`;

  return (
    <div
      className="relative w-screen h-screen overflow-hidden select-none flex flex-col items-center justify-center"
      style={{
        background: 'radial-gradient(ellipse 120% 100% at 50% 30%, #301a10 0%, #1a0e0a 40%, #0d0705 100%)',
      }}
    >
      {/* Legal agreement gate — only shown once */}
      <LegalAgreementModal onAccepted={() => setAccepted(true)} />

      {/* Page body — only rendered after user accepts */}
      {accepted && (
        <>
          {/* Ambient glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 60% 40% at 50% 35%, rgba(212, 168, 67, 0.06) 0%, transparent 70%)',
            }}
          />

          {/* Secondary ambient glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle 300px at 50% 20%, rgba(212, 168, 67, 0.03) 0%, transparent 100%)',
            }}
          />

          {/* Decorative card suits floating */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {['♠', '♥', '♦', '♣'].map((suit, i) => (
              <motion.span
                key={suit}
                className="absolute text-6xl"
                style={{
                  color: suit === '♥' || suit === '♦' ? 'rgba(220, 50, 50, 0.04)' : 'rgba(255, 255, 255, 0.03)',
                  left: `${15 + i * 22}%`,
                  top: `${20 + (i % 2) * 40}%`,
                }}
                animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 6 + i, repeat: Infinity, ease: 'easeInOut' }}
              >
                {suit}
              </motion.span>
            ))}
          </div>

          {/* ─── Top-right: Balance Card ─── */}
          {isHydrated && (
            <motion.div
              className="absolute top-6 right-6 z-20"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <div
                className="relative px-5 py-3.5 rounded-2xl backdrop-blur-md overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(212, 168, 67, 0.08) 0%, rgba(30, 20, 10, 0.6) 100%)',
                  border: '1px solid rgba(212, 168, 67, 0.15)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
                }}
              >
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(110deg, transparent 40%, rgba(212, 168, 67, 0.06) 50%, transparent 60%)',
                  }}
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
                />

                <div className="flex items-center gap-3 relative z-10">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(212, 168, 67, 0.15) 0%, rgba(212, 168, 67, 0.05) 100%)',
                      border: '1px solid rgba(212, 168, 67, 0.2)',
                    }}
                  >
                    <Wallet size={16} className="text-amber-400" />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.25em] text-white/30 font-bold flex items-center gap-1">
                      <TrendingUp size={9} />
                      Balance
                    </p>
                    <motion.p
                      className="text-lg font-black"
                      style={{
                        backgroundImage: 'linear-gradient(135deg, #d4a843 0%, #f0d78c 50%, #d4a843 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                      key={bankroll}
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                    >
                      {formatMoney(bankroll)}
                    </motion.p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Main content */}
          <motion.div
            className="relative z-10 flex flex-col items-center gap-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Logo / Title */}
            <div className="text-center">
              <motion.div
                className="mb-4 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: 2, repeatDelay: 5 }}
              >
                <Spade className="w-16 h-16 mx-auto fill-current" />
              </motion.div>
              <h1
                className="text-5xl font-black text-transparent bg-clip-text"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #d4a843 0%, #f0d78c 50%, #d4a843 100%)',
                }}
              >
                BLACKJACK
              </h1>
              <p className="text-white/30 text-sm tracking-[0.5em] uppercase mt-2 font-medium">
                Premium Casino Experience
              </p>
            </div>

            {/* Subtitle */}
            <p className="text-white/40 text-center max-w-md text-sm leading-relaxed">
              Multi-hand Blackjack with realistic 6-deck shoe.
              Choose your table and play like a high roller.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col items-center gap-4">
              {/* Play Button */}
              <motion.button
                onClick={() => router.push('/lobby')}
                className="px-12 py-4 rounded-full font-extrabold text-lg uppercase tracking-[0.2em] cursor-pointer
                            bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-black
                            shadow-[0_0_40px_rgba(212,168,67,0.3)] hover:shadow-[0_0_60px_rgba(212,168,67,0.5)]
                            transition-all duration-500"
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                🎰 Enter Lobby
              </motion.button>

              {/* Secondary buttons row */}
              <div className="flex items-center gap-3">
                {/* Quick Play */}
                <motion.button
                  onClick={() => router.push('/game/classic')}
                  className="text-white/30 text-xs uppercase tracking-[0.3em] hover:text-white/60 transition-colors cursor-pointer"
                  whileHover={{ y: -2 }}
                >
                  Quick Play →
                </motion.button>

                <span className="text-white/10 text-xs">|</span>

                {/* Strategy Button */}
                <motion.button
                  onClick={() => setShowStrategy(true)}
                  className="flex items-center gap-1.5 text-amber-400/50 text-xs uppercase tracking-[0.2em] hover:text-amber-400/90 transition-all cursor-pointer"
                  whileHover={{ y: -2 }}
                >
                  <BookOpen size={13} />
                  Strategy Guide
                </motion.button>
              </div>
            </div>

            {/* Room selector for strategy (only when modal open) */}
            {/* Inline strategy room picker chips */}
          </motion.div>

          {/* ─── Strategy Modal ─── */}
          <AnimatePresence>
            {showStrategy && (
              <div className="fixed inset-0 z-[200]">
                {/* Room selector floating above modal */}
                <motion.div
                  className="absolute top-8 left-8 z-[210] flex flex-col items-start gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {(['classic', 'vegas_strip', 'vegas_downtown'] as const).map((roomId) => {
                    const room = ROOMS[roomId];
                    const isActive = selectedRoom === roomId;
                    return (
                      <button
                        key={roomId}
                        onClick={() => setSelectedRoom(roomId)}
                        className="px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                        style={{
                          background: isActive
                            ? `linear-gradient(135deg, ${room.accentColor} 0%, ${room.accentColor}cc 100%)`
                            : 'rgba(255,255,255,0.06)',
                          color: isActive ? '#000' : 'rgba(255,255,255,0.4)',
                          border: `1px solid ${isActive ? room.accentColor : 'rgba(255,255,255,0.1)'}`,
                          boxShadow: isActive ? `0 0 20px ${room.accentColor}40` : 'none',
                        }}
                      >
                        <Sparkles size={11} className="inline mr-1" style={{ opacity: isActive ? 1 : 0.3 }} />
                        {room.name}
                      </button>
                    );
                  })}
                </motion.div>

                <StrategyModal
                  room={ROOMS[selectedRoom]}
                  onClose={() => setShowStrategy(false)}
                />
              </div>
            )}
          </AnimatePresence>

          {/* Bottom decoration */}
          <div className="absolute bottom-6 text-center space-y-2">
            <p className="text-white/10 text-[10px] uppercase tracking-[0.3em]">
              18+ Simulated Gambling • Offline • No Real Money • For Entertainment &amp; Education Only
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => router.push('/privacy')}
                className="text-white/20 text-[10px] hover:text-white/50 transition-colors cursor-pointer underline underline-offset-2"
              >
                Privacy Policy
              </button>
              <span className="text-white/10 text-[10px]">•</span>
              <button
                onClick={() => router.push('/terms')}
                className="text-white/20 text-[10px] hover:text-white/50 transition-colors cursor-pointer underline underline-offset-2"
              >
                Terms of Service
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
