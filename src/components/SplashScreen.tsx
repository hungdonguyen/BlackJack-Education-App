'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { useStoreHydration } from '@/hooks/useGameStore';
import { hasAudioUserActivation, primeBGMEngine } from '@/utils/bgm';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [logoVisible, setLogoVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [awaitingContinueClick, setAwaitingContinueClick] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const isHydrated = useStoreHydration();
  const isHydratedRef = useRef(isHydrated);
  isHydratedRef.current = isHydrated;

  useEffect(() => {
    primeBGMEngine();
    const syncActivationState = () => {
      setAudioUnlocked(hasAudioUserActivation());
    };

    syncActivationState();
    window.addEventListener('bgm_audio_unlocked', syncActivationState);
    window.addEventListener('pointerdown', syncActivationState, { capture: true });
    window.addEventListener('keydown', syncActivationState, { capture: true });

    return () => {
      window.removeEventListener('bgm_audio_unlocked', syncActivationState);
      window.removeEventListener('pointerdown', syncActivationState, { capture: true });
      window.removeEventListener('keydown', syncActivationState, { capture: true });
    };
  }, []);
  
  useEffect(() => {
    const minDuration = 2800; // Minimum load time to see the animation
    const start = Date.now();
    let hasCompleted = false;

    // Wait slightly before fading in logo
    const t1 = setTimeout(() => {
      setLogoVisible(true);
    }, 400);

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const isReadyNow = isHydratedRef.current && document.readyState === 'complete';
      
      let p = Math.floor((elapsed / minDuration) * 100);
      
      if (!isReadyNow && p >= 90) {
        // Stall at 90-95% if not completely ready
        p = 90 + Math.floor((elapsed - minDuration * 0.9) / 800);
        if (p > 95) p = 95;
      }

      if (p >= 100) {
        // Ensure cap at 100 if ready
        p = isReadyNow ? 100 : 99;
      }

      setProgress(p);

      if (p === 100 && isReadyNow && !hasCompleted) {
        hasCompleted = true;
        setAwaitingContinueClick(true);
      }
    }, 50);

    return () => {
      clearInterval(interval);
      clearTimeout(t1);
    };
  }, []);

  const handleContinue = () => {
    if (!awaitingContinueClick || isExiting) return;
    setIsExiting(true);
    setLogoVisible(false);
    setTimeout(() => {
      onComplete();
    }, 800);
  };

  return (
    <motion.div
      key="splash-screen"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      className={`fixed inset-0 z-[99999] flex items-center justify-center bg-white ${awaitingContinueClick ? 'cursor-pointer' : ''}`}
      onPointerDown={handleContinue}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: logoVisible ? 1 : 0, scale: logoVisible ? 1 : 0.95 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        className="relative w-[280px] h-[280px] md:w-[400px] md:h-[400px]"
      >
        <Image
          src="/images/logo_company.png"
          alt="Company Logo"
          fill
          className="object-contain"
          priority
        />
      </motion.div>

      {/* Pixel Loading Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: logoVisible ? 1 : 0, y: logoVisible ? 0 : 10 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="absolute bottom-16 md:bottom-24 left-1/2 -translate-x-1/2 flex flex-col items-start w-[240px]"
      >
        <div 
          className="flex justify-between w-full text-black mb-1 px-1 text-sm md:text-base font-black tracking-[0.08em]"
          style={{ fontFamily: '"Arial Black", "Segoe UI", Arial, sans-serif' }}
        >
          <span>LOADING...</span>
          <span>{progress}%</span>
        </div>
        
        {/* Pixel style bar container */}
        <div 
          className="bg-white"
          style={{
            border: '4px solid black',
            borderRadius: '8px', /* Thicker rounded corners for pixel vibe */
            width: '240px',
            height: '28px',
            padding: '3px',
            boxShadow: '4px 4px 0px rgba(0,0,0,0.15)' /* Subtle drop shadow */
          }}
        >
          <div className="flex w-full h-full gap-1">
            {Array.from({ length: 12 }).map((_, i) => {
              const activeSegments = Math.round((progress / 100) * 12);
              return (
                <div 
                  key={i} 
                  className={`flex-1 h-full rounded-[2px] ${i < activeSegments ? 'bg-black' : 'bg-transparent'}`}
                  style={{ transition: 'background-color 0.15s ease' }}
                />
              )
            })}
          </div>
        </div>

        {awaitingContinueClick && (
          <p
            className="mt-2 px-1 text-[10px] md:text-[11px] font-black tracking-[0.12em] uppercase"
            style={{
              fontFamily: '"Arial Black", "Segoe UI", Arial, sans-serif',
              color: audioUnlocked ? '#0b8f4f' : 'rgba(0,0,0,0.72)',
            }}
          >
            {'Click anywhere to countinue'}
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
