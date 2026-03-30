'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export const ROOM_LOGO_PATHS = [
  '/images/logo/rooms/atlantic.png',
  '/images/logo/rooms/classic.png',
  '/images/logo/rooms/european.png',
  '/images/logo/rooms/exchange21.png',
  '/images/logo/rooms/firecard21.png',
  '/images/logo/rooms/freeaction.png',
  '/images/logo/rooms/iberian21.png',
  '/images/logo/rooms/infinity_double_down.png',
  '/images/logo/rooms/uk_logo.png',
  '/images/logo/rooms/vegas_downtown.png',
  '/images/logo/rooms/vegas_strip.png',
  '/images/logo/rooms/zapout21.png',
] as const;

interface FloatingLogosBackdropProps {
  logoPaths?: readonly string[];
  rowCount?: number;
  opacityClassName?: string;
  className?: string;
}

export function FloatingLogosBackdrop({
  logoPaths = ROOM_LOGO_PATHS,
  rowCount = 5,
  opacityClassName = 'opacity-[0.12]',
  className = '',
}: FloatingLogosBackdropProps) {
  const repeatedLogos = [...logoPaths, ...logoPaths, ...logoPaths, ...logoPaths];

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      <div
        className={`absolute w-[200%] h-[150%] -top-[25%] -left-[50%] flex flex-col justify-center gap-16 -rotate-6 scale-110 ${opacityClassName}`}
      >
        {Array.from({ length: rowCount }).map((_, rowIndex) => (
          <motion.div
            key={`row-${rowIndex}`}
            className="flex items-center gap-24 whitespace-nowrap"
            animate={{ x: rowIndex % 2 === 0 ? ['0%', '-30%'] : ['-30%', '0%'] }}
            transition={{ duration: 100 + rowIndex * 15, repeat: Infinity, ease: 'linear' }}
          >
            {repeatedLogos.map((logoPath, i) => (
              <div key={`${logoPath}-${i}`} className="relative w-40 h-40 shrink-0">
                <Image src={logoPath} fill alt="Room Logo" unoptimized className="object-contain" />
              </div>
            ))}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
