'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, CheckCircle2, Trophy } from 'lucide-react';
import { useGameStore } from '@/hooks/useGameStore';
import { ACHIEVEMENTS, TIER_CONFIG, TIER_SORT_ORDER, AchievementDefinition } from '@/types/achievements';
import { useModalNavigation } from '@/hooks/useMenuNavigation';
import { CategoryIcon } from './CasinoIcons';

const ACHIEVEMENT_QUOTES: Record<string, string> = {
    first_hand: "The journey of a thousand miles begins with a single hand. — Unknown Dealer",
    natural_blackjack: "Blackjack is the only game where a true natural can beat the house. — Edward O. Thorp",
    double_trouble: "In blackjack, doubling down is the ultimate expression of confidence. — Don Johnson",
    split_victory: "Divide and conquer. A wise split is often the difference between walking away rich or broke. — Ken Uston",
    surrendered: "There is no shame in surrender; it's just math telling you to live to fight another hand. — Stanford Wong",
    win_streak_5: "Momentum is a fragile thing. When the cards are hot, you better be betting. — Stu Ungar",
    win_streak_10: "Once you're on a hot streak, the hardest thing is to know when to walk away. — Archie Karas",
    win_streak_20: "When luck meets strategy, you become an unstoppable force. — Blair Hull",
    low_bankroll: "A chip and a chair is all you need to mount a legendary comeback. — Jack Straus",
    all_in_glory: "Fortune favors the bold. Going all-in is the truest test of nerve. — Doyle Brunson",
    millionaire: "Money won is twice as sweet as money earned. — Paul Newman (The Color of Money)",
    billionaire: "To beat the casino, you have to think like the casino, and play like a titan. — Kerry Packer",
    perfect_strategy: "The house edge is beaten by discipline, memory, and an unwavering belief in math. — Richard Feynman",
    wins_100: "Winning 100 hands isn't just luck; it's the rhythm of a grinder. — David Sklansky",
    wins_500: "Professional play isn't glamorous; it’s a grind of perfect decisions over time. — Colin Jones",
    wins_1000: "Legends are made not in single sessions, but over ten thousand perfectly played hands. — Tommy Hyland",
    room_explorer: "Every casino tells a story, and every table has a lesson to teach. — Max Rubin",
    daily_regular: "Consistency is the hallmark of the unimaginative, but also the profitable. — Oscar Wilde",
    daily_devoted: "Show up every day, because you never know when the deck will favor you. — Unknown Grinder",
    daily_dedicated: "Dedication turns a gamble into an investment. — MIT Blackjack Team",
    daily_obsessed: "Belief in the math will carry you through the worst variance. — James Grosjean",
    daily_eternal: "Loyalty to the game brings its own rewards. — Arnold Snyder",
    zap_master: "Sometimes the best cards are the ones you erase from existence. — Card Conjurer",
    fire_walker: "When the deck catches fire, you must walk right through it. — Anonymous Advantage Player",
    switch_artist: "A good player adapts. A great player changes the entire hand to fit their needs. — Richard Epstein",
    free_deal: "The best things in life are free, especially free actions at a blackjack table. — European Casino Manager",
    iberian_king: "Three sevens is the mark of true royalty in the game of 21. — Spanish Proverb",
    bust_master: "Let the dealer hang themselves. It's the most beautiful sight in the casino. — John Tarne",
    insurance_pay: "Insurance is a sucker bet, unless you know exactly what is in the hole. — Lawrence Revere",
    multi_blackjack: "Two Blackjacks at once is a glitch in the matrix. — Anonymous Pit Boss",
    dealer_bust_22: "A dealer busting on 22 is a push that feels like a loss, unless you've laid a trap. — Casino Floor Regular",
    perfect_21_sum: "Finding 21 on all spots requires a zen-like connection to the shoe. — Asian Pit Boss",
    exact_zero: "Rising from exactly zero is the greatest comeback story ever told. — Stu Ungar",
    count_savant: "He's not gambling. He's doing math, and he's doing it perfectly. — Casino Surveillance",
};

