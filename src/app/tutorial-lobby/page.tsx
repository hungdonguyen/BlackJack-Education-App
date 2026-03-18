'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ChevronLeft, BookOpen, Star, Play, Trophy } from 'lucide-react';
import { ROOMS } from '@/utils/rooms';
import { useAudio } from '@/utils/audio';
import Image from 'next/image';

export default function TutorialLobby() {
  const router = useRouter();
  const { playSound } = useAudio();

  const tutorialRooms = Object.values(ROOMS).filter(r => r.isTutorial);

  return (
    <div className="min-h-screen bg-[#02020a] text-white font-sans selection:bg-indigo-500/30">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#1e1b4b_0%,_transparent_70%)] opacity-40" />
        <div className="absolute inset-0 bg-[url('/images/bg/grid.png')] opacity-[0.03] bg-repeat" />
      </div>

      {/* Header */}
      <header className="relative z-50 flex items-center justify-between px-8 py-6 backdrop-blur-md border-b border-white/5 bg-black/40">
        <div className="flex items-center gap-6">
          <motion.button
            onClick={() => { playSound('click'); router.push('/'); }}
            className="p-3 rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            whileHover={{ x: -4 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronLeft size={20} />
          </motion.button>
          
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
              <span className="bg-linear-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Tutorial</span>
              <span className="text-white/20 font-light">/</span>
              <span className="text-white/90">Academy</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold mt-1">Master the art of Blackjack</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tutorialRooms.map((room) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative"
            >
              {/* Card Decoration */}
              <div className="absolute -inset-[1px] bg-linear-to-b from-indigo-500/50 to-transparent rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
              
              <div className="relative bg-[#0a0a16] border border-white/10 rounded-[2rem] overflow-hidden flex flex-col h-full transition-transform duration-500 group-hover:-translate-y-2">
                {/* Visual Header */}
                <div className="h-48 relative overflow-hidden" style={{ background: room.feltGradient }}>
                    <div className="absolute inset-0 opacity-20 bg-[url('/images/bg/felt-texture.png')]" />
                    <div className="absolute inset-0 flex items-center justify-center p-8">
                        <div className="relative w-full h-full transform transition-transform duration-700 group-hover:scale-110">
                            <Image 
                                src={room.logoPath} 
                                alt={room.name} 
                                fill 
                                className="object-contain drop-shadow-2xl"
                            />
                        </div>
                    </div>
                    {/* Badge */}
                    <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
                        <Star size={10} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-white/90">Academy</span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 flex flex-col flex-1">
                    <div className="mb-4">
                        <h2 className="text-2xl font-black text-white/90 mb-1">{room.name}</h2>
                        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                            <BookOpen size={12} />
                            {room.subtitle}
                        </div>
                    </div>

                    <p className="text-white/40 text-sm leading-relaxed mb-8 flex-1">
                        {room.description}
                    </p>

                    <button
                        onClick={() => { playSound('chip-lay'); router.push(`/game/${room.id}`); }}
                        className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 cursor-pointer group/btn overflow-hidden relative shadow-lg shadow-indigo-600/20"
                    >
                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                        <Play size={16} fill="white" className="relative transition-transform group-hover/btn:scale-110" />
                        <span className="relative">Start Tutorial</span>
                    </button>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Locked/Coming Soon Placeholder */}
          <div className="relative group opacity-40 grayscale pointer-events-none">
             <div className="relative bg-[#0a0a16]/50 border border-white/5 rounded-[2rem] overflow-hidden flex flex-col h-full p-8 border-dashed">
                <div className="flex-1 flex flex-col items-center justify-center gap-4 py-20">
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                        <Trophy size={24} className="text-white/20" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-black text-white/60 mb-1">Advanced Counting</h3>
                        <p className="text-xs text-white/20 font-medium">Coming in next update</p>
                    </div>
                </div>
             </div>
          </div>
        </div>
      </main>

      {/* Footer Info */}
      <footer className="relative z-10 max-w-7xl mx-auto px-8 py-12 border-t border-white/5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 opacity-40">
            <p className="text-xs font-medium text-white/60 text-center md:text-left">
                The Blackjack Academy tutorials are designed for educational purposes only.
            </p>
            <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none mt-0.5">Free Access</span>
                 </div>
            </div>
        </div>
      </footer>
    </div>
  );
}
