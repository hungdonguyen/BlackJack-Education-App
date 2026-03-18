'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, Lock, CheckCircle2, Star, Zap, Flame, Repeat, Info } from 'lucide-react';
import { useGameStore } from '@/hooks/useGameStore';
import { ACHIEVEMENTS, TIER_CONFIG, AchievementDefinition } from '@/types/achievements';

interface AchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AchievementModal: React.FC<AchievementModalProps> = ({ isOpen, onClose }) => {
  const unlockedAchievements = useGameStore(s => s.unlockedAchievements);
  const [activeCategory, setActiveCategory] = useState<'all' | 'general' | 'mastery' | 'daily' | 'variant'>('all');

  const filteredAchievements = ACHIEVEMENTS.filter(a => 
    activeCategory === 'all' || a.category === activeCategory
  );

  const unlockedCount = ACHIEVEMENTS.reduce((acc, a) => acc + (unlockedAchievements[a.id] ? 1 : 0), 0);
  const totalCount = ACHIEVEMENTS.length;
  const progressPercent = (unlockedCount / totalCount) * 100;

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
        className="relative w-full max-w-6xl h-full max-h-[85vh] bg-[#0c0c0c] border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,1)]"
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
                  className={`group relative p-4 rounded-xl border transition-all duration-500 flex items-center gap-4 ${
                    isUnlocked 
                      ? 'bg-white/[0.03] border-white/10 hover:border-white/20' 
                      : 'bg-transparent border-white/5 opacity-60'
                  }`}
                >
                  {/* Badge */}
                  <div className="relative flex-shrink-0">
                    <div 
                      className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-700 ${
                        isUnlocked ? '' : 'grayscale opacity-40 grayscale-[80%]'
                      }`}
                      style={{ 
                        borderColor: isUnlocked ? tier.color : 'rgba(255,255,255,0.1)',
                        background: isUnlocked ? tier.bg : 'transparent',
                        boxShadow: isUnlocked ? `0 0 20px ${tier.glow}` : 'none'
                      }}
                    >
                      {isUnlocked ? (
                        achievement.icon ? (
                          <img 
                            src={achievement.icon} 
                            alt={achievement.name}
                            className="w-full h-full object-cover rounded-full p-0.5"
                          />
                        ) : (
                          <Star size={24} style={{ color: tier.color }} fill={tier.color} className="animate-pulse" />
                        )
                      ) : (
                        <Lock size={20} className="text-white/20" />
                      )}
                    </div>
                    {isUnlocked && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-black border-2 border-black">
                        <CheckCircle2 size={14} strokeWidth={4} />
                      </div>
                    )}
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
                    
                    {isUnlocked && unlockedAchievements[achievement.id] && (
                      <div className="mt-2 text-[8px] font-bold text-white/20 uppercase tracking-widest">
                        Earned: {new Date(unlockedAchievements[achievement.id]).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* Hover Decoration */}
                  {isUnlocked && (
                    <div 
                      className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none"
                      style={{ background: `radial-gradient(circle at center, ${tier.color} 0%, transparent 70%)` }}
                    />
                  )}
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
      </motion.div>
    </div>
  );
};
