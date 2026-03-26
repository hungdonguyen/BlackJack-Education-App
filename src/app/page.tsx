'use client';

// ============================================
// Home Page — Premium Landing
// ============================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Wallet, BookOpen, Sparkles, Zap, Trophy, Gift } from 'lucide-react';
import appIcon from '../../src-tauri/icons/icon.png';
import { ROOMS } from '@/utils/rooms';
import LegalAgreementModal from '@/components/LegalAgreementModal';
import StrategyModal from '@/components/StrategyModal';
import { useGameStore, useStoreHydration } from '@/hooks/useGameStore';
import { useAudio } from '@/utils/audio';
import { MusicPlayer } from '@/components/MusicPlayer';
import { AchievementModal } from '@/components/AchievementModal';
import { AchievementToast } from '@/components/AchievementToast';
import { DailyClaimModal } from '@/components/DailyClaimModal';
import SettingsModal from '@/components/SettingsModal';

const STRATEGY_ROOM_IDS = [
  'madness_21',
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
  const [showDailyClaim, setShowDailyClaim] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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
      className="relative w-screen min-h-screen flex flex-col items-center overflow-x-hidden overflow-y-auto select-none"
      style={{
        background: 'radial-gradient(ellipse 120% 100% at 50% 30%, #301a10 0%, #1a0e0a 40%, #0d0705 100%)',
      }}
    >
      {/* Balance Badge — top left */}
      {isHydrated && (
        <div className="absolute top-6 left-6 z-20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-xl cursor-default"
          >
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-amber-500/10 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
              <Wallet size={14} className="text-amber-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-white/50 font-bold">Balance</span>
              <motion.span
                className="text-sm font-black"
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
              </motion.span>
            </div>
          </motion.div>
        </div>
      )}

      {/* Music Player — top right */}
      <div className="absolute top-6 right-6 z-20 flex items-center pr-2">
        <MusicPlayer roomId="lobby" />
      </div>

      <AnimatePresence>
        {showSettings && (
          <SettingsModal
            roomId="lobby"
            accentColor="#d4a843"
            borderColor="rgba(212, 168, 67, 0.3)"
            isFullscreen={false}
            onClose={() => setShowSettings(false)}
            onToggleFullscreen={() => {}}
            onSaveAndExit={() => setShowSettings(false)}
          />
        )}
      </AnimatePresence>

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


          {/* Main content wrapper */}
          <div className="flex-1 flex flex-col items-center justify-center w-full max-w-3xl px-4 pt-24 pb-8 relative z-10 min-h-[max-content]">
            <motion.div
              className="flex flex-col items-center gap-4 w-full my-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
            {/* Logo / Title */}
            <div className="text-center">
              <motion.div
                className="mb-4 mx-auto relative"
                style={{ width: 140, height: 140 }}
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
                className="text-4xl md:text-5xl font-black text-transparent bg-clip-text"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #d4a843 0%, #f0d78c 50%, #d4a843 100%)',
                }}
              >
                BLACKJACK
              </h1>
              <p className="text-white/30 text-xs tracking-[0.5em] uppercase mt-2 font-medium">
                Premium Casino Experience
              </p>
            </div>

            {/* Subtitle */}
            <p className="text-white/40 text-center max-w-lg text-xs leading-relaxed px-4">
              A premium Blackjack simulator with realistic casino logic and diverse rulesets.
              Practice optimal strategies, track your progress, and master the game in a risk-free environment.
            </p>

            {/* Action Cards (Bento Grid) */}
            <div className="w-full max-w-2xl px-4 mt-2">
              {/* Top Row: Main Actions */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3">
                
                {/* Enter Lobby - Hero Card */}
                <motion.div
                  className="col-span-1 md:col-span-8"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <button
                    onClick={() => { playSound('click'); router.push('/lobby'); }}
                    className="group relative w-full h-full min-h-[100px] rounded-3xl overflow-hidden cursor-pointer flex items-center justify-between px-6 py-5 text-left transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: 'linear-gradient(135deg, #d4a843 0%, #f0d78c 50%, #b38b34 100%)',
                      boxShadow: '0 10px 40px -10px rgba(212,168,67,0.5), inset 0 2px 0 rgba(255,255,255,0.4)',
                    }}
                  >
                    {/* Dark overlay pattern */}
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none" />
                    
                    {/* Animated glow */}
                    <div className="absolute -inset-[100%] animate-[spin_10s_linear_infinite] opacity-30 bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] pointer-events-none" />
                    
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-1">
                        <Sparkles size={16} className="text-black/70 fill-current animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-black/60 bg-black/5 px-2 py-1 rounded-md">
                          Premium Access
                        </span>
                      </div>
                      <h2 className="text-2xl font-black text-black tracking-tight leading-none uppercase">
                        Join Lobby
                      </h2>
                    </div>
                    
                    <div className="relative z-10 w-10 h-10 rounded-full bg-black/10 backdrop-blur-sm flex items-center justify-center border border-black/10 group-hover:bg-black/20 group-hover:translate-x-2 transition-all">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </button>
                </motion.div>

                {/* Tutorial Card */}
                <motion.div
                  className="col-span-1 md:col-span-4 h-full"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.45, duration: 0.5 }}
                >
                  <button
                    onClick={() => { playSound('click'); router.push('/tutorial-lobby'); }}
                    className="group relative flex flex-col items-center justify-center gap-2 w-full h-full min-h-[100px] rounded-3xl cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-[rgba(255,255,255,0.05)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(255,255,255,0.05)] text-white/70">
                      <BookOpen size={18} className="group-hover:fill-white/20" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/70 group-hover:text-white transition-colors text-center w-full">Tutorial</span>
                  </button>
                </motion.div>
              </div>

              {/* Bottom Row: 5 Feature Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                
                {/* Quick Play */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}
                  onClick={() => { playSound('click'); router.push('/game/classic'); }}
                  className="group relative flex flex-col items-center justify-center gap-2 p-4 rounded-3xl cursor-pointer transition-all hover:-translate-y-1 active:scale-[0.96] overflow-hidden"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(255,255,255,0.05)] text-white/70">
                    <Zap size={18} className="group-hover:fill-white/20" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/70 group-hover:text-white transition-colors text-center w-full">Quick Play</span>
                </motion.button>

                {/* Strategy Guide */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }}
                  onClick={() => { playSound('click'); setShowStrategy(true); }}
                  className="group relative flex flex-col items-center justify-center gap-2 p-4 rounded-3xl cursor-pointer transition-all hover:-translate-y-1 active:scale-[0.96] overflow-hidden"
                  style={{
                    background: 'linear-gradient(180deg, rgba(212,168,67,0.05) 0%, rgba(30,20,10,0.5) 100%)',
                    border: '1px solid rgba(212,168,67,0.15)',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(212,168,67,0.1)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="w-10 h-10 rounded-2xl bg-[rgba(212,168,67,0.1)] flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(212,168,67,0.15)] text-[#d4a843]">
                    <BookOpen size={18} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#d4a843]/80 group-hover:text-[#d4a843] transition-colors text-center w-full">Strategy</span>
                </motion.button>

                {/* Daily Claim */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.5 }}
                  onClick={() => { playSound('click'); setShowDailyClaim(true); }}
                  className="group relative flex flex-col items-center justify-center gap-2 p-4 rounded-3xl cursor-pointer transition-all hover:-translate-y-1 active:scale-[0.96] overflow-hidden"
                  style={{
                    background: 'linear-gradient(180deg, rgba(245,158,11,0.05) 0%, rgba(245,158,11,0.01) 100%)',
                    border: '1px solid rgba(245,158,11,0.2)',
                  }}
                >
                  <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.2),transparent_60%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  
                  {/* Notification Dot */}
                  <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#facc15] animate-ping" />
                  
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(245,158,11,0.15)] text-amber-500">
                    <Gift size={18} className="group-hover:fill-amber-500/20" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-500/80 group-hover:text-amber-500 transition-colors text-center w-full">Claim</span>
                </motion.button>

                {/* Achievements */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.5 }}
                  onClick={() => { playSound('click'); setShowAchievements(true); }}
                  className="group relative flex flex-col items-center justify-center gap-2 p-4 rounded-3xl cursor-pointer transition-all hover:-translate-y-1 active:scale-[0.96] overflow-hidden"
                  style={{
                    background: 'linear-gradient(180deg, rgba(168,85,247,0.05) 0%, rgba(168,85,247,0.01) 100%)',
                    border: '1px solid rgba(168,85,247,0.2)',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(168,85,247,0.1)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(168,85,247,0.15)] text-purple-400">
                    <Trophy size={18} className="group-hover:fill-purple-500/20" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-purple-400/80 group-hover:text-purple-400 transition-colors text-center w-full">Trophies</span>
                </motion.button>

                {/* Settings */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.5 }}
                  onClick={() => { playSound('click'); setShowSettings(true); }}
                  className="group relative flex flex-col items-center justify-center gap-2 p-4 rounded-3xl cursor-pointer transition-all hover:-translate-y-1 active:scale-[0.96] overflow-hidden col-span-2 lg:col-span-1"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-[rgba(255,255,255,0.05)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(255,255,255,0.05)] text-white/70">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings group-hover:rotate-45 transition-transform duration-500">
                      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/70 group-hover:text-white transition-colors text-center w-full">Settings</span>
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
                  className="absolute top-4 left-1/2 z-[210] flex max-w-[calc(100vw-1.5rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/35 px-3 py-3 backdrop-blur-md md:top-24 md:left-8 md:max-w-[240px] md:translate-x-0 md:flex-col md:items-start md:justify-start md:gap-3"
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
          
          {/* ─── Daily Claim Modal ─── */}
          <AnimatePresence>
            {showDailyClaim && (
              <DailyClaimModal
                isOpen={showDailyClaim}
                onClose={() => setShowDailyClaim(false)}
              />
            )}
          </AnimatePresence>

          {/* Bottom decoration */}
          <div className="mt-8 pt-4 pb-2 text-center w-full max-w-4xl relative z-10 shrink-0">
            <p className="text-white/30 text-[10px] uppercase tracking-[0.3em] mb-2">
              18+ Simulated Gambling • Offline • No Real Money • For Entertainment &amp; Education Only
            </p>
            <div className="text-[8px] text-white/10 leading-tight uppercase tracking-widest mb-3">
              Audio Credits: Music by Kevin MacLeod & Audionautix.com · SFX by Kenney.nl
            </div>
            <div className="flex items-center justify-center gap-4">
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
          </div>
        </>
      )}
    </div>
  );
}
