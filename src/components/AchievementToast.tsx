'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { useGameStore } from '@/hooks/useGameStore';
import { ACHIEVEMENT_MAP, TIER_CONFIG } from '@/types/achievements';

/**
 * Steam-style achievement unlock notification toast.
 * Slides in from bottom-right and handles multiple notifications via a queue.
 */
export const AchievementToast: React.FC = () => {
  const achievementToastQueue = useGameStore(s => s.achievementToastQueue);
  const dismissAchievementToast = useGameStore(s => s.dismissAchievementToast);
  const [currentId, setCurrentId] = useState<string | null>(null);

  // Effect 1: Handle picking the next item from the queue
  useEffect(() => {
    if (achievementToastQueue.length > 0 && !currentId) {
      setCurrentId(achievementToastQueue[0]);
    }
  }, [achievementToastQueue, currentId]);

  // Effect 2: Handle the auto-dismiss timer for the current notification
  useEffect(() => {
    if (!currentId) return;

    const timer = setTimeout(() => {
      handleDismiss();
    }, 4000);

    return () => clearTimeout(timer);
  }, [currentId]);

  const handleDismiss = () => {
    setCurrentId(null);
    // Use a small timeout to let the exit animation finish before removing from queue
    setTimeout(() => {
      dismissAchievementToast();
    }, 300);
  };

  const achievement = currentId ? ACHIEVEMENT_MAP[currentId] : null;
  const tier = achievement ? TIER_CONFIG[achievement.tier] : null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none">
      <AnimatePresence>
        {achievement && tier && (
          <motion.div
            initial={{ x: 400, opacity: 0, scale: 0.8 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: 400, opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="pointer-events-auto flex items-center gap-4 p-4 rounded-xl border border-white/10 shadow-2xl backdrop-blur-xl bg-black/80 min-w-[320px] max-w-[400px]"
            style={{
              boxShadow: `0 10px 40px -10px ${tier.glow}, 0 0 20px rgba(0,0,0,0.5)`,
            }}
          >
            {/* Achievement Icon / Badge Placeholder */}
            <div 
              className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center border-2"
              style={{ 
                borderColor: tier.color,
                background: tier.bg,
                boxShadow: `inset 0 0 10px ${tier.glow}`
              }}
            >
              {achievement.icon ? (
                <img 
                  src={achievement.icon} 
                  alt={achievement.name}
                  className="w-full h-full object-cover rounded-full p-0.5"
                />
              ) : (
                <Trophy size={24} style={{ color: tier.color }} />
              )}
            </div>

            <div className="flex-grow min-w-0">
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="text-[10px] uppercase tracking-wider font-bold opacity-50">
                  Achievement Unlocked
                </span>
                <span 
                  className="text-[10px] uppercase tracking-wider font-black px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: tier.color, color: 'black' }}
                >
                  {tier.label}
                </span>
              </div>
              <h3 className="text-white font-bold text-sm truncate uppercase tracking-tighter">
                {achievement.name}
              </h3>
              <p className="text-white/60 text-xs line-clamp-1 italic">
                {achievement.description}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
