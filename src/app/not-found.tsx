'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, LayoutGrid, AlertTriangle } from 'lucide-react';
import { ShinyText } from '@/components/reactbits';
import { toAppHref } from '@/utils/platform';
import { useAudio } from '@/utils/audio';

export default function NotFound() {
    const router = useRouter();
    const { playSound } = useAudio();

    return (
        <div 
            className="relative w-screen h-screen overflow-hidden flex flex-col items-center justify-center select-none p-6"
            style={{
                background: 'radial-gradient(ellipse 120% 100% at 50% 30%, #301a10 0%, #1a0e0a 45%, #0d0705 100%)',
            }}
        >
            {/* Ambient Casino Lighting */}
            <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(circle 500px at 50% 50%, rgba(212, 168, 67, 0.08) 0%, transparent 70%)',
                }}
            />

            {/* Glowing 404 Card Visual */}
            <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto"
            >
                {/* Playing Card Icon Badge */}
                <div className="relative mb-6">
                    <motion.div
                        animate={{ rotate: [-4, 4, -4] }}
                        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-24 h-32 rounded-2xl bg-gradient-to-br from-[#2a170e] to-[#120a06] border-2 border-amber-400/40 shadow-[0_0_40px_rgba(212,168,67,0.25)] flex flex-col items-center justify-between p-3.5 relative overflow-hidden"
                    >
                        <div className="flex justify-between w-full text-amber-400 font-black text-xs">
                            <span>4</span>
                            <span className="text-red-500">♠</span>
                        </div>
                        <div className="text-3xl font-black text-amber-400/80 my-auto">
                            0
                        </div>
                        <div className="flex justify-between w-full text-amber-400 font-black text-xs rotate-180">
                            <span>4</span>
                            <span className="text-red-500">♠</span>
                        </div>
                    </motion.div>
                </div>

                {/* 404 Headline */}
                <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={20} className="text-amber-400" />
                    <span className="text-xs font-black uppercase tracking-[0.3em] text-amber-400/80">
                        Error 404 · Table Busted
                    </span>
                </div>

                <ShinyText
                    text="TABLE NOT FOUND"
                    shineColor="#ffffff"
                    color="#f5d280"
                    speed={3}
                    className="text-4xl md:text-5xl font-black uppercase tracking-wider font-cinzel mb-4 drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]"
                />

                {/* Helpful Message */}
                <p className="text-stone-300 text-sm leading-relaxed max-w-[48ch] mb-8 font-medium">
                    The table or page you are looking for does not exist, has been closed, or the shoe has moved elsewhere.
                </p>

                {/* Navigation Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
                    {/* Primary Button: Return to Lobby */}
                    <button
                        onClick={() => { playSound('click'); router.push(toAppHref('/lobby')); }}
                        className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black text-xs uppercase tracking-[0.2em] shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:shadow-[0_0_35px_rgba(245,158,11,0.6)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2.5"
                    >
                        <LayoutGrid size={16} />
                        Enter Casino Lobby
                    </button>

                    {/* Secondary Button: Return Home */}
                    <button
                        onClick={() => { playSound('click'); router.push(toAppHref('/')); }}
                        className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2.5"
                    >
                        <Home size={16} className="text-amber-400" />
                        Return Home
                    </button>
                </div>
            </motion.div>

            {/* Footer Notice */}
            <div className="absolute bottom-6 text-[10px] text-stone-400 uppercase tracking-widest pointer-events-none">
                Educational Blackjack Simulator · 100% Risk Free
            </div>
        </div>
    );
}
