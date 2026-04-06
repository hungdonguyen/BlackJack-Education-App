'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [logoVisible, setLogoVisible] = useState(false);
  
  useEffect(() => {
    // Wait slightly before fading in logo
    const t1 = setTimeout(() => {
      setLogoVisible(true);
    }, 400);
    
    // Hide logo after reading time
    const t2 = setTimeout(() => {
      setLogoVisible(false);
    }, 2400);

    // Call onComplete to unmount whole splash smoothly
    const t3 = setTimeout(() => {
      onComplete();
    }, 3200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <motion.div
      key="splash-screen"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-white"
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
    </motion.div>
  );
}
