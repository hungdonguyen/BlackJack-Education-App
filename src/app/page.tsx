'use client';

// ============================================
// Home Page — Premium Landing
// ============================================

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Spade } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none flex flex-col items-center justify-center"
      style={{
        background: 'radial-gradient(ellipse 120% 100% at 50% 30%, #301a10 0%, #1a0e0a 40%, #0d0705 100%)',
      }}
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 35%, rgba(212, 168, 67, 0.06) 0%, transparent 70%)',
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
            animate={{
              y: [0, -20, 0],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 6 + i,
              repeat: 1,
              ease: 'easeInOut',
            }}
          >
            {suit}
          </motion.span>
        ))}
      </div>

      {/* Main content */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-8"
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
          <h1 className="text-5xl font-black text-transparent bg-clip-text"
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

        {/* Quick play */}
        <motion.button
          onClick={() => router.push('/game/classic')}
          className="text-white/30 text-xs uppercase tracking-[0.3em] hover:text-white/60 transition-colors cursor-pointer"
          whileHover={{ y: -2 }}
        >
          or Quick Play →
        </motion.button>
      </motion.div>

      {/* Bottom decoration */}
      <div className="absolute bottom-6 text-center">
        <p className="text-white/10 text-[10px] uppercase tracking-[0.3em]">
          Offline • No Real Money • For Entertainment Only
        </p>
      </div>
    </div>
  );
}
