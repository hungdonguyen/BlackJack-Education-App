'use client';

// ============================================
// Home Page — Premium Landing
// ============================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Wallet, BookOpen, Sparkles, Zap, Trophy } from 'lucide-react';
import appIcon from '../../src-tauri/icons/icon.png';
import { ROOMS } from '@/utils/rooms';
import LegalAgreementModal from '@/components/LegalAgreementModal';
import StrategyModal from '@/components/StrategyModal';
import { useGameStore, useStoreHydration } from '@/hooks/useGameStore';
import { useAudio } from '@/utils/audio';
import { MusicPlayer } from '@/components/MusicPlayer';
import { AchievementModal } from '@/components/AchievementModal';
import { AchievementToast } from '@/components/AchievementToast'; // Though added to layout, keeping here if needed

const STRATEGY_ROOM_IDS = [
  'classic',
  'vegas_strip',
  'vegas_downtown',
  'free_action',
  'atlantic_city',
  'zapout_21',
  'exchange_21',
  'firecard_21',
  'iberian_21',
  'european',
  'uk',
] as const;

type StrategyRoomId = (typeof STRATEGY_ROOM_IDS)[number];

export default function HomePage() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [showStrategy, setShowStrategy] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<StrategyRoomId>('classic');

  const isHydrated = useStoreHydration();
  const bankroll = useGameStore((s) => s.bankroll);
  const { playSound } = useAudio();

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
      {/* Music Player — top right */}
      <div className="absolute top-6 right-6 z-20 flex items-center pr-2">
        <MusicPlayer roomId="lobby" />
      </div>

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

          {/* Decorative room logos floating */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Object.values(ROOMS).map((room, i) => (
              <motion.div
                key={room.id}
                className="absolute w-32 h-32 opacity-[0.06] blur-[2px]"
                style={{
                  left: `${(i % 4) * 22 + 8}%`,
                  top: `${Math.floor(i / 4) * 45 + 15}%`,
                  willChange: 'transform',
                }}
                animate={{ y: [0, -30, 0], rotate: [0, 8, -8, 0], scale: [1, 1.05, 1] }}
                transition={{ duration: 12 + (i % 3) * 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Image src={room.logoPath} fill alt={room.name} unoptimized className="object-contain" />
              </motion.div>
            ))}
          </div>


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
                className="mb-5 mx-auto relative"
                style={{ width: 168, height: 168 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                {/* Glow ring */}
                <motion.div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle, rgba(212,168,67,0.18) 0%, transparent 70%)',
                    filter: 'blur(12px)',
                    willChange: 'opacity',
                  }}
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                />
                <Image
                  src={appIcon}
                  alt="Blackjack Icon"
                  width={512}
                  height={512}
                  sizes="168px"
                  quality={100}
                  unoptimized
                  className="h-full w-full object-contain drop-shadow-[0_0_16px_rgba(212,168,67,0.32)]"
                  priority
                />
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
            <p className="text-white/40 text-center max-w-lg text-sm leading-relaxed px-4">
              A premium Blackjack simulator with realistic casino logic and diverse rulesets.
              Practice optimal strategies, track your progress, and master the game in a risk-free environment.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col items-center gap-6">
              {/* Balance Card — Moved here, above the button */}
              {isHydrated && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                >
                  <div
                    className="relative px-6 py-3 rounded-2xl backdrop-blur-md overflow-hidden min-w-[220px]"
                    style={{
                      background: 'linear-gradient(135deg, rgba(212, 168, 67, 0.08) 0%, rgba(30, 20, 10, 0.6) 100%)',
                      border: '1px solid rgba(212, 168, 67, 0.15)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)',
                    }}
                  >
                    <div className="flex items-center justify-center gap-3 relative z-10">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(135deg, rgba(212, 168, 67, 0.15) 0%, rgba(212, 168, 67, 0.05) 100%)',
                          border: '1px solid rgba(212, 168, 67, 0.2)',
                        }}
                      >
                        <Wallet size={14} className="text-amber-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/35 mb-1">
                          Balance
                        </p>
                        <motion.p
                          className="text-xl font-black"
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

              {/* Play Button */}
              <motion.button
                onClick={() => { playSound('click'); router.push('/lobby'); }}
                className="px-12 py-4 rounded-full font-extrabold text-lg uppercase tracking-[0.2em] cursor-pointer
                            bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-black
                            shadow-[0_0_40px_rgba(212,168,67,0.3)] hover:shadow-[0_0_60px_rgba(212,168,67,0.5)]
                            transition-all duration-500 flex items-center gap-3"
                whileHover={{ scale: 1.05, y: -3 }}
                whileTap={{ scale: 0.95 }}
              >
                <Sparkles size={22} className="fill-current animate-pulse" />
                Enter Lobby
              </motion.button>

              {/* Secondary buttons row */}
              <div className="flex items-center gap-3">
                {/* Quick Play */}
                <motion.button
                  onClick={() => { playSound('click'); router.push('/game/classic'); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-[0.2em] cursor-pointer transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: 'rgba(255,255,255,0.55)',
                  }}
                  whileHover={{ y: -2, scale: 1.04, backgroundColor: 'rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.85)' }}
                  whileTap={{ scale: 0.96 }}
                >
                  <Zap size={13} />
                  Quick Play
                </motion.button>
                {/* Strategy Button */}
                <motion.button
                  onClick={() => { playSound('click'); setShowStrategy(true); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-[0.2em] cursor-pointer transition-all"
                  style={{
                    background: 'linear-gradient(135deg, rgba(212,168,67,0.12) 0%, rgba(212,168,67,0.06) 100%)',
                    border: '1px solid rgba(212,168,67,0.25)',
                    color: 'rgba(212,168,67,0.7)',
                  }}
                  whileHover={{ y: -2, scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                >
                  <BookOpen size={13} />
                  Strategy Guide
                </motion.button>

                {/* Achievement Button */}
                <motion.button
                  onClick={() => { playSound('click'); setShowAchievements(true); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-[0.2em] cursor-pointer transition-all"
                  style={{
                    background: 'rgba(212,168,67,0.1)',
                    border: '1px solid rgba(212,168,67,0.3)',
                    color: '#d4a843',
                  }}
                  whileHover={{ y: -2, scale: 1.04, backgroundColor: 'rgba(212,168,67,0.15)' }}
                  whileTap={{ scale: 0.96 }}
                >
                  <Trophy size={13} fill="currentColor" />
                  Achievements
                </motion.button>

                {/* Tutorial Button */}
                <motion.button
                  onClick={() => { playSound('click'); router.push('/tutorial-lobby'); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-[0.2em] cursor-pointer transition-all"
                  style={{
                    background: 'rgba(99,102,241,0.1)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    color: '#818cf8',
                  }}
                  whileHover={{ y: -2, scale: 1.04, backgroundColor: 'rgba(99,102,241,0.15)' }}
                  whileTap={{ scale: 0.96 }}
                >
                  <BookOpen size={13} />
                  Tutorial
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
                  className="absolute top-4 left-1/2 z-[210] flex max-w-[calc(100vw-1.5rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/35 px-3 py-3 backdrop-blur-md md:top-8 md:left-8 md:max-w-[240px] md:translate-x-0 md:flex-col md:items-start md:justify-start md:gap-3"
                  initial={{ opacity: 0, y: -16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                >
                  {STRATEGY_ROOM_IDS.map((roomId) => {
                    const room = ROOMS[roomId];
                    const isActive = selectedRoom === roomId;
                    return (
                      <button
                        key={roomId}
                        onClick={() => { playSound('click'); setSelectedRoom(roomId); }}
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

          {/* ─── Achievement Modal ─── */}
          <AnimatePresence>
            {showAchievements && (
              <AchievementModal
                isOpen={showAchievements}
                onClose={() => setShowAchievements(false)}
              />
            )}
          </AnimatePresence>
          

          {/* Bottom decoration */}
          <div className="absolute bottom-6 text-center space-y-2">
            <p className="text-white/30 text-[10px] uppercase tracking-[0.3em]">
              18+ Simulated Gambling • Offline • No Real Money • For Entertainment &amp; Education Only
            </p>
            <div className="text-[8px] text-white/10 leading-tight uppercase tracking-widest">
              Audio Credits: Music by Kevin MacLeod & Audionautix.com · SFX by Kenney.nl
            </div>
            <div className="flex items-center justify-center gap-4 pt-1">
              <button
                onClick={() => { playSound('click'); router.push('/privacy'); }}
                className="text-white/20 text-[10px] hover:text-white/50 transition-colors cursor-pointer underline underline-offset-2"
              >
                Privacy Policy
              </button>
              <span className="text-white/10 text-[10px]">•</span>
              <button
                onClick={() => { playSound('click'); router.push('/terms'); }}
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