interface AchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AchievementModal: React.FC<AchievementModalProps> = ({ isOpen, onClose }) => {
  const unlockedAchievements = useGameStore(s => s.unlockedAchievements);
  const [activeCategory, setActiveCategory] = useState<'all' | 'general' | 'mastery' | 'daily' | 'variant'>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<AchievementDefinition | null>(null);
  const [currentQuote, setCurrentQuote] = useState('');

  const filteredAchievements = ACHIEVEMENTS.filter(a => 
    activeCategory === 'all' || a.category === activeCategory
  ).sort((a, b) => TIER_SORT_ORDER[a.tier] - TIER_SORT_ORDER[b.tier]);

  const unlockedCount = ACHIEVEMENTS.reduce((acc, a) => acc + (unlockedAchievements[a.id] ? 1 : 0), 0);
  const totalCount = ACHIEVEMENTS.length;
  const progressPercent = (unlockedCount / totalCount) * 100;

  const categories = ['all', 'general', 'mastery', 'daily', 'variant'] as const;

  // Keyboard/gamepad: ←→ cycle categories, Escape close
  useModalNavigation({
    disabled: !isOpen,
    onClose: selectedAchievement ? () => setSelectedAchievement(null) : onClose,
    onPrev: () => {
      const idx = categories.indexOf(activeCategory);
      const prev = idx <= 0 ? categories.length - 1 : idx - 1;
      setActiveCategory(categories[prev]);
    },
    onNext: () => {
      const idx = categories.indexOf(activeCategory);
      const next = idx >= categories.length - 1 ? 0 : idx + 1;
      setActiveCategory(categories[next]);
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-6xl h-full max-h-[calc(100%-2rem)] bg-[#0c0c0c] border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,1)] md:max-h-[calc(100%-4rem)]"
      >
        {/* Header */}
        <div className="flex-shrink-0 p-6 border-b border-white/5 bg-gradient-to-r from-yellow-500/10 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
              <Trophy size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-2">
                Achievements <span className="text-yellow-500/50">Mastery</span>
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    className="h-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                  />
                </div>
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                  {unlockedCount} / {totalCount} UNLOCKED ({Math.round(progressPercent)}%)
                </span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all border border-white/10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation / Filters */}
        <div className="flex-shrink-0 px-6 py-4 flex items-center gap-2 border-b border-white/5 bg-white/[0.02] overflow-x-auto no-scrollbar">
          {(['all', 'general', 'mastery', 'daily', 'variant'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                activeCategory === cat 
                  ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]' 
                  : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Achievement Grid */}
        <div className="flex-grow overflow-y-auto p-6 custom-scrollbar bg-[#080808]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map((achievement) => {
              const isUnlocked = !!unlockedAchievements[achievement.id];
              const tier = TIER_CONFIG[achievement.tier];
              
              return (
                <motion.div
                  layout
                  key={achievement.id}
                  onClick={() => {
                      setSelectedAchievement(achievement);
                      setCurrentQuote(ACHIEVEMENT_QUOTES[achievement.id] || "Fortune favors the bold. — Virgil");
                  }}
                  className={`relative p-3 rounded-md border transition-all duration-300 flex items-center gap-4 cursor-pointer ${
                    isUnlocked 
                      ? 'bg-[#121212] border-white/10 hover:bg-[#1a1a1a] hover:border-white/20' 
                      : 'bg-transparent border-white/5 opacity-50 hover:bg-white/[0.02]'
                  }`}
                >
                  {/* Badge */}
                  <div className="relative flex-shrink-0">
                    <div 
                      className={`w-14 h-14 rounded-md flex items-center justify-center border transition-all duration-500 ${
                        isUnlocked ? 'bg-[#1c1c1c] border-white/10' : 'bg-[#0a0a0a] border-white/5'
                      }`}
                    >
                      {isUnlocked ? (
                        <CategoryIcon category={achievement.category} size={24} style={{ color: tier.color }} />
                      ) : (
                        <Lock size={20} className="text-white/20" />
                      )}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span 
                        className="text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded"
                        style={{ 
                          backgroundColor: isUnlocked ? tier.color : 'rgba(255,255,255,0.1)',
                          color: isUnlocked ? 'black' : 'rgba(255,255,255,0.3)'
                        }}
                      >
                        {tier.label}
                      </span>
                      {achievement.roomId && (
                        <span className="text-[8px] font-black uppercase text-white/30 border border-white/10 px-1 rounded">
                          {achievement.roomId.split('_')[0]}
                        </span>
                      )}
                    </div>
                    <h3 className={`text-sm font-bold truncate uppercase tracking-tight transition-colors ${
                      isUnlocked ? 'text-white' : 'text-white/30'
                    }`}>
                      {achievement.secret && !isUnlocked ? 'Secret Achievement' : achievement.name}
                    </h3>
                    <p className={`text-[11px] leading-tight line-clamp-2 italic ${
                      isUnlocked ? 'text-white/50' : 'text-white/10'
                    }`}>
                      {achievement.secret && !isUnlocked ? 'Unlock this to reveal the requirements.' : achievement.description}
                    </p>
                    
                    <div className="mt-2 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                       <span style={{ color: tier.color }}>{tier.label}</span>
                       <span className="text-white/30">•</span>
                       {isUnlocked && unlockedAchievements[achievement.id] ? (
                         <span className="text-green-500/80">
                           Unlocked {new Date(unlockedAchievements[achievement.id]).toLocaleDateString()}
                         </span>
                       ) : (
                         <span className="text-white/20">Locked</span>
                       )}
                    </div>
                  </div>


                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-white/5 bg-black/40 flex items-center justify-between px-8">
          <div className="flex gap-6">
            <div className="flex items-center gap-2 text-white/30">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-[10px] uppercase font-bold tracking-widest">Rarity Scale Mastery</span>
            </div>
          </div>
          <div className="text-[10px] text-white/20 font-medium uppercase tracking-[0.2em]">
            &copy; 2026 BlackJack Elite — Achievement Protocol
          </div>
        </div>
        
        {/* Achievement Details Overlay */}
        <AnimatePresence>
          {selectedAchievement && (() => {
            const isUnlocked = !!unlockedAchievements[selectedAchievement.id];
            const tier = TIER_CONFIG[selectedAchievement.tier];
            
            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-8"
              >
                <button
                  onClick={() => setSelectedAchievement(null)}
                  className="absolute top-6 right-6 w-12 h-12 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all border border-white/10"
                >
                  <X size={24} />
                </button>

                <div className="max-w-xl w-full flex flex-col items-center text-center">
                  <div 
                    className={`relative w-32 h-32 rounded-lg flex items-center justify-center border-2 mb-8 transition-all duration-500 ${
                      isUnlocked ? 'bg-[#1c1c1c] border-white/10' : 'bg-[#0a0a0a] border-white/5 opacity-50'
                    }`}
                  >
                    {isUnlocked ? (
                      <CategoryIcon category={selectedAchievement.category} size={56} style={{ color: tier.color }} />
                    ) : (
                      <Lock size={56} className="text-white/20" />
                    )}
                  </div>
                  
                  <span 
                    className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4"
                    style={{ 
                      backgroundColor: isUnlocked ? tier.color : 'rgba(255,255,255,0.1)',
                      color: isUnlocked ? 'black' : 'rgba(255,255,255,0.3)'
                    }}
                  >
                    {tier.label} {selectedAchievement.roomId ? `• ${selectedAchievement.roomId.split('_')[0]}` : ''}
                  </span>

                  <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">
                    {selectedAchievement.secret && !isUnlocked ? 'Secret Achievement' : selectedAchievement.name}
                  </h2>
                  
                  <p className="text-lg text-white/60 mb-8 italic">
                    {selectedAchievement.secret && !isUnlocked ? 'Unlock this to reveal the requirements.' : selectedAchievement.description}
                  </p>

                  <div className="w-full h-px bg-white/10 mb-8" />
                  
                  <div className="relative w-full p-6 rounded-2xl bg-white/5 border border-white/10 overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-white/80 leading-relaxed italic pr-8 relative z-10">
                       "{currentQuote}"
                    </p>
                  </div>

                  {isUnlocked && unlockedAchievements[selectedAchievement.id] && (
                    <div className="mt-8 flex items-center gap-2 text-white/40 font-bold uppercase tracking-widest text-xs">
                      <CheckCircle2 size={16} className="text-green-500" />
                      Unlocked on {new Date(unlockedAchievements[selectedAchievement.id]).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
