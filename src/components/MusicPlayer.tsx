'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Disc, SkipForward, SkipBack } from 'lucide-react';
import { useBGM } from '@/utils/bgm';
import { useGameStore } from '@/hooks/useGameStore';

interface MusicPlayerProps {
    roomId: string;
}

export const MusicPlayer: React.FC<MusicPlayerProps> = ({ roomId }) => {
    const musicEnabled = useGameStore((state) => state.musicEnabled);
    const { changeTrack, currentTrackName, playlist } = useBGM(roomId);

    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [localRotation, setLocalRotation] = useState(0);

    const handleWheel = (e: React.WheelEvent) => {
        setIsScrolling(true);
        if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);

        scrollTimerRef.current = setTimeout(() => {
            setIsScrolling(false);
        }, 1200);

        if (e.deltaY > 0) {
            changeTrack(1);
            setLocalRotation(prev => prev + 45);
        } else {
            changeTrack(-1);
            setLocalRotation(prev => prev - 45);
        }
    };

    const currentTrackIndex = playlist.findIndex(t => t.name === currentTrackName);

    return (
        <div
            className={`relative flex items-center justify-end h-[70px] pointer-events-auto pr-2 transition-opacity duration-500 ${!musicEnabled ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}
            onWheel={handleWheel}
        >
            {/* Scroll Interaction Wheel / Vortex */}
            <AnimatePresence>
                {isScrolling && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, x: 20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.8, x: 20 }}
                        className="absolute right-[100%] mr-4 flex flex-col items-end gap-1 pointer-events-none"
                    >
                        <div className="text-[10px] font-bold text-amber-400/60 uppercase tracking-widest mb-1">Playlist Scroll</div>
                        {[-2, -1, 0, 1, 2].map((offset) => {
                            const idx = (currentTrackIndex + offset + playlist.length) % playlist.length;
                            const track = playlist[idx];
                            const isCurrent = offset === 0;

                            return (
                                <motion.div
                                    key={`${track.name}-${offset}`}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{
                                        opacity: isCurrent ? 1 : 0.3,
                                        x: 0,
                                        scale: isCurrent ? 1.1 : 0.85,
                                    }}
                                    className={`text-[11px] font-bold whitespace-nowrap px-3 py-1 rounded-sm ${isCurrent ? 'bg-amber-400/20 text-amber-400 border-r-2 border-amber-400' : 'text-white/40'
                                        }`}
                                >
                                    {track.name}
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Widget Container */}
            <motion.div
                className={`flex items-center gap-4 bg-black/50 backdrop-blur-xl border border-white/10 rounded-full pl-3 pr-6 py-2.5 shadow-[0_0_30px_rgba(0,0,0,0.5)] cursor-pointer hover:bg-black/70 transition-all group relative overflow-hidden`}
                onClick={() => changeTrack(1)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                {/* Visual Feedback on scroll */}
                <AnimatePresence>
                    {isScrolling && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-amber-400"
                        />
                    )}
                </AnimatePresence>

                {/* Spinning Disc / Wheel */}
                <div className="relative flex items-center justify-center">
                    <motion.div
                        animate={{ rotate: isScrolling ? localRotation : [localRotation, localRotation + 360] }}
                        transition={isScrolling
                            ? { type: 'spring', stiffness: 200, damping: 20 }
                            : { duration: 4, repeat: musicEnabled ? Infinity : 0, ease: "linear" }
                        }
                        className="text-white group-hover:text-amber-400 transition-colors"
                    >
                        <Disc size={32} strokeWidth={1.5} />
                    </motion.div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-2 h-2 bg-black rounded-full border border-white/20" />
                    </div>

                    {/* Direction Indicators */}
                    <div className="absolute -right-3 flex flex-col gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <SkipForward size={10} className="text-amber-400 animate-pulse" />
                    </div>
                </div>

                {/* Track Info */}
                <div className="flex flex-col min-w-[120px]">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-black leading-none mb-1">
                        {musicEnabled ? 'Music Engine' : 'Audio Muted'}
                    </span>
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-[13px] font-black text-white tracking-wide truncate">
                            {currentTrackName}
                        </span>
                        <div className="flex items-center gap-0.5">
                            <motion.div
                                animate={musicEnabled ? { scaleY: [1, 2.2, 1.2, 1.8, 1] } : { scaleY: 1 }}
                                transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
                                className="w-0.5 h-3 bg-amber-400/60 rounded-full origin-bottom"
                            />
                            <motion.div
                                animate={musicEnabled ? { scaleY: [1, 1.8, 2.5, 1.4, 1] } : { scaleY: 1 }}
                                transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut", delay: 0.2 }}
                                className="w-0.5 h-2 bg-amber-400/40 rounded-full origin-bottom"
                            />
                            <motion.div
                                animate={musicEnabled ? { scaleY: [1, 2.8, 1.5, 2.2, 1] } : { scaleY: 1 }}
                                transition={{ repeat: Infinity, duration: 0.9, ease: "easeInOut", delay: 0.1 }}
                                className="w-0.5 h-4 bg-amber-400/80 rounded-full origin-bottom"
                            />
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
